import { createAdminClient } from '../supabase/admin';
import { normalizeSubscriptionTier, TIER_CONFIG } from '../entitlements';

export interface ProvisioningResult {
  success: boolean;
  agencyId?: string;
  agencyName?: string;
  email?: string;
  error?: string;
  alreadyCompleted?: boolean;
}

/**
 * Auto-provisions an agency workspace upon successful Payoneer payment.
 * Idempotent: safe to invoke repeatedly from webhooks and redirect callbacks.
 */
export async function provisionAgencyWorkspace(
  sessionId: string
): Promise<ProvisioningResult> {
  const supabase = createAdminClient();

  // 1. Fetch the checkout session
  const { data: session, error: sessionError } = await supabase
    .from('billing_checkout_sessions')
    .select('*')
    .eq('session_id', sessionId)
    .single();

  if (sessionError || !session) {
    console.error(`[Provisioning] Checkout session ${sessionId} not found:`, sessionError);
    return { success: false, error: 'Checkout session not found' };
  }

  // Idempotency check: if already completed, return agency info directly
  if (session.status === 'completed' && session.agency_id) {
    return {
      success: true,
      agencyId: session.agency_id,
      agencyName: session.agency_name,
      email: session.customer_email,
      alreadyCompleted: true,
    };
  }

  const tier = normalizeSubscriptionTier(session.tier);
  const tierConfig = TIER_CONFIG[tier];
  const billingCycle = session.billing_cycle || 'monthly';

  // Case A: Existing agency upgrading their subscription
  if (session.agency_id) {
    const { error: updateError } = await supabase
      .from('agencies')
      .update({
        subscription_tier: tier,
        subscription_status: 'active',
        billing_cycle: billingCycle,
        monthly_conversation_limit: tierConfig.monthlyConversationLimit,
        max_whatsapp_lines: tierConfig.maxWhatsappLines,
        payoneer_list_id: session.payoneer_list_id || null,
        current_period_end: new Date(
          Date.now() + (billingCycle === 'yearly' ? 365 : 30) * 86400000
        ).toISOString(),
      })
      .eq('id', session.agency_id);

    if (updateError) {
      console.error(`[Provisioning] Failed to update agency ${session.agency_id}:`, updateError);
      return { success: false, error: updateError.message };
    }

    // Mark checkout session as completed
    await supabase
      .from('billing_checkout_sessions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('session_id', sessionId);

    return {
      success: true,
      agencyId: session.agency_id,
      agencyName: session.agency_name,
      email: session.customer_email,
    };
  }

  // Case B: Brand new agency workspace onboarding
  const slugBase = (session.agency_name || 'agency')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, 32);
  const uniqueSlug = `${slugBase}-${Math.random().toString(36).substring(2, 7)}`;

  // Insert new agency
  const { data: newAgency, error: agencyInsertError } = await supabase
    .from('agencies')
    .insert({
      name: session.agency_name,
      slug: uniqueSlug,
      is_active: true,
      subscription_tier: tier,
      subscription_status: 'active',
      billing_cycle: billingCycle,
      monthly_conversation_limit: tierConfig.monthlyConversationLimit,
      conversations_used_this_month: 0,
      max_whatsapp_lines: tierConfig.maxWhatsappLines,
      payoneer_list_id: session.payoneer_list_id || null,
      current_period_end: new Date(
        Date.now() + (billingCycle === 'yearly' ? 365 : 30) * 86400000
      ).toISOString(),
    })
    .select('id, name')
    .single();

  if (agencyInsertError || !newAgency) {
    console.error('[Provisioning] Failed to create agency:', agencyInsertError);
    return { success: false, error: agencyInsertError?.message || 'Failed to create agency' };
  }

  const newAgencyId = newAgency.id;

  // Insert default business info
  await supabase.from('business_info').insert({
    agency_id: newAgencyId,
    name: session.agency_name,
    support_phone: session.customer_phone || null,
    operating_hours: '09:00 - 20:00 GST',
  });

  // Check if an agent record with this email already exists
  const { data: existingAgent } = await supabase
    .from('agents')
    .select('id, auth_user_id')
    .eq('email', session.customer_email)
    .maybeSingle();

  if (existingAgent) {
    await supabase
      .from('agents')
      .update({
        agency_id: newAgencyId,
        role: 'admin',
        is_active: true,
        name: session.customer_name || 'Agency Principal',
      })
      .eq('id', existingAgent.id);
  } else {
    // Look up auth_user_id from metadata if created during signup
    const authUserId = session.metadata?.auth_user_id || null;

    await supabase.from('agents').insert({
      agency_id: newAgencyId,
      auth_user_id: authUserId,
      name: session.customer_name || 'Agency Principal',
      email: session.customer_email,
      phone: session.customer_phone || null,
      role: 'admin',
      is_active: true,
    });
  }

  // Update session record to completed with the new agency ID
  await supabase
    .from('billing_checkout_sessions')
    .update({
      status: 'completed',
      agency_id: newAgencyId,
      completed_at: new Date().toISOString(),
    })
    .eq('session_id', sessionId);

  console.info(
    `[Provisioning] Successfully provisioned agency "${newAgency.name}" (${newAgencyId}) on ${tier} tier.`
  );

  return {
    success: true,
    agencyId: newAgencyId,
    agencyName: newAgency.name,
    email: session.customer_email,
  };
}

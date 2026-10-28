'use server';

import { createClient } from '../supabase/server';
import { getDashboardContext } from '../supabase/context';
import { checkFeatureAccess } from '../entitlements';
import { revalidatePath } from 'next/cache';

const DEFAULT_N8N_WEBHOOK_URL = 'https://n8n.balos.tech/webhook/balos-agent-message';

export interface SendAgentMessageParams {
  leadId: string;
  text: string;
  agentId?: string | null;
  agentName?: string | null;
  mediaUrl?: string | null;
  mediaType?: 'IMAGE' | 'VIDEO' | 'DOCUMENT' | null;
  fileName?: string | null;
  propertyId?: string | null;
}

export interface SendAgentMessageResult {
  success: boolean;
  error?: string;
}

export interface GenerateAiDraftParams {
  leadId: string;
  instructionPrompt?: string;
}

export interface GenerateAiDraftResult {
  success: boolean;
  draft?: string;
  error?: string;
}

/**
 * Sends a human broker WhatsApp message via n8n & WAHA,
 * persists the message (and any media/document attachments) in Supabase,
 * and ensures the lead stays strictly paused.
 */
export async function sendAgentWhatsAppMessage({
  leadId,
  text,
  agentId,
  agentName,
  mediaUrl,
  mediaType,
  fileName,
  propertyId,
}: SendAgentMessageParams): Promise<SendAgentMessageResult> {
  const context = await getDashboardContext();
  if (!checkFeatureAccess(context.subscription_tier, 'canHumanTakeover')) {
    return {
      success: false,
      error: 'Human broker messaging requires the Growth or Scale plan. Please upgrade your agency plan.',
    };
  }

  if (mediaUrl && !checkFeatureAccess(context.subscription_tier, 'canMediaDispatch')) {
    return {
      success: false,
      error: 'Rich media dispatch requires the Growth or Scale plan. Please upgrade your agency plan.',
    };
  }

  const trimmedText = text.trim();
  if (!trimmedText && !mediaUrl) {
    return { success: false, error: 'Message or attachment cannot be empty.' };
  }

  const supabase = createClient();

  // 1. Fetch lead details (phone number and current handoff state)
  const { data: lead, error: leadError } = await supabase
    .from('leads')
    .select('id, whatsapp_id, e164_phone, full_name, ai_paused')
    .eq('id', leadId)
    .single();

  if (leadError || !lead) {
    return { success: false, error: leadError?.message || 'Lead not found.' };
  }

  const rawPhone = lead.e164_phone || lead.whatsapp_id || '';
  const cleanPhone = rawPhone.replace(/\D/g, '');

  if (!cleanPhone) {
    return {
      success: false,
      error: 'Lead does not have a valid phone number for WhatsApp delivery.',
    };
  }

  // 2. Dispatch to n8n outbound webhook
  const webhookUrl =
    process.env.N8N_AGENT_MESSAGE_WEBHOOK_URL || DEFAULT_N8N_WEBHOOK_URL;

  let n8nSuccess = false;
  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'SEND_MESSAGE',
        lead_id: lead.id,
        phone: cleanPhone,
        text: trimmedText,
        agent_id: agentId || null,
        agent_name: agentName || 'Agent',
        media_url: mediaUrl || null,
        media_type: mediaType || null,
        file_name: fileName || null,
        property_id: propertyId || null,
      }),
      // Short timeout to avoid blocking server actions
      signal: AbortSignal.timeout(12000),
    });

    if (res.ok) {
      n8nSuccess = true;
    } else {
      console.warn(`[Balos] n8n webhook returned status: ${res.status}`);
    }
  } catch (err: any) {
    console.warn('[Balos] n8n dispatch warning:', err?.message || err);
  }

  // 3. Fallback / direct Supabase insert to guarantee UI synchronization
  // (In case n8n execution had a delay or webhook didn't insert directly)
  const nowIso = new Date().toISOString();
  
  // Check if n8n already inserted this message in the last 2 seconds
  const { data: existing } = await supabase
    .from('messages')
    .select('id')
    .eq('lead_id', lead.id)
    .eq('sender', 'HUMAN_AGENT')
    .eq('content', trimmedText)
    .gte('created_at', new Date(Date.now() - 3000).toISOString())
    .maybeSingle();

  if (!existing) {
    await supabase.from('messages').insert({
      lead_id: lead.id,
      sender: 'HUMAN_AGENT',
      direction: 'OUTGOING',
      content: trimmedText,
      media_url: mediaUrl || null,
      message_type: mediaType || (mediaUrl ? 'MEDIA' : 'TEXT'),
      created_at: nowIso,
    });
  }

  // 4. Update lead timestamps and keep strictly paused per design alignment
  const leadUpdates: Record<string, any> = {
    ai_paused: true,
    updated_at: nowIso,
  };
  if (propertyId) {
    leadUpdates.last_property_id = propertyId;
  }

  await supabase
    .from('leads')
    .update(leadUpdates)
    .eq('id', lead.id);

  revalidatePath('/inbox');
  revalidatePath('/leads');

  return { success: true };
}

/**
 * Generates an on-brand, luxury Dubai real estate advisory draft using NVIDIA DeepSeek in n8n,
 * conditioned on the lead's budget, communities, and recent conversation history.
 */
export async function generateAiDraft({
  leadId,
  instructionPrompt,
}: GenerateAiDraftParams): Promise<GenerateAiDraftResult> {
  const context = await getDashboardContext();
  if (!checkFeatureAccess(context.subscription_tier, 'canAiCopilot')) {
    return {
      success: false,
      error: 'In-App AI Co-Pilot drafting requires the Growth or Scale plan. Please upgrade your agency plan.',
    };
  }

  const supabase = createClient();

  // 1. Fetch lead qualification context
  const { data: lead, error: leadError } = await supabase
    .from('leads')
    .select(
      'id, full_name, budget_aed_min, budget_aed_max, buyer_persona, preferred_market, target_communities, target_category, min_bedrooms, max_bedrooms, golden_visa_seeker, notes'
    )
    .eq('id', leadId)
    .single();

  if (leadError || !lead) {
    return { success: false, error: 'Lead context could not be loaded.' };
  }

  // 2. Fetch last 10 messages for conversation context
  const { data: msgs } = await supabase
    .from('messages')
    .select('sender, content, created_at')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false })
    .limit(10);

  const chronologicalMsgs = (msgs || []).reverse();
  const historyText = chronologicalMsgs
    .map((m) => `[${m.sender}]: ${m.content}`)
    .join('\n');

  const leadContextSummary = `
- Name: ${lead.full_name || 'Prospective Buyer'}
- Buyer Persona: ${lead.buyer_persona || 'Unspecified'}
- Budget Range: AED ${lead.budget_aed_min ? Number(lead.budget_aed_min).toLocaleString() : 'N/A'} to AED ${lead.budget_aed_max ? Number(lead.budget_aed_max).toLocaleString() : 'N/A'}
- Preferred Market: ${lead.preferred_market || 'Off-plan / Secondary'}
- Target Communities: ${Array.isArray(lead.target_communities) ? lead.target_communities.join(', ') : 'Dubai'}
- Property Category: ${lead.target_category || 'Any'} (${lead.min_bedrooms ?? ''}-${lead.max_bedrooms ?? ''} BR)
- Golden Visa Eligible: ${lead.golden_visa_seeker ? 'Yes (AED 2.0M+)' : 'No'}
- Broker Notes: ${lead.notes || 'None'}
`.trim();

  // 3. Call n8n DRAFT_ASSIST webhook
  const webhookUrl =
    process.env.N8N_AGENT_MESSAGE_WEBHOOK_URL || DEFAULT_N8N_WEBHOOK_URL;

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'DRAFT_ASSIST',
        lead_id: lead.id,
        leadContext: leadContextSummary,
        history: historyText || 'No prior conversation messages.',
        instructions:
          instructionPrompt ||
          'Draft the next high-converting WhatsApp message to qualify or advance this lead to a viewing.',
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (res.ok) {
      const data = await res.json();
      const draftText = data?.draft || data?.output || data?.text || '';
      if (draftText && typeof draftText === 'string' && draftText.trim()) {
        return { success: true, draft: draftText.trim() };
      }
    }
  } catch (err: any) {
    console.warn('[Balos] n8n AI Draft warning, using resilient Dubai broker draft fallback:', err?.message || err);
  }

  // 4. Infallible, context-aware fallback draft (ensures the agent UI never errors or hangs)
  const leadName = lead.full_name && lead.full_name !== '.' && lead.full_name !== 'Prospective Buyer'
    ? lead.full_name.trim().split(' ')[0]
    : 'there';

  const targetArea = Array.isArray(lead.target_communities) && lead.target_communities.length > 0
    ? lead.target_communities.join(' & ')
    : 'Dubai';

  const budgetSnippet = lead.budget_aed_max
    ? ` within your AED ${Number(lead.budget_aed_max).toLocaleString()} budget`
    : '';

  const fallbackDraft = `Hi ${leadName}, thank you for reaching out! We have curated exclusive prime options in ${targetArea}${budgetSnippet} that match your criteria. Would you be available for a brief call or private walkthrough this week to review the available inventory and floor plans?`;

  return { success: true, draft: fallbackDraft };
}

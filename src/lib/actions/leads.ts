'use server';

import { createClient } from '../supabase/server';
import { getDashboardContext } from '../supabase/context';
import { checkFeatureAccess } from '../entitlements';
import { revalidatePath } from 'next/cache';
import { dispatchCrmSync } from '../crm/dispatcher';
import { Lead } from '../types';

/**
 * Helper to dispatch CRM sync safely in the background
 */
async function triggerCrmSyncAsync(
  event: 'LEAD_QUALIFIED' | 'HANDOFF' | 'STAGE_CHANGED',
  leadId: string
) {
  try {
    const supabase = createClient();
    const { data: lead } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .maybeSingle();

    if (!lead) return;

    let assignedAgent = null;
    if (lead.assigned_agent_id) {
      const { data: agent } = await supabase
        .from('agents')
        .select('*')
        .eq('id', lead.assigned_agent_id)
        .maybeSingle();
      assignedAgent = agent;
    }

    await dispatchCrmSync(event, lead as Lead, { assignedAgent });
  } catch {
    // Graceful background sync failure
  }
}

/**
 * Take over lead from AI:
 * sets ai_paused = true, handoff_at = now() only if handoff_at is null.
 * Leave stage alone. Never edit any other lead field.
 */
export async function takeOverLead(leadId: string) {
  const context = await getDashboardContext();
  if (!checkFeatureAccess(context.subscription_tier, 'canHumanTakeover')) {
    return {
      success: false,
      error: 'Human Takeover is available on Growth and Scale plans. Upgrade to enable broker takeover.',
    };
  }

  const supabase = createClient();

  // Fetch current lead handoff_at
  const { data: lead } = await supabase
    .from('leads')
    .select('handoff_at')
    .eq('id', leadId)
    .single();

  const updatePayload: Record<string, any> = {
    ai_paused: true,
  };

  if (!lead?.handoff_at) {
    updatePayload.handoff_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from('leads')
    .update(updatePayload)
    .eq('id', leadId);

  if (error) {
    return { success: false, error: error.message };
  }

  // Trigger CRM auto-sync for human handoff
  triggerCrmSyncAsync('HANDOFF', leadId).catch(() => {});

  revalidatePath('/inbox');
  revalidatePath('/');
  revalidatePath('/leads');
  return { success: true };
}

/**
 * Hand lead back to AI:
 * sets ai_paused = false. Only if stage = 'HANDOFF_TO_AGENT', set stage = 'ENGAGED'.
 * This closes the handoff and lets AI reply normally.
 * Never edit any other lead field.
 */
export async function handBackToAi(leadId: string, currentStage?: string) {
  const supabase = createClient();

  const updatePayload: { ai_paused: boolean; stage?: string } = {
    ai_paused: false,
  };

  if (currentStage === 'HANDOFF_TO_AGENT') {
    updatePayload.stage = 'ENGAGED';
  }

  const { error } = await supabase
    .from('leads')
    .update(updatePayload)
    .eq('id', leadId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/inbox');
  revalidatePath('/');
  revalidatePath('/leads');
  return { success: true };
}

/**
 * Update lead pipeline stage in-app (e.g. QUALIFIED, CLOSED_WON, CLOSED_LOST)
 */
export async function updateLeadStage(leadId: string, stage: string) {
  const supabase = createClient();

  const updatePayload: Record<string, any> = {
    stage,
    updated_at: new Date().toISOString(),
  };

  if (stage === 'HANDOFF_TO_AGENT') {
    updatePayload.handoff_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from('leads')
    .update(updatePayload)
    .eq('id', leadId);

  if (error) {
    return { success: false, error: error.message };
  }

  // Trigger CRM auto-sync based on stage change
  if (stage === 'QUALIFIED') {
    triggerCrmSyncAsync('LEAD_QUALIFIED', leadId).catch(() => {});
  } else if (stage === 'HANDOFF_TO_AGENT') {
    triggerCrmSyncAsync('HANDOFF', leadId).catch(() => {});
  } else {
    triggerCrmSyncAsync('STAGE_CHANGED', leadId).catch(() => {});
  }

  revalidatePath('/inbox');
  revalidatePath('/leads');
  revalidatePath('/');
  return { success: true };
}

/**
 * Assign or unassign a lead to an active agent.
 * Restricted strictly to leadership roles: Admin, Sales Leader, or Team Leader.
 * Updates Supabase `public.leads.assigned_agent_id` (which immediately broadcasts via
 * Supabase Realtime to the assigned agent's dashboard) and records a notification event.
 */
export async function assignLeadAgent(leadId: string, agentId: string | null) {
  const supabase = createClient();

  // 1. Verify caller has leadership authority (Admin, Sales Leader, or Team Leader)
  const { data: ctx } = await supabase.rpc('dashboard_context');
  const callerRole = (ctx?.role || '').toLowerCase().trim();
  const isLeader =
    Boolean(ctx?.is_admin) ||
    callerRole === 'admin' ||
    callerRole === 'sales_leader' ||
    callerRole === 'team_leader';

  if (!isLeader) {
    return {
      success: false,
      error:
        'Only leadership roles (Admin, Sales Leader, or Team Leader) can assign leads to agents.',
    };
  }

  // 2. Update assigned_agent_id in Supabase leads table
  const nowIso = new Date().toISOString();
  const { data: updatedLead, error } = await supabase
    .from('leads')
    .update({
      assigned_agent_id: agentId || null,
      updated_at: nowIso,
    })
    .eq('id', leadId)
    .select('id, full_name, e164_phone, whatsapp_id, stage, budget_aed_min, budget_aed_max, target_communities')
    .maybeSingle();

  if (error) {
    return { success: false, error: error.message };
  }

  // 3. If an agent was assigned, log notification in Supabase & optional webhook
  if (agentId) {
    const { data: targetAgent } = await supabase
      .from('agents')
      .select('id, name, email, phone')
      .eq('id', agentId)
      .maybeSingle();

    const leadDisplayName =
      updatedLead?.full_name && updatedLead.full_name !== '.'
        ? updatedLead.full_name
        : updatedLead?.e164_phone || updatedLead?.whatsapp_id || 'WhatsApp Lead';

    // Best-effort insert into agent_notifications table (if migration has been applied)
    await supabase.from('agent_notifications').insert({
      agent_id: agentId,
      lead_id: leadId,
      type: 'LEAD_ASSIGNED',
      title: `New lead assigned: ${leadDisplayName}`,
      body: `Assigned by ${ctx?.name || 'Sales Leadership'}`,
      created_at: nowIso,
    });

    // Optional external webhook for WhatsApp/Email push to the agent's phone
    const webhookUrl = process.env.N8N_ASSIGNMENT_WEBHOOK_URL;
    if (webhookUrl && targetAgent) {
      fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'LEAD_ASSIGNED',
          lead_id: leadId,
          lead_name: leadDisplayName,
          lead_phone: updatedLead?.e164_phone || updatedLead?.whatsapp_id,
          assigned_agent_id: targetAgent.id,
          agent_name: targetAgent.name,
          agent_email: targetAgent.email,
          agent_phone: targetAgent.phone,
          assigned_by: ctx?.name || ctx?.email || 'Sales Leadership',
          assigned_at: nowIso,
        }),
      }).catch(() => {});
    }
  }

  revalidatePath('/inbox');
  revalidatePath('/leads');
  revalidatePath('/');
  return { success: true };
}

/**
 * Update or override lead source channel (PROPERTY_FINDER, BAYUT, META_ADS, WEBSITE, DIRECT_WHATSAPP, etc.)
 */
export async function updateLeadSource(leadId: string, source: string) {
  const supabase = createClient();

  const { error } = await supabase
    .from('leads')
    .update({
      source,
      updated_at: new Date().toISOString(),
    })
    .eq('id', leadId);

  if (error) {
    if (error.message?.includes('column') && error.message?.includes('source')) {
      return {
        success: false,
        error:
          'Column "source" not found on leads table. Run supabase/migrations/20261016_uae_launch_updates.sql in Supabase SQL Editor.',
      };
    }
    return { success: false, error: error.message };
  }

  revalidatePath('/inbox');
  revalidatePath('/leads');
  revalidatePath('/');
  return { success: true };
}

/**
 * Save internal agent notes on a lead.
 * Gracefully handles environments where `notes` column hasn't been migrated yet.
 */
export async function updateLeadNotes(leadId: string, notes: string) {
  const supabase = createClient();

  const { error } = await supabase
    .from('leads')
    .update({
      notes: notes.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', leadId);

  if (error) {
    if (error.message?.includes('column') && error.message?.includes('notes')) {
      return {
        success: false,
        error:
          'Run supabase/migrations/20261016_uae_launch_updates.sql in Supabase SQL Editor to persist lead notes in PostgreSQL.',
      };
    }
    return { success: false, error: error.message };
  }

  revalidatePath('/inbox');
  revalidatePath('/leads');
  return { success: true };
}


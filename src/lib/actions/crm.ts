'use server';

import { createClient } from '../supabase/server';
import { getDashboardContext } from '../supabase/context';
import { checkFeatureAccess } from '../entitlements';
import { revalidatePath } from 'next/cache';
import { CrmIntegration, Lead, Agent } from '../types';
import { getStoredCrmIntegrations, saveStoredCrmIntegration, getStoredCrmSyncLogs, clearStoredCrmSyncLogs } from '../crm/storage';
import { dispatchCrmSync, DispatchSummary } from '../crm/dispatcher';
import { pingCrmIntegration, PingResult } from '../crm/test-ping';

/**
 * Fetch all configured CRM integrations.
 */
export async function getCrmIntegrationsAction() {
  const result = await getStoredCrmIntegrations();
  return result;
}

/**
 * Save or update a CRM integration profile.
 */
export async function saveCrmIntegrationAction(
  integration: Partial<CrmIntegration> & { provider: string }
): Promise<{ success: boolean; needsMigration: boolean; error?: string; data?: CrmIntegration }> {
  const context = await getDashboardContext();
  if (integration.provider === 'salesforce') {
    if (!checkFeatureAccess(context.subscription_tier, 'canSalesforce')) {
      return {
        success: false,
        needsMigration: false,
        error: 'Salesforce CRM integration is exclusive to the Enterprise tier. Please contact us for enterprise setup.',
      };
    }
  } else {
    if (!checkFeatureAccess(context.subscription_tier, 'canCrmSync')) {
      return {
        success: false,
        needsMigration: false,
        error: 'External CRM integration requires the Scale or Enterprise plan. Please upgrade your plan in Billing settings.',
      };
    }
  }

  const result = await saveStoredCrmIntegration(integration);
  revalidatePath('/settings/crm');
  return result;
}

/**
 * Send a test ping to verify CRM connection.
 */
export async function testCrmIntegrationAction(
  integration: CrmIntegration,
  sampleLead?: Partial<Lead>
): Promise<PingResult> {
  const context = await getDashboardContext();
  if (!checkFeatureAccess(context.subscription_tier, 'canCrmSync')) {
    return {
      success: false,
      httpStatus: 403,
      durationMs: 0,
      requestPayload: {},
      responsePayload: {},
      errorMessage: 'External CRM integration requires the Scale or Enterprise plan.',
    };
  }

  const result = await pingCrmIntegration(integration, sampleLead);
  revalidatePath('/settings/crm');
  return result;
}

/**
 * Fetch recent CRM audit sync logs.
 */
export async function getCrmSyncLogsAction(limit = 25) {
  const logs = await getStoredCrmSyncLogs(limit);
  return logs;
}

/**
 * Clear CRM audit logs.
 */
export async function clearCrmSyncLogsAction() {
  await clearStoredCrmSyncLogs();
  revalidatePath('/settings/crm');
  return { success: true };
}

/**
 * Manually trigger sync for a specific lead to one or all active CRMs.
 */
export async function syncLeadToCrmAction(
  leadId: string,
  targetIntegrationId?: string
): Promise<{ success: boolean; summary?: DispatchSummary; error?: string }> {
  const supabase = createClient();

  const { data: lead, error: leadErr } = await supabase
    .from('leads')
    .select('*')
    .eq('id', leadId)
    .single();

  if (leadErr || !lead) {
    return {
      success: false,
      error: leadErr?.message || 'Lead not found.',
    };
  }

  let assignedAgent: Agent | null = null;
  if (lead.assigned_agent_id) {
    const { data: agent } = await supabase
      .from('agents')
      .select('*')
      .eq('id', lead.assigned_agent_id)
      .maybeSingle();
    assignedAgent = agent;
  }

  const summary = await dispatchCrmSync('MANUAL_SYNC', lead as Lead, {
    assignedAgent,
    forceIntegrationId: targetIntegrationId,
  });

  revalidatePath('/leads');
  revalidatePath('/inbox');
  revalidatePath('/settings/crm');

  const anyFailed = summary.results.some((r) => !r.success);
  return {
    success: summary.triggeredCount > 0 && !anyFailed,
    summary,
  };
}

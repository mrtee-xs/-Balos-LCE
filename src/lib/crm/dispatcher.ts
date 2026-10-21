import { Lead, Booking, Agent, CrmIntegration, CrmSyncEvent } from '../types';
import { buildStandardCrmPayload } from './payload';
import { getStoredCrmIntegrations, logCrmSyncAttempt, saveStoredCrmIntegration } from './storage';
import { sendToFollowUpBoss, AdapterResult } from './adapters/followupboss';
import { sendToHubSpot } from './adapters/hubspot';
import { sendToGoHighLevel } from './adapters/gohighlevel';
import { sendToZoho } from './adapters/zoho';
import { sendToSalesforce } from './adapters/salesforce';
import { sendToWebhook } from './adapters/webhook';

export interface DispatchSummary {
  event: CrmSyncEvent;
  totalIntegrations: number;
  triggeredCount: number;
  results: {
    provider: string;
    name: string;
    success: boolean;
    httpStatus: number;
    errorMessage?: string;
    durationMs: number;
  }[];
}

export async function dispatchCrmSync(
  event: CrmSyncEvent,
  lead: Lead,
  options?: {
    assignedAgent?: Agent | null;
    viewing?: Booking | null;
    forceIntegrationId?: string; // For manual 1-click sync to a specific provider
  }
): Promise<DispatchSummary> {
  const { data: integrations } = await getStoredCrmIntegrations();
  const payload = buildStandardCrmPayload(
    event,
    lead,
    options?.assignedAgent,
    options?.viewing
  );

  const results: DispatchSummary['results'] = [];
  let triggeredCount = 0;

  for (const integration of integrations) {
    // If targeted manual sync, only run that integration
    if (options?.forceIntegrationId && integration.id !== options.forceIntegrationId) {
      continue;
    }

    // Must be enabled unless manually forced
    if (!integration.is_enabled && !options?.forceIntegrationId) {
      continue;
    }

    // Check trigger condition if not manual
    if (event !== 'MANUAL_SYNC' && !options?.forceIntegrationId) {
      let shouldTrigger = false;
      if (event === 'LEAD_CREATED' && integration.sync_on_create) shouldTrigger = true;
      if (event === 'LEAD_QUALIFIED' && integration.sync_on_qualified) shouldTrigger = true;
      if (event === 'VIEWING_SCHEDULED' && integration.sync_on_viewing) shouldTrigger = true;
      if (event === 'HANDOFF' && integration.sync_on_handoff) shouldTrigger = true;
      if (event === 'STAGE_CHANGED' && integration.sync_on_stage_change) shouldTrigger = true;

      if (!shouldTrigger) {
        continue;
      }
    }

    triggeredCount++;
    const startTime = Date.now();
    let adapterResult: AdapterResult = {
      success: false,
      httpStatus: 0,
      requestPayload: null as any,
      responsePayload: null as any,
      errorMessage: 'Unknown provider',
    };

    try {
      switch (integration.provider) {
        case 'followupboss':
          adapterResult = await sendToFollowUpBoss(integration, payload);
          break;
        case 'hubspot':
          adapterResult = await sendToHubSpot(integration, payload);
          break;
        case 'gohighlevel':
          adapterResult = await sendToGoHighLevel(integration, payload);
          break;
        case 'zoho':
          adapterResult = await sendToZoho(integration, payload);
          break;
        case 'salesforce':
          adapterResult = await sendToSalesforce(integration, payload);
          break;
        case 'webhook':
          adapterResult = await sendToWebhook(integration, payload);
          break;
      }
    } catch (err: any) {
      adapterResult = {
        success: false,
        httpStatus: 0,
        requestPayload: payload,
        responsePayload: null,
        errorMessage: err.message || 'Error executing CRM adapter',
      };
    }

    const durationMs = Date.now() - startTime;

    // Log the sync attempt
    await logCrmSyncAttempt({
      integration_id: integration.id,
      provider: integration.provider,
      lead_id: lead.id,
      lead_name: lead.full_name || lead.e164_phone || lead.whatsapp_id || 'Lead',
      event,
      status: adapterResult.success ? 'SUCCESS' : 'FAILED',
      http_status: adapterResult.httpStatus,
      request_payload: adapterResult.requestPayload,
      response_payload: adapterResult.responsePayload,
      error_message: adapterResult.errorMessage,
      duration_ms: durationMs,
    });

    // Update integration last_sync status
    await saveStoredCrmIntegration({
      ...integration,
      last_sync_at: new Date().toISOString(),
      last_sync_status: adapterResult.success ? 'SUCCESS' : 'ERROR',
      last_sync_error: adapterResult.errorMessage || null,
    }).catch(() => {});

    results.push({
      provider: integration.provider,
      name: integration.name,
      success: adapterResult.success,
      httpStatus: adapterResult.httpStatus,
      errorMessage: adapterResult.errorMessage,
      durationMs,
    });
  }

  return {
    event,
    totalIntegrations: integrations.length,
    triggeredCount,
    results,
  };
}

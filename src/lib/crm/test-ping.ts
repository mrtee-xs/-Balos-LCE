import { CrmIntegration, Lead } from '../types';
import { buildStandardCrmPayload } from './payload';
import { sendToFollowUpBoss, AdapterResult } from './adapters/followupboss';
import { sendToHubSpot } from './adapters/hubspot';
import { sendToGoHighLevel } from './adapters/gohighlevel';
import { sendToZoho } from './adapters/zoho';
import { sendToSalesforce } from './adapters/salesforce';
import { sendToWebhook } from './adapters/webhook';
import { logCrmSyncAttempt } from './storage';

export interface PingResult {
  success: boolean;
  httpStatus: number;
  durationMs: number;
  requestPayload: any;
  responsePayload: any;
  errorMessage?: string;
}

export async function pingCrmIntegration(
  integration: CrmIntegration,
  customSampleLead?: Partial<Lead>
): Promise<PingResult> {
  const sampleLead: Lead = {
    id: 'demo-lead-test-ping',
    whatsapp_id: '+971501234567',
    e164_phone: '+971501234567',
    full_name: 'Dr. Tariq Al Mansoori',
    stage: 'QUALIFIED',
    temperature: 'HOT',
    lead_score: 92,
    buyer_persona: 'INVESTOR_HIGH_YIELD',
    preferred_market: 'OFF_PLAN',
    target_communities: ['Downtown Dubai', 'Palm Jumeirah'],
    target_category: 'PENTHOUSE',
    min_bedrooms: 3,
    max_bedrooms: 4,
    budget_aed_min: 5000000,
    budget_aed_max: 8500000,
    payment_preference: 'CASH',
    is_uae_resident: true,
    golden_visa_seeker: true,
    timeline: 'Immediate (Next 14 Days)',
    assigned_agent_id: null,
    ai_paused: false,
    last_agent_message_at: null,
    last_lead_message_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    viewing_at: null,
    viewing_type: null,
    calendar_event_id: null,
    handoff_reason: null,
    handoff_at: null,
    handoff_reminder_sent_at: null,
    source: 'PROPERTY_FINDER',
    source_detail: 'Downtown Dubai Luxury Penthouse Featured Listing',
    notes: 'Verified cash investor seeking high capital appreciation and Golden Visa nomination.',
    ...customSampleLead,
  };

  const payload = buildStandardCrmPayload('TEST_PING', sampleLead, {
    id: 'agent-demo-1',
    name: 'Karim Mansour',
    email: 'karim@balosrealestate.ae',
    phone: '+971509988776',
    role: 'sales_leader',
    rera_brn: '49201',
    languages: ['English', 'Arabic'],
    is_active: true,
    created_at: new Date().toISOString(),
  });

  const startTime = Date.now();
  let result: AdapterResult = {
    success: false,
    httpStatus: 0,
    requestPayload: null as any,
    responsePayload: null as any,
    errorMessage: 'No provider adapter configured',
  };

  try {
    switch (integration.provider) {
      case 'followupboss':
        result = await sendToFollowUpBoss(integration, payload);
        break;
      case 'hubspot':
        result = await sendToHubSpot(integration, payload);
        break;
      case 'gohighlevel':
        result = await sendToGoHighLevel(integration, payload);
        break;
      case 'zoho':
        result = await sendToZoho(integration, payload);
        break;
      case 'salesforce':
        result = await sendToSalesforce(integration, payload);
        break;
      case 'webhook':
        result = await sendToWebhook(integration, payload);
        break;
    }
  } catch (err: any) {
    result = {
      success: false,
      httpStatus: 0,
      requestPayload: payload,
      responsePayload: null,
      errorMessage: err.message || 'Error executing ping adapter',
    };
  }

  const durationMs = Date.now() - startTime;

  await logCrmSyncAttempt({
    integration_id: integration.id,
    provider: integration.provider,
    lead_id: sampleLead.id,
    lead_name: sampleLead.full_name,
    event: 'TEST_PING',
    status: result.success ? 'SUCCESS' : 'FAILED',
    http_status: result.httpStatus,
    request_payload: result.requestPayload,
    response_payload: result.responsePayload,
    error_message: result.errorMessage,
    duration_ms: durationMs,
  });

  return {
    success: result.success,
    httpStatus: result.httpStatus,
    durationMs,
    requestPayload: result.requestPayload,
    responsePayload: result.responsePayload,
    errorMessage: result.errorMessage,
  };
}

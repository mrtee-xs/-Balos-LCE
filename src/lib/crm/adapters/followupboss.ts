import { CrmIntegration } from '../../types';
import { StandardCrmPayload } from '../payload';

export interface AdapterResult {
  success: boolean;
  httpStatus: number;
  requestPayload: any;
  responsePayload: any;
  errorMessage?: string;
}

export async function sendToFollowUpBoss(
  integration: CrmIntegration,
  payload: StandardCrmPayload
): Promise<AdapterResult> {
  const apiKey = integration.api_key?.trim();
  const endpoint =
    integration.api_endpoint?.trim() || 'https://api.followupboss.com/v1/events';
  const systemName = integration.account_id?.trim() || 'Balos AI Lead Engine';

  if (!apiKey) {
    return {
      success: false,
      httpStatus: 400,
      requestPayload: null,
      responsePayload: null,
      errorMessage: 'Follow Up Boss API Key is missing.',
    };
  }

  const { lead, assigned_agent, viewing, event } = payload;

  const tags = [
    'Balos WhatsApp',
    lead.stage ? `Balos-${lead.stage}` : null,
    lead.temperature ? `Temp-${lead.temperature}` : null,
    lead.target_category || null,
    lead.golden_visa_seeker ? 'Golden Visa Seeker' : null,
    lead.is_uae_resident ? 'UAE Resident' : 'International Investor',
  ].filter(Boolean);

  const formattedPayload = {
    source: lead.source_label || 'Balos WhatsApp Engine',
    system: systemName,
    type: event === 'VIEWING_SCHEDULED' ? 'Showing Request' : 'General Inquiry',
    message: [
      `Dubai WhatsApp Lead [Score: ${lead.lead_score}/100 | Temp: ${lead.temperature}]`,
      lead.estimated_budget_aed > 0
        ? `Budget: AED ${lead.estimated_budget_aed.toLocaleString()}`
        : null,
      lead.target_communities.length > 0
        ? `Communities: ${lead.target_communities.join(', ')}`
        : null,
      lead.target_category ? `Property: ${lead.target_category}` : null,
      viewing ? `Viewing: ${viewing.viewing_type} at ${viewing.scheduled_at}` : null,
      lead.notes ? `Consultant Notes: ${lead.notes}` : null,
    ]
      .filter(Boolean)
      .join('\n'),
    person: {
      firstName: lead.first_name,
      lastName: lead.last_name,
      phones: [{ value: lead.phone, type: 'mobile' }],
      stage:
        lead.stage === 'CLOSED_WON'
          ? 'Closed'
          : lead.stage === 'QUALIFIED' || lead.stage === 'VIEWING_SCHEDULED'
          ? 'Hot Prospect'
          : 'Lead',
      tags,
      customFields: {
        'Balos Lead Score': lead.lead_score,
        'Budget AED': lead.estimated_budget_aed,
        'Preferred Communities': lead.target_communities.join(', '),
        'Buyer Persona': lead.buyer_persona || '',
        'Assigned Agent': assigned_agent?.name || '',
      },
    },
  };

  const basicAuth = Buffer.from(`${apiKey}:`).toString('base64');

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${basicAuth}`,
        'X-System': systemName,
      },
      body: JSON.stringify(formattedPayload),
    });

    let resBody: any = null;
    try {
      resBody = await res.json();
    } catch {
      resBody = { statusText: res.statusText };
    }

    return {
      success: res.ok,
      httpStatus: res.status,
      requestPayload: formattedPayload,
      responsePayload: resBody,
      errorMessage: res.ok ? undefined : resBody?.errorMessage || `HTTP ${res.status}: ${res.statusText}`,
    };
  } catch (err: any) {
    return {
      success: false,
      httpStatus: 0,
      requestPayload: formattedPayload,
      responsePayload: null,
      errorMessage: err.message || 'Network error connecting to Follow Up Boss.',
    };
  }
}

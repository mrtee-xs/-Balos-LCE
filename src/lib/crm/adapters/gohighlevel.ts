import { CrmIntegration } from '../../types';
import { StandardCrmPayload } from '../payload';
import { AdapterResult } from './followupboss';

export async function sendToGoHighLevel(
  integration: CrmIntegration,
  payload: StandardCrmPayload
): Promise<AdapterResult> {
  const token = integration.api_key?.trim();
  const endpoint =
    integration.api_endpoint?.trim() || 'https://rest.gohighlevel.com/v1/contacts/';
  const locationId = integration.account_id?.trim();

  if (!token) {
    return {
      success: false,
      httpStatus: 400,
      requestPayload: null,
      responsePayload: null,
      errorMessage: 'GoHighLevel API Key / Token is missing.',
    };
  }

  const { lead, assigned_agent, viewing } = payload;

  const tags = [
    'balos-whatsapp-lead',
    `stage-${lead.stage.toLowerCase()}`,
    lead.temperature ? `temp-${lead.temperature.toLowerCase()}` : null,
    lead.target_category ? lead.target_category.toLowerCase() : null,
    lead.golden_visa_seeker ? 'golden-visa' : null,
    lead.is_uae_resident ? 'uae-resident' : 'international-buyer',
  ].filter(Boolean);

  const formattedPayload: Record<string, any> = {
    firstName: lead.first_name,
    lastName: lead.last_name,
    name: lead.full_name,
    phone: lead.phone,
    source: lead.source_label || 'Balos WhatsApp AI',
    tags,
    customField: {
      lead_score: lead.lead_score,
      budget_aed: lead.estimated_budget_aed,
      communities: lead.target_communities.join(', '),
      buyer_persona: lead.buyer_persona || '',
      assigned_agent: assigned_agent?.name || '',
      viewing_status: viewing ? `${viewing.viewing_type} (${viewing.scheduled_at})` : '',
      consultant_notes: lead.notes || '',
    },
  };

  if (locationId) {
    formattedPayload.locationId = locationId;
  }

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
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
      errorMessage: res.ok
        ? undefined
        : resBody?.message || resBody?.error || `HTTP ${res.status}: ${res.statusText}`,
    };
  } catch (err: any) {
    return {
      success: false,
      httpStatus: 0,
      requestPayload: formattedPayload,
      responsePayload: null,
      errorMessage: err.message || 'Network error connecting to GoHighLevel API.',
    };
  }
}

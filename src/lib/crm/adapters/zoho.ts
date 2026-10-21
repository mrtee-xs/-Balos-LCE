import { CrmIntegration } from '../../types';
import { StandardCrmPayload } from '../payload';
import { AdapterResult } from './followupboss';

export async function sendToZoho(
  integration: CrmIntegration,
  payload: StandardCrmPayload
): Promise<AdapterResult> {
  const token = integration.api_key?.trim();
  const endpoint =
    integration.api_endpoint?.trim() || 'https://www.zohoapis.com/crm/v2/Leads';

  if (!token) {
    return {
      success: false,
      httpStatus: 400,
      requestPayload: null,
      responsePayload: null,
      errorMessage: 'Zoho CRM OAuth Token or Webhook URL is missing.',
    };
  }

  const { lead, assigned_agent, viewing } = payload;

  const mapZohoStatus = (stage: string) => {
    switch (stage) {
      case 'QUALIFIED':
        return 'Qualified';
      case 'VIEWING_SCHEDULED':
        return 'Contact in Future';
      case 'HANDOFF_TO_AGENT':
        return 'Attempted to Contact';
      case 'CLOSED_WON':
        return 'Closed Won';
      case 'CLOSED_LOST':
        return 'Lost Lead';
      default:
        return 'Not Contacted';
    }
  };

  const formattedPayload = {
    data: [
      {
        First_Name: lead.first_name,
        Last_Name: lead.last_name,
        Phone: lead.phone,
        Mobile: lead.phone,
        Lead_Source: lead.source_label || 'WhatsApp Engine',
        Lead_Status: mapZohoStatus(lead.stage),
        City: 'Dubai',
        Country: 'United Arab Emirates',
        Annual_Revenue: lead.estimated_budget_aed,
        Description: [
          `[Balos AI Qualification]`,
          `Lead Score: ${lead.lead_score}/100 | Temp: ${lead.temperature}`,
          `Budget: AED ${lead.estimated_budget_aed.toLocaleString()}`,
          `Communities: ${lead.target_communities.join(', ')}`,
          `Property: ${lead.target_category || 'Any'}`,
          `Golden Visa: ${lead.golden_visa_seeker ? 'Yes' : 'No'}`,
          assigned_agent ? `Agent: ${assigned_agent.name}` : null,
          viewing ? `Viewing: ${viewing.viewing_type} (${viewing.scheduled_at})` : null,
          lead.notes ? `Notes: ${lead.notes}` : null,
        ]
          .filter(Boolean)
          .join('\n'),
      },
    ],
  };

  const isFullWebhook = endpoint.startsWith('http') && endpoint.includes('webhook');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (!isFullWebhook) {
    headers['Authorization'] = token.startsWith('Zoho-oauthtoken ')
      ? token
      : `Zoho-oauthtoken ${token}`;
  }

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers,
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
        : resBody?.message || resBody?.data?.[0]?.message || `HTTP ${res.status}: ${res.statusText}`,
    };
  } catch (err: any) {
    return {
      success: false,
      httpStatus: 0,
      requestPayload: formattedPayload,
      responsePayload: null,
      errorMessage: err.message || 'Network error connecting to Zoho CRM.',
    };
  }
}

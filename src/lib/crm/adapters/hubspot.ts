import { CrmIntegration } from '../../types';
import { StandardCrmPayload } from '../payload';
import { AdapterResult } from './followupboss';

export async function sendToHubSpot(
  integration: CrmIntegration,
  payload: StandardCrmPayload
): Promise<AdapterResult> {
  const token = integration.api_key?.trim();
  const endpoint =
    integration.api_endpoint?.trim() || 'https://api.hubapi.com/crm/v3/objects/contacts';

  if (!token) {
    return {
      success: false,
      httpStatus: 400,
      requestPayload: null,
      responsePayload: null,
      errorMessage: 'HubSpot Private App Access Token is missing.',
    };
  }

  const { lead, assigned_agent, viewing } = payload;

  const mapLeadStatus = (stage: string) => {
    switch (stage) {
      case 'QUALIFIED':
        return 'QUALIFIED';
      case 'VIEWING_SCHEDULED':
        return 'IN_PROGRESS';
      case 'HANDOFF_TO_AGENT':
        return 'OPEN_DEAL';
      case 'CLOSED_WON':
        return 'CUSTOMER';
      case 'CLOSED_LOST':
        return 'UNQUALIFIED';
      default:
        return 'NEW';
    }
  };

  const formattedPayload = {
    properties: {
      firstname: lead.first_name,
      lastname: lead.last_name,
      phone: lead.phone,
      mobilephone: lead.phone,
      hs_lead_status: mapLeadStatus(lead.stage),
      lifecyclestage: lead.stage === 'CLOSED_WON' ? 'customer' : 'lead',
      city: 'Dubai',
      country: 'United Arab Emirates',
      message: [
        `[Balos AI Qualification Summary]`,
        `Score: ${lead.lead_score}/100 | Temp: ${lead.temperature}`,
        lead.estimated_budget_aed > 0
          ? `Budget: AED ${lead.estimated_budget_aed.toLocaleString()}`
          : null,
        lead.target_communities.length > 0
          ? `Target Communities: ${lead.target_communities.join(', ')}`
          : null,
        lead.target_category ? `Category: ${lead.target_category}` : null,
        lead.buyer_persona ? `Persona: ${lead.buyer_persona}` : null,
        lead.golden_visa_seeker ? 'Golden Visa Seeker: Yes' : null,
        assigned_agent ? `Assigned Agent: ${assigned_agent.name} (${assigned_agent.email})` : null,
        viewing ? `Viewing: ${viewing.viewing_type} at ${viewing.scheduled_at}` : null,
        lead.notes ? `Consultant Notes: ${lead.notes}` : null,
      ]
        .filter(Boolean)
        .join(' | '),
    },
  };

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
        : resBody?.message || `HTTP ${res.status}: ${res.statusText}`,
    };
  } catch (err: any) {
    return {
      success: false,
      httpStatus: 0,
      requestPayload: formattedPayload,
      responsePayload: null,
      errorMessage: err.message || 'Network error connecting to HubSpot API.',
    };
  }
}

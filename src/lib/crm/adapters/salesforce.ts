import { CrmIntegration } from '../../types';
import { StandardCrmPayload } from '../payload';
import { AdapterResult } from './followupboss';

export async function sendToSalesforce(
  integration: CrmIntegration,
  payload: StandardCrmPayload
): Promise<AdapterResult> {
  const token = integration.api_key?.trim();
  const instanceUrl = (integration.account_id?.trim() || '').replace(/\/$/, '');
  const endpoint =
    integration.api_endpoint?.trim() ||
    (instanceUrl
      ? `${instanceUrl}/services/data/v58.0/sobjects/Lead`
      : 'https://login.salesforce.com/services/data/v58.0/sobjects/Lead');

  if (!token) {
    return {
      success: false,
      httpStatus: 400,
      requestPayload: null,
      responsePayload: null,
      errorMessage: 'Salesforce OAuth Access Token is missing.',
    };
  }

  const { lead, assigned_agent, viewing } = payload;

  const mapSalesforceStatus = (stage: string) => {
    switch (stage) {
      case 'QUALIFIED':
        return 'Qualified';
      case 'VIEWING_SCHEDULED':
        return 'Working - Contacted';
      case 'HANDOFF_TO_AGENT':
        return 'Working - Contacted';
      case 'CLOSED_WON':
        return 'Closed - Converted';
      case 'CLOSED_LOST':
        return 'Closed - Not Converted';
      default:
        return 'Open - Not Contacted';
    }
  };

  const formattedPayload = {
    FirstName: lead.first_name,
    LastName: lead.last_name,
    Phone: lead.phone,
    MobilePhone: lead.phone,
    Company: lead.golden_visa_seeker
      ? 'Golden Visa Applicant'
      : 'Private Dubai Property Investor',
    LeadSource: lead.source_label || 'Balos WhatsApp AI',
    Status: mapSalesforceStatus(lead.stage),
    City: 'Dubai',
    Country: 'United Arab Emirates',
    Description: [
      `[Balos AI Qualification Dossier]`,
      `Score: ${lead.lead_score}/100 | Temp: ${lead.temperature}`,
      `Budget: AED ${lead.estimated_budget_aed.toLocaleString()}`,
      `Communities: ${lead.target_communities.join(', ')}`,
      `Target Property: ${lead.target_category || 'Any'}`,
      `UAE Resident: ${lead.is_uae_resident ? 'Yes' : 'No'}`,
      assigned_agent ? `Agent Assigned: ${assigned_agent.name}` : null,
      viewing ? `Viewing: ${viewing.viewing_type} (${viewing.scheduled_at})` : null,
      lead.notes ? `Consultant Notes: ${lead.notes}` : null,
    ]
      .filter(Boolean)
      .join('\n'),
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
        : (Array.isArray(resBody) ? resBody[0]?.message : resBody?.message) ||
          `HTTP ${res.status}: ${res.statusText}`,
    };
  } catch (err: any) {
    return {
      success: false,
      httpStatus: 0,
      requestPayload: formattedPayload,
      responsePayload: null,
      errorMessage: err.message || 'Network error connecting to Salesforce API.',
    };
  }
}

import { Lead, Booking, Agent, getLeadEstimatedBudget, getLeadSourceMeta } from '../types';

export interface StandardCrmPayload {
  event: string;
  timestamp: string;
  source_app: string;
  lead: {
    id: string;
    full_name: string;
    first_name: string;
    last_name: string;
    phone: string;
    whatsapp_id: string;
    stage: string;
    temperature: string;
    lead_score: number;
    budget_aed_min: number | null;
    budget_aed_max: number | null;
    estimated_budget_aed: number;
    target_communities: string[];
    target_category: string | null;
    buyer_persona: string | null;
    preferred_market: string | null;
    payment_preference: string | null;
    is_uae_resident: boolean | null;
    golden_visa_seeker: boolean | null;
    timeline: string | null;
    source: string;
    source_label: string;
    source_detail: string | null;
    notes: string | null;
    ai_paused: boolean;
    created_at: string;
    updated_at: string;
  };
  assigned_agent?: {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: string;
    rera_brn: string | null;
  } | null;
  viewing?: {
    id: string;
    scheduled_at: string;
    viewing_type: string;
    status: string;
    meeting_link: string | null;
  } | null;
}

export function buildStandardCrmPayload(
  event: string,
  lead: Lead,
  assignedAgent?: Agent | null,
  viewing?: Booking | null
): StandardCrmPayload {
  const rawName = (lead.full_name || '').trim();
  let firstName = 'WhatsApp';
  let lastName = 'Lead';

  if (rawName && rawName !== '.') {
    const parts = rawName.split(/\s+/);
    firstName = parts[0];
    lastName = parts.slice(1).join(' ') || 'Lead';
  } else if (lead.e164_phone) {
    firstName = 'Lead';
    lastName = lead.e164_phone;
  }

  const phone = lead.e164_phone || lead.whatsapp_id || '';
  const sourceMeta = getLeadSourceMeta(lead.source);
  const estimatedBudget = getLeadEstimatedBudget(lead);

  return {
    event,
    timestamp: new Date().toISOString(),
    source_app: 'Balos Real Estate Lead Engine',
    lead: {
      id: lead.id,
      full_name: lead.full_name || `${firstName} ${lastName}`.trim(),
      first_name: firstName,
      last_name: lastName,
      phone,
      whatsapp_id: lead.whatsapp_id,
      stage: lead.stage || 'NEW',
      temperature: lead.temperature || 'COLD',
      lead_score: lead.lead_score ?? 0,
      budget_aed_min: lead.budget_aed_min,
      budget_aed_max: lead.budget_aed_max,
      estimated_budget_aed: estimatedBudget,
      target_communities: lead.target_communities || [],
      target_category: lead.target_category || null,
      buyer_persona: lead.buyer_persona || null,
      preferred_market: lead.preferred_market || null,
      payment_preference: lead.payment_preference || null,
      is_uae_resident: lead.is_uae_resident,
      golden_visa_seeker: lead.golden_visa_seeker,
      timeline: lead.timeline || null,
      source: lead.source || 'DIRECT_WHATSAPP',
      source_label: sourceMeta.label,
      source_detail: lead.source_detail || null,
      notes: lead.notes || null,
      ai_paused: Boolean(lead.ai_paused),
      created_at: lead.created_at || new Date().toISOString(),
      updated_at: lead.updated_at || new Date().toISOString(),
    },
    assigned_agent: assignedAgent
      ? {
          id: assignedAgent.id,
          name: assignedAgent.name,
          email: assignedAgent.email,
          phone: assignedAgent.phone,
          role: assignedAgent.role,
          rera_brn: assignedAgent.rera_brn,
        }
      : null,
    viewing: viewing
      ? {
          id: viewing.id,
          scheduled_at: viewing.scheduled_at,
          viewing_type: viewing.viewing_type,
          status: viewing.status,
          meeting_link: viewing.meeting_link,
        }
      : null,
  };
}

export type MessageDirection = 'INBOUND' | 'OUTGOING';

export type SenderType = 'LEAD' | 'AI' | 'HUMAN_AGENT';

export type ViewingType = 'PHYSICAL_SITE_VISIT' | 'VIRTUAL_ZOOM_MEET' | 'OFFICE_CONSULTATION';

export type BookingStatus = 'REQUESTED' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';

export type LeadStage =
  | 'NEW'
  | 'ENGAGED'
  | 'QUALIFIED'
  | 'VIEWING_SCHEDULED'
  | 'HANDOFF_TO_AGENT'
  | 'CLOSED_LOST'
  | 'CLOSED_WON';

export type LeadTemperature = 'COLD' | 'WARM' | 'HOT';

export type BuyerPersona =
  | 'INVESTOR_HIGH_YIELD'
  | 'INVESTOR_CAPITAL_GAIN'
  | 'END_USER_BUYER'
  | 'TENANT';

export type PropertyCategory =
  | 'APARTMENT'
  | 'VILLA'
  | 'TOWNHOUSE'
  | 'PENTHOUSE'
  | 'DUPLEX'
  | 'PLOT'
  | 'COMMERCIAL';

export type PropertyMarketType = 'OFF_PLAN' | 'READY_SECONDARY' | 'RENTAL';

export type PaymentMethod = 'CASH' | 'MORTGAGE' | 'DEVELOPER_PLAN' | 'CRYPTO';

export type PropertyStatus = 'AVAILABLE' | 'RESERVED' | 'SOLD' | 'HIDDEN';

export type HandoffPriority = 'NORMAL' | 'HIGH' | 'URGENT';

export type HandoffStatus = 'PENDING' | 'ACCEPTED' | 'RESOLVED';

export interface Lead {
  id: string;
  whatsapp_id: string;
  e164_phone: string | null;
  full_name: string | null;
  stage: LeadStage | string;
  temperature: LeadTemperature | string;
  lead_score: number | null;
  buyer_persona: BuyerPersona | string | null;
  preferred_market: PropertyMarketType | string | null;
  target_communities: string[] | null;
  target_category: PropertyCategory | string | null;
  min_bedrooms: number | null;
  max_bedrooms: number | null;
  budget_aed_min: number | null;
  budget_aed_max: number | null;
  payment_preference: PaymentMethod | string | null;
  is_uae_resident: boolean | null;
  golden_visa_seeker: boolean | null;
  timeline: string | null;
  assigned_agent_id: string | null;
  ai_paused: boolean;
  last_agent_message_at: string | null;
  last_lead_message_at: string | null;
  created_at: string;
  updated_at: string;
  viewing_at: string | null;
  viewing_type: string | null;
  calendar_event_id: string | null;
  handoff_reason: string | null;
  handoff_at: string | null;
  handoff_reminder_sent_at: string | null;
}

export interface Message {
  id: string;
  lead_id: string;
  direction: MessageDirection | string;
  sender: SenderType | string;
  content: string;
  raw_payload?: any;
  tool_calls?: any;
  created_at: string;
}

export interface Booking {
  id: string;
  lead_id: string;
  property_id: string | null;
  agent_id: string | null;
  viewing_type: ViewingType | string;
  scheduled_at: string;
  meeting_link: string | null;
  status: BookingStatus | string;
  notes: string | null;
  created_at: string;
  lead?: {
    id: string;
    full_name: string | null;
    e164_phone: string | null;
  } | null;
  property?: {
    id: string;
    title: string;
    community: string;
  } | null;
}

export interface Property {
  id: string;
  title: string;
  developer: string | null;
  project_name: string | null;
  community: string;
  sub_community: string | null;
  category: PropertyCategory | string;
  market_type: PropertyMarketType | string;
  price_aed: number;
  bedrooms: number;
  bathrooms: number | null;
  size_sqft: number | null;
  payment_plan: any | null;
  handover_date: string | null;
  service_charge_aed_sqft: number | null;
  projected_roi: number | null;
  golden_visa_eligible: boolean;
  trakheesi_permit_no: string | null;
  status: PropertyStatus | string;
  description: string | null;
  brochure_url: string | null;
  images: string[] | null;
  created_at: string;
  updated_at: string;
  video_url: string | null;
}

export interface BusinessInfo {
  id: string;
  agency_name: string;
  description: string | null;
  service_areas: string | null;
  operating_hours: string | null;
  tone_of_voice: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  website: string | null;
  additional_notes: string | null;
  updated_at?: string;
}

export interface Agent {
  id: string;
  name: string;
  email: string;
  phone: string;
  rera_brn: string | null;
  languages: string[] | null;
  is_active: boolean;
  created_at: string;
  role: 'admin' | 'agent' | string;
}

export interface Handoff {
  id: string;
  lead_id: string;
  assigned_agent_id: string | null;
  priority: HandoffPriority | string;
  reason: string;
  status: HandoffStatus | string;
  created_at: string;
  resolved_at: string | null;
  lead?: Lead;
}

export interface DashboardContextData {
  is_user: boolean;
  is_admin: boolean;
  name?: string | null;
  role?: string | null;
  email?: string | null;
  agent_id?: string | null;
}

/**
 * Checks whether a lead belongs in the human queue.
 * Condition: stage = 'HANDOFF_TO_AGENT' OR ai_paused = true
 */
export function isLeadInQueue(lead: {
  stage?: string | null;
  ai_paused?: boolean | null;
}): boolean {
  return lead.stage === 'HANDOFF_TO_AGENT' || Boolean(lead.ai_paused);
}

export interface QueueBadgeInfo {
  label: string;
  variant: 'paused' | 'waiting';
}

/**
 * Returns the exact soft handoff queue badge for a lead.
 * - ai_paused = true -> "AI paused. You are in control"
 * - ai_paused = false and stage is handoff -> "Waiting for you. AI is answering other questions"
 */
export function getQueueStatusBadge(lead: {
  stage?: string | null;
  ai_paused?: boolean | null;
}): QueueBadgeInfo | null {
  if (lead.ai_paused) {
    return {
      label: 'AI paused. You are in control',
      variant: 'paused',
    };
  }
  if (lead.stage === 'HANDOFF_TO_AGENT') {
    return {
      label: 'Waiting for you. AI is answering other questions',
      variant: 'waiting',
    };
  }
  return null;
}

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

export type LeadSource =
  | 'PROPERTY_FINDER'
  | 'BAYUT'
  | 'DUBIZZLE'
  | 'META_ADS'
  | 'WEBSITE'
  | 'DIRECT_WHATSAPP';

export const LEAD_STAGE_OPTIONS: { value: LeadStage; label: string }[] = [
  { value: 'NEW', label: 'New' },
  { value: 'ENGAGED', label: 'Engaged' },
  { value: 'QUALIFIED', label: 'Qualified' },
  { value: 'VIEWING_SCHEDULED', label: 'Viewing scheduled' },
  { value: 'HANDOFF_TO_AGENT', label: 'Handoff to agent' },
  { value: 'CLOSED_WON', label: 'Closed won' },
  { value: 'CLOSED_LOST', label: 'Closed lost' },
];

export const LEAD_SOURCE_OPTIONS: {
  value: LeadSource;
  label: string;
  shortLabel: string;
  badgeClass: string;
}[] = [
  {
    value: 'PROPERTY_FINDER',
    label: 'Property Finder',
    shortLabel: 'Property Finder',
    badgeClass: 'bg-ink text-white border border-ink',
  },
  {
    value: 'BAYUT',
    label: 'Bayut',
    shortLabel: 'Bayut',
    badgeClass: 'bg-surface-muted text-ink border border-border-strong',
  },
  {
    value: 'DUBIZZLE',
    label: 'Dubizzle',
    shortLabel: 'Dubizzle',
    badgeClass: 'bg-surface-subtle text-ink-muted border border-border',
  },
  {
    value: 'META_ADS',
    label: 'Meta Click-to-WhatsApp',
    shortLabel: 'Meta Ads',
    badgeClass: 'bg-surface-muted text-ink border border-border',
  },
  {
    value: 'WEBSITE',
    label: 'Agency Website',
    shortLabel: 'Website',
    badgeClass: 'bg-surface-subtle text-ink-muted border border-border',
  },
  {
    value: 'DIRECT_WHATSAPP',
    label: 'Direct WhatsApp',
    shortLabel: 'WhatsApp',
    badgeClass: 'bg-seaglass text-ink-muted border border-border',
  },
];

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
  source?: LeadSource | string | null;
  source_detail?: string | null;
  notes?: string | null;
  last_property_id?: string | null;
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
  received_at?: string | null;
  message_type?: string | null;
  media_url?: string | null;
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

export type AgentRole = 'admin' | 'sales_leader' | 'team_leader' | 'agent';

export const AGENT_ROLE_OPTIONS: {
  value: AgentRole;
  label: string;
  canAssign: boolean;
}[] = [
  { value: 'agent', label: 'Licensed Agent', canAssign: false },
  { value: 'team_leader', label: 'Team Leader', canAssign: true },
  { value: 'sales_leader', label: 'Sales Leader', canAssign: true },
  { value: 'admin', label: 'Agency Principal', canAssign: true },
];

export interface Agent {
  id: string;
  name: string;
  email: string;
  phone: string;
  rera_brn: string | null;
  languages: string[] | null;
  is_active: boolean;
  created_at: string;
  role: AgentRole | string;
}

/**
 * Checks whether the current user is an Agency Principal (Admin level).
 */
export function isAgencyPrincipal(
  role?: string | null,
  isAdmin?: boolean | null
): boolean {
  if (isAdmin) return true;
  return (role || '').toLowerCase().trim() === 'admin';
}

/**
 * Checks whether the user is a regular licensed agent scoped strictly to their assigned items.
 */
export function isAgentScoped(
  role?: string | null,
  isAdmin?: boolean | null
): boolean {
  return !isAgencyPrincipal(role, isAdmin);
}

/**
 * Only Leadership positions (Admin, Sales Leader, Team Leader) are permitted
 * to assign or reassign leads to agents. Regular agents cannot assign leads.
 */
export function canAssignLeads(
  role?: string | null,
  isAdmin?: boolean | null
): boolean {
  if (isAdmin) return true;
  const r = (role || '').toLowerCase().trim();
  return r === 'admin' || r === 'sales_leader' || r === 'team_leader';
}

export function formatAgentRole(
  role?: string | null,
  isAdmin?: boolean | null
): string {
  const r = (role || '').toLowerCase().trim();
  if (r === 'sales_leader') return 'Sales Leader';
  if (r === 'team_leader') return 'Team Leader';
  if (r === 'admin' || isAdmin) return 'Agency Principal';
  return 'Licensed Agent';
}

export interface AgentNotification {
  id: string;
  type: 'LEAD_ASSIGNED' | 'HANDOFF_ALERT' | 'NEW_MESSAGE';
  title: string;
  body: string;
  leadId: string;
  createdAt: string;
  read: boolean;
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

export type SubscriptionTier = 'starter' | 'growth' | 'scale' | 'enterprise';

export interface DashboardContextData {
  is_user: boolean;
  is_admin: boolean;
  name?: string | null;
  role?: string | null;
  email?: string | null;
  agent_id?: string | null;
  agency_id?: string | null;
  agency_name?: string | null;
  subscription_tier?: SubscriptionTier | null;
  subscription_status?: string | null;
  billing_cycle?: 'monthly' | 'yearly' | null;
  monthly_conversation_limit?: number | null;
  conversations_used_this_month?: number | null;
  max_whatsapp_lines?: number | null;
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

/**
 * Resolves display metadata for a lead's source channel.
 */
export function getLeadSourceMeta(source?: string | null) {
  const normalized = (source || 'DIRECT_WHATSAPP').toUpperCase().trim();
  const found = LEAD_SOURCE_OPTIONS.find((o) => o.value === normalized);
  if (found) return found;
  return LEAD_SOURCE_OPTIONS[LEAD_SOURCE_OPTIONS.length - 1]; // Direct WhatsApp default
}

/**
 * Checks whether a lead is low-intent/junk spam filtered by Balos (score <= 10 and not qualified/booked).
 */
export function isJunkOrSpamLead(lead: {
  lead_score?: number | null;
  stage?: string | null;
  temperature?: string | null;
}): boolean {
  const score = lead.lead_score ?? 0;
  const stage = lead.stage || 'NEW';
  const highIntentStages = [
    'QUALIFIED',
    'VIEWING_SCHEDULED',
    'HANDOFF_TO_AGENT',
    'CLOSED_WON',
  ];
  if (highIntentStages.includes(stage)) return false;
  return score <= 10 && (lead.temperature || 'COLD') === 'COLD';
}

/**
 * Calculates the best single-number AED budget estimate for a lead:
 * midpoint if both min and max are positive, otherwise max or min.
 */
export function getLeadEstimatedBudget(lead: {
  budget_aed_min?: number | null;
  budget_aed_max?: number | null;
}): number {
  const min = Number(lead.budget_aed_min) || 0;
  const max = Number(lead.budget_aed_max) || 0;
  if (min > 0 && max > 0) {
    return Math.round((min + max) / 2);
  }
  return max > 0 ? max : min > 0 ? min : 0;
}

// ============================================================================
// External CRM Integrations & Audit Types
// ============================================================================

export type CrmProvider =
  | 'followupboss'
  | 'hubspot'
  | 'gohighlevel'
  | 'zoho'
  | 'salesforce'
  | 'webhook';

export interface CrmIntegration {
  id: string;
  provider: CrmProvider;
  name: string;
  is_enabled: boolean;
  api_key?: string | null;
  api_endpoint?: string | null;
  account_id?: string | null; // e.g. Location ID for GHL, System Name for FUB, Portal ID for HubSpot
  webhook_url?: string | null;
  webhook_secret?: string | null;
  sync_on_create: boolean;
  sync_on_qualified: boolean;
  sync_on_viewing: boolean;
  sync_on_handoff: boolean;
  sync_on_stage_change: boolean;
  field_mapping?: Record<string, string> | null;
  last_sync_at?: string | null;
  last_sync_status?: 'SUCCESS' | 'ERROR' | 'PENDING' | null;
  last_sync_error?: string | null;
  created_at?: string;
  updated_at?: string;
}

export type CrmSyncEvent =
  | 'LEAD_CREATED'
  | 'LEAD_QUALIFIED'
  | 'VIEWING_SCHEDULED'
  | 'HANDOFF'
  | 'STAGE_CHANGED'
  | 'MANUAL_SYNC'
  | 'TEST_PING';

export interface CrmSyncLog {
  id: string;
  integration_id?: string | null;
  provider: CrmProvider | string;
  lead_id?: string | null;
  lead_name?: string | null;
  event: CrmSyncEvent | string;
  status: 'SUCCESS' | 'FAILED';
  http_status?: number | null;
  request_payload?: any;
  response_payload?: any;
  error_message?: string | null;
  duration_ms?: number | null;
  created_at: string;
}

export interface CrmProviderMeta {
  provider: CrmProvider;
  name: string;
  tagline: string;
  category: 'Real Estate' | 'Inbound & Sales' | 'Agency Marketing' | 'Enterprise' | 'Custom';
  authType: 'api_key' | 'bearer' | 'oauth_webhook' | 'webhook';
  defaultEndpoint: string;
  docsUrl: string;
  supportsAccountId: boolean;
  accountIdLabel?: string;
  accountIdPlaceholder?: string;
  keyLabel: string;
  keyPlaceholder: string;
  iconBg: string;
}

export const CRM_PROVIDERS_META: CrmProviderMeta[] = [
  {
    provider: 'followupboss',
    name: 'Follow Up Boss',
    tagline: 'Premier real estate CRM for top-producing teams & brokerages',
    category: 'Real Estate',
    authType: 'api_key',
    defaultEndpoint: 'https://api.followupboss.com/v1/events',
    docsUrl: 'https://docs.followupboss.com/reference/events-post',
    supportsAccountId: true,
    accountIdLabel: 'System Name Header',
    accountIdPlaceholder: 'Balos AI Lead Engine',
    keyLabel: 'API Key (fub_...)',
    keyPlaceholder: 'fub_live_xxxxxxxxxxxxxxxxxxxxxxxx',
    iconBg: 'bg-blue-600 text-white',
  },
  {
    provider: 'hubspot',
    name: 'HubSpot CRM',
    tagline: 'Leading inbound CRM for automated pipelines & deal tracking',
    category: 'Inbound & Sales',
    authType: 'bearer',
    defaultEndpoint: 'https://api.hubapi.com/crm/v3/objects/contacts',
    docsUrl: 'https://developers.hubspot.com/docs/api/crm/contacts',
    supportsAccountId: true,
    accountIdLabel: 'HubSpot Portal ID',
    accountIdPlaceholder: 'e.g. 24891024',
    keyLabel: 'Private App Access Token (pat-...)',
    keyPlaceholder: 'pat-na1-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    iconBg: 'bg-orange-500 text-white',
  },
  {
    provider: 'gohighlevel',
    name: 'GoHighLevel / LeadConnector',
    tagline: 'Multi-channel marketing automation & CRM pipelines',
    category: 'Agency Marketing',
    authType: 'bearer',
    defaultEndpoint: 'https://rest.gohighlevel.com/v1/contacts/',
    docsUrl: 'https://highlevel.stoplight.io/docs/integrations/',
    supportsAccountId: true,
    accountIdLabel: 'Sub-Account Location ID',
    accountIdPlaceholder: 'e.g. v7bL1K... Location ID',
    keyLabel: 'API Key / Bearer Token',
    keyPlaceholder: 'eyJhbGciOi... Location API Key',
    iconBg: 'bg-emerald-600 text-white',
  },
  {
    provider: 'zoho',
    name: 'Zoho CRM',
    tagline: 'Enterprise CRM choice for GCC & UAE property developers',
    category: 'Enterprise',
    authType: 'oauth_webhook',
    defaultEndpoint: 'https://www.zohoapis.com/crm/v2/Leads',
    docsUrl: 'https://www.zoho.com/crm/developer/docs/api/v2/insert-records.html',
    supportsAccountId: false,
    keyLabel: 'OAuth Access Token or Webhook URL',
    keyPlaceholder: '1000.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.xxxxxxxx',
    iconBg: 'bg-red-500 text-white',
  },
  {
    provider: 'salesforce',
    name: 'Salesforce CRM',
    tagline: 'Global enterprise standard for corporate real estate groups',
    category: 'Enterprise',
    authType: 'bearer',
    defaultEndpoint: 'https://login.salesforce.com/services/data/v58.0/sobjects/Lead',
    docsUrl: 'https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/',
    supportsAccountId: true,
    accountIdLabel: 'Instance URL / My Domain',
    accountIdPlaceholder: 'https://youragency.my.salesforce.com',
    keyLabel: 'Connected App OAuth Access Token',
    keyPlaceholder: '00D5... Bearer Access Token',
    iconBg: 'bg-sky-500 text-white',
  },
  {
    provider: 'webhook',
    name: 'Custom Webhook / Zapier / Make',
    tagline: 'Connect to any CRM (MyCRM, Masterkey, Airtable, n8n, Pabbly) via JSON POST',
    category: 'Custom',
    authType: 'webhook',
    defaultEndpoint: 'https://n8n.balos.tech/webhook/balos-crm-sync',
    docsUrl: 'https://zapier.com/apps/webhook/integrations',
    supportsAccountId: false,
    keyLabel: 'Secret Signing Key (Optional HMAC-SHA256)',
    keyPlaceholder: 'whsec_xxxxxxxxxxxxxxxxxxxxxxxx',
    iconBg: 'bg-stone-800 text-white',
  },
];



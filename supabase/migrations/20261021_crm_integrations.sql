-- ============================================================================
-- Balos CRM Integrations & Sync Audit Log Migration
-- Safe, idempotent migration for external CRM synchronization:
-- Follow Up Boss, HubSpot, GoHighLevel, Zoho CRM, Salesforce, & Generic Webhooks
-- ============================================================================

-- 1. Create table for CRM Integration Configurations
CREATE TABLE IF NOT EXISTS public.crm_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL, -- 'followupboss', 'hubspot', 'gohighlevel', 'zoho', 'salesforce', 'webhook'
  name text NOT NULL,
  is_enabled boolean NOT NULL DEFAULT false,
  api_key text,
  api_endpoint text,
  account_id text, -- e.g. Location ID for GHL, System Name for FUB, Portal ID for HubSpot
  webhook_url text,
  webhook_secret text,
  sync_on_create boolean NOT NULL DEFAULT false,
  sync_on_qualified boolean NOT NULL DEFAULT true,
  sync_on_viewing boolean NOT NULL DEFAULT true,
  sync_on_handoff boolean NOT NULL DEFAULT true,
  sync_on_stage_change boolean NOT NULL DEFAULT false,
  field_mapping jsonb DEFAULT '{}'::jsonb,
  last_sync_at timestamptz,
  last_sync_status text, -- 'SUCCESS', 'ERROR', 'PENDING'
  last_sync_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index provider for fast lookups
CREATE INDEX IF NOT EXISTS idx_crm_integrations_provider ON public.crm_integrations(provider);
CREATE INDEX IF NOT EXISTS idx_crm_integrations_enabled ON public.crm_integrations(is_enabled);

-- 2. Create table for CRM Sync Audit Trail
CREATE TABLE IF NOT EXISTS public.crm_sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id uuid REFERENCES public.crm_integrations(id) ON DELETE SET NULL,
  provider text NOT NULL,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  lead_name text,
  event text NOT NULL, -- 'LEAD_CREATED', 'LEAD_QUALIFIED', 'VIEWING_SCHEDULED', 'HANDOFF', 'STAGE_CHANGED', 'MANUAL_SYNC', 'TEST_PING'
  status text NOT NULL, -- 'SUCCESS', 'FAILED'
  http_status integer,
  request_payload jsonb,
  response_payload jsonb,
  error_message text,
  duration_ms integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_sync_logs_lead ON public.crm_sync_logs(lead_id);
CREATE INDEX IF NOT EXISTS idx_crm_sync_logs_created ON public.crm_sync_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crm_sync_logs_provider ON public.crm_sync_logs(provider);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.crm_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_sync_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- Policy for crm_integrations: Authenticated read & write
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'crm_integrations'
      AND policyname = 'Authenticated users can manage crm integrations'
  ) THEN
    CREATE POLICY "Authenticated users can manage crm integrations"
      ON public.crm_integrations
      FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;

  -- Policy for crm_sync_logs: Authenticated read & write
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'crm_sync_logs'
      AND policyname = 'Authenticated users can view and write crm sync logs'
  ) THEN
    CREATE POLICY "Authenticated users can view and write crm sync logs"
      ON public.crm_sync_logs
      FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- 4. Seed default provider profiles if empty
INSERT INTO public.crm_integrations (
  provider,
  name,
  is_enabled,
  api_endpoint,
  sync_on_create,
  sync_on_qualified,
  sync_on_viewing,
  sync_on_handoff,
  sync_on_stage_change
)
SELECT 'followupboss', 'Follow Up Boss', false, 'https://api.followupboss.com/v1/events', false, true, true, true, false
WHERE NOT EXISTS (SELECT 1 FROM public.crm_integrations WHERE provider = 'followupboss');

INSERT INTO public.crm_integrations (
  provider,
  name,
  is_enabled,
  api_endpoint,
  sync_on_create,
  sync_on_qualified,
  sync_on_viewing,
  sync_on_handoff,
  sync_on_stage_change
)
SELECT 'hubspot', 'HubSpot CRM', false, 'https://api.hubapi.com/crm/v3/objects/contacts', false, true, true, true, false
WHERE NOT EXISTS (SELECT 1 FROM public.crm_integrations WHERE provider = 'hubspot');

INSERT INTO public.crm_integrations (
  provider,
  name,
  is_enabled,
  api_endpoint,
  sync_on_create,
  sync_on_qualified,
  sync_on_viewing,
  sync_on_handoff,
  sync_on_stage_change
)
SELECT 'gohighlevel', 'GoHighLevel / LeadConnector', false, 'https://rest.gohighlevel.com/v1/contacts/', false, true, true, true, false
WHERE NOT EXISTS (SELECT 1 FROM public.crm_integrations WHERE provider = 'gohighlevel');

INSERT INTO public.crm_integrations (
  provider,
  name,
  is_enabled,
  api_endpoint,
  sync_on_create,
  sync_on_qualified,
  sync_on_viewing,
  sync_on_handoff,
  sync_on_stage_change
)
SELECT 'zoho', 'Zoho CRM', false, 'https://www.zohoapis.com/crm/v2/Leads', false, true, true, true, false
WHERE NOT EXISTS (SELECT 1 FROM public.crm_integrations WHERE provider = 'zoho');

INSERT INTO public.crm_integrations (
  provider,
  name,
  is_enabled,
  api_endpoint,
  sync_on_create,
  sync_on_qualified,
  sync_on_viewing,
  sync_on_handoff,
  sync_on_stage_change
)
SELECT 'salesforce', 'Salesforce CRM', false, 'https://login.salesforce.com/services/data/v58.0/sobjects/Lead', false, true, true, true, false
WHERE NOT EXISTS (SELECT 1 FROM public.crm_integrations WHERE provider = 'salesforce');

INSERT INTO public.crm_integrations (
  provider,
  name,
  is_enabled,
  webhook_url,
  sync_on_create,
  sync_on_qualified,
  sync_on_viewing,
  sync_on_handoff,
  sync_on_stage_change
)
SELECT 'webhook', 'Custom Webhook / Zapier / Make', false, 'https://n8n.balos.tech/webhook/balos-crm-sync', false, true, true, true, true
WHERE NOT EXISTS (SELECT 1 FROM public.crm_integrations WHERE provider = 'webhook');

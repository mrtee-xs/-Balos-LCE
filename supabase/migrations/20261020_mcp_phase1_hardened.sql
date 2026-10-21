-- ============================================================================
-- BALOS PHASE 1: HARDENED MULTI-TENANT ISOLATION & SECURE MCP ACCESS LAYER
-- Idempotent, single-transaction migration
-- To be executed manually in Supabase SQL Editor by Administrator
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. Create agencies table & establish Balos primary agency
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.agencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.agencies (id, name, slug)
VALUES ('99999999-9999-4999-8999-999999999999', 'Balos Real Estate Luxury & Off-Plan', 'balos-primary')
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 2. Add agency_id to all operational tables & backfill
-- ----------------------------------------------------------------------------
ALTER TABLE public.leads 
  ADD COLUMN IF NOT EXISTS agency_id uuid REFERENCES public.agencies(id) DEFAULT '99999999-9999-4999-8999-999999999999';
CREATE INDEX IF NOT EXISTS idx_leads_agency_id ON public.leads(agency_id);

ALTER TABLE public.properties 
  ADD COLUMN IF NOT EXISTS agency_id uuid REFERENCES public.agencies(id) DEFAULT '99999999-9999-4999-8999-999999999999';
CREATE INDEX IF NOT EXISTS idx_properties_agency_id ON public.properties(agency_id);

ALTER TABLE public.bookings 
  ADD COLUMN IF NOT EXISTS agency_id uuid REFERENCES public.agencies(id) DEFAULT '99999999-9999-4999-8999-999999999999';
CREATE INDEX IF NOT EXISTS idx_bookings_agency_id ON public.bookings(agency_id);

ALTER TABLE public.messages 
  ADD COLUMN IF NOT EXISTS agency_id uuid REFERENCES public.agencies(id) DEFAULT '99999999-9999-4999-8999-999999999999';
CREATE INDEX IF NOT EXISTS idx_messages_agency_id ON public.messages(agency_id);

ALTER TABLE public.business_info 
  ADD COLUMN IF NOT EXISTS agency_id uuid REFERENCES public.agencies(id) DEFAULT '99999999-9999-4999-8999-999999999999';

ALTER TABLE public.agent_notifications 
  ADD COLUMN IF NOT EXISTS agency_id uuid REFERENCES public.agencies(id) DEFAULT '99999999-9999-4999-8999-999999999999';
CREATE INDEX IF NOT EXISTS idx_agent_notifications_agency_id ON public.agent_notifications(agency_id);

ALTER TABLE public.handoffs 
  ADD COLUMN IF NOT EXISTS agency_id uuid REFERENCES public.agencies(id) DEFAULT '99999999-9999-4999-8999-999999999999';
CREATE INDEX IF NOT EXISTS idx_handoffs_agency_id ON public.handoffs(agency_id);

ALTER TABLE public.weekly_reports 
  ADD COLUMN IF NOT EXISTS agency_id uuid REFERENCES public.agencies(id) DEFAULT '99999999-9999-4999-8999-999999999999';
CREATE INDEX IF NOT EXISTS idx_weekly_reports_agency_id ON public.weekly_reports(agency_id);

-- Backfill any null agency_id with primary agency
UPDATE public.leads SET agency_id = '99999999-9999-4999-8999-999999999999' WHERE agency_id IS NULL;
UPDATE public.properties SET agency_id = '99999999-9999-4999-8999-999999999999' WHERE agency_id IS NULL;
UPDATE public.bookings SET agency_id = '99999999-9999-4999-8999-999999999999' WHERE agency_id IS NULL;
UPDATE public.messages SET agency_id = '99999999-9999-4999-8999-999999999999' WHERE agency_id IS NULL;
UPDATE public.business_info SET agency_id = '99999999-9999-4999-8999-999999999999' WHERE agency_id IS NULL;
UPDATE public.agent_notifications SET agency_id = '99999999-9999-4999-8999-999999999999' WHERE agency_id IS NULL;
UPDATE public.handoffs SET agency_id = '99999999-9999-4999-8999-999999999999' WHERE agency_id IS NULL;
UPDATE public.weekly_reports SET agency_id = '99999999-9999-4999-8999-999999999999' WHERE agency_id IS NULL;

-- Enforce NOT NULL constraint
ALTER TABLE public.leads ALTER COLUMN agency_id SET NOT NULL;
ALTER TABLE public.properties ALTER COLUMN agency_id SET NOT NULL;
ALTER TABLE public.bookings ALTER COLUMN agency_id SET NOT NULL;
ALTER TABLE public.messages ALTER COLUMN agency_id SET NOT NULL;
ALTER TABLE public.business_info ALTER COLUMN agency_id SET NOT NULL;
ALTER TABLE public.agent_notifications ALTER COLUMN agency_id SET NOT NULL;
ALTER TABLE public.handoffs ALTER COLUMN agency_id SET NOT NULL;
ALTER TABLE public.weekly_reports ALTER COLUMN agency_id SET NOT NULL;

-- ----------------------------------------------------------------------------
-- 3. Link auth_user_id to agents and dashboard_viewers (by confirmed email)
-- ----------------------------------------------------------------------------
ALTER TABLE public.agents 
  ADD COLUMN IF NOT EXISTS agency_id uuid REFERENCES public.agencies(id) DEFAULT '99999999-9999-4999-8999-999999999999',
  ADD COLUMN IF NOT EXISTS auth_user_id uuid UNIQUE REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS idx_agents_agency_id ON public.agents(agency_id);
CREATE INDEX IF NOT EXISTS idx_agents_auth_user_id ON public.agents(auth_user_id);

UPDATE public.agents SET agency_id = '99999999-9999-4999-8999-999999999999' WHERE agency_id IS NULL;
ALTER TABLE public.agents ALTER COLUMN agency_id SET NOT NULL;

-- Backfill agents.auth_user_id from confirmed auth.users
UPDATE public.agents a
SET auth_user_id = u.id
FROM auth.users u
WHERE lower(a.email) = lower(u.email)
  AND u.email_confirmed_at IS NOT NULL
  AND a.auth_user_id IS NULL;

-- Same linking for dashboard_viewers
ALTER TABLE public.dashboard_viewers
  ADD COLUMN IF NOT EXISTS auth_user_id uuid UNIQUE REFERENCES auth.users(id);
CREATE INDEX IF NOT EXISTS idx_dashboard_viewers_auth_user_id ON public.dashboard_viewers(auth_user_id);

UPDATE public.dashboard_viewers dv
SET auth_user_id = u.id
FROM auth.users u
WHERE lower(dv.email) = lower(u.email)
  AND u.email_confirmed_at IS NOT NULL
  AND dv.auth_user_id IS NULL;

-- ----------------------------------------------------------------------------
-- 4. Create MCP Client and Audit Call Log Tables
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.mcp_clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  name text NOT NULL,
  scopes text[] NOT NULL DEFAULT '{"leads:read", "viewings:read", "roi:read"}',
  key_hash text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz DEFAULT NULL
);
CREATE INDEX IF NOT EXISTS idx_mcp_clients_agency ON public.mcp_clients(agency_id);
CREATE INDEX IF NOT EXISTS idx_mcp_clients_key_hash ON public.mcp_clients(key_hash);

CREATE TABLE IF NOT EXISTS public.mcp_call_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.mcp_clients(id) ON DELETE SET NULL,
  tool text NOT NULL,
  params_hash text NOT NULL,
  row_count int NOT NULL DEFAULT 0,
  ok boolean NOT NULL DEFAULT true,
  latency_ms int NOT NULL DEFAULT 0,
  at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_mcp_call_log_agency_at ON public.mcp_call_log(agency_id, at DESC);

-- Enable RLS on all tables
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.handoffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboard_viewers ENABLE ROW LEVEL SECURITY;

-- Note: RLS enabled on mcp_clients and mcp_call_log with NO policies for authenticated/anon.
-- They are completely denied from dashboard and REST API (deny by default).
ALTER TABLE public.mcp_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mcp_call_log ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 5. Create Dedicated Restricted Database Roles for MCP
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'balos_mcp_role') THEN
    CREATE ROLE balos_mcp_role WITH NOLOGIN NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE;
  END IF;
  -- Create login role with NO password (to be set manually by admin via ALTER ROLE)
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'balos_mcp_user') THEN
    CREATE ROLE balos_mcp_user WITH LOGIN NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE;
  END IF;
END $$;

GRANT balos_mcp_role TO balos_mcp_user;
GRANT USAGE ON SCHEMA public TO balos_mcp_role, balos_mcp_user;

-- Revoke all table access from MCP role and anon
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM balos_mcp_role;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM balos_mcp_role;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;

ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM anon, PUBLIC;

-- ----------------------------------------------------------------------------
-- 6. Helper Functions (Strict auth.uid() matching, no email fallback, no UPDATE)
-- ----------------------------------------------------------------------------

-- Clean up any legacy function signatures that have differing return types
DROP FUNCTION IF EXISTS public.dashboard_context() CASCADE;
DROP FUNCTION IF EXISTS public.generate_weekly_report(date) CASCADE;
DROP FUNCTION IF EXISTS public.generate_weekly_report(date, uuid) CASCADE;

-- Phone number masking: strips non-digits, returns '••••' if < 7, else '••••' || right(4)
CREATE OR REPLACE FUNCTION public.mask_phone(p_phone text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = ''
AS $$
DECLARE
  v_digits text;
BEGIN
  IF p_phone IS NULL THEN
    RETURN '••••';
  END IF;

  v_digits := regexp_replace(p_phone, '[^0-9]', '', 'g');

  IF length(v_digits) < 7 THEN
    RETURN '••••';
  END IF;

  RETURN '••••' || right(v_digits, 4);
END;
$$;

-- Returns agency_id matching auth.uid() strictly. Returns NULL if unauthenticated or no agent/viewer row.
CREATE OR REPLACE FUNCTION public.current_user_agency_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT agency_id FROM public.agents
  WHERE auth_user_id = auth.uid() AND is_active = true
  UNION ALL
  SELECT '99999999-9999-4999-8999-999999999999'::uuid FROM public.dashboard_viewers
  WHERE auth_user_id = auth.uid() AND is_active = true
  LIMIT 1;
$$;

-- Returns true if auth.uid() belongs to an active licensed agent or admin (excludes demo viewers)
CREATE OR REPLACE FUNCTION public.is_dashboard_staff()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.agents
    WHERE auth_user_id = auth.uid() AND is_active = true
  );
$$;

-- Returns true if auth.uid() belongs to an active admin
CREATE OR REPLACE FUNCTION public.is_dashboard_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.agents
    WHERE auth_user_id = auth.uid() AND is_active = true AND role = 'admin'
  );
$$;

-- Returns true if auth.uid() is an active agent OR active demo viewer
CREATE OR REPLACE FUNCTION public.is_dashboard_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT (public.current_user_agency_id() IS NOT NULL);
$$;

-- Returns exact JSON keys expected by DashboardContextData in src/lib/types.ts
DROP FUNCTION IF EXISTS public.dashboard_context();
CREATE OR REPLACE FUNCTION public.dashboard_context()
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_agent record;
  v_viewer record;
BEGIN
  IF v_uid IS NULL THEN
    RETURN json_build_object('is_user', false, 'is_admin', false);
  END IF;

  SELECT id, name, role, email, agency_id
  INTO v_agent
  FROM public.agents
  WHERE auth_user_id = v_uid AND is_active = true
  LIMIT 1;

  IF v_agent.id IS NOT NULL THEN
    RETURN json_build_object(
      'is_user', true,
      'is_admin', (v_agent.role = 'admin'),
      'name', v_agent.name,
      'role', v_agent.role,
      'email', v_agent.email,
      'agent_id', v_agent.id,
      'agency_id', v_agent.agency_id
    );
  END IF;

  SELECT email
  INTO v_viewer
  FROM public.dashboard_viewers
  WHERE auth_user_id = v_uid AND is_active = true
  LIMIT 1;

  IF v_viewer.email IS NOT NULL THEN
    RETURN json_build_object(
      'is_user', true,
      'is_admin', false,
      'name', 'Demo Viewer',
      'role', 'viewer',
      'email', v_viewer.email,
      'agent_id', null,
      'agency_id', '99999999-9999-4999-8999-999999999999'::uuid
    );
  END IF;

  RETURN json_build_object('is_user', false, 'is_admin', false);
END;
$$;

-- Harden agent assignment notification trigger
CREATE OR REPLACE FUNCTION public.notify_agent_on_lead_assignment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.assigned_agent_id IS NOT NULL
     AND (OLD.assigned_agent_id IS DISTINCT FROM NEW.assigned_agent_id) THEN
    INSERT INTO public.agent_notifications (
      agency_id,
      agent_id,
      lead_id,
      type,
      title,
      body
    ) VALUES (
      NEW.agency_id,
      NEW.assigned_agent_id,
      NEW.id,
      'LEAD_ASSIGNED',
      'New lead assigned: ' || COALESCE(NULLIF(NEW.full_name, '.'), NEW.e164_phone, NEW.whatsapp_id, 'WhatsApp Lead'),
      'Stage: ' || COALESCE(NEW.stage, 'NEW')
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Multi-tenant Weekly Report generator
DROP FUNCTION IF EXISTS public.generate_weekly_report(date);
DROP FUNCTION IF EXISTS public.generate_weekly_report(date, uuid);
CREATE OR REPLACE FUNCTION public.generate_weekly_report(
  p_week_start date DEFAULT NULL,
  p_agency_id uuid DEFAULT '99999999-9999-4999-8999-999999999999'::uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_week_start date;
  v_week_end date;
  v_agency_id uuid := COALESCE(p_agency_id, '99999999-9999-4999-8999-999999999999'::uuid);
  v_metrics json;
  v_by_source json;
  v_report_id uuid;
BEGIN
  v_week_start := COALESCE(p_week_start, (date_trunc('week', now() AT TIME ZONE 'Asia/Dubai'))::date);
  v_week_end := v_week_start + 6;

  -- Compute aggregated metrics for the agency
  SELECT json_build_object(
    'new_leads', COUNT(l.id),
    'qualified', COUNT(l.id) FILTER (WHERE l.stage IN ('QUALIFIED', 'VIEWING_SCHEDULED', 'HANDOFF_TO_AGENT', 'CLOSED_WON')),
    'viewings_booked', (SELECT COUNT(b.id) FROM public.bookings b WHERE b.agency_id = v_agency_id AND b.created_at >= v_week_start AND b.created_at < v_week_end + 1),
    'closed_won', COUNT(l.id) FILTER (WHERE l.stage = 'CLOSED_WON'),
    'pipeline_value_aed', COALESCE(SUM(COALESCE(l.budget_aed_max, l.budget_aed_min, 0)) FILTER (WHERE l.stage IN ('QUALIFIED', 'VIEWING_SCHEDULED', 'HANDOFF_TO_AGENT')), 0)
  ) INTO v_metrics
  FROM public.leads l
  WHERE l.agency_id = v_agency_id AND l.created_at >= v_week_start AND l.created_at < v_week_end + 1;

  -- Compute by-source breakdown for the agency
  SELECT json_agg(json_build_object(
    'source', s.source,
    'count', s.cnt,
    'qualified', s.qual
  )) INTO v_by_source
  FROM (
    SELECT 
      l.source,
      COUNT(l.id) AS cnt,
      COUNT(l.id) FILTER (WHERE l.stage IN ('QUALIFIED', 'VIEWING_SCHEDULED', 'HANDOFF_TO_AGENT', 'CLOSED_WON')) AS qual
    FROM public.leads l
    WHERE l.agency_id = v_agency_id AND l.created_at >= v_week_start AND l.created_at < v_week_end + 1
    GROUP BY l.source
  ) s;

  INSERT INTO public.weekly_reports (
    agency_id,
    week_start,
    week_end,
    metrics,
    by_source,
    generated_at
  ) VALUES (
    v_agency_id,
    v_week_start,
    v_week_end,
    v_metrics,
    COALESCE(v_by_source, '[]'::json),
    now()
  ) RETURNING id INTO v_report_id;

  RETURN json_build_object(
    'report_id', v_report_id,
    'agency_id', v_agency_id,
    'week_start', v_week_start,
    'week_end', v_week_end,
    'metrics', v_metrics,
    'by_source', COALESCE(v_by_source, '[]'::json)
  );
END;
$$;

-- ----------------------------------------------------------------------------
-- 7. Purge ALL Existing Policies Dynamically by Real Name & Apply Scoped Policies
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT schemaname, tablename, policyname 
    FROM pg_policies 
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
  END LOOP;
END $$;

-- Table: agencies
CREATE POLICY "agencies_select_policy" ON public.agencies
  FOR SELECT TO authenticated
  USING (id = public.current_user_agency_id());

-- Table: leads
CREATE POLICY "leads_select_policy" ON public.leads
  FOR SELECT TO authenticated
  USING (agency_id = public.current_user_agency_id());

CREATE POLICY "leads_insert_policy" ON public.leads
  FOR INSERT TO authenticated
  WITH CHECK (agency_id = public.current_user_agency_id() AND public.is_dashboard_staff());

CREATE POLICY "leads_update_policy" ON public.leads
  FOR UPDATE TO authenticated
  USING (agency_id = public.current_user_agency_id() AND public.is_dashboard_staff())
  WITH CHECK (agency_id = public.current_user_agency_id() AND public.is_dashboard_staff());

CREATE POLICY "leads_delete_policy" ON public.leads
  FOR DELETE TO authenticated
  USING (agency_id = public.current_user_agency_id() AND public.is_dashboard_admin());

-- Table: properties
CREATE POLICY "properties_select_policy" ON public.properties
  FOR SELECT TO authenticated
  USING (agency_id = public.current_user_agency_id());

CREATE POLICY "properties_insert_policy" ON public.properties
  FOR INSERT TO authenticated
  WITH CHECK (agency_id = public.current_user_agency_id() AND public.is_dashboard_admin());

CREATE POLICY "properties_update_policy" ON public.properties
  FOR UPDATE TO authenticated
  USING (agency_id = public.current_user_agency_id() AND public.is_dashboard_admin())
  WITH CHECK (agency_id = public.current_user_agency_id() AND public.is_dashboard_admin());

CREATE POLICY "properties_delete_policy" ON public.properties
  FOR DELETE TO authenticated
  USING (agency_id = public.current_user_agency_id() AND public.is_dashboard_admin());

-- Table: bookings
CREATE POLICY "bookings_select_policy" ON public.bookings
  FOR SELECT TO authenticated
  USING (agency_id = public.current_user_agency_id());

CREATE POLICY "bookings_insert_policy" ON public.bookings
  FOR INSERT TO authenticated
  WITH CHECK (agency_id = public.current_user_agency_id() AND public.is_dashboard_staff());

CREATE POLICY "bookings_update_policy" ON public.bookings
  FOR UPDATE TO authenticated
  USING (agency_id = public.current_user_agency_id() AND public.is_dashboard_staff())
  WITH CHECK (agency_id = public.current_user_agency_id() AND public.is_dashboard_staff());

CREATE POLICY "bookings_delete_policy" ON public.bookings
  FOR DELETE TO authenticated
  USING (agency_id = public.current_user_agency_id() AND public.is_dashboard_admin());

-- Table: messages
CREATE POLICY "messages_select_policy" ON public.messages
  FOR SELECT TO authenticated
  USING (agency_id = public.current_user_agency_id());

CREATE POLICY "messages_insert_policy" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (agency_id = public.current_user_agency_id() AND public.is_dashboard_staff());

CREATE POLICY "messages_update_policy" ON public.messages
  FOR UPDATE TO authenticated
  USING (agency_id = public.current_user_agency_id() AND public.is_dashboard_staff())
  WITH CHECK (agency_id = public.current_user_agency_id() AND public.is_dashboard_staff());

CREATE POLICY "messages_delete_policy" ON public.messages
  FOR DELETE TO authenticated
  USING (agency_id = public.current_user_agency_id() AND public.is_dashboard_admin());

-- Table: agents (Admin-only for write; prevents role/privilege escalation)
CREATE POLICY "agents_select_policy" ON public.agents
  FOR SELECT TO authenticated
  USING (agency_id = public.current_user_agency_id());

CREATE POLICY "agents_insert_policy" ON public.agents
  FOR INSERT TO authenticated
  WITH CHECK (agency_id = public.current_user_agency_id() AND public.is_dashboard_admin());

CREATE POLICY "agents_update_policy" ON public.agents
  FOR UPDATE TO authenticated
  USING (agency_id = public.current_user_agency_id() AND public.is_dashboard_admin())
  WITH CHECK (agency_id = public.current_user_agency_id() AND public.is_dashboard_admin());

CREATE POLICY "agents_delete_policy" ON public.agents
  FOR DELETE TO authenticated
  USING (agency_id = public.current_user_agency_id() AND public.is_dashboard_admin());

-- Table: business_info
CREATE POLICY "business_info_select_policy" ON public.business_info
  FOR SELECT TO authenticated
  USING (agency_id = public.current_user_agency_id());

CREATE POLICY "business_info_insert_policy" ON public.business_info
  FOR INSERT TO authenticated
  WITH CHECK (agency_id = public.current_user_agency_id() AND public.is_dashboard_admin());

CREATE POLICY "business_info_update_policy" ON public.business_info
  FOR UPDATE TO authenticated
  USING (agency_id = public.current_user_agency_id() AND public.is_dashboard_admin())
  WITH CHECK (agency_id = public.current_user_agency_id() AND public.is_dashboard_admin());

CREATE POLICY "business_info_delete_policy" ON public.business_info
  FOR DELETE TO authenticated
  USING (agency_id = public.current_user_agency_id() AND public.is_dashboard_admin());

-- Table: agent_notifications (Fixed: scoped by agency and recipient agent)
CREATE POLICY "agent_notifications_select_policy" ON public.agent_notifications
  FOR SELECT TO authenticated
  USING (
    agency_id = public.current_user_agency_id() 
    AND (
      agent_id IN (SELECT a.id FROM public.agents a WHERE a.auth_user_id = auth.uid()) 
      OR public.is_dashboard_admin()
    )
  );

CREATE POLICY "agent_notifications_insert_policy" ON public.agent_notifications
  FOR INSERT TO authenticated
  WITH CHECK (agency_id = public.current_user_agency_id() AND public.is_dashboard_staff());

CREATE POLICY "agent_notifications_update_policy" ON public.agent_notifications
  FOR UPDATE TO authenticated
  USING (
    agency_id = public.current_user_agency_id() 
    AND (
      agent_id IN (SELECT a.id FROM public.agents a WHERE a.auth_user_id = auth.uid()) 
      OR public.is_dashboard_admin()
    )
  )
  WITH CHECK (
    agency_id = public.current_user_agency_id() 
    AND (
      agent_id IN (SELECT a.id FROM public.agents a WHERE a.auth_user_id = auth.uid()) 
      OR public.is_dashboard_admin()
    )
  );

CREATE POLICY "agent_notifications_delete_policy" ON public.agent_notifications
  FOR DELETE TO authenticated
  USING (agency_id = public.current_user_agency_id() AND public.is_dashboard_admin());

-- Table: handoffs
CREATE POLICY "handoffs_select_policy" ON public.handoffs
  FOR SELECT TO authenticated
  USING (agency_id = public.current_user_agency_id());

CREATE POLICY "handoffs_insert_policy" ON public.handoffs
  FOR INSERT TO authenticated
  WITH CHECK (agency_id = public.current_user_agency_id() AND public.is_dashboard_staff());

CREATE POLICY "handoffs_update_policy" ON public.handoffs
  FOR UPDATE TO authenticated
  USING (agency_id = public.current_user_agency_id() AND public.is_dashboard_staff())
  WITH CHECK (agency_id = public.current_user_agency_id() AND public.is_dashboard_staff());

CREATE POLICY "handoffs_delete_policy" ON public.handoffs
  FOR DELETE TO authenticated
  USING (agency_id = public.current_user_agency_id() AND public.is_dashboard_admin());

-- Table: weekly_reports
CREATE POLICY "weekly_reports_select_policy" ON public.weekly_reports
  FOR SELECT TO authenticated
  USING (agency_id = public.current_user_agency_id());

CREATE POLICY "weekly_reports_insert_policy" ON public.weekly_reports
  FOR INSERT TO authenticated
  WITH CHECK (agency_id = public.current_user_agency_id() AND public.is_dashboard_admin());

CREATE POLICY "weekly_reports_update_policy" ON public.weekly_reports
  FOR UPDATE TO authenticated
  USING (agency_id = public.current_user_agency_id() AND public.is_dashboard_admin())
  WITH CHECK (agency_id = public.current_user_agency_id() AND public.is_dashboard_admin());

CREATE POLICY "weekly_reports_delete_policy" ON public.weekly_reports
  FOR DELETE TO authenticated
  USING (agency_id = public.current_user_agency_id() AND public.is_dashboard_admin());

-- Table: dashboard_viewers (Admin-only manage)
CREATE POLICY "dashboard_viewers_select_policy" ON public.dashboard_viewers
  FOR SELECT TO authenticated
  USING (public.is_dashboard_admin());

CREATE POLICY "dashboard_viewers_insert_policy" ON public.dashboard_viewers
  FOR INSERT TO authenticated
  WITH CHECK (public.is_dashboard_admin());

CREATE POLICY "dashboard_viewers_update_policy" ON public.dashboard_viewers
  FOR UPDATE TO authenticated
  USING (public.is_dashboard_admin())
  WITH CHECK (public.is_dashboard_admin());

CREATE POLICY "dashboard_viewers_delete_policy" ON public.dashboard_viewers
  FOR DELETE TO authenticated
  USING (public.is_dashboard_admin());

-- ----------------------------------------------------------------------------
-- 8. Agency-Aware Views (security_invoker = true, agency_id appended last, NO DROP)
-- ----------------------------------------------------------------------------

-- View: v_lead_response
CREATE OR REPLACE VIEW public.v_lead_response AS
SELECT 
  l.id AS lead_id,
  l.source,
  l.stage,
  min(m_in.created_at) AS first_inbound_at,
  min(m_out.created_at) AS first_reply_at,
  (min(m_out.created_at) IS NOT NULL AND min(m_in.created_at) IS NOT NULL) AS latency_measured,
  EXTRACT(EPOCH FROM (min(m_out.created_at) - min(m_in.created_at)))::int AS first_reply_seconds,
  (
    EXTRACT(ISODOW FROM min(m_in.created_at) AT TIME ZONE 'Asia/Dubai') = 7 
    OR EXTRACT(HOUR FROM min(m_in.created_at) AT TIME ZONE 'Asia/Dubai') < 9 
    OR EXTRACT(HOUR FROM min(m_in.created_at) AT TIME ZONE 'Asia/Dubai') >= 19
  ) AS after_hours,
  l.agency_id
FROM public.leads l
LEFT JOIN public.messages m_in ON m_in.lead_id = l.id AND m_in.direction = 'INBOUND'
LEFT JOIN public.messages m_out ON m_out.lead_id = l.id AND m_out.direction = 'OUTGOING' AND m_out.created_at >= m_in.created_at
GROUP BY l.id, l.source, l.stage, l.agency_id;

ALTER VIEW public.v_lead_response SET (security_invoker = true);

-- View: v_source_performance
CREATE OR REPLACE VIEW public.v_source_performance AS
SELECT 
  l.source,
  COUNT(l.id)::bigint AS leads,
  COUNT(l.id) FILTER (WHERE l.created_at >= now() - interval '30 days')::bigint AS leads_30d,
  COUNT(l.id) FILTER (WHERE l.stage IN ('QUALIFIED', 'VIEWING_SCHEDULED', 'HANDOFF_TO_AGENT', 'CLOSED_WON'))::bigint AS qualified,
  (SELECT COUNT(b.id)::bigint FROM public.bookings b WHERE b.agency_id = l.agency_id AND b.lead_id IN (SELECT l2.id FROM public.leads l2 WHERE l2.source = l.source AND l2.agency_id = l.agency_id)) AS viewings_booked,
  COUNT(l.id) FILTER (WHERE l.stage = 'CLOSED_WON')::bigint AS closed_won,
  COALESCE(AVG(l.lead_score), 0)::numeric AS avg_lead_score,
  COALESCE(SUM(COALESCE(l.budget_aed_max, l.budget_aed_min, 0)) FILTER (WHERE l.stage IN ('QUALIFIED', 'VIEWING_SCHEDULED', 'HANDOFF_TO_AGENT', 'CLOSED_WON')), 0)::numeric AS pipeline_deal_value_aed,
  l.agency_id
FROM public.leads l
GROUP BY l.agency_id, l.source;

ALTER VIEW public.v_source_performance SET (security_invoker = true);

-- View: v_lead_pipeline
CREATE OR REPLACE VIEW public.v_lead_pipeline AS
SELECT 
  l.id AS lead_id,
  l.source,
  l.stage,
  COALESCE(l.budget_aed_max, l.budget_aed_min, 0)::numeric(15,2) AS deal_value_aed,
  l.agency_id
FROM public.leads l;

ALTER VIEW public.v_lead_pipeline SET (security_invoker = true);

-- View: v_roi_overview
CREATE OR REPLACE VIEW public.v_roi_overview AS
SELECT 
  COUNT(l.id) FILTER (WHERE l.created_at >= now() - interval '7 days')::bigint AS enquiries_7d,
  COUNT(l.id) FILTER (WHERE l.created_at >= now() - interval '7 days' AND l.last_agent_message_at IS NOT NULL)::bigint AS answered_7d,
  COUNT(l.id) FILTER (
    WHERE l.created_at >= now() - interval '7 days' 
    AND (
      EXTRACT(ISODOW FROM l.created_at AT TIME ZONE 'Asia/Dubai') = 7 
      OR EXTRACT(HOUR FROM l.created_at AT TIME ZONE 'Asia/Dubai') < 9 
      OR EXTRACT(HOUR FROM l.created_at AT TIME ZONE 'Asia/Dubai') >= 19
    )
  )::bigint AS after_hours_enquiries_7d,
  COUNT(l.id) FILTER (
    WHERE l.created_at >= now() - interval '7 days' 
    AND l.last_agent_message_at IS NOT NULL
    AND (
      EXTRACT(ISODOW FROM l.created_at AT TIME ZONE 'Asia/Dubai') = 7 
      OR EXTRACT(HOUR FROM l.created_at AT TIME ZONE 'Asia/Dubai') < 9 
      OR EXTRACT(HOUR FROM l.created_at AT TIME ZONE 'Asia/Dubai') >= 19
    )
  )::bigint AS after_hours_answered_7d,
  COUNT(lr.lead_id) FILTER (WHERE lr.first_inbound_at >= now() - interval '7 days' AND lr.latency_measured = true)::bigint AS measured_replies_7d,
  COALESCE(percentile_cont(0.5) WITHIN GROUP (ORDER BY lr.first_reply_seconds) FILTER (WHERE lr.first_inbound_at >= now() - interval '7 days' AND lr.latency_measured = true), 0)::double precision AS median_first_reply_seconds_7d,
  (SELECT COUNT(m.id)::bigint FROM public.messages m WHERE m.agency_id = l.agency_id AND m.sender = 'AI' AND m.created_at >= now() - interval '7 days') AS ai_messages_7d,
  COUNT(l.id) FILTER (WHERE l.created_at >= now() - interval '7 days' AND l.stage IN ('QUALIFIED', 'VIEWING_SCHEDULED', 'HANDOFF_TO_AGENT', 'CLOSED_WON'))::bigint AS qualified_7d,
  (SELECT COUNT(b.id)::bigint FROM public.bookings b WHERE b.agency_id = l.agency_id AND b.created_at >= now() - interval '7 days') AS viewings_booked_7d,
  (SELECT COUNT(b.id)::bigint FROM public.bookings b WHERE b.agency_id = l.agency_id AND b.scheduled_at >= now() AND b.status = 'CONFIRMED') AS upcoming_viewings,
  COUNT(l.id) FILTER (WHERE l.stage IN ('QUALIFIED', 'VIEWING_SCHEDULED', 'HANDOFF_TO_AGENT'))::bigint AS pipeline_leads,
  COALESCE(SUM(COALESCE(l.budget_aed_max, l.budget_aed_min, 0)) FILTER (WHERE l.stage IN ('QUALIFIED', 'VIEWING_SCHEDULED', 'HANDOFF_TO_AGENT')), 0)::numeric AS pipeline_deal_value_aed,
  l.agency_id
FROM public.leads l
LEFT JOIN public.v_lead_response lr ON lr.lead_id = l.id
GROUP BY l.agency_id;

ALTER VIEW public.v_roi_overview SET (security_invoker = true);

-- Confirm SELECT on views for authenticated
GRANT SELECT ON public.v_lead_response TO authenticated;
GRANT SELECT ON public.v_source_performance TO authenticated;
GRANT SELECT ON public.v_lead_pipeline TO authenticated;
GRANT SELECT ON public.v_roi_overview TO authenticated;

-- ----------------------------------------------------------------------------
-- 9. Hardened MCP Database Functions (Client ID validation, strict scopes)
-- ----------------------------------------------------------------------------

-- Helper: validate client, non-revoked, active agency, and required scope
CREATE OR REPLACE FUNCTION public.validate_mcp_client(
  p_client_id uuid,
  p_required_scope text
)
RETURNS TABLE (agency_id uuid, has_pii boolean, has_messages boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_agency_id uuid;
  v_scopes text[];
  v_agency_active boolean;
BEGIN
  SELECT c.agency_id, c.scopes, a.is_active
  INTO v_agency_id, v_scopes, v_agency_active
  FROM public.mcp_clients c
  JOIN public.agencies a ON a.id = c.agency_id
  WHERE c.id = p_client_id
    AND c.revoked_at IS NULL;

  IF v_agency_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Invalid, missing, or revoked MCP client token';
  END IF;

  IF NOT v_agency_active THEN
    RAISE EXCEPTION 'Unauthorized: Client agency account is inactive';
  END IF;

  IF NOT (p_required_scope = ANY(v_scopes)) THEN
    RAISE EXCEPTION 'Forbidden: Client lacks required permission scope "%"', p_required_scope;
  END IF;

  RETURN QUERY SELECT 
    v_agency_id, 
    ('pii:read' = ANY(v_scopes)), 
    ('messages:read' = ANY(v_scopes));
END;
$$;

-- Function 1: mcp_list_leads (NO notes in list results; masked phone only; max 25 rows)
CREATE OR REPLACE FUNCTION public.mcp_list_leads(
  p_client_id uuid,
  p_status text DEFAULT NULL,
  p_source text DEFAULT NULL,
  p_temperature text DEFAULT NULL,
  p_date_from timestamptz DEFAULT NULL,
  p_date_to timestamptz DEFAULT NULL,
  p_limit int DEFAULT 25,
  p_offset int DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  full_name text,
  stage text,
  temperature text,
  lead_score int,
  source text,
  source_detail text,
  budget_aed_min numeric,
  budget_aed_max numeric,
  target_communities text[],
  target_category text,
  masked_phone text,
  created_at timestamptz,
  updated_at timestamptz,
  viewing_at timestamptz,
  viewing_type text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_agency_id uuid;
  v_capped_limit int;
BEGIN
  -- Authenticate client and verify leads:read scope
  SELECT v.agency_id INTO v_agency_id
  FROM public.validate_mcp_client(p_client_id, 'leads:read') v;

  v_capped_limit := LEAST(GREATEST(COALESCE(p_limit, 25), 1), 25);

  RETURN QUERY
  SELECT 
    l.id,
    l.full_name,
    l.stage,
    l.temperature,
    l.lead_score,
    l.source,
    l.source_detail,
    l.budget_aed_min::numeric,
    l.budget_aed_max::numeric,
    l.target_communities,
    l.target_category,
    public.mask_phone(COALESCE(l.e164_phone, l.whatsapp_id)),
    l.created_at,
    l.updated_at,
    l.viewing_at,
    l.viewing_type
  FROM public.leads l
  WHERE l.agency_id = v_agency_id
    AND (p_status IS NULL OR l.stage = UPPER(p_status))
    AND (p_source IS NULL OR l.source = UPPER(p_source))
    AND (p_temperature IS NULL OR l.temperature = UPPER(p_temperature))
    AND (p_date_from IS NULL OR l.created_at >= p_date_from)
    AND (p_date_to IS NULL OR l.created_at <= p_date_to)
  ORDER BY l.created_at DESC
  LIMIT v_capped_limit
  OFFSET GREATEST(COALESCE(p_offset, 0), 0);
END;
$$;

-- Function 2: mcp_get_lead (returns notes & messages inside untrusted_content; phone masked unless pii:read)
CREATE OR REPLACE FUNCTION public.mcp_get_lead(
  p_client_id uuid,
  p_lead_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_agency_id uuid;
  v_has_pii boolean;
  v_has_messages boolean;
  v_lead json;
BEGIN
  SELECT v.agency_id, v.has_pii, v.has_messages 
  INTO v_agency_id, v_has_pii, v_has_messages
  FROM public.validate_mcp_client(p_client_id, 'leads:read') v;

  SELECT json_build_object(
    'id', l.id,
    'full_name', l.full_name,
    'stage', l.stage,
    'temperature', l.temperature,
    'lead_score', l.lead_score,
    'source', l.source,
    'source_detail', l.source_detail,
    'buyer_persona', l.buyer_persona,
    'preferred_market', l.preferred_market,
    'target_communities', l.target_communities,
    'target_category', l.target_category,
    'min_bedrooms', l.min_bedrooms,
    'max_bedrooms', l.max_bedrooms,
    'budget_aed_min', l.budget_aed_min,
    'budget_aed_max', l.budget_aed_max,
    'payment_preference', l.payment_preference,
    'is_uae_resident', l.is_uae_resident,
    'golden_visa_seeker', l.golden_visa_seeker,
    'timeline', l.timeline,
    'assigned_agent_id', l.assigned_agent_id,
    'ai_paused', l.ai_paused,
    'viewing_at', l.viewing_at,
    'viewing_type', l.viewing_type,
    'created_at', l.created_at,
    'updated_at', l.updated_at,
    'phone', CASE WHEN v_has_pii THEN COALESCE(l.e164_phone, l.whatsapp_id) ELSE public.mask_phone(COALESCE(l.e164_phone, l.whatsapp_id)) END,
    'untrusted_content', json_build_object(
      'notes', l.notes,
      'recent_messages', CASE WHEN v_has_messages THEN (
        SELECT json_agg(json_build_object(
          'id', m.id,
          'direction', m.direction,
          'sender', m.sender,
          'content', m.content,
          'created_at', m.created_at
        ) ORDER BY m.created_at DESC)
        FROM (
          SELECT id, direction, sender, content, created_at
          FROM public.messages
          WHERE lead_id = l.id AND agency_id = v_agency_id
          ORDER BY created_at DESC
          LIMIT 10
        ) m
      ) ELSE '[]'::json END
    )
  ) INTO v_lead
  FROM public.leads l
  WHERE l.id = p_lead_id AND l.agency_id = v_agency_id;

  RETURN v_lead;
END;
$$;

-- Function 3: mcp_get_roi_summary (requires roi:read)
CREATE OR REPLACE FUNCTION public.mcp_get_roi_summary(
  p_client_id uuid,
  p_period_days int DEFAULT 7
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_agency_id uuid;
  v_since timestamptz;
  v_summary json;
BEGIN
  SELECT v.agency_id INTO v_agency_id
  FROM public.validate_mcp_client(p_client_id, 'roi:read') v;

  v_since := now() - (COALESCE(p_period_days, 7) || ' days')::interval;

  SELECT json_build_object(
    'period_days', p_period_days,
    'enquiries_count', COUNT(l.id),
    'qualified_count', COUNT(l.id) FILTER (WHERE l.stage IN ('QUALIFIED', 'VIEWING_SCHEDULED', 'HANDOFF_TO_AGENT', 'CLOSED_WON')),
    'viewings_booked_count', (
      SELECT COUNT(b.id) FROM public.bookings b 
      WHERE b.agency_id = v_agency_id AND b.created_at >= v_since
    ),
    'closed_won_count', COUNT(l.id) FILTER (WHERE l.stage = 'CLOSED_WON'),
    'pipeline_deal_value_aed', COALESCE(SUM(COALESCE(l.budget_aed_max, l.budget_aed_min, 0)) FILTER (WHERE l.stage IN ('QUALIFIED', 'VIEWING_SCHEDULED', 'HANDOFF_TO_AGENT')), 0),
    'hot_leads_count', COUNT(l.id) FILTER (WHERE l.temperature = 'HOT')
  ) INTO v_summary
  FROM public.leads l
  WHERE l.agency_id = v_agency_id AND l.created_at >= v_since;

  RETURN v_summary;
END;
$$;

-- Function 4: mcp_list_viewings (requires viewings:read, max 25 rows)
CREATE OR REPLACE FUNCTION public.mcp_list_viewings(
  p_client_id uuid,
  p_status text DEFAULT NULL,
  p_date_from timestamptz DEFAULT NULL,
  p_date_to timestamptz DEFAULT NULL,
  p_limit int DEFAULT 25,
  p_offset int DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  lead_id uuid,
  property_id uuid,
  property_title text,
  property_community text,
  lead_name text,
  viewing_type text,
  scheduled_at timestamptz,
  meeting_link text,
  status text,
  notes text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_agency_id uuid;
  v_capped_limit int;
BEGIN
  SELECT v.agency_id INTO v_agency_id
  FROM public.validate_mcp_client(p_client_id, 'viewings:read') v;

  v_capped_limit := LEAST(GREATEST(COALESCE(p_limit, 25), 1), 25);

  RETURN QUERY
  SELECT 
    b.id,
    b.lead_id,
    b.property_id,
    p.title AS property_title,
    p.community AS property_community,
    l.full_name AS lead_name,
    b.viewing_type,
    b.scheduled_at,
    b.meeting_link,
    b.status,
    b.notes,
    b.created_at
  FROM public.bookings b
  LEFT JOIN public.properties p ON p.id = b.property_id
  LEFT JOIN public.leads l ON l.id = b.lead_id
  WHERE b.agency_id = v_agency_id
    AND (p_status IS NULL OR b.status = UPPER(p_status))
    AND (p_date_from IS NULL OR b.scheduled_at >= p_date_from)
    AND (p_date_to IS NULL OR b.scheduled_at <= p_date_to)
  ORDER BY b.scheduled_at ASC
  LIMIT v_capped_limit
  OFFSET GREATEST(COALESCE(p_offset, 0), 0);
END;
$$;

-- Function 5: mcp_update_lead_status (requires leads:write, validates stage enum)
CREATE OR REPLACE FUNCTION public.mcp_update_lead_status(
  p_client_id uuid,
  p_lead_id uuid,
  p_status text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_agency_id uuid;
  v_clean_stage text;
  v_rows_affected int := 0;
BEGIN
  SELECT v.agency_id INTO v_agency_id
  FROM public.validate_mcp_client(p_client_id, 'leads:write') v;

  v_clean_stage := UPPER(TRIM(p_status));
  
  IF v_clean_stage NOT IN ('NEW', 'ENGAGED', 'QUALIFIED', 'VIEWING_SCHEDULED', 'HANDOFF_TO_AGENT', 'CLOSED_WON', 'CLOSED_LOST') THEN
    RAISE EXCEPTION 'Invalid lead stage: %. Must be one of: NEW, ENGAGED, QUALIFIED, VIEWING_SCHEDULED, HANDOFF_TO_AGENT, CLOSED_WON, CLOSED_LOST', v_clean_stage;
  END IF;

  UPDATE public.leads
  SET stage = v_clean_stage,
      handoff_at = CASE WHEN v_clean_stage = 'HANDOFF_TO_AGENT' AND handoff_at IS NULL THEN now() ELSE handoff_at END,
      updated_at = now()
  WHERE id = p_lead_id AND agency_id = v_agency_id;

  GET DIAGNOSTICS v_rows_affected = ROW_COUNT;

  IF v_rows_affected = 0 THEN
    RETURN json_build_object('ok', false, 'error', 'Lead not found or does not belong to agency');
  END IF;

  RETURN json_build_object('ok', true, 'lead_id', p_lead_id, 'stage', v_clean_stage);
END;
$$;

-- Function 6: mcp_add_lead_note (requires leads:write, max 2000 chars)
CREATE OR REPLACE FUNCTION public.mcp_add_lead_note(
  p_client_id uuid,
  p_lead_id uuid,
  p_note text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_agency_id uuid;
  v_sanitized_note text;
  v_rows_affected int := 0;
BEGIN
  SELECT v.agency_id INTO v_agency_id
  FROM public.validate_mcp_client(p_client_id, 'leads:write') v;

  v_sanitized_note := SUBSTRING(TRIM(p_note) FROM 1 FOR 2000);

  UPDATE public.leads
  SET notes = CASE 
        WHEN notes IS NULL OR notes = '' THEN '[' || to_char(now(), 'YYYY-MM-DD HH24:MI:SS') || ' MCP]: ' || v_sanitized_note
        ELSE notes || E'\n' || '[' || to_char(now(), 'YYYY-MM-DD HH24:MI:SS') || ' MCP]: ' || v_sanitized_note
      END,
      updated_at = now()
  WHERE id = p_lead_id AND agency_id = v_agency_id;

  GET DIAGNOSTICS v_rows_affected = ROW_COUNT;

  IF v_rows_affected = 0 THEN
    RETURN json_build_object('ok', false, 'error', 'Lead not found or does not belong to agency');
  END IF;

  RETURN json_build_object('ok', true, 'lead_id', p_lead_id, 'note_length', length(v_sanitized_note));
END;
$$;

-- Function 7: mcp_log_call (Dedicated audit logger, executable by balos_mcp_role, never rolled back)
CREATE OR REPLACE FUNCTION public.mcp_log_call(
  p_client_id uuid,
  p_tool text,
  p_params_hash text,
  p_row_count int DEFAULT 0,
  p_ok boolean DEFAULT true,
  p_latency_ms int DEFAULT 0
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_agency_id uuid;
  v_log_id uuid;
BEGIN
  SELECT agency_id INTO v_agency_id
  FROM public.mcp_clients
  WHERE id = p_client_id;

  INSERT INTO public.mcp_call_log (
    agency_id,
    client_id,
    tool,
    params_hash,
    row_count,
    ok,
    latency_ms,
    at
  ) VALUES (
    COALESCE(v_agency_id, '99999999-9999-4999-8999-999999999999'::uuid),
    p_client_id,
    p_tool,
    p_params_hash,
    COALESCE(p_row_count, 0),
    COALESCE(p_ok, true),
    COALESCE(p_latency_ms, 0),
    now()
  ) RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;

-- ----------------------------------------------------------------------------
-- 10. Strict Function Grants (Revoke all from PUBLIC/anon, grant back selectively)
-- ----------------------------------------------------------------------------
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC, anon;

-- Dashboard & trigger grants:
GRANT EXECUTE ON FUNCTION public.current_user_agency_id TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_dashboard_admin TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_dashboard_user TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_dashboard_staff TO authenticated;
GRANT EXECUTE ON FUNCTION public.dashboard_context TO authenticated;
GRANT EXECUTE ON FUNCTION public.mask_phone TO authenticated;

-- MCP Role grants (Strictly restricted to balos_mcp_role):
GRANT EXECUTE ON FUNCTION public.validate_mcp_client TO balos_mcp_role;
GRANT EXECUTE ON FUNCTION public.mcp_list_leads TO balos_mcp_role;
GRANT EXECUTE ON FUNCTION public.mcp_get_lead TO balos_mcp_role;
GRANT EXECUTE ON FUNCTION public.mcp_get_roi_summary TO balos_mcp_role;
GRANT EXECUTE ON FUNCTION public.mcp_list_viewings TO balos_mcp_role;
GRANT EXECUTE ON FUNCTION public.mcp_update_lead_status TO balos_mcp_role;
GRANT EXECUTE ON FUNCTION public.mcp_add_lead_note TO balos_mcp_role;
GRANT EXECUTE ON FUNCTION public.mcp_log_call TO balos_mcp_role;

-- ----------------------------------------------------------------------------
-- 11. Initial Agency A Test Client (Seed template with placeholder key_hash)
-- ----------------------------------------------------------------------------
INSERT INTO public.mcp_clients (
  id,
  agency_id,
  name,
  scopes,
  key_hash
) VALUES (
  'a0000000-0000-4000-8000-000000000001',
  '99999999-9999-4999-8999-999999999999',
  'Agency A Primary Claude Desktop MCP Client',
  ARRAY['leads:read', 'viewings:read', 'roi:read', 'leads:write', 'messages:read', 'pii:read'],
  'PLACEHOLDER_SHA256_HASH_OF_TOKEN_A'
)
ON CONFLICT (key_hash) DO NOTHING;

COMMIT;

-- ============================================================================
-- POST-MIGRATION INSTRUCTIONS FOR ADMINISTRATOR:
--
-- 1. Set password for the MCP database user:
--    ALTER ROLE balos_mcp_user WITH PASSWORD 'PASTE_YOUR_SECURE_PASSWORD_HERE';
--
-- 2. Generate a 32-byte token for Agency A and update its key_hash:
--    In PowerShell:
--      $t = "balos_mcp_sec_token_agency_a_$(New-Guid)"
--      $h = [BitConverter]::ToString([System.Security.Cryptography.SHA256]::Create().ComputeHash([System.Text.Encoding]::UTF8.GetBytes($t))).Replace("-","").ToLower()
--      Write-Host "Bearer Token for n8n/Claude: $t"
--      Write-Host "Hash for SQL: $h"
--    In Supabase SQL Editor:
--      UPDATE public.mcp_clients
--      SET key_hash = '<paste_hash_here>'
--      WHERE id = 'a0000000-0000-4000-8000-000000000001';
--
-- 3. Check for any agents whose auth_user_id could not be linked:
--    SELECT id, name, email, role, is_active FROM public.agents WHERE auth_user_id IS NULL;
-- ============================================================================

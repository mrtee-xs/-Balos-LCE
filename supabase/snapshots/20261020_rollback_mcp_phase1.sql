-- ============================================================================
-- BALOS PHASE 1 ROLLBACK SCRIPT
-- Safely reverts all Phase 1 schema, function, role, and policy additions
-- ============================================================================

BEGIN;

-- 1. Drop MCP Functions
DROP FUNCTION IF EXISTS public.mcp_log_call(uuid, text, text, int, boolean, int);
DROP FUNCTION IF EXISTS public.mcp_add_lead_note(uuid, uuid, text);
DROP FUNCTION IF EXISTS public.mcp_update_lead_status(uuid, uuid, text);
DROP FUNCTION IF EXISTS public.mcp_list_viewings(uuid, text, timestamptz, timestamptz, int, int);
DROP FUNCTION IF EXISTS public.mcp_get_roi_summary(uuid, int);
DROP FUNCTION IF EXISTS public.mcp_get_lead(uuid, uuid);
DROP FUNCTION IF EXISTS public.mcp_list_leads(uuid, text, text, text, timestamptz, timestamptz, int, int);
DROP FUNCTION IF EXISTS public.validate_mcp_client(uuid, text);
DROP FUNCTION IF EXISTS public.mask_phone(text);
DROP FUNCTION IF EXISTS public.is_dashboard_staff();

-- 2. Drop MCP Tables
DROP TABLE IF EXISTS public.mcp_call_log CASCADE;
DROP TABLE IF EXISTS public.mcp_clients CASCADE;

-- 3. Drop MCP Roles
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'balos_mcp_user') THEN
    DROP ROLE balos_mcp_user;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'balos_mcp_role') THEN
    DROP ROLE balos_mcp_role;
  END IF;
END $$;

-- 4. Revert View security_invoker settings
ALTER VIEW IF EXISTS public.v_lead_response SET (security_invoker = false);
ALTER VIEW IF EXISTS public.v_source_performance SET (security_invoker = false);
ALTER VIEW IF EXISTS public.v_lead_pipeline SET (security_invoker = false);
ALTER VIEW IF EXISTS public.v_roi_overview SET (security_invoker = false);

-- 5. Drop Multi-Tenant RLS Policies
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

-- 6. Restore baseline permissive policies for agent_notifications
CREATE POLICY "Authenticated users can read notifications"
  ON public.agent_notifications FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert notifications"
  ON public.agent_notifications FOR INSERT TO authenticated WITH CHECK (true);

-- 7. Restore baseline table grants to authenticated
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

COMMIT;

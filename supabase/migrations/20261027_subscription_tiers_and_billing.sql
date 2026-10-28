-- ============================================================================
-- Balos Subscription Tiers, Billing & Payoneer Checkout Migration
-- Idempotent, safe migration for multi-tier feature gating and workspace billing
-- ============================================================================

-- 1. Add subscription and quota columns to public.agencies
ALTER TABLE public.agencies
  ADD COLUMN IF NOT EXISTS subscription_tier text NOT NULL DEFAULT 'starter',
  ADD COLUMN IF NOT EXISTS subscription_status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS billing_cycle text NOT NULL DEFAULT 'monthly',
  ADD COLUMN IF NOT EXISTS monthly_conversation_limit integer NOT NULL DEFAULT 500,
  ADD COLUMN IF NOT EXISTS conversations_used_this_month integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_whatsapp_lines integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS payoneer_list_id text,
  ADD COLUMN IF NOT EXISTS current_period_end timestamptz;

-- 2. Backfill primary master demo agency to Enterprise tier
UPDATE public.agencies
SET
  subscription_tier = 'enterprise',
  subscription_status = 'active',
  billing_cycle = 'yearly',
  monthly_conversation_limit = 999999,
  conversations_used_this_month = 0,
  max_whatsapp_lines = 10
WHERE id = '99999999-9999-4999-8999-999999999999';

-- 3. Create billing checkout sessions table for tracking Payoneer checkouts
CREATE TABLE IF NOT EXISTS public.billing_checkout_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text UNIQUE NOT NULL,
  agency_id uuid REFERENCES public.agencies(id) ON DELETE SET NULL,
  tier text NOT NULL,
  billing_cycle text NOT NULL DEFAULT 'monthly',
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'AED',
  status text NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'canceled'
  customer_email text NOT NULL,
  customer_name text,
  customer_phone text,
  agency_name text NOT NULL,
  payoneer_list_id text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_billing_checkout_sessions_session_id ON public.billing_checkout_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_billing_checkout_sessions_agency_id ON public.billing_checkout_sessions(agency_id);
CREATE INDEX IF NOT EXISTS idx_billing_checkout_sessions_email ON public.billing_checkout_sessions(customer_email);

-- Enable RLS on billing_checkout_sessions
ALTER TABLE public.billing_checkout_sessions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'billing_checkout_sessions' 
      AND policyname = 'billing_checkout_sessions_agency_policy'
  ) THEN
    CREATE POLICY billing_checkout_sessions_agency_policy ON public.billing_checkout_sessions
      FOR ALL TO authenticated
      USING (
        agency_id IS NULL OR agency_id = public.current_user_agency_id()
      )
      WITH CHECK (
        agency_id IS NULL OR agency_id = public.current_user_agency_id()
      );
  END IF;
END $$;

-- 4. Update public.dashboard_context() to include agency subscription & quota data
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
  v_agency record;
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
    SELECT id, name, subscription_tier, subscription_status, billing_cycle,
           monthly_conversation_limit, conversations_used_this_month, max_whatsapp_lines
    INTO v_agency
    FROM public.agencies
    WHERE id = v_agent.agency_id;

    RETURN json_build_object(
      'is_user', true,
      'is_admin', (v_agent.role = 'admin'),
      'name', v_agent.name,
      'role', v_agent.role,
      'email', v_agent.email,
      'agent_id', v_agent.id,
      'agency_id', v_agent.agency_id,
      'agency_name', COALESCE(v_agency.name, 'Agency Workspace'),
      'subscription_tier', COALESCE(v_agency.subscription_tier, 'starter'),
      'subscription_status', COALESCE(v_agency.subscription_status, 'active'),
      'billing_cycle', COALESCE(v_agency.billing_cycle, 'monthly'),
      'monthly_conversation_limit', COALESCE(v_agency.monthly_conversation_limit, 500),
      'conversations_used_this_month', COALESCE(v_agency.conversations_used_this_month, 0),
      'max_whatsapp_lines', COALESCE(v_agency.max_whatsapp_lines, 1)
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
      'agency_id', '99999999-9999-4999-8999-999999999999'::uuid,
      'agency_name', 'Balos Real Estate Luxury & Off-Plan',
      'subscription_tier', 'enterprise',
      'subscription_status', 'active',
      'billing_cycle', 'yearly',
      'monthly_conversation_limit', 999999,
      'conversations_used_this_month', 0,
      'max_whatsapp_lines', 10
    );
  END IF;

  RETURN json_build_object('is_user', false, 'is_admin', false);
END;
$$;

GRANT EXECUTE ON FUNCTION public.dashboard_context TO authenticated;

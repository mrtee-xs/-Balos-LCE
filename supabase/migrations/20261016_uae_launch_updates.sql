-- ============================================================================
-- Balos UAE Launch Plan Schema Updates
-- Safe, idempotent migration for Lead Source Tracking, Consultant Notes,
-- Leadership Roles ('admin', 'sales_leader', 'team_leader', 'agent'),
-- and Real-Time Agent Assignment Notifications
-- ============================================================================

-- 1. Add lead source attribution & internal agent notes columns
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS source text DEFAULT 'DIRECT_WHATSAPP',
  ADD COLUMN IF NOT EXISTS source_detail text,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS last_property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL;

-- 2. Backfill existing leads with default source where null
UPDATE public.leads
SET source = 'DIRECT_WHATSAPP'
WHERE source IS NULL;

-- 3. Index on source and assigned_agent_id for fast filtering
CREATE INDEX IF NOT EXISTS idx_leads_source ON public.leads(source);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_agent ON public.leads(assigned_agent_id);

-- 4. Create agent_notifications table for persistent assignment & handoff alerts
CREATE TABLE IF NOT EXISTS public.agent_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES public.agents(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'LEAD_ASSIGNED',
  title text NOT NULL,
  body text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_notifications_agent_id
  ON public.agent_notifications(agent_id, created_at DESC);

ALTER TABLE public.agent_notifications ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'agent_notifications'
      AND policyname = 'Authenticated users can read notifications'
  ) THEN
    CREATE POLICY "Authenticated users can read notifications"
      ON public.agent_notifications
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'agent_notifications'
      AND policyname = 'Authenticated users can insert notifications'
  ) THEN
    CREATE POLICY "Authenticated users can insert notifications"
      ON public.agent_notifications
      FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;
END $$;

-- 5. Automatic Postgres Trigger: Whenever a lead's assigned_agent_id is updated,
-- automatically insert an agent_notifications row in Supabase
CREATE OR REPLACE FUNCTION public.notify_agent_on_lead_assignment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.assigned_agent_id IS NOT NULL
     AND (OLD.assigned_agent_id IS DISTINCT FROM NEW.assigned_agent_id) THEN
    INSERT INTO public.agent_notifications (
      agent_id,
      lead_id,
      type,
      title,
      body
    ) VALUES (
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

DROP TRIGGER IF EXISTS trg_notify_agent_on_lead_assignment ON public.leads;
CREATE TRIGGER trg_notify_agent_on_lead_assignment
  AFTER UPDATE OF assigned_agent_id ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_agent_on_lead_assignment();

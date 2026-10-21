-- ============================================================================
-- BALOS DATABASE PRE-MCP SNAPSHOT (Captured: 2026-10-20)
-- Exact baseline before applying Phase 1 Multi-Tenant MCP Hardening
-- ============================================================================

-- 1. BASE TABLES IN PUBLIC
-- Leads: 74 rows (73 demo UAE leads + 1 inbound WhatsApp lead)
-- Properties, Bookings, Messages, Agents, Business_Info, Agent_Notifications, Handoffs, Weekly_Reports, Dashboard_Viewers

-- 2. BASE POLICIES (BEFORE PURGE)
-- agent_notifications:
--   "Authenticated users can read notifications" ON public.agent_notifications FOR SELECT TO authenticated USING (true);
--   "Authenticated users can insert notifications" ON public.agent_notifications FOR INSERT TO authenticated WITH CHECK (true);
-- Default Supabase policies on other tables permitting authenticated users.

-- 3. BASE FUNCTIONS IN PUBLIC
--   public.is_dashboard_user()
--   public.is_dashboard_admin()
--   public.is_demo_viewer()
--   public.dashboard_context()
--   public.generate_weekly_report(p_week_start date)
--   public.notify_agent_on_lead_assignment() [Trigger on public.leads]

-- 4. BASE VIEWS IN PUBLIC
--   public.v_lead_response (lead_id, source, stage, first_inbound_at, first_reply_at, latency_measured, first_reply_seconds, after_hours)
--   public.v_source_performance (source, leads, leads_30d, qualified, viewings_booked, closed_won, avg_lead_score, pipeline_deal_value_aed)
--   public.v_lead_pipeline (lead_id, source, stage, deal_value_aed)
--   public.v_roi_overview (enquiries_7d, answered_7d, after_hours_enquiries_7d, after_hours_answered_7d, measured_replies_7d, median_first_reply_seconds_7d, ai_messages_7d, qualified_7d, viewings_booked_7d, upcoming_viewings, pipeline_leads, pipeline_deal_value_aed)

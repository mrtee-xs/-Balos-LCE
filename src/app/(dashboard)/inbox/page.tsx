import { createClient } from '../../../lib/supabase/server';
import { InboxView } from '../../../components/inbox/InboxView';
import { Lead } from '../../../lib/types';

export const revalidate = 0; // dynamic

export default async function InboxPage({
  searchParams,
}: {
  searchParams: { lead?: string };
}) {
  const supabase = createClient();

  // Server-load only the lead list with the exact columns needed (NO messages loaded on server)
  const { data: leadsData } = await supabase
    .from('leads')
    .select(
      'id, full_name, e164_phone, whatsapp_id, stage, temperature, lead_score, ai_paused, handoff_at, handoff_reason, last_lead_message_at, budget_aed_min, budget_aed_max, target_communities, min_bedrooms, max_bedrooms, target_category, timeline, is_uae_resident, golden_visa_seeker, updated_at'
    )
    .order('created_at', { ascending: false });

  const leads = (leadsData || []) as unknown as Lead[];

  return (
    <InboxView
      initialLeads={leads}
      initialSelectedLeadId={searchParams?.lead}
    />
  );
}

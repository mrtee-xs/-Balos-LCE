import { createClient } from '../../../lib/supabase/server';
import { InboxView } from '../../../components/inbox/InboxView';
import { Lead, Agent } from '../../../lib/types';

export const revalidate = 0; // dynamic

export default async function InboxPage({
  searchParams,
}: {
  searchParams: { lead?: string };
}) {
  const supabase = createClient();

  const [leadsRes, agentsRes] = await Promise.all([
    supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false }),
    supabase
      .from('agents')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true }),
  ]);

  const leads = (leadsRes.data || []) as unknown as Lead[];
  const agents = (agentsRes.data || []) as unknown as Agent[];

  return (
    <InboxView
      initialLeads={leads}
      agents={agents}
      initialSelectedLeadId={searchParams?.lead}
    />
  );
}

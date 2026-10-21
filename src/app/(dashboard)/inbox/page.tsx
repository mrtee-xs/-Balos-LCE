import { createClient } from '../../../lib/supabase/server';
import { getDashboardContext } from '../../../lib/supabase/context';
import { InboxView } from '../../../components/inbox/InboxView';
import { Lead, Agent, isAgencyPrincipal } from '../../../lib/types';

export const revalidate = 0; // dynamic

export default async function InboxPage({
  searchParams,
}: {
  searchParams: { lead?: string };
}) {
  const supabase = createClient();
  const context = await getDashboardContext();
  const isPrincipal = isAgencyPrincipal(context.role, context.is_admin);

  let leadsQuery = supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false });

  // If user is a licensed agent, scope inbox strictly to their assigned leads
  if (!isPrincipal && context.agent_id) {
    leadsQuery = leadsQuery.eq('assigned_agent_id', context.agent_id);
  }

  const [leadsRes, agentsRes] = await Promise.all([
    leadsQuery,
    supabase
      .from('agents')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true }),
  ]);

  const leads = (leadsRes.data || []) as unknown as Lead[];
  const agents = (agentsRes.data || []) as unknown as Agent[];

  // Validate queryLeadId exists in scoped leads to prevent cross-agent lead inspection
  const requestedLeadId = searchParams?.lead;
  const isRequestedLeadAllowed =
    requestedLeadId && leads.some((l) => l.id === requestedLeadId);
  const selectedLeadId = isRequestedLeadAllowed
    ? requestedLeadId
    : leads[0]?.id;

  return (
    <InboxView
      initialLeads={leads}
      agents={agents}
      initialSelectedLeadId={selectedLeadId}
    />
  );
}

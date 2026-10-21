import { createClient } from '../../../lib/supabase/server';
import { getDashboardContext } from '../../../lib/supabase/context';
import { LeadsDirectory } from '../../../components/leads/LeadsDirectory';
import { Lead, Agent, isAgencyPrincipal } from '../../../lib/types';

export const revalidate = 0; // dynamic

export default async function LeadsPage() {
  const supabase = createClient();
  const context = await getDashboardContext();
  const isPrincipal = isAgencyPrincipal(context.role, context.is_admin);

  let leadsQuery = supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false });

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

  const leads: Lead[] = leadsRes.data || [];
  const agents: Agent[] = agentsRes.data || [];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold font-heading text-ink">
          {isPrincipal ? 'Leads directory' : 'My assigned leads'}
        </h2>
        <p className="text-xs text-ink-muted mt-0.5">
          {isPrincipal
            ? 'Agency-wide qualification dossiers, channel source attribution, agent assignment, and stage controls'
            : 'Your client qualification dossiers, contact details, notes, and deal stage progression'}
        </p>
      </div>

      <LeadsDirectory initialLeads={leads} agents={agents} />
    </div>
  );
}

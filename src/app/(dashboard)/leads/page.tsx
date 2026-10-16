import { createClient } from '../../../lib/supabase/server';
import { LeadsDirectory } from '../../../components/leads/LeadsDirectory';
import { Lead, Agent } from '../../../lib/types';

export const revalidate = 0; // dynamic

export default async function LeadsPage() {
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

  const leads: Lead[] = leadsRes.data || [];
  const agents: Agent[] = agentsRes.data || [];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold font-heading text-ink">
          Leads directory
        </h2>
        <p className="text-xs text-ink-muted mt-0.5">
          Qualification dossiers, channel source attribution, agent assignment, and stage controls
        </p>
      </div>

      <LeadsDirectory initialLeads={leads} agents={agents} />
    </div>
  );
}

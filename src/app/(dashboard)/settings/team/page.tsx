import { redirect } from 'next/navigation';
import { createClient } from '../../../../lib/supabase/server';
import { TeamManager } from '../../../../components/settings/TeamManager';
import { Agent } from '../../../../lib/types';

export const revalidate = 0; // dynamic

export default async function TeamSettingsPage() {
  const supabase = createClient();

  const { data: isAdmin } = await supabase.rpc('is_dashboard_admin');
  if (!isAdmin) {
    redirect('/');
  }

  const { data: agentsData } = await supabase
    .from('agents')
    .select('*')
    .order('created_at', { ascending: true });

  const agents: Agent[] = agentsData || [];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold font-heading text-ink">
          Team & agent management
        </h2>
        <p className="text-xs text-ink-muted mt-0.5">
          Configure agent access, roles, and status for Dubai WhatsApp operations
        </p>
      </div>

      <TeamManager initialAgents={agents} />
    </div>
  );
}

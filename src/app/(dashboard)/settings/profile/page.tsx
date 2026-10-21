import { redirect } from 'next/navigation';
import { createClient } from '../../../../lib/supabase/server';
import { getDashboardContext } from '../../../../lib/supabase/context';
import { AgentProfileForm } from '../../../../components/settings/AgentProfileForm';
import { Agent } from '../../../../lib/types';

export const revalidate = 0; // dynamic

export default async function ProfileSettingsPage() {
  const supabase = createClient();
  const context = await getDashboardContext();

  if (!context.is_user || !context.agent_id) {
    redirect('/');
  }

  const { data: agentData } = await supabase
    .from('agents')
    .select('*')
    .eq('id', context.agent_id)
    .maybeSingle();

  if (!agentData) {
    redirect('/');
  }

  const agent: Agent = agentData as Agent;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold font-heading text-ink">
          My profile & credentials
        </h2>
        <p className="text-xs text-ink-muted mt-0.5">
          Manage your WhatsApp notification phone, Dubai RERA BRN license, and language fluencies
        </p>
      </div>

      <AgentProfileForm agent={agent} />
    </div>
  );
}

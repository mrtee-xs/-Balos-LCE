import { createClient } from '../../../lib/supabase/server';
import { LeadsDirectory } from '../../../components/leads/LeadsDirectory';
import { Lead } from '../../../lib/types';

export const revalidate = 0; // dynamic

export default async function LeadsPage() {
  const supabase = createClient();

  const { data: leadsData } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false });

  const leads: Lead[] = leadsData || [];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold font-heading text-ink">
          Leads directory
        </h2>
        <p className="text-xs text-ink-muted mt-0.5">
          Read-only list of client inquiries and WhatsApp conversations
        </p>
      </div>

      <LeadsDirectory leads={leads} />
    </div>
  );
}

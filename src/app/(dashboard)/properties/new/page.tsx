import { redirect } from 'next/navigation';
import { createClient } from '../../../../lib/supabase/server';
import { PropertyForm } from '../../../../components/properties/PropertyForm';

export default async function NewPropertyPage() {
  const supabase = createClient();

  const { data: isAdmin } = await supabase.rpc('is_dashboard_admin');
  if (!isAdmin) {
    redirect('/properties');
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold font-heading text-ink">
          New property
        </h2>
        <p className="text-xs text-ink-muted mt-0.5">
          Add a new real estate inventory asset for the WhatsApp AI
        </p>
      </div>

      <PropertyForm isNew={true} />
    </div>
  );
}

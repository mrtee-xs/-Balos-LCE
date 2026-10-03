import { notFound, redirect } from 'next/navigation';
import { createClient } from '../../../../../lib/supabase/server';
import { PropertyForm } from '../../../../../components/properties/PropertyForm';
import { Property } from '../../../../../lib/types';

export const revalidate = 0; // dynamic

export default async function EditPropertyPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const { data: isAdmin } = await supabase.rpc('is_dashboard_admin');
  if (!isAdmin) {
    redirect('/properties');
  }

  const { data: propertyData, error } = await supabase
    .from('properties')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error || !propertyData) {
    notFound();
  }

  const property: Property = propertyData;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold font-heading text-ink">
          Edit property: {property.title}
        </h2>
        <p className="text-xs text-ink-muted mt-0.5">
          Update asset specifications and live AI parameters
        </p>
      </div>

      <PropertyForm initialProperty={property} isNew={false} />
    </div>
  );
}

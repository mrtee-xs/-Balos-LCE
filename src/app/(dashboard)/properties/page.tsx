import { createClient } from '../../../lib/supabase/server';
import { PropertiesDirectory } from '../../../components/properties/PropertiesDirectory';
import { Property } from '../../../lib/types';

export const revalidate = 0; // dynamic

export default async function PropertiesPage() {
  const supabase = createClient();

  const { data: propertiesData } = await supabase
    .from('properties')
    .select('*')
    .order('created_at', { ascending: false });

  const properties: Property[] = propertiesData || [];

  return <PropertiesDirectory properties={properties} />;
}

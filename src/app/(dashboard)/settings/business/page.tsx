import { createClient } from '../../../../lib/supabase/server';
import { BusinessInfoForm } from '../../../../components/settings/BusinessInfoForm';
import { BusinessInfo } from '../../../../lib/types';

export const revalidate = 0; // dynamic

export default async function BusinessSettingsPage() {
  const supabase = createClient();

  const { data: bizData } = await supabase
    .from('business_info')
    .select('*')
    .limit(1)
    .single();

  const defaultBiz: BusinessInfo = {
    id: '',
    agency_name: 'Balos Luxury Real Estate',
    description: '',
    service_areas: '',
    operating_hours: 'Mon-Sat, 9:00 AM - 7:00 PM GST',
    tone_of_voice: 'ultra-professional, consultative',
    contact_email: '',
    contact_phone: '',
    website: '',
    additional_notes: '',
  };

  const businessInfo: BusinessInfo = bizData || defaultBiz;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold font-heading text-ink">
          Agency identity & directives
        </h2>
        <p className="text-xs text-ink-muted mt-0.5">
          Configure prompt identity, alert routing, and operating schedule for Balos WhatsApp AI
        </p>
      </div>

      <BusinessInfoForm initialInfo={businessInfo} />
    </div>
  );
}

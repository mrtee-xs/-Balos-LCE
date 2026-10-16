import { createClient } from '../../../lib/supabase/server';
import { ViewingsManager } from '../../../components/viewings/ViewingsManager';
import { Booking } from '../../../lib/types';

export const revalidate = 0; // dynamic

export default async function ViewingsPage() {
  const supabase = createClient();

  const { data: bookingsData } = await supabase
    .from('bookings')
    .select(`
      id,
      lead_id,
      property_id,
      agent_id,
      scheduled_at,
      viewing_type,
      status,
      notes,
      meeting_link,
      created_at,
      lead:leads(id, full_name, e164_phone),
      property:properties(id, title, community, category, images, video_url)
    `)
    .order('scheduled_at', { ascending: false });

  const bookings: Booking[] = (bookingsData as any) || [];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold font-heading text-ink">
          Viewings & consultations
        </h2>
        <p className="text-xs text-ink-muted mt-0.5">
          Confirmed property tours, Zoom walkthroughs, and office sessions
        </p>
      </div>

      <ViewingsManager initialBookings={bookings} />
    </div>
  );
}

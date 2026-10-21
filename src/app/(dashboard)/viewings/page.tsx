import { createClient } from '../../../lib/supabase/server';
import { getDashboardContext } from '../../../lib/supabase/context';
import { ViewingsManager } from '../../../components/viewings/ViewingsManager';
import { Booking, isAgencyPrincipal } from '../../../lib/types';

export const revalidate = 0; // dynamic

export default async function ViewingsPage() {
  const supabase = createClient();
  const context = await getDashboardContext();
  const isPrincipal = isAgencyPrincipal(context.role, context.is_admin);

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
      lead:leads(id, full_name, e164_phone, assigned_agent_id),
      property:properties(id, title, community, category, images, video_url)
    `)
    .order('scheduled_at', { ascending: false });

  const rawBookings: any[] = bookingsData || [];
  const bookings: Booking[] = isPrincipal
    ? (rawBookings as Booking[])
    : (rawBookings.filter(
        (b) =>
          b.agent_id === context.agent_id ||
          b.lead?.assigned_agent_id === context.agent_id
      ) as Booking[]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold font-heading text-ink">
          {isPrincipal ? 'Viewings & consultations' : 'My viewings & consultations'}
        </h2>
        <p className="text-xs text-ink-muted mt-0.5">
          {isPrincipal
            ? 'Agency-wide confirmed property tours, Zoom walkthroughs, and office sessions'
            : 'Your confirmed property walkthroughs, client Zoom meetings, and office consultations'}
        </p>
      </div>

      <ViewingsManager initialBookings={bookings} />
    </div>
  );
}

'use server';

import { createClient } from '../supabase/server';
import { revalidatePath } from 'next/cache';
import { dispatchCrmSync } from '../crm/dispatcher';
import { Lead, Booking, Agent } from '../types';

/**
 * Update booking status (e.g. COMPLETED, CANCELLED, CONFIRMED)
 */
export async function updateBookingStatus(bookingId: string, status: string) {
  const supabase = createClient();

  const { error } = await supabase
    .from('bookings')
    .update({ status })
    .eq('id', bookingId);

  if (error) {
    return { success: false, error: error.message };
  }

  // Trigger CRM viewing sync
  try {
    const { data: booking } = await supabase
      .from('bookings')
      .select('*, lead:leads(*), agent:agents(*)')
      .eq('id', bookingId)
      .maybeSingle();

    if (booking?.lead) {
      dispatchCrmSync('VIEWING_SCHEDULED', booking.lead as Lead, {
        viewing: booking as Booking,
        assignedAgent: booking.agent as Agent,
      }).catch(() => {});
    }
  } catch {
    // Ignore background sync errors
  }

  revalidatePath('/viewings');
  revalidatePath('/');
  return { success: true };
}

/**
 * Update booking notes
 */
export async function updateBookingNotes(bookingId: string, notes: string) {
  const supabase = createClient();

  const { error } = await supabase
    .from('bookings')
    .update({ notes })
    .eq('id', bookingId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/viewings');
  return { success: true };
}

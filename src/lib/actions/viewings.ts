'use server';

import { createClient } from '../supabase/server';
import { revalidatePath } from 'next/cache';

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

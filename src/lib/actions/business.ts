'use server';

import { createClient } from '../supabase/server';
import { revalidatePath } from 'next/cache';
import { BusinessInfo } from '../types';

export async function updateBusinessInfo(id: string, data: Partial<BusinessInfo>) {
  const supabase = createClient();

  const payload: Record<string, any> = {
    agency_name: data.agency_name,
    description: data.description || null,
    service_areas: data.service_areas || null,
    operating_hours: data.operating_hours || null,
    tone_of_voice: data.tone_of_voice || null,
    contact_email: data.contact_email || null,
    contact_phone: data.contact_phone || null,
    website: data.website || null,
    additional_notes: data.additional_notes || null,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('business_info')
    .update(payload)
    .eq('id', id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/settings/business');
  return { success: true };
}

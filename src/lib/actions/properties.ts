'use server';

import { createClient } from '../supabase/server';
import { revalidatePath } from 'next/cache';
import { Property } from '../types';

export async function saveProperty(propertyData: Partial<Property>, isNew: boolean) {
  const supabase = createClient();

  // Validate price
  const price = Number(propertyData.price_aed);
  if (isNaN(price) || price < 0) {
    return { success: false, error: 'Price must be a valid non-negative number.' };
  }

  // Validate bedrooms
  const bedrooms = Number(propertyData.bedrooms);
  if (isNaN(bedrooms) || bedrooms < 0) {
    return { success: false, error: 'Bedrooms must be a non-negative number.' };
  }

  // Validate bathrooms
  if (propertyData.bathrooms !== null && propertyData.bathrooms !== undefined && propertyData.bathrooms !== ('' as any)) {
    if (Number(propertyData.bathrooms) < 0) {
      return { success: false, error: 'Bathrooms cannot be negative.' };
    }
  }

  // Validate size sqft
  if (propertyData.size_sqft !== null && propertyData.size_sqft !== undefined && propertyData.size_sqft !== ('' as any)) {
    if (Number(propertyData.size_sqft) < 0) {
      return { success: false, error: 'Size cannot be negative.' };
    }
  }

  // Note: golden_visa_eligible is a GENERATED ALWAYS AS (price_aed >= 2000000) STORED column in PostgreSQL.
  // It must not be included in INSERT/UPDATE payloads.

  // Prepare payload
  const payload: Record<string, any> = {
    title: propertyData.title,
    community: propertyData.community,
    sub_community: propertyData.sub_community || null,
    category: propertyData.category,
    market_type: propertyData.market_type,
    price_aed: price,
    bedrooms: Math.floor(bedrooms),
    bathrooms: propertyData.bathrooms ? Number(propertyData.bathrooms) : null,
    size_sqft: propertyData.size_sqft ? Number(propertyData.size_sqft) : null,
    payment_plan: propertyData.payment_plan || null,
    handover_date: propertyData.handover_date || null,
    service_charge_aed_sqft: propertyData.service_charge_aed_sqft ? Number(propertyData.service_charge_aed_sqft) : null,
    projected_roi: propertyData.projected_roi ? Number(propertyData.projected_roi) : null,
    trakheesi_permit_no: propertyData.trakheesi_permit_no || null,
    status: propertyData.status || 'AVAILABLE',
    description: propertyData.description || null,
    brochure_url: propertyData.brochure_url || null,
    images: propertyData.images || [],
    video_url: propertyData.video_url || null,
    developer: propertyData.developer || null,
    project_name: propertyData.project_name || null,
    updated_at: new Date().toISOString(),
  };

  if (isNew) {
    const { data, error } = await supabase.from('properties').insert(payload).select().single();
    if (error) {
      return { success: false, error: error.message };
    }
    revalidatePath('/properties');
    return { success: true, data };
  } else {
    if (!propertyData.id) {
      return { success: false, error: 'Property ID missing for update.' };
    }
    const { data, error } = await supabase
      .from('properties')
      .update(payload)
      .eq('id', propertyData.id)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }
    revalidatePath('/properties');
    revalidatePath(`/properties/${propertyData.id}/edit`);
    return { success: true, data };
  }
}

'use server';

import { createClient } from '../supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * Take over lead from AI:
 * sets ai_paused = true, handoff_at = now() only if handoff_at is null.
 * Leave stage alone. Never edit any other lead field.
 */
export async function takeOverLead(leadId: string) {
  const supabase = createClient();

  // Fetch current lead handoff_at
  const { data: lead } = await supabase
    .from('leads')
    .select('handoff_at')
    .eq('id', leadId)
    .single();

  const updatePayload: Record<string, any> = {
    ai_paused: true,
  };

  if (!lead?.handoff_at) {
    updatePayload.handoff_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from('leads')
    .update(updatePayload)
    .eq('id', leadId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/inbox');
  revalidatePath('/');
  revalidatePath('/leads');
  return { success: true };
}

/**
 * Hand lead back to AI:
 * sets ai_paused = false. Only if stage = 'HANDOFF_TO_AGENT', set stage = 'ENGAGED'.
 * This closes the handoff and lets AI reply normally.
 * Never edit any other lead field.
 */
export async function handBackToAi(leadId: string, currentStage?: string) {
  const supabase = createClient();

  const updatePayload: { ai_paused: boolean; stage?: string } = {
    ai_paused: false,
  };

  if (currentStage === 'HANDOFF_TO_AGENT') {
    updatePayload.stage = 'ENGAGED';
  }

  const { error } = await supabase
    .from('leads')
    .update(updatePayload)
    .eq('id', leadId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/inbox');
  revalidatePath('/');
  revalidatePath('/leads');
  return { success: true };
}

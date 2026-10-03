'use server';

import { createClient } from '../supabase/server';
import { revalidatePath } from 'next/cache';

export async function toggleAgentActive(agentId: string, isActive: boolean) {
  const supabase = createClient();

  const { error } = await supabase
    .from('agents')
    .update({ is_active: isActive })
    .eq('id', agentId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/settings/team');
  return { success: true };
}

export async function updateAgentRole(agentId: string, role: 'admin' | 'agent') {
  const supabase = createClient();

  const { error } = await supabase
    .from('agents')
    .update({ role })
    .eq('id', agentId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/settings/team');
  return { success: true };
}

'use server';

import { createClient } from '../supabase/server';
import { getDashboardContext } from '../supabase/context';
import { checkFeatureAccess } from '../entitlements';
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

export async function updateAgentRole(
  agentId: string,
  role: 'admin' | 'sales_leader' | 'team_leader' | 'agent'
) {
  if (role === 'sales_leader' || role === 'team_leader') {
    const context = await getDashboardContext();
    if (!checkFeatureAccess(context.subscription_tier, 'canLeadershipRoles')) {
      return {
        success: false,
        error: 'Multi-tier leadership roles (Sales Leader, Team Leader) require the Scale or Enterprise plan.',
      };
    }
  }

  const supabase = createClient();

  const { error } = await supabase
    .from('agents')
    .update({ role })
    .eq('id', agentId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/settings/team');
  revalidatePath('/leads');
  revalidatePath('/inbox');
  return { success: true };
}

export async function updateAgentProfile(
  agentId: string,
  payload: {
    phone?: string | null;
    rera_brn?: string | null;
    languages?: string[] | null;
  }
) {
  const supabase = createClient();
  const { data: ctx } = await supabase.rpc('dashboard_context');

  // Verify caller is either admin/principal or updating their own profile
  const isSelf = ctx?.agent_id === agentId;
  const isPrincipal = Boolean(ctx?.is_admin) || ctx?.role === 'admin';

  if (!isSelf && !isPrincipal) {
    return {
      success: false,
      error: 'You are only authorized to update your own agent profile.',
    };
  }

  const updateData: Record<string, any> = {};
  if (payload.phone !== undefined) updateData.phone = payload.phone?.trim() || '';
  if (payload.rera_brn !== undefined) updateData.rera_brn = payload.rera_brn?.trim() || null;
  if (payload.languages !== undefined) updateData.languages = payload.languages;

  const { error } = await supabase
    .from('agents')
    .update(updateData)
    .eq('id', agentId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/settings/profile');
  revalidatePath('/settings/team');
  revalidatePath('/');
  return { success: true };
}

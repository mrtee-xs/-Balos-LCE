import { cache } from 'react';
import { createClient } from './server';
import { DashboardContextData } from '../types';

/**
 * Cached fetcher for the user's dashboard context using a single RPC call.
 * Wrapped in React.cache so layout and pages within the same request
 * share the exact same result without duplicate network round trips.
 */
export const getDashboardContext = cache(async (): Promise<DashboardContextData> => {
  const supabase = createClient();
  const { data, error } = await supabase.rpc('dashboard_context');

  if (error || !data) {
    return { is_user: false, is_admin: false };
  }

  return data as DashboardContextData;
});

import { createClient } from '../supabase/server';
import { CrmIntegration, CrmSyncLog, CRM_PROVIDERS_META } from '../types';

// In-memory fallback cache if Supabase table has not been created yet
let inMemoryIntegrations: CrmIntegration[] = CRM_PROVIDERS_META.map((meta) => ({
  id: `mock-${meta.provider}`,
  provider: meta.provider,
  name: meta.name,
  is_enabled: false,
  api_endpoint: meta.defaultEndpoint,
  sync_on_create: false,
  sync_on_qualified: true,
  sync_on_viewing: true,
  sync_on_handoff: true,
  sync_on_stage_change: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}));

let inMemoryLogs: CrmSyncLog[] = [];

export interface StorageResult<T> {
  data: T;
  needsMigration: boolean;
  error?: string;
}

/**
 * Retrieve all configured CRM integrations.
 */
export async function getStoredCrmIntegrations(): Promise<StorageResult<CrmIntegration[]>> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('crm_integrations')
    .select('*')
    .order('provider', { ascending: true });

  if (error) {
    // Check if table missing
    if (
      error.message?.includes('does not exist') ||
      error.message?.includes('not found') ||
      error.code === '42P01'
    ) {
      return {
        data: inMemoryIntegrations,
        needsMigration: true,
      };
    }
    return {
      data: inMemoryIntegrations,
      needsMigration: false,
      error: error.message,
    };
  }

  // If table exists but is empty, seed standard templates
  if (!data || data.length === 0) {
    return {
      data: inMemoryIntegrations,
      needsMigration: false,
    };
  }

  return {
    data: data as CrmIntegration[],
    needsMigration: false,
  };
}

/**
 * Save or update a CRM integration record.
 */
export async function saveStoredCrmIntegration(
  integration: Partial<CrmIntegration> & { provider: string }
): Promise<{ success: boolean; needsMigration: boolean; error?: string; data?: CrmIntegration }> {
  const supabase = createClient();
  const now = new Date().toISOString();

  // Try saving to Supabase
  const payload = {
    ...integration,
    updated_at: now,
  };

  if (integration.id && !integration.id.startsWith('mock-')) {
    const { data, error } = await supabase
      .from('crm_integrations')
      .update(payload)
      .eq('id', integration.id)
      .select()
      .maybeSingle();

    if (error) {
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        // Fallback in-memory
        inMemoryIntegrations = inMemoryIntegrations.map((item) =>
          item.provider === integration.provider ? { ...item, ...payload } : item
        );
        return { success: true, needsMigration: true, data: inMemoryIntegrations.find(i => i.provider === integration.provider) };
      }
      return { success: false, needsMigration: false, error: error.message };
    }
    return { success: true, needsMigration: false, data: data as CrmIntegration };
  } else {
    // Check if record for provider already exists
    const { data: existing, error: checkError } = await supabase
      .from('crm_integrations')
      .select('id')
      .eq('provider', integration.provider)
      .maybeSingle();

    if (checkError && (checkError.code === '42P01' || checkError.message?.includes('does not exist'))) {
      inMemoryIntegrations = inMemoryIntegrations.map((item) =>
        item.provider === integration.provider ? { ...item, ...payload } : item
      );
      return { success: true, needsMigration: true, data: inMemoryIntegrations.find(i => i.provider === integration.provider) };
    }

    if (existing?.id) {
      const { data, error } = await supabase
        .from('crm_integrations')
        .update(payload)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) return { success: false, needsMigration: false, error: error.message };
      return { success: true, needsMigration: false, data: data as CrmIntegration };
    } else {
      const { data, error } = await supabase
        .from('crm_integrations')
        .insert([{ ...payload, created_at: now }])
        .select()
        .single();

      if (error) {
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          inMemoryIntegrations = inMemoryIntegrations.map((item) =>
            item.provider === integration.provider ? { ...item, ...payload } : item
          );
          return { success: true, needsMigration: true, data: inMemoryIntegrations.find(i => i.provider === integration.provider) };
        }
        return { success: false, needsMigration: false, error: error.message };
      }
      return { success: true, needsMigration: false, data: data as CrmIntegration };
    }
  }
}

/**
 * Log a sync attempt to crm_sync_logs with fail-safe fallback.
 */
export async function logCrmSyncAttempt(
  log: Omit<CrmSyncLog, 'id' | 'created_at'>
): Promise<void> {
  const supabase = createClient();
  const newLog: CrmSyncLog = {
    ...log,
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    created_at: new Date().toISOString(),
  };

  // Keep in-memory buffer (latest 50)
  inMemoryLogs = [newLog, ...inMemoryLogs.slice(0, 49)];

  try {
    await supabase.from('crm_sync_logs').insert([
      {
        integration_id: log.integration_id?.startsWith('mock-') ? null : log.integration_id,
        provider: log.provider,
        lead_id: log.lead_id,
        lead_name: log.lead_name,
        event: log.event,
        status: log.status,
        http_status: log.http_status,
        request_payload: log.request_payload,
        response_payload: log.response_payload,
        error_message: log.error_message,
        duration_ms: log.duration_ms,
        created_at: newLog.created_at,
      },
    ]);
  } catch {
    // Best effort logging
  }
}

/**
 * Get recent sync logs.
 */
export async function getStoredCrmSyncLogs(limit = 25): Promise<CrmSyncLog[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('crm_sync_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !data || data.length === 0) {
    return inMemoryLogs.slice(0, limit);
  }

  return data as CrmSyncLog[];
}

/**
 * Clear sync logs.
 */
export async function clearStoredCrmSyncLogs(): Promise<void> {
  const supabase = createClient();
  inMemoryLogs = [];
  try {
    await supabase.from('crm_sync_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  } catch {
    // Ignore
  }
}

import { createAdminClient } from '../supabase/admin';

export interface CheckoutSessionRecord {
  id?: string;
  session_id: string;
  agency_id?: string | null;
  tier: string;
  billing_cycle: string;
  amount: number;
  currency: string;
  status: string;
  customer_email: string;
  customer_name?: string | null;
  customer_phone?: string | null;
  agency_name: string;
  payoneer_list_id?: string | null;
  metadata?: any;
  created_at?: string;
  completed_at?: string | null;
}

// In-memory fallback cache when Supabase SQL migration has not yet been executed
const inMemorySessions = new Map<string, CheckoutSessionRecord>();

export async function saveCheckoutSession(
  session: CheckoutSessionRecord
): Promise<void> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from('billing_checkout_sessions')
    .insert(session);

  if (error) {
    console.warn(
      `[Billing Sessions] Supabase table billing_checkout_sessions unavailable (${error.code || error.message}). Using memory fallback cache.`
    );
    inMemorySessions.set(session.session_id, {
      ...session,
      created_at: new Date().toISOString(),
    });
    return;
  }

  // Also cache locally
  inMemorySessions.set(session.session_id, session);
}

export async function getCheckoutSession(
  sessionId: string
): Promise<CheckoutSessionRecord | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('billing_checkout_sessions')
    .select('*')
    .eq('session_id', sessionId)
    .maybeSingle();

  if (!error && data) {
    return data as CheckoutSessionRecord;
  }

  // Fallback to in-memory cache
  return inMemorySessions.get(sessionId) || null;
}

export async function updateCheckoutSession(
  sessionId: string,
  updates: Partial<CheckoutSessionRecord>
): Promise<void> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from('billing_checkout_sessions')
    .update(updates)
    .eq('session_id', sessionId);

  if (error) {
    console.warn(
      `[Billing Sessions] Could not update Supabase session (${error.message}). Updating memory fallback.`
    );
  }

  const existing = inMemorySessions.get(sessionId);
  if (existing) {
    inMemorySessions.set(sessionId, { ...existing, ...updates });
  }
}

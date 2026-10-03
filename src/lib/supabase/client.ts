import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xsiitikrcckzivadvact.supabase.co';
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhzaWl0aWtyY2Nreml2YWR2YWN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5ODU3MDQsImV4cCI6MjEwNTU2MTcwNH0.c7ifHSefGyqy_MsZj63fJTXA2d_9rs7aaKSJJqjJmvE';

  return createBrowserClient(url, anonKey);
}

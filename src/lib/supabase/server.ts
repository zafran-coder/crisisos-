import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabasePublicKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  '';

/**
 * Server-side Supabase client for Route Handlers and Server Actions.
 * Uses the Service Role Key when available for privileged operations (e.g. pgvector queries, guideline sync),
 * otherwise safely falls back to Publishable/Anon key.
 */
export function createServerSupabaseClient() {
  const apiKey = supabaseServiceRoleKey || supabasePublicKey || 'placeholder-key';
  const url = supabaseUrl || 'https://placeholder.supabase.co';

  return createClient<Database>(url, apiKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

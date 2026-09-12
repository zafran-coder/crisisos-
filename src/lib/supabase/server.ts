import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

/**
 * Resolves Supabase credentials dynamically from process.env.
 * Supports standard Vercel environment variable naming conventions:
 * NEXT_PUBLIC_SUPABASE_URL, SUPABASE_URL
 * SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_ANON_KEY, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
 */
export function getSupabaseServerConfig() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    process.env.SUPABASE_URL?.trim() ||
    '';
  const apiKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    process.env.SUPABASE_ANON_KEY?.trim() ||
    process.env.SUPABASE_KEY?.trim() ||
    '';

  return {
    url,
    apiKey,
    isConfigured: Boolean(url && apiKey),
    hasServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()),
  };
}

export function isSupabaseServerConfigured(): boolean {
  return getSupabaseServerConfig().isConfigured;
}

/**
 * Server-side Supabase client for Route Handlers and Server Actions.
 * Uses the Service Role Key when available for privileged operations (e.g. pgvector queries, guideline sync),
 * otherwise safely falls back to Publishable/Anon key.
 *
 * If environment variables are not configured, uses a safe mock fetch handler
 * rather than a non-existent placeholder host that throws "TypeError: fetch failed" DNS crashes.
 */
export function createServerSupabaseClient() {
  const { url, apiKey, isConfigured } = getSupabaseServerConfig();

  if (!isConfigured) {
    return createClient<Database>('https://unconfigured.internal', 'unconfigured-key', {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        fetch: async () =>
          new Response(
            JSON.stringify({
              message:
                'Supabase is not configured on this environment. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.',
              code: 'SUPABASE_NOT_CONFIGURED',
            }),
            { status: 503, headers: { 'Content-Type': 'application/json' } }
          ),
      },
    });
  }

  return createClient<Database>(url, apiKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}


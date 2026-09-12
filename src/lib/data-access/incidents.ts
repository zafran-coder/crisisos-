import { createServerSupabaseClient } from '@/lib/supabase/server';
import { FALLBACK_INCIDENT } from '@/data/fallback-zones';
import { Incident } from '@/types/database';

export type ActiveIncidentData = Omit<typeof FALLBACK_INCIDENT, 'status' | 'severity' | 'location_name'> &
  Partial<Incident> & {
    status: string;
    severity: string;
    location_name: string;
  };

export interface ActiveIncidentDetails {
  incident: ActiveIncidentData;
  source: 'supabase' | 'fallback';
  error?: string;
}

/**
 * Retrieves the currently active emergency incident telemetry.
 */
export async function getActiveIncident(): Promise<ActiveIncidentDetails> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return {
      incident: FALLBACK_INCIDENT,
      source: 'fallback',
    };
  }

  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from('incidents')
      .select('*')
      .ilike('status', 'active')
      .limit(1)
      .maybeSingle();

    const incidentData = data as Incident | null;

    if (error || !incidentData) {
      return {
        incident: FALLBACK_INCIDENT,
        source: 'fallback',
        error: error?.message,
      };
    }

    return {
      incident: {
        ...FALLBACK_INCIDENT,
        ...incidentData,
      },
      source: 'supabase',
    };
  } catch (err) {
    return {
      incident: FALLBACK_INCIDENT,
      source: 'fallback',
      error: err instanceof Error ? err.message : 'Database error',
    };
  }
}

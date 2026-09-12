import { createServerSupabaseClient } from '@/lib/supabase/server';
import { EmergencyGuideline } from '@/types/database';

export const FALLBACK_GUIDELINES: Partial<EmergencyGuideline>[] = [
  {
    id: 'guide-fema-p1052',
    protocol_code: 'FEMA-P-1052',
    title: 'Flood Evacuation Priority & Swiftwater Inundation Response',
    category: 'flood_containment',
    source_agency: 'FEMA / CDC SVI 2024',
    protocol_text:
      'Sections with rising water rates exceeding +3.0 ft/hr combined with isolated critical facilities (care homes, clinics) must receive immediate priority tier-1 air and amphibious rescue assets. Ground transport is contraindicated once bridge clearances submerge below 0.5 meters.',
  },
  {
    id: 'guide-usar-ops4',
    protocol_code: 'USAR-URBAN-WATER-04',
    title: 'Urban Search and Rescue in Swiftwater & Submerged Transit Hubs',
    category: 'search_and_rescue',
    source_agency: 'FEMA USAR',
    protocol_text:
      'Deploy motorized inflatable craft with tethered downstream safety anchors before breaching submerged commercial or residential basements. Ensure continuous gas monitoring for trapped hazardous fumes and localized electrical hazards.',
  },
  {
    id: 'guide-who-masscas',
    protocol_code: 'WHO-MASS-CASUALTY-11',
    title: 'Mass Casualty Triage Protocol under Severe Access Disruption',
    category: 'mass_casualty',
    source_agency: 'WHO Emergency Operations',
    protocol_text:
      'When ground ambulances cannot access victim pockets, establish forward air-evac staging points and field triage tents within 45 minutes to stabilize red-category trauma victims prior to tertiary hospital transport.',
  },
];

/**
 * Retrieves guidelines relevant to a disaster scenario.
 */
export async function getEmergencyGuidelines(category?: string): Promise<{
  guidelines: Partial<EmergencyGuideline>[];
  source: 'supabase' | 'fallback';
  error?: string;
}> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return {
      guidelines: FALLBACK_GUIDELINES,
      source: 'fallback',
    };
  }

  try {
    const supabase = createServerSupabaseClient();
    let query = supabase.from('emergency_guidelines').select('*');
    if (category) {
      query = query.eq('category', category);
    }
    const { data, error } = await query;

    if (error || !data || data.length === 0) {
      return {
        guidelines: FALLBACK_GUIDELINES,
        source: 'fallback',
        error: error?.message,
      };
    }

    return {
      guidelines: data,
      source: 'supabase',
    };
  } catch (err) {
    return {
      guidelines: FALLBACK_GUIDELINES,
      source: 'fallback',
      error: err instanceof Error ? err.message : 'Database error',
    };
  }
}

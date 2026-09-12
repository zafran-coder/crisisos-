import { createServerSupabaseClient, isSupabaseServerConfigured } from '@/lib/supabase/server';
import { getFallbackZonesWithRisk } from '@/data/fallback-zones';
import { calculateDeterministicRisk } from '@/lib/risk-engine/calculator';
import { DeterministicRiskResult, RiskFactors } from '@/lib/risk-engine/types';
import { AffectedZone } from '@/types/database';

export interface EnrichedZoneRecord extends AffectedZone {
  factors: RiskFactors;
  current_risk_score: number;
  riskResult: DeterministicRiskResult;
  priorityRank: number;
  severity?: string;
  severity_label?: string;
  accessibility?: string;
  accessibility_label?: string;
  medical_need?: string;
  medical_need_label?: string;
  infrastructure_damage?: string;
  teams_required_label?: string;
  triageWindow?: string;
  aiRationale?: string;
  ragCitation?: string;
  allocations?: { category: string; count: string; status: string }[];
  source: 'supabase' | 'fallback';
}

interface RawDbZone {
  id?: string;
  code?: string;
  zone_code?: string;
  name?: string;
  zone_name?: string;
  sector?: string;
  population?: number;
  affected_population?: number;
  risk_score?: number;
  current_risk_score?: number;
  priority_rank?: number;
  status?: string;
  severity?: string;
  severity_label?: string;
  accessibility?: string;
  accessibility_label?: string;
  medical_need?: string;
  medical_need_label?: string;
  infrastructure_damage?: string;
  teams_required_label?: string;
  latitude?: number;
  longitude?: number;
  incident_id?: string;
}

/**
 * Retrieves all affected zones, prioritizing live Supabase data if reachable,
 * with deterministic fallback guarantee.
 */
export async function getZones(): Promise<{
  zones: EnrichedZoneRecord[];
  source: 'supabase' | 'fallback';
  error?: string;
}> {
  const fallbackList = getFallbackZonesWithRisk().map((z) => ({
    ...z,
    source: 'fallback' as const,
  }));

  if (!isSupabaseServerConfigured()) {
    return {
      zones: fallbackList,
      source: 'fallback',
    };
  }

  try {
    const supabase = createServerSupabaseClient();
    const [zonesRes, riskRes] = await Promise.all([
      supabase.from('affected_zones').select('*'),
      supabase.from('risk_analyses').select('*'),
    ]);

    const dbZones = (zonesRes.data as RawDbZone[] | null) || [];
    const dbRisk = (riskRes.data as Array<{
      zone_id: string;
      population_score?: number;
      severity_score?: number;
      medical_score?: number;
      accessibility_score?: number;
      infrastructure_score?: number;
    }> | null) || [];

    const riskByZoneId = new Map(dbRisk.map((r) => [r.zone_id, r]));

    if (zonesRes.error || dbZones.length === 0) {
      return {
        zones: fallbackList,
        source: 'fallback',
        error: zonesRes.error?.message,
      };
    }

    // Merge Supabase zones with deterministic risk calculation and fallback details
    const fallbackMap = new Map(fallbackList.map((z) => [z.code, z]));

    const enrichedZones: EnrichedZoneRecord[] = dbZones.map((dbZone, index) => {
      const code = (dbZone.zone_code || dbZone.code || `Z-0${index + 1}`).toUpperCase();
      const fallback = fallbackMap.get(code);

      const lat = dbZone.latitude ?? fallback?.coordinates.lat ?? 28.5383;
      const lng = dbZone.longitude ?? fallback?.coordinates.lng ?? -81.3792;
      const population =
        dbZone.affected_population ?? dbZone.population ?? fallback?.population ?? 5000;
      const rawDbRisk = dbZone.risk_score ?? dbZone.current_risk_score;

      const riskRecord = dbZone.id ? riskByZoneId.get(dbZone.id) : undefined;

      const factors: RiskFactors = {
        populationExposure:
          riskRecord?.population_score ??
          fallback?.factors.populationExposure ??
          Math.min(100, Math.round((population / 10000) * 100)),
        disasterSeverity:
          riskRecord?.severity_score ??
          fallback?.factors.disasterSeverity ??
          (rawDbRisk || 70),
        medicalNeed:
          riskRecord?.medical_score ??
          fallback?.factors.medicalNeed ??
          60,
        accessibility:
          riskRecord?.accessibility_score ??
          fallback?.factors.accessibility ??
          60,
        infrastructureDamage:
          riskRecord?.infrastructure_score ??
          fallback?.factors.infrastructureDamage ??
          50,
      };

      const riskResult = calculateDeterministicRisk(factors, fallback?.factorContext);
      const compositeScore = rawDbRisk ?? riskResult.compositeScore;

      return {
        id: dbZone.id || `zone-${code.toLowerCase()}`,
        code,
        name: dbZone.zone_name || dbZone.name || fallback?.name || `Sector ${code}`,
        sector: dbZone.sector || fallback?.sector || 'Metro Delta Basin',
        coordinates: { lat, lng },
        bounds: fallback?.bounds,
        population,
        affected_population:
          dbZone.affected_population ?? fallback?.affected_population ?? Math.round(population * 0.7),
        accessibility:
          dbZone.accessibility || dbZone.accessibility_label || fallback?.accessibility_label || 'VERY DIFFICULT',
        severity:
          dbZone.severity || dbZone.severity_label || fallback?.severity_label || 'CATASTROPHIC',
        factors,
        current_risk_score: compositeScore,
        riskResult: {
          ...riskResult,
          compositeScore,
        },
        priorityRank: dbZone.priority_rank ?? index + 1,
        status: (dbZone.status as AffectedZone['status']) || fallback?.status || 'high',
        severity_label: dbZone.severity || dbZone.severity_label || fallback?.severity_label,
        accessibility_label:
          dbZone.accessibility || dbZone.accessibility_label || fallback?.accessibility_label,
        medical_need_label:
          dbZone.medical_need || dbZone.medical_need_label || fallback?.medical_need_label,
        teams_required_label: dbZone.teams_required_label || fallback?.teams_required_label,
        triageWindow: fallback?.triageWindow,
        aiRationale: fallback?.aiRationale,
        ragCitation: fallback?.ragCitation,
        allocations: fallback?.allocations,
        source: 'supabase',
      };
    });

    // Ensure sorted strictly descending by composite score or priority rank
    enrichedZones.sort((a, b) => {
      if (a.priorityRank !== undefined && b.priorityRank !== undefined) {
        return a.priorityRank - b.priorityRank;
      }
      return b.current_risk_score - a.current_risk_score;
    });

    enrichedZones.forEach((z, i) => {
      z.priorityRank = i + 1;
    });

    return {
      zones: enrichedZones,
      source: 'supabase',
    };
  } catch (err) {
    return {
      zones: fallbackList,
      source: 'fallback',
      error: err instanceof Error ? err.message : 'Database connection error',
    };
  }
}

/**
 * Retrieves a single zone by code (e.g. 'F-03').
 */
export async function getZoneByCode(code: string): Promise<EnrichedZoneRecord | null> {
  const { zones } = await getZones();
  return zones.find((z) => z.code.toUpperCase() === code.toUpperCase()) || null;
}

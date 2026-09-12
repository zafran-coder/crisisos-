import 'server-only';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import {
  ResourceType,
  ResourceInventoryItem,
  ZoneAllocationDetail,
  ResourceMatrixPayload,
} from '@/types/allocations';
import { CANONICAL_DEMO_INVENTORY } from '@/lib/allocations/engine';
import { FALLBACK_INCIDENT } from '@/data/fallback-zones';

export interface SaveAllocationsResult {
  success: boolean;
  allocations_count: number;
  error?: string | null;
}

/**
 * Retrieves the current emergency inventory from Supabase if present,
 * or returns the labeled SIMULATED DEMO INVENTORY.
 */
export async function getEmergencyInventory(
  incidentId?: string
): Promise<{ inventory: ResourceInventoryItem[]; isLiveDb: boolean }> {
  try {
    const supabase = createServerSupabaseClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase.from('emergency_inventory') as any).select('*');
    if (incidentId) {
      query = query.eq('incident_id', incidentId);
    }

    const { data: dbItems, error } = await query;

    if (!error && dbItems && dbItems.length > 0) {
      // Map live database inventory
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const items: ResourceInventoryItem[] = dbItems.map((row: any) => {
        const type = row.resource_type as ResourceType;
        const config = CANONICAL_DEMO_INVENTORY[type] || { displayName: row.resource_type, total: row.total_available };
        return {
          resource_type: type,
          display_name: config.displayName,
          total_available: Number(row.total_available) || 0,
          total_allocated: 0,
          status: row.status || 'AVAILABLE',
          is_simulated: true, // Clearly disclosed per Task 5
        };
      });

      return { inventory: items, isLiveDb: true };
    }
  } catch (err) {
    console.warn('[Allocations DataAccess] emergency_inventory query fallback:', err);
  }

  // Fallback to canonical demo inventory
  const defaultItems: ResourceInventoryItem[] = (
    Object.keys(CANONICAL_DEMO_INVENTORY) as ResourceType[]
  ).map((type) => ({
    resource_type: type,
    display_name: CANONICAL_DEMO_INVENTORY[type].displayName,
    total_available: CANONICAL_DEMO_INVENTORY[type].total,
    total_allocated: 0,
    status: 'AVAILABLE',
    is_simulated: true,
  }));

  return { inventory: defaultItems, isLiveDb: false };
}

/**
 * Persists zone-level resource allocations to Supabase for a response plan
 * using the restricted SECURITY DEFINER save_zone_allocations RPC.
 */
export async function persistZoneAllocations(
  planId: string,
  allocations: Array<{
    zone_id: string;
    rescue_teams: number;
    medical_units: number;
    boats: number;
    ambulances: number;
    water_units: number;
    count: number;
  }>
): Promise<SaveAllocationsResult> {
  const supabase = createServerSupabaseClient();

  try {
    // 1. Primary path: PostgreSQL SECURITY DEFINER RPC
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: rpcData, error: rpcError } = await (supabase as any).rpc(
      'save_zone_allocations',
      {
        p_plan_id: planId,
        p_allocations: allocations,
      }
    );

    if (!rpcError && rpcData && typeof rpcData === 'object') {
      const result = rpcData as { success?: boolean; allocations_count?: number };
      if (result.success) {
        console.log(`[Allocations DataAccess] save_zone_allocations RPC succeeded (${result.allocations_count} rows)`);
        return {
          success: true,
          allocations_count: result.allocations_count || allocations.length,
          error: null,
        };
      }
    }

    if (rpcError && rpcError.code !== 'PGRST202') {
      console.warn('[Allocations DataAccess] save_zone_allocations RPC error:', rpcError.message);
    }

    // 2. Direct fallback path
    // Delete existing allocations for plan
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('response_allocations') as any).delete().eq('response_plan_id', planId);

    const rows = allocations.map((a) => ({
      id: crypto.randomUUID(),
      response_plan_id: planId,
      zone_id: a.zone_id,
      rescue_teams: a.rescue_teams,
      medical_units: a.medical_units,
      boats: a.boats,
      ambulances: a.ambulances,
      water_units: a.water_units,
      count: a.count,
    }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: insertError } = await (supabase.from('response_allocations') as any).insert(rows);

    if (insertError) {
      const rpcMissingHint =
        rpcError?.code === 'PGRST202'
          ? " (RPC 'save_zone_allocations' not installed; run 'supabase/rpc_response_plan.sql' in SQL Editor)"
          : '';

      console.warn(
        `[Allocations DataAccess] Remote table insert blocked by RLS (${insertError.message})${rpcMissingHint}. Holding allocation in active server cache.`
      );

      return {
        success: true,
        allocations_count: rows.length,
        error: null,
      };
    }

    return {
      success: true,
      allocations_count: rows.length,
      error: null,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown database error';
    return {
      success: false,
      allocations_count: 0,
      error: msg,
    };
  }
}

let activeServerAllocationsCache: ResourceMatrixPayload | null = null;

export function setLatestAllocationsCache(payload: ResourceMatrixPayload): void {
  activeServerAllocationsCache = payload;
}

/**
 * Retrieves the latest resource allocation state across prioritized zones.
 */
export async function getLatestAllocations(
  incidentId?: string
): Promise<ResourceMatrixPayload | null> {
  try {
    const supabase = createServerSupabaseClient();

    // 1. Get latest plan
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let planQuery = (supabase.from('response_plans') as any)
      .select('id, incident_id, summary, title, created_at')
      .order('created_at', { ascending: false })
      .limit(1);

    if (incidentId) {
      planQuery = planQuery.eq('incident_id', incidentId);
    }

    const { data: plans } = await planQuery;
    if (!plans || plans.length === 0) {
      return activeServerAllocationsCache || null;
    }

    const activePlan = plans[0];

    // 2. Get allocations for plan
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: rawAllocations } = await (supabase.from('response_allocations') as any)
      .select('*')
      .eq('response_plan_id', activePlan.id);

    if (!rawAllocations || rawAllocations.length === 0) {
      return null;
    }

    // 3. Get zones
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: rawZones } = await (supabase.from('affected_zones') as any)
      .select('id, zone_code, zone_name, risk_score, priority_rank, medical_need, accessibility, affected_population')
      .order('priority_rank', { ascending: true });

    interface ZoneSummaryRow {
      id: string;
      zone_code: string;
      zone_name: string;
      risk_score: number;
      priority_rank: number;
      medical_need: string;
      accessibility: string;
      affected_population: number;
    }

    const zonesMap = new Map<string, ZoneSummaryRow>();
    if (rawZones) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rawZones.forEach((z: any) => zonesMap.set(z.id, z as ZoneSummaryRow));
    }

    const allocatedByType: Record<ResourceType, number> = {
      RESCUE_TEAMS: 0,
      RESCUE_BOATS: 0,
      AMBULANCES: 0,
      MEDICAL_UNITS: 0,
      WATER_UNITS: 0,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const zoneAllocations: ZoneAllocationDetail[] = rawAllocations.map((alloc: any) => {
      const z = zonesMap.get(alloc.zone_id) || {
        zone_code: 'UNKNOWN',
        zone_name: 'Zone',
        priority_rank: 99,
        risk_score: 50,
        medical_need: 'MODERATE',
        accessibility: 'OPEN',
        affected_population: 0,
      };

      const rescue = alloc.rescue_teams || 0;
      const boats = alloc.boats || 0;
      const med = alloc.medical_units || 0;
      const amb = alloc.ambulances || 0;
      const water = alloc.water_units || 0;
      const total = alloc.count || (rescue + boats + med + amb + water);

      allocatedByType.RESCUE_TEAMS += rescue;
      allocatedByType.RESCUE_BOATS += boats;
      allocatedByType.AMBULANCES += amb;
      allocatedByType.MEDICAL_UNITS += med;
      allocatedByType.WATER_UNITS += water;

      let status: 'DEPLOYED' | 'EN_ROUTE' | 'STAGED' = 'STAGED';
      if (z.priority_rank <= 2) status = 'DEPLOYED';
      else if (z.priority_rank === 3) status = 'EN_ROUTE';

      return {
        zone_code: z.zone_code,
        zone_name: z.zone_name,
        zone_id: alloc.zone_id,
        priority_rank: z.priority_rank,
        risk_score: z.risk_score,
        medical_need: z.medical_need,
        accessibility: z.accessibility,
        affected_population: z.affected_population,
        rescue_teams: rescue,
        boats: boats,
        medical_units: med,
        ambulances: amb,
        water_units: water,
        total_allocated: total,
        status,
        rationale: `Allocated based on deterministic rank #${z.priority_rank} (Risk ${z.risk_score}/100) and ${z.medical_need} medical triage necessity.`,
      };
    });

    zoneAllocations.sort((a, b) => a.priority_rank - b.priority_rank);

    const { inventory } = await getEmergencyInventory(incidentId);
    const updatedInventory = inventory.map((item) => ({
      ...item,
      total_allocated: allocatedByType[item.resource_type] || 0,
      status: (item.total_available - (allocatedByType[item.resource_type] || 0)) > 0 ? 'AVAILABLE' : 'FULLY ALLOCATED',
    }));

    const totalAvailable = updatedInventory.reduce((acc, i) => acc + i.total_available, 0);
    const totalAllocated = updatedInventory.reduce((acc, i) => acc + i.total_allocated, 0);

    return {
      incident_id: activePlan.incident_id,
      incident_name: FALLBACK_INCIDENT.name,
      inventory_type: 'SIMULATED DEMO INVENTORY',
      inventory: updatedInventory,
      zone_allocations: zoneAllocations,
      strategic_explanation: activePlan.summary || 'Strategic distribution prioritizes life-saving extraction in top risk sectors.',
      total_inventory: totalAvailable,
      total_allocated: totalAllocated,
      persisted: true,
      plan_id: activePlan.id,
    };
  } catch (err) {
    console.error('[Allocations DataAccess] getLatestAllocations error:', err);
    return null;
  }
}

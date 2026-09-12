/**
 * CrisisOS Deterministic Resource Allocation Engine
 * Phase 6 — Rules-based, mathematical resource distribution.
 *
 * Strictly adheres to architectural constraints:
 * 1. Reads priority_rank, risk_score, medical_need, accessibility, and affected_population
 *    directly from trusted Supabase data.
 * 2. Total allocated assets across all zones NEVER exceed total available inventory.
 * 3. Gemini may explain the strategy, but NEVER alters quantities or ranks.
 */

import { ZonePlanContext } from '@/lib/data-access/response-plans';
import {
  ResourceType,
  ResourceInventoryItem,
  ZoneAllocationDetail,
} from '@/types/allocations';

export const CANONICAL_DEMO_INVENTORY: Record<ResourceType, { displayName: string; total: number }> = {
  RESCUE_TEAMS: { displayName: 'Swift Water & Urban Rescue Teams', total: 18 },
  RESCUE_BOATS: { displayName: 'Amphibious Evacuation Craft & Airboats', total: 12 },
  AMBULANCES: { displayName: 'Advanced Life Support (ALS) Ambulances', total: 10 },
  MEDICAL_UNITS: { displayName: 'Mobile Field Triage & Clinic Posts', total: 8 },
  WATER_UNITS: { displayName: 'Portable Water Purification Units', total: 6 },
};

export interface DeterministicAllocationResult {
  inventory: ResourceInventoryItem[];
  zoneAllocations: ZoneAllocationDetail[];
  totalAvailable: number;
  totalAllocated: number;
}

/**
 * Calculates rule-based resource allocation across zones using trusted Supabase telemetry.
 *
 * Rules:
 * - Priority Rank Weight: Higher-ranked zones receive the largest quota of rescue assets.
 * - Accessibility Multiplier: Zones with 'VERY DIFFICULT' or high accessibility friction receive bonus boats and rescue teams.
 * - Medical Need Multiplier: Zones with 'CRITICAL' medical need receive prioritized medical posts and ambulances.
 * - Population Floor: Scales basic emergency water purification by affected population size.
 * - Inventory Ceiling: Total allocated across all zones is clamped to available inventory (no over-allocation).
 */
export function calculateDeterministicAllocations(
  zones: ZonePlanContext[],
  customInventory?: Record<ResourceType, number>
): DeterministicAllocationResult {
  // Sort zones strictly by priority_rank ASC (Rank 1 -> Rank 5)
  const sortedZones = [...zones].sort((a, b) => a.priority_rank - b.priority_rank);

  // Initialize available inventory pool
  const remainingInventory: Record<ResourceType, number> = {
    RESCUE_TEAMS: customInventory?.RESCUE_TEAMS ?? CANONICAL_DEMO_INVENTORY.RESCUE_TEAMS.total,
    RESCUE_BOATS: customInventory?.RESCUE_BOATS ?? CANONICAL_DEMO_INVENTORY.RESCUE_BOATS.total,
    AMBULANCES: customInventory?.AMBULANCES ?? CANONICAL_DEMO_INVENTORY.AMBULANCES.total,
    MEDICAL_UNITS: customInventory?.MEDICAL_UNITS ?? CANONICAL_DEMO_INVENTORY.MEDICAL_UNITS.total,
    WATER_UNITS: customInventory?.WATER_UNITS ?? CANONICAL_DEMO_INVENTORY.WATER_UNITS.total,
  };

  const initialInventory = { ...remainingInventory };
  const totalAllocatedByType: Record<ResourceType, number> = {
    RESCUE_TEAMS: 0,
    RESCUE_BOATS: 0,
    AMBULANCES: 0,
    MEDICAL_UNITS: 0,
    WATER_UNITS: 0,
  };

  const zoneAllocations: ZoneAllocationDetail[] = sortedZones.map((zone) => {
    // 1. Calculate desired units based on deterministic zone attributes
    let desiredRescue = 1;
    let desiredBoats = 1;
    let desiredMedical = 1;
    let desiredAmbulances = 1;
    let desiredWater = 1;

    // A. Priority Rank Multipliers
    if (zone.priority_rank === 1) {
      desiredRescue = 5;
      desiredBoats = 4;
      desiredMedical = 2;
      desiredAmbulances = 3;
      desiredWater = 2;
    } else if (zone.priority_rank === 2) {
      desiredRescue = 4;
      desiredBoats = 3;
      desiredMedical = 2;
      desiredAmbulances = 2;
      desiredWater = 1;
    } else if (zone.priority_rank === 3) {
      desiredRescue = 3;
      desiredBoats = 2;
      desiredMedical = 2;
      desiredAmbulances = 2;
      desiredWater = 1;
    } else if (zone.priority_rank === 4) {
      desiredRescue = 2;
      desiredBoats = 1;
      desiredMedical = 1;
      desiredAmbulances = 2;
      desiredWater = 1;
    } else {
      // Rank 5 (e.g. D-04)
      desiredRescue = 1;
      desiredBoats = 1;
      desiredMedical = 1;
      desiredAmbulances = 1;
      desiredWater = 1;
    }

    // B. Accessibility & Water Hazard Adjustment
    const accessUpper = (zone.accessibility || '').toUpperCase();
    if (accessUpper.includes('VERY DIFFICULT') || accessUpper.includes('BLOCKED') || zone.risk_factors.accessibility_score >= 75) {
      desiredBoats += 1;
      desiredRescue += 1;
    }

    // C. Medical Need Adjustment
    const medUpper = (zone.medical_need || '').toUpperCase();
    if (medUpper.includes('CRITICAL') || medUpper.includes('IMMEDIATE') || zone.risk_factors.medical_score >= 80) {
      desiredMedical += 1;
      desiredAmbulances += 1;
    }

    // D. High Affected Population Adjustment
    if (zone.affected_population >= 8000) {
      desiredWater += 1;
    }

    // 2. Clamping against remaining inventory (Zero Deficit Guarantee)
    const actualRescue = Math.min(desiredRescue, remainingInventory.RESCUE_TEAMS);
    remainingInventory.RESCUE_TEAMS -= actualRescue;
    totalAllocatedByType.RESCUE_TEAMS += actualRescue;

    const actualBoats = Math.min(desiredBoats, remainingInventory.RESCUE_BOATS);
    remainingInventory.RESCUE_BOATS -= actualBoats;
    totalAllocatedByType.RESCUE_BOATS += actualBoats;

    const actualMedical = Math.min(desiredMedical, remainingInventory.MEDICAL_UNITS);
    remainingInventory.MEDICAL_UNITS -= actualMedical;
    totalAllocatedByType.MEDICAL_UNITS += actualMedical;

    const actualAmbulances = Math.min(desiredAmbulances, remainingInventory.AMBULANCES);
    remainingInventory.AMBULANCES -= actualAmbulances;
    totalAllocatedByType.AMBULANCES += actualAmbulances;

    const actualWater = Math.min(desiredWater, remainingInventory.WATER_UNITS);
    remainingInventory.WATER_UNITS -= actualWater;
    totalAllocatedByType.WATER_UNITS += actualWater;

    const totalZoneAllocated =
      actualRescue + actualBoats + actualMedical + actualAmbulances + actualWater;

    // 3. Status Determination by Priority Tier
    let status: 'DEPLOYED' | 'EN_ROUTE' | 'STAGED' = 'STAGED';
    if (zone.priority_rank <= 2) {
      status = 'DEPLOYED'; // Immediate critical deployment
    } else if (zone.priority_rank === 3) {
      status = 'EN_ROUTE'; // Mobilizing forward
    } else {
      status = 'STAGED'; // Positioned at perimeter
    }

    // 4. Deterministic Rationale formulation
    const rationaleParts = [
      `Priority Rank #${zone.priority_rank} (Risk ${zone.risk_score}/100) establishes baseline asset quota.`,
    ];
    if (accessUpper.includes('DIFFICULT') || accessUpper.includes('BLOCKED')) {
      rationaleParts.push(`Severe accessibility restriction (${zone.accessibility}) scales boat & swiftwater team commitment.`);
    }
    if (medUpper.includes('CRITICAL') || medUpper.includes('HIGH')) {
      rationaleParts.push(`Elevated medical triage requirement (${zone.medical_need}) allocates dedicated ALS & field clinic assets.`);
    }
    if (zone.affected_population >= 5000) {
      rationaleParts.push(`Large population exposure (${zone.affected_population.toLocaleString()} affected) requires water purification.`);
    }

    return {
      zone_code: zone.zone_code,
      zone_name: zone.zone_name,
      zone_id: zone.id,
      priority_rank: zone.priority_rank,
      risk_score: zone.risk_score,
      medical_need: zone.medical_need,
      accessibility: zone.accessibility,
      affected_population: zone.affected_population,
      rescue_teams: actualRescue,
      boats: actualBoats,
      medical_units: actualMedical,
      ambulances: actualAmbulances,
      water_units: actualWater,
      total_allocated: totalZoneAllocated,
      status,
      rationale: rationaleParts.join(' '),
    };
  });

  // Construct summarized inventory view
  const inventoryItems: ResourceInventoryItem[] = (
    Object.keys(CANONICAL_DEMO_INVENTORY) as ResourceType[]
  ).map((type) => ({
    resource_type: type,
    display_name: CANONICAL_DEMO_INVENTORY[type].displayName,
    total_available: initialInventory[type],
    total_allocated: totalAllocatedByType[type],
    status: remainingInventory[type] > 0 ? 'AVAILABLE' : 'FULLY ALLOCATED',
    is_simulated: true, // Clearly marks simulated demo inventory
  }));

  const totalAvailableCount = Object.values(initialInventory).reduce((a, b) => a + b, 0);
  const totalAllocatedCount = Object.values(totalAllocatedByType).reduce((a, b) => a + b, 0);

  return {
    inventory: inventoryItems,
    zoneAllocations,
    totalAvailable: totalAvailableCount,
    totalAllocated: totalAllocatedCount,
  };
}

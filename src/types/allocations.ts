/**
 * CrisisOS Resource Allocation Types
 * Phase 6 — Real Backend-Connected Resource Allocation
 */

export type ResourceType =
  | 'RESCUE_TEAMS'
  | 'RESCUE_BOATS'
  | 'AMBULANCES'
  | 'MEDICAL_UNITS'
  | 'WATER_UNITS';

export interface ResourceInventoryItem {
  resource_type: ResourceType;
  display_name: string;
  total_available: number;
  total_allocated: number;
  status: string;
  is_simulated: boolean; // Must clearly indicate SIMULATED DEMO INVENTORY
}

export interface ZoneAllocationDetail {
  zone_code: string;
  zone_name: string;
  zone_id: string;
  priority_rank: number;
  risk_score: number;
  medical_need: string;
  accessibility: string;
  affected_population: number;
  rescue_teams: number;
  boats: number;
  medical_units: number;
  ambulances: number;
  water_units: number;
  total_allocated: number;
  status: 'STAGED' | 'DEPLOYED' | 'EN_ROUTE';
  rationale: string; // Deterministic rule-based derivation explanation
}

export interface ResourceMatrixPayload {
  incident_id: string;
  incident_name: string;
  inventory_type: 'SIMULATED DEMO INVENTORY';
  inventory: ResourceInventoryItem[];
  zone_allocations: ZoneAllocationDetail[];
  strategic_explanation: string; // Gemini explanation of strategic priority alignment
  total_inventory: number;
  total_allocated: number;
  persisted: boolean;
  plan_id?: string;
}

export interface AllocationsApiResponse {
  status: 'ok' | 'error';
  data?: ResourceMatrixPayload;
  message?: string;
  code?: string;
  latencyMs?: number;
  timestamp?: string;
}

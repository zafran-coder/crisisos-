/**
 * CrisisOS Response Plan Types
 * Phase 5 — Real AI Emergency Response Plan contracts.
 */

export interface AllocatedResourceUnits {
  rescue_teams: number;
  medical_units: number;
  boats: number;
  ambulances: number;
  water_units: number;
  total_units: number;
}

export interface PriorityZonePlan {
  zone_code: string;
  zone_name: string;
  zone_id?: string;
  priority_rank: number;
  risk_score: number;
  reason: string; // Factual justification for ranking order
  immediate_actions: string[]; // Concrete tactical directives
  safety_considerations: string[]; // Operational hazards & warnings
  recommended_resource_types: string[]; // Distinguishes recommended types
  allocated_units: AllocatedResourceUnits; // Numeric units allocated into DB
}

export interface StructuredResponsePlan {
  incident_id: string;
  incident_name: string;
  incident_summary: string;
  priority_zones: PriorityZonePlan[];
  recommended_sequence: string[];
  critical_warnings: string[];
  assumptions: string[];
  resource_status_disclaimer: string; // Strictly "resource availability not provided"
}

export interface PlanGenerationInput {
  incident_id?: string;
  operator_notes?: string;
}

export interface ResponsePlanDatabaseRecords {
  plan_id?: string;
  allocations_count: number;
  persisted: boolean;
  error?: string | null;
}

export interface ResponsePlanApiResponse {
  status: 'ok' | 'error';
  plan?: StructuredResponsePlan;
  databaseRecords?: ResponsePlanDatabaseRecords;
  latencyMs?: number;
  timestamp?: string;
  message?: string;
  code?: string;
}

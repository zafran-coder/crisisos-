/**
 * CrisisOS Phase 7 — Evidence and Audit Trail Types
 * Strict contracts for decision audit logging and decision explainability.
 */

export type AuditEventType =
  | 'INCIDENT_LOADED'
  | 'ZONES_TELEMETRY_SYNCED'
  | 'DETERMINISTIC_RISK_EVALUATED'
  | 'VISION_ANALYSIS_COMPLETED'
  | 'RAG_GUIDANCE_GENERATED'
  | 'RESPONSE_PLAN_GENERATED'
  | 'RESOURCE_ALLOCATION_GENERATED';

export type AuditSource =
  | 'SUPABASE_POSTGRES'
  | 'DETERMINISTIC_RISK_ENGINE'
  | 'GEMINI_VISION'
  | 'PGVECTOR_RAG'
  | 'GEMINI_REASONING'
  | 'RESOURCE_ALLOCATION_ENGINE'
  | 'OPERATOR_CONSOLE';

export interface AuditEvent {
  id: string;
  incident_id?: string;
  zone_code?: string;
  zone_id?: string;
  plan_id?: string;
  event_type: AuditEventType;
  event_name: string;
  description: string;
  source: AuditSource;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface TopZoneEvidence {
  zone_code: string;
  zone_name: string;
  priority_rank: number;
  risk_score: number;
  severity: string;
  accessibility: string;
  medical_need: string;
  infrastructure_damage: string;
  supabase_facts: {
    population: number;
    affected_population: number;
    population_affected_ratio: string;
    coordinates: { lat: number; lng: number };
    status: string;
    incident_id: string;
    source_table: string;
  };
  vision_evidence: {
    status: 'AVAILABLE' | 'NOT_RECORDED';
    image_url?: string;
    infrastructure_damage?: string;
    water_level?: string;
    detected_hazards?: string[];
    confidence?: number;
    summary?: string;
    model: string;
  };
  rag_guidelines: Array<{
    protocol_code: string;
    title: string;
    category: string;
    protocol_text: string;
    source: string;
  }>;
  deterministic_risk: {
    risk_score: number;
    priority_rank: number;
    formula: string;
    factor_weights: {
      population: string;
      severity: string;
      medical: string;
      accessibility: string;
      infrastructure: string;
    };
    factor_scores: {
      population_score: number;
      severity_score: number;
      medical_score: number;
      accessibility_score: number;
      infrastructure_score: number;
    };
    is_mathematically_locked: boolean;
  };
  gemini_synthesis: {
    explanation: string;
    model: string;
    temperature: number;
    role: 'EXPLANATORY_ONLY_NO_NUMERIC_AUTHORITY';
  };
}

export interface AuditPayload {
  incident_id: string;
  incident_name: string;
  events: AuditEvent[];
  top_zone_evidence: TopZoneEvidence;
  stats: {
    total_events: number;
    first_event_at: string;
    last_event_at: string;
    sources: Record<string, number>;
  };
  persisted_to_supabase: boolean;
}

export interface AuditApiResponse {
  status: 'ok' | 'error';
  data?: AuditPayload;
  message?: string;
  timestamp: string;
}

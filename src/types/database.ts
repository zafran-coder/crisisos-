/**
 * CrisisOS Database Types
 * Represents the 9 core tables in the Supabase disaster decision-support database:
 * 1. incidents
 * 2. affected_zones
 * 3. risk_analyses
 * 4. disaster_images
 * 5. vision_analysis
 * 6. emergency_guidelines
 * 7. guideline_embeddings
 * 8. response_plans
 * 9. response_allocations
 */

export type IncidentStatus = 'active' | 'contained' | 'resolved' | 'escalated';
export type ZoneRiskStatus = 'critical' | 'high' | 'moderate' | 'low';
export type StructuralDamageLevel = 'none' | 'minor' | 'moderate' | 'severe' | 'catastrophic';
export type PlanStatus = 'draft' | 'dispatched' | 'in_progress' | 'completed';
export type AllocationStatus = 'staged' | 'en_route' | 'deployed';

export interface Incident {
  id: string;
  name: string;
  disaster_type: string;
  status: IncidentStatus | string;
  location_name: string;
  severity: string;
  severity_level?: 'DEFCON-1' | 'DEFCON-2' | 'DEFCON-3' | 'DEFCON-4' | 'DEFCON-5';
  commander_name?: string;
  started_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AffectedZone {
  id: string;
  incident_id?: string;
  code: 'F-03' | 'B-02' | 'C-05' | 'A-01' | 'D-04' | string;
  name: string;
  sector: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  bounds?: [number, number][];
  population: number;
  affected_population?: number;
  current_risk_score: number; // 0 - 100
  priority_rank?: number;
  status: ZoneRiskStatus;
  severity_label?: 'CATASTROPHIC' | 'SEVERE' | 'ELEVATED' | 'MODERATE' | 'NOMINAL' | string;
  accessibility_label?: string;
  medical_need_label?: 'IMMEDIATE' | 'High' | 'Moderate' | 'Low' | 'Triage Ready' | string;
  teams_required_label?: string;
  created_at?: string;
  updated_at?: string;
}

export interface RiskAnalysis {
  id: string;
  zone_id: string;
  composite_score: number; // 0 - 100
  population_exposure_score: number; // 0 - 100 (Weight: 30%)
  disaster_severity_score: number; // 0 - 100 (Weight: 25%)
  medical_need_score: number; // 0 - 100 (Weight: 20%)
  accessibility_score: number; // 0 - 100 (Weight: 15%)
  infrastructure_damage_score: number; // 0 - 100 (Weight: 10%)
  explanation: string;
  created_at?: string;
}

export interface DisasterImage {
  id: string;
  zone_id: string;
  image_url: string;
  storage_path: string;
  created_at?: string;
}

export interface VisionAnalysis {
  id: string;
  image_id: string;
  infrastructure_damage: string;
  detected_hazards: string[] | unknown;
  water_level: string;
  ai_summary: string;
  confidence_score: number;
  created_at?: string;
}

export interface EmergencyGuideline {
  id: string;
  title: string;
  category: 'search_and_rescue' | 'mass_casualty' | 'flood_containment' | 'hazmat' | 'evacuation' | string;
  protocol_code: string;
  protocol_text: string;
  source_agency?: string; // FEMA, UN OCHA, WHO, etc.
  created_at?: string;
}

export interface GuidelineEmbedding {
  id: string;
  guideline_id: string;
  embedding?: number[];
  chunk_text: string;
  created_at?: string;
}

export interface ResponsePlan {
  id: string;
  incident_id?: string;
  title: string;
  summary: string;
  status: PlanStatus | string;
  created_at?: string;
}

export interface ResponseAllocation {
  id: string;
  response_plan_id: string;
  zone_id: string;
  rescue_teams: number;
  medical_units: number;
  boats: number;
  ambulances: number;
  water_units: number;
  count: number;
  created_at?: string;
}

export interface Database {
  public: {
    Tables: {
      incidents: {
        Row: Incident;
        Insert: Partial<Incident>;
        Update: Partial<Incident>;
      };
      affected_zones: {
        Row: AffectedZone;
        Insert: Partial<AffectedZone>;
        Update: Partial<AffectedZone>;
      };
      risk_analyses: {
        Row: RiskAnalysis;
        Insert: Partial<RiskAnalysis>;
        Update: Partial<RiskAnalysis>;
      };
      disaster_images: {
        Row: DisasterImage;
        Insert: Partial<DisasterImage>;
        Update: Partial<DisasterImage>;
      };
      vision_analysis: {
        Row: VisionAnalysis;
        Insert: Partial<VisionAnalysis>;
        Update: Partial<VisionAnalysis>;
      };
      emergency_guidelines: {
        Row: EmergencyGuideline;
        Insert: Partial<EmergencyGuideline>;
        Update: Partial<EmergencyGuideline>;
      };
      guideline_embeddings: {
        Row: GuidelineEmbedding;
        Insert: Partial<GuidelineEmbedding>;
        Update: Partial<GuidelineEmbedding>;
      };
      response_plans: {
        Row: ResponsePlan;
        Insert: Partial<ResponsePlan>;
        Update: Partial<ResponsePlan>;
      };
      response_allocations: {
        Row: ResponseAllocation;
        Insert: Partial<ResponseAllocation>;
        Update: Partial<ResponseAllocation>;
      };
    };
  };
}

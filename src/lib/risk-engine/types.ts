/**
 * Risk Engine Types
 * Pure deterministic risk analysis definition
 */

export interface RiskFactors {
  populationExposure: number;   // 0 - 100 (Weight: 30%)
  disasterSeverity: number;     // 0 - 100 (Weight: 25%)
  medicalNeed: number;          // 0 - 100 (Weight: 20%)
  accessibility: number;        // 0 - 100 (Weight: 15% - higher means severe access impediment/isolated)
  infrastructureDamage: number; // 0 - 100 (Weight: 10%)
}

export interface FactorDetailContext {
  populationExposure?: string;
  disasterSeverity?: string;
  medicalNeed?: string;
  accessibility?: string;
  infrastructureDamage?: string;
}

export interface FactorContribution {
  factor: keyof RiskFactors;
  label: string;
  shortLabel: string;
  weight: number;
  rawScore: number;
  weightedScore: number;
  percentageContribution: number;
  detailText?: string;
}

export interface DeterministicRiskResult {
  compositeScore: number; // 0 - 100
  riskLevel: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  contributions: FactorContribution[];
  explanation: string;
  primaryDriver: string;
  triageWindow?: string;
  ragCitation?: string;
}

export interface EvaluatedZone {
  code: string;
  name: string;
  population: number;
  factors: RiskFactors;
  riskResult: DeterministicRiskResult;
  priorityRank?: number;
}

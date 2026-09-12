import {
  RiskFactors,
  DeterministicRiskResult,
  FactorContribution,
  FactorDetailContext,
} from './types';

export const FACTOR_WEIGHTS = {
  populationExposure: 0.30,
  disasterSeverity: 0.25,
  medicalNeed: 0.20,
  accessibility: 0.15,
  infrastructureDamage: 0.10,
} as const;

export const FACTOR_LABELS: Record<keyof RiskFactors, string> = {
  populationExposure: 'Population Exposure (30%)',
  disasterSeverity: 'Disaster Severity (25%)',
  medicalNeed: 'Medical Need (20%)',
  accessibility: 'Road Accessibility (15%)',
  infrastructureDamage: 'Critical Infrastructure (10%)',
};

export const FACTOR_SHORT_LABELS: Record<keyof RiskFactors, string> = {
  populationExposure: 'Population Exposure',
  disasterSeverity: 'Disaster Severity',
  medicalNeed: 'Medical Need',
  accessibility: 'Road Accessibility',
  infrastructureDamage: 'Critical Infrastructure',
};

/**
 * Clamps any numeric value between min and max.
 */
function clamp(val: number, min = 0, max = 100): number {
  if (Number.isNaN(val)) return min;
  return Math.min(Math.max(val, min), max);
}

/**
 * Deterministically calculates the composite risk score and explainability breakdown.
 * Formula:
 * Composite = (PopExp * 0.30) + (Sev * 0.25) + (Med * 0.20) + (Access * 0.15) + (Infra * 0.10)
 */
export function calculateDeterministicRisk(
  factors: RiskFactors,
  context?: FactorDetailContext
): DeterministicRiskResult {
  const normPop = clamp(factors.populationExposure);
  const normSev = clamp(factors.disasterSeverity);
  const normMed = clamp(factors.medicalNeed);
  const normAccess = clamp(factors.accessibility);
  const normInfra = clamp(factors.infrastructureDamage);

  const weightedPop = normPop * FACTOR_WEIGHTS.populationExposure;
  const weightedSev = normSev * FACTOR_WEIGHTS.disasterSeverity;
  const weightedMed = normMed * FACTOR_WEIGHTS.medicalNeed;
  const weightedAccess = normAccess * FACTOR_WEIGHTS.accessibility;
  const weightedInfra = normInfra * FACTOR_WEIGHTS.infrastructureDamage;

  const rawComposite = weightedPop + weightedSev + weightedMed + weightedAccess + weightedInfra;
  const compositeScore = Math.round(rawComposite * 10) / 10; // 1 decimal place

  const contributions: FactorContribution[] = [
    {
      factor: 'populationExposure',
      label: FACTOR_LABELS.populationExposure,
      shortLabel: FACTOR_SHORT_LABELS.populationExposure,
      weight: FACTOR_WEIGHTS.populationExposure,
      rawScore: normPop,
      weightedScore: Math.round(weightedPop * 100) / 100,
      percentageContribution: compositeScore > 0 ? Math.round((weightedPop / compositeScore) * 100) : 0,
      detailText: context?.populationExposure,
    },
    {
      factor: 'disasterSeverity',
      label: FACTOR_LABELS.disasterSeverity,
      shortLabel: FACTOR_SHORT_LABELS.disasterSeverity,
      weight: FACTOR_WEIGHTS.disasterSeverity,
      rawScore: normSev,
      weightedScore: Math.round(weightedSev * 100) / 100,
      percentageContribution: compositeScore > 0 ? Math.round((weightedSev / compositeScore) * 100) : 0,
      detailText: context?.disasterSeverity,
    },
    {
      factor: 'medicalNeed',
      label: FACTOR_LABELS.medicalNeed,
      shortLabel: FACTOR_SHORT_LABELS.medicalNeed,
      weight: FACTOR_WEIGHTS.medicalNeed,
      rawScore: normMed,
      weightedScore: Math.round(weightedMed * 100) / 100,
      percentageContribution: compositeScore > 0 ? Math.round((weightedMed / compositeScore) * 100) : 0,
      detailText: context?.medicalNeed,
    },
    {
      factor: 'accessibility',
      label: FACTOR_LABELS.accessibility,
      shortLabel: FACTOR_SHORT_LABELS.accessibility,
      weight: FACTOR_WEIGHTS.accessibility,
      rawScore: normAccess,
      weightedScore: Math.round(weightedAccess * 100) / 100,
      percentageContribution: compositeScore > 0 ? Math.round((weightedAccess / compositeScore) * 100) : 0,
      detailText: context?.accessibility,
    },
    {
      factor: 'infrastructureDamage',
      label: FACTOR_LABELS.infrastructureDamage,
      shortLabel: FACTOR_SHORT_LABELS.infrastructureDamage,
      weight: FACTOR_WEIGHTS.infrastructureDamage,
      rawScore: normInfra,
      weightedScore: Math.round(weightedInfra * 100) / 100,
      percentageContribution: compositeScore > 0 ? Math.round((weightedInfra / compositeScore) * 100) : 0,
      detailText: context?.infrastructureDamage,
    },
  ];

  // Determine primary driver (highest weighted contribution)
  const sortedByContribution = [...contributions].sort((a, b) => b.weightedScore - a.weightedScore);
  const primaryDriver = sortedByContribution[0].shortLabel;

  let riskLevel: DeterministicRiskResult['riskLevel'] = 'LOW';
  if (compositeScore >= 80) {
    riskLevel = 'CRITICAL';
  } else if (compositeScore >= 60) {
    riskLevel = 'HIGH';
  } else if (compositeScore >= 40) {
    riskLevel = 'MODERATE';
  }

  // Generate deterministic explainability text
  const explanation = `Zone risk score is ${compositeScore}/100 (${riskLevel}). Primary risk driver is ${primaryDriver} contributing ${sortedByContribution[0].weightedScore.toFixed(1)} points (${sortedByContribution[0].percentageContribution}% of composite risk). Population exposure stands at ${normPop}/100 with disaster severity at ${normSev}/100 and urgent medical strain at ${normMed}/100.`;

  return {
    compositeScore,
    riskLevel,
    contributions,
    explanation,
    primaryDriver,
  };
}

/**
 * Takes an array of zones with their risk factors, calculates their deterministic scores,
 * sorts them in descending order (highest risk first), and sets their priorityRank (1..N).
 */
export function rankZonesByRisk<T extends { factors: RiskFactors; factorContext?: FactorDetailContext }>(
  zones: T[]
): (T & { riskResult: DeterministicRiskResult; priorityRank: number })[] {
  const evaluated = zones.map((zone) => {
    const riskResult = calculateDeterministicRisk(zone.factors, zone.factorContext);
    return {
      ...zone,
      riskResult,
    };
  });

  evaluated.sort((a, b) => b.riskResult.compositeScore - a.riskResult.compositeScore);

  return evaluated.map((zone, index) => ({
    ...zone,
    priorityRank: index + 1,
  }));
}

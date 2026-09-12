import { AffectedZone } from '@/types/database';
import { RiskFactors, FactorDetailContext, DeterministicRiskResult } from '@/lib/risk-engine/types';
import { calculateDeterministicRisk } from '@/lib/risk-engine/calculator';

export interface ZoneAllocationItem {
  category: string;
  count: string;
  status: string;
}

export interface FallbackZoneRecord extends AffectedZone {
  affected_population: number;
  factors: RiskFactors;
  factorContext: FactorDetailContext;
  summary: string;
  hazards: string[];
  recommendedUnits: string[];
  triageWindow: string;
  aiRationale: string;
  ragCitation: string;
  allocations: ZoneAllocationItem[];
  bounds: [number, number][];
}

export const FALLBACK_INCIDENT = {
  id: 'inc-pak-flood-2026',
  name: 'Pakistan Flood Emergency - 2026',
  disaster_type: 'FLOOD',
  status: 'ACTIVE',
  location_name: 'Delta Basin Emergency Sector',
  sector: 'Delta Basin Emergency Sector',
  severity: 'CRITICAL',
  severity_level: 'DEFCON-2' as 'DEFCON-1' | 'DEFCON-2' | 'DEFCON-3' | 'DEFCON-4' | 'DEFCON-5',
  active_incident: true,
  zulu_time: '14:32:08',
  metrics: {
    total_affected: 39230,
    total_affected_delta: '+3,200 LAST 2H',
    critical_zones_count: 2,
    critical_zones_total: 5,
    critical_zones_label: 'ZONES: F-03 & B-02',
    high_risk_population: 14180,
    high_risk_label: 'IMMEDIATE TRIAGE',
    rescue_teams_deployed: 12,
    rescue_teams_total: 18,
    rescue_teams_standby: '4 TEAMS ON STANDBY',
    medical_units_deployed: 8,
    medical_units_total: 10,
    medical_units_en_route: '2 UNITS EN ROUTE',
    incident_severity: 88,
    incident_severity_label: 'EXTREME RISK',
  },
  system_status: {
    integrity: '99.98%',
    satellite_downlink: 'GOES-16 ACTIVE',
    radar_sync: '24 SEC AGO',
    auth_officer: 'C. VANCE',
  },
};

export const FALLBACK_ZONES: FallbackZoneRecord[] = [
  {
    id: 'zone-f03',
    code: 'F-03',
    name: 'Delta Basin',
    sector: 'Lower Leh Confluence / Waterfront',
    coordinates: { lat: 33.5930, lng: 73.0450 },
    bounds: [
      [33.5980, 73.0400],
      [33.5980, 73.0500],
      [33.5880, 73.0510],
      [33.5870, 73.0390],
    ],
    population: 12500,
    affected_population: 8420,
    current_risk_score: 92,
    status: 'critical',
    severity_label: 'CATASTROPHIC',
    accessibility_label: 'VERY DIFFICULT',
    medical_need_label: 'CRITICAL',
    teams_required_label: '4 Teams / 2 Boats',
    factors: {
      populationExposure: 95,
      disasterSeverity: 92,
      medicalNeed: 90,
      accessibility: 90,
      infrastructureDamage: 90,
    },
    factorContext: {
      populationExposure: '8,420 of 12,500 Residents Inundated',
      disasterSeverity: 'Water Rise +4.2 ft/hr, River Embankment Breach',
      medicalNeed: 'Elderly Care Home + Clinic Isolated',
      accessibility: '3 Bridges Submerged, Air/Boat Only',
      infrastructureDamage: 'Substation Offline, Zero Telecom',
    },
    triageWindow: '< 45 MIN BEFORE LEVEE CREST',
    aiRationale:
      'High population exposure combined with rapid flood accumulation (+4.2 ft/hr) and acute medical vulnerability makes Zone F-03 the urgent #1 priority. Conventional ground access is fully severed on Bridge 12; air/boat rescue deployment is required immediately.',
    ragCitation: 'NDMA Flood Evac SOP §4.2 & WHO Surge Medical Guidelines',
    hazards: ['Embankment Breach Inbound', 'Power Substation 4 Flooded', 'Rapid Water Rise +4.2 ft/hr'],
    recommendedUnits: ['4 Swiftwater Teams', '2 Heavy Airboats', '2 ALS Ambulances', '1 Mobile Clinic'],
    allocations: [
      { category: 'SWIFT WATER TEAMS', count: '4 TEAMS (102, 105, 109, 114)', status: 'Assigned & Staged' },
      { category: 'EVACUATION CRAFT', count: '2 HEAVY AIRBOATS', status: 'Flotilla Delta Ready' },
      { category: 'CRITICAL AMBULANCES', count: '2 ADVANCED LIFE SUPPORT', status: 'Staging Area Alpha' },
      { category: 'FIELD MEDICAL', count: '1 MOBILE CLINIC POST', status: 'Positioning East Ridge' },
    ],
    summary:
      'Catastrophic inundation at the Leh-Soan river confluence. 3 access bridges submerged; urgent 45-minute window before peak crest.',
  },
  {
    id: 'zone-b02',
    code: 'B-02',
    name: 'River Bend',
    sector: 'Soan River Meander / Industrial Corridor',
    coordinates: { lat: 33.5780, lng: 73.0620 },
    bounds: [
      [33.5830, 73.0560],
      [33.5840, 73.0680],
      [33.5720, 73.0690],
      [33.5710, 73.0550],
    ],
    population: 9800,
    affected_population: 5760,
    current_risk_score: 84,
    status: 'critical',
    severity_label: 'SEVERE',
    accessibility_label: 'DIFFICULT',
    medical_need_label: 'HIGH',
    teams_required_label: '2 Teams',
    factors: {
      populationExposure: 85,
      disasterSeverity: 88,
      medicalNeed: 85,
      accessibility: 80,
      infrastructureDamage: 75,
    },
    factorContext: {
      populationExposure: '5,760 of 9,800 Workers & Residents Endangered',
      disasterSeverity: 'River Embankment Overflow & Rupture',
      medicalNeed: 'Chemical Inhalation Risk / Trauma',
      accessibility: 'Roads Impassable, Watercraft Route Open',
      infrastructureDamage: 'Rail Depot & Power Feeder Down',
    },
    triageWindow: '< 90 MIN BEFORE TOXIC LEAK SPILL',
    aiRationale:
      'Critical river bend zone with high exposure to secondary industrial runoff and severe water accumulation. Secondary priority behind Delta Basin.',
    ragCitation: 'EPA HAZMAT-EOC Guide §3.1 & USAR Urban Water Protocol',
    hazards: ['Industrial Runoff', 'Canal Embankment Slump', 'Power Grid Blackout'],
    recommendedUnits: ['2 Hazmat Rescue Teams', '1 Decon Squad', '2 Transport Ambulances'],
    allocations: [
      { category: 'SWIFT WATER TEAMS', count: '2 TEAMS (106, 110)', status: 'En Route' },
      { category: 'EVACUATION CRAFT', count: '1 HIGH-DRAFT ZODIAC', status: 'Staged Base 2' },
      { category: 'CRITICAL AMBULANCES', count: '2 BASIC LIFE SUPPORT', status: 'Staging Area Beta' },
      { category: 'FIELD MEDICAL', count: '1 DECON TENT', status: 'Standby Perimeter' },
    ],
    summary:
      'Severe river embankment overflow threatening industrial workers and adjacent residents. Watercraft access required.',
  },
  {
    id: 'zone-c05',
    code: 'C-05',
    name: 'East Heights',
    sector: 'Eastern Ridge / Midtown Heights',
    coordinates: { lat: 33.6120, lng: 73.0750 },
    bounds: [
      [33.6180, 73.0680],
      [33.6190, 73.0820],
      [33.6060, 73.0830],
      [33.6050, 73.0670],
    ],
    population: 18500,
    affected_population: 11780,
    current_risk_score: 73,
    status: 'high',
    severity_label: 'SEVERE',
    accessibility_label: 'LIMITED',
    medical_need_label: 'HIGH',
    teams_required_label: '2 Teams',
    factors: {
      populationExposure: 70,
      disasterSeverity: 76,
      medicalNeed: 75,
      accessibility: 70,
      infrastructureDamage: 75,
    },
    factorContext: {
      populationExposure: '11,780 of 18,500 Urban Residents Trapped on Lower Floors',
      disasterSeverity: 'Flash Flooding on Low Intersections',
      medicalNeed: 'Ambulatory Patients / Minor Trauma',
      accessibility: 'Arterial Road North Clear for Trucks',
      infrastructureDamage: 'Cellular Tower Intermittent',
    },
    triageWindow: '< 3 HOURS BEFORE NIGHTFALL',
    aiRationale:
      'Large population density with elevated risk, but road access remains partially clear allowing vehicle evacuation.',
    ragCitation: 'NDMA Urban Evacuation Blueprint §6 & Civil Defence Protocol',
    hazards: ['Street Level Flash Surge', 'Downed Trees', 'Traffic Chokepoint'],
    recommendedUnits: ['2 Evacuation Teams', '4 Bus Transports'],
    allocations: [
      { category: 'SWIFT WATER TEAMS', count: '1 RESCUE UNIT', status: 'Staged Midtown' },
      { category: 'EVACUATION CRAFT', count: 'NONE REQUIRED (ROAD ACCESSIBLE)', status: 'N/A' },
      { category: 'CRITICAL AMBULANCES', count: '1 ALS UNIT', status: 'En Route' },
      { category: 'FIELD MEDICAL', count: '1 AMBULATORY BUS', status: 'Active Evac' },
    ],
    summary:
      'Dense urban sector with flash flooded basements and intersections, but major northern egress remains passable.',
  },
  {
    id: 'zone-a01',
    code: 'A-01',
    name: 'North Sector',
    sector: 'Northern Residential Enclave',
    coordinates: { lat: 33.6300, lng: 73.0400 },
    bounds: [
      [33.6360, 73.0340],
      [33.6370, 73.0460],
      [33.6230, 73.0470],
      [33.6220, 73.0330],
    ],
    population: 14200,
    affected_population: 9150,
    current_risk_score: 61,
    status: 'high',
    severity_label: 'MODERATE',
    accessibility_label: 'OPEN',
    medical_need_label: 'MODERATE',
    teams_required_label: '1 Team',
    factors: {
      populationExposure: 60,
      disasterSeverity: 64,
      medicalNeed: 65,
      accessibility: 50,
      infrastructureDamage: 65,
    },
    factorContext: {
      populationExposure: '9,150 of 14,200 Suburban Residents Impacted',
      disasterSeverity: 'Localized Retention Pond Overflow',
      medicalNeed: 'Elderly Welfare Checks Required',
      accessibility: 'South Corridor Clear to Expressway',
      infrastructureDamage: 'Municipal Water Boil Notice',
    },
    triageWindow: '< 6 HOURS STABILIZATION WINDOW',
    aiRationale:
      'Moderate water accumulation and intact southern highways allow phased self-evacuation with light SAR oversight.',
    ragCitation: 'NFPA 1600 Disaster Management & Relief Guide',
    hazards: ['Local Pond Surge', 'Power Outage Pockets'],
    recommendedUnits: ['1 Community Patrol Team', 'Welfare Check Squad'],
    allocations: [
      { category: 'SWIFT WATER TEAMS', count: '1 PATROL SQUAD', status: 'Patrolling' },
      { category: 'EVACUATION CRAFT', count: 'NONE', status: 'Standby' },
      { category: 'CRITICAL AMBULANCES', count: '1 BLS UNIT', status: 'On Call' },
      { category: 'FIELD MEDICAL', count: 'MOBILE WATER STATION', status: 'Deployed South Gate' },
    ],
    summary:
      'Residential enclave with localized street flooding. Southern evacuation highway remains completely open.',
  },
  {
    id: 'zone-d04',
    code: 'D-04',
    name: 'West Evac',
    sector: 'Western High-Ground Plateau',
    coordinates: { lat: 33.5650, lng: 73.0150 },
    bounds: [
      [33.5720, 73.0080],
      [33.5730, 73.0220],
      [33.5580, 73.0230],
      [33.5570, 73.0070],
    ],
    population: 6500,
    affected_population: 4120,
    current_risk_score: 34,
    status: 'low',
    severity_label: 'MODERATE',
    accessibility_label: 'OPEN',
    medical_need_label: 'LOW',
    teams_required_label: 'Staging HQ',
    factors: {
      populationExposure: 35,
      disasterSeverity: 36,
      medicalNeed: 35,
      accessibility: 30,
      infrastructureDamage: 30,
    },
    factorContext: {
      populationExposure: '4,120 Evacuees Processed of 6,500 Base Capacity',
      disasterSeverity: 'High-Ground Shelter / Dry Ground',
      medicalNeed: 'Field Hospital Operating at 60% Capacity',
      accessibility: 'All Main Arteries 100% Passable',
      infrastructureDamage: 'Full Generator Power & Starlink Up',
    },
    triageWindow: 'SAFE EVACUATION ZONE // 24H SECURE',
    aiRationale:
      'Elevated ridge sector well above water accumulation levels. Safe haven designated for incoming survivor processing and medical stabilization.',
    ragCitation: 'NDMA EOC Incident Management Staging Protocol',
    hazards: ['Crowd Congestion', 'Supply Logistics Strain'],
    recommendedUnits: ['EOC Command Group', 'Logistics Distribution Team'],
    allocations: [
      { category: 'SWIFT WATER TEAMS', count: 'STAGING BASE HQ', status: 'Command Post Active' },
      { category: 'EVACUATION CRAFT', count: 'FLOTILLA RECOVERY SLIP', status: 'Operational' },
      { category: 'CRITICAL AMBULANCES', count: '4 STAGED ALS UNITS', status: 'Staged Reserve' },
      { category: 'FIELD MEDICAL', count: '2 50-BED MEDICAL TENTS', status: 'Fully Operational' },
    ],
    summary:
      'Designated safe evacuation haven on elevated terrain. Staging HQ with full electrical power and hospital units.',
  },
];

export function getFallbackZonesWithRisk(): (FallbackZoneRecord & {
  riskResult: DeterministicRiskResult;
  priorityRank: number;
})[] {
  return FALLBACK_ZONES.map((zone, index) => {
    const riskResult = calculateDeterministicRisk(zone.factors, zone.factorContext);
    return {
      ...zone,
      current_risk_score: riskResult.compositeScore,
      riskResult,
      priorityRank: index + 1,
    };
  });
}

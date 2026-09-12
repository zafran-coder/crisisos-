'use client';

import React from 'react';
import { Users, AlertTriangle, ShieldAlert, Navigation, HeartPulse, Flame } from 'lucide-react';
import { EnrichedZoneRecord } from '@/lib/data-access/zones';

export interface KPICardsProps {
  zones: EnrichedZoneRecord[];
  rescueTeams?: { deployed: number; total: number; standbyLabel: string };
  medicalUnits?: { deployed: number; total: number; enRouteLabel: string };
  severityScore?: number;
}

export function KPICards({
  zones,
  rescueTeams = { deployed: 12, total: 18, standbyLabel: '4 TEAMS ON STANDBY' },
  medicalUnits = { deployed: 8, total: 10, enRouteLabel: '2 UNITS EN ROUTE' },
  severityScore = 88,
}: KPICardsProps) {
  // Dynamically calculate metrics from zones
  const totalAffected = zones.reduce((acc, z) => acc + z.population, 0);
  const criticalZonesList = zones.filter((z) => z.current_risk_score >= 80);
  const criticalCount = criticalZonesList.length;
  const criticalCodesLabel =
    criticalZonesList.length > 0
      ? `ZONES: ${criticalZonesList.map((z) => z.code).join(' & ')}`
      : 'NONE DETECTED';
  const highRiskPopulation = criticalZonesList.reduce((acc, z) => acc + z.population, 0);

  const cards = [
    {
      id: 'total-affected',
      title: 'TOTAL AFFECTED',
      value: totalAffected.toLocaleString(),
      subtext: '+3,200 LAST 2H',
      subtextColor: 'text-cyan-400',
      icon: Users,
      iconColor: 'text-cyan-400',
      borderColor: 'border-slate-800',
    },
    {
      id: 'critical-zones',
      title: 'CRITICAL ZONES',
      value: `${criticalCount} OF ${zones.length}`,
      subtext: criticalCodesLabel,
      subtextColor: 'text-red-400',
      icon: AlertTriangle,
      iconColor: 'text-red-400',
      borderColor: 'border-red-900/40',
      badge: 'URGENT',
    },
    {
      id: 'high-risk-pop',
      title: 'HIGH-RISK POP.',
      value: highRiskPopulation.toLocaleString(),
      subtext: 'IMMEDIATE TRIAGE',
      subtextColor: 'text-amber-400',
      icon: ShieldAlert,
      iconColor: 'text-amber-400',
      borderColor: 'border-amber-900/40',
    },
    {
      id: 'rescue-teams',
      title: 'RESCUE TEAMS',
      value: `${rescueTeams.deployed} / ${rescueTeams.total}`,
      subtext: rescueTeams.standbyLabel,
      subtextColor: 'text-slate-400',
      icon: Navigation,
      iconColor: 'text-blue-400',
      borderColor: 'border-slate-800',
    },
    {
      id: 'medical-units',
      title: 'MEDICAL UNITS',
      value: `${medicalUnits.deployed} / ${medicalUnits.total}`,
      subtext: medicalUnits.enRouteLabel,
      subtextColor: 'text-cyan-400',
      icon: HeartPulse,
      iconColor: 'text-cyan-400',
      borderColor: 'border-slate-800',
    },
    {
      id: 'incident-severity',
      title: 'INCIDENT SEVERITY',
      value: `${severityScore} / 100`,
      subtext: 'EXTREME RISK',
      subtextColor: 'text-red-400',
      icon: Flame,
      iconColor: 'text-red-500',
      borderColor: 'border-red-900/40',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 font-mono">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.id}
            className={`bg-[#0f172a]/70 border ${card.borderColor} rounded p-2.5 flex flex-col justify-between backdrop-blur-sm shadow-sm hover:border-slate-700 transition-colors`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                {card.title}
              </span>
              <Icon className={`h-3.5 w-3.5 ${card.iconColor}`} />
            </div>

            <div className="text-xl font-bold text-white tracking-tight my-0.5">
              {card.value}
            </div>

            <div className={`text-[10px] font-medium tracking-wide ${card.subtextColor} truncate`}>
              {card.subtext}
            </div>
          </div>
        );
      })}
    </div>
  );
}

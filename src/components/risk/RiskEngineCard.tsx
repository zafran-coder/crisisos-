'use client';

import React from 'react';
import { Crosshair, Clock } from 'lucide-react';
import { EnrichedZoneRecord } from '@/lib/data-access/zones';

export interface RiskEngineCardProps {
  zone: EnrichedZoneRecord;
}

export function RiskEngineCard({ zone }: RiskEngineCardProps) {
  const isTopRank = zone.priorityRank === 1;
  const isCritical = zone.current_risk_score >= 80;

  let rankBadge = `RANK #${zone.priorityRank}`;
  let rankBadgeStyle = 'bg-slate-800 text-slate-300 border-slate-700';

  if (isTopRank) {
    rankBadge = 'RANK #1 CRITICAL';
    rankBadgeStyle = 'bg-red-950/80 text-red-400 border-red-500 animate-pulse';
  } else if (isCritical) {
    rankBadge = `RANK #${zone.priorityRank} CRITICAL`;
    rankBadgeStyle = 'bg-red-950/80 text-red-400 border-red-600';
  } else if (zone.current_risk_score >= 60) {
    rankBadge = `RANK #${zone.priorityRank} HIGH`;
    rankBadgeStyle = 'bg-amber-950/80 text-amber-400 border-amber-600';
  }

  return (
    <div className="rounded border border-slate-800 bg-[#0f172a]/80 p-3 font-mono shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2.5">
        <div className="flex items-center gap-2">
          <Crosshair className="h-4 w-4 text-cyan-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">
            AI REAL-TIME TRIAGE RANKING
          </h3>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${rankBadgeStyle}`}>
          {rankBadge}
        </span>
      </div>

      {/* Immediate Rescue Target & Composite Score */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            IMMEDIATE RESCUE TARGET
          </div>
          <div className="text-base font-bold text-white tracking-wide mt-0.5">
            {`ZONE ${zone.code} // ${zone.name.toUpperCase()}`}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-amber-400 font-medium mt-1">
            <Clock className="h-3.5 w-3.5 text-amber-400" />
            <span>TRIAGE WINDOW: {zone.triageWindow || '< 45 MIN BEFORE LEVEE CREST'}</span>
          </div>
        </div>

        {/* Score Stamp Box */}
        <div className="flex flex-col items-center justify-center p-2 rounded border border-red-800/80 bg-red-950/40 text-center min-w-[72px]">
          <span className="text-[9px] text-slate-400 uppercase font-bold">COMPOSITE RISK</span>
          <span className="text-2xl font-black text-red-400 tracking-tight leading-none mt-0.5">
            {zone.current_risk_score}
          </span>
          <span className="text-[9px] text-slate-400">/ 100</span>
        </div>
      </div>
    </div>
  );
}

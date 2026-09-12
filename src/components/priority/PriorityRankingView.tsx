'use client';

import React from 'react';
import { BarChart3, Clock, ArrowRight, Truck } from 'lucide-react';
import { EnrichedZoneRecord } from '@/lib/data-access/zones';

export interface PriorityRankingViewProps {
  zones: EnrichedZoneRecord[];
  onSelectZone: (code: string) => void;
  onExecuteDispatch?: (zoneCode: string) => void;
  onViewResponsePlan?: () => void;
}

export function PriorityRankingView({
  zones,
  onSelectZone,
  onExecuteDispatch,
  onViewResponsePlan,
}: PriorityRankingViewProps) {
  const sortedZones = [...zones].sort((a, b) => a.priorityRank - b.priorityRank);

  return (
    <div className="space-y-4 font-mono">
      {/* Top Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
            <BarChart3 className="h-4 w-4" />
            <span>AUTHORITATIVE COMMAND TRIAGE // CANONICAL PRIORITY SEQUENCE</span>
          </div>
          <h1 className="text-xl font-bold text-white mt-1">
            Tactical Zone Priority Rankings
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Strict algorithmic ordering dictating operational sequence for life-saving search and rescue deployments.
          </p>
        </div>

        {onViewResponsePlan && (
          <button
            onClick={onViewResponsePlan}
            className="px-3.5 py-2 rounded text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-slate-950 border border-cyan-400 flex items-center gap-1.5 transition-colors self-start md:self-auto"
          >
            <span>Generate Full AI Response Plan</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Priority Sequence Stack */}
      <div className="space-y-3">
        {sortedZones.map((zone) => {
          const isTop = zone.priorityRank === 1;
          const isCritical = zone.current_risk_score >= 80;

          return (
            <div
              key={zone.code}
              onClick={() => onSelectZone(zone.code)}
              className={`border rounded-lg p-4 transition-all cursor-pointer ${
                isTop
                  ? 'bg-red-950/30 border-red-500 shadow-lg shadow-red-950/20'
                  : isCritical
                  ? 'bg-slate-900/80 border-red-900/50'
                  : 'bg-slate-950/70 border-slate-800'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                {/* Left: Rank & Sector Identifiers */}
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg font-bold text-sm border flex-shrink-0 ${
                      isTop
                        ? 'bg-red-600 text-white border-red-400 shadow-md shadow-red-600/30 animate-pulse'
                        : isCritical
                        ? 'bg-red-950 text-red-300 border-red-800'
                        : 'bg-slate-900 text-slate-300 border-slate-800'
                    }`}
                  >
                    #{zone.priorityRank}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white">
                        Sector {zone.code} &mdash; {zone.name}
                      </h3>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          isTop
                            ? 'bg-red-900/80 text-red-200 border-red-500'
                            : isCritical
                            ? 'bg-red-950 text-red-400 border-red-800'
                            : 'bg-slate-900 text-slate-400 border-slate-700'
                        }`}
                      >
                        {zone.severity_label || zone.severity || 'ACTIVE SECTOR'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {zone.sector} &bull; Coordinates: {zone.coordinates.lat}&deg; N, {zone.coordinates.lng}&deg; E
                    </p>
                  </div>
                </div>

                {/* Center: Metrics Badges */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="bg-slate-950/80 border border-slate-800 px-3 py-1.5 rounded">
                    <span className="text-[10px] text-slate-500 block uppercase">Composite Risk</span>
                    <span className="text-sm font-bold text-red-400">{zone.current_risk_score} / 100</span>
                  </div>

                  <div className="bg-slate-950/80 border border-slate-800 px-3 py-1.5 rounded">
                    <span className="text-[10px] text-slate-500 block uppercase">Inundated</span>
                    <span className="text-xs font-bold text-white">
                      {(zone.affected_population || zone.population).toLocaleString()}
                    </span>
                  </div>

                  <div className="bg-slate-950/80 border border-slate-800 px-3 py-1.5 rounded">
                    <span className="text-[10px] text-slate-500 block uppercase">Triage Window</span>
                    <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {zone.triageWindow || '< 2H'}
                    </span>
                  </div>

                  {onExecuteDispatch && (
                    <button
                      onClick={() => onExecuteDispatch(zone.code)}
                      className="px-3 py-2 rounded text-xs font-bold bg-red-600 hover:bg-red-500 text-white flex items-center gap-1.5 transition-colors"
                    >
                      <Truck className="h-3.5 w-3.5" />
                      <span>Dispatch</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Rationale & Actions */}
              <div className="mt-3 pt-3 border-t border-slate-800/80 text-xs space-y-1.5">
                <p className="text-slate-300">
                  <strong className="text-white">Command Justification:</strong> {zone.aiRationale}
                </p>
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-cyan-300">
                  <span className="text-slate-500">Required Asset Capability:</span>
                  <span className="bg-cyan-950/60 border border-cyan-900 px-2 py-0.5 rounded">
                    {zone.teams_required_label || 'Tactical Search & Extraction Teams'}
                  </span>
                  <span className="text-slate-500">&bull; Ground Access:</span>
                  <span className="text-amber-400 font-bold">
                    {zone.accessibility || zone.accessibility_label || 'RESTRICTED'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { Table } from 'lucide-react';
import { EnrichedZoneRecord } from '@/lib/data-access/zones';

export interface ZoneTelemetryTableProps {
  zones: EnrichedZoneRecord[];
  selectedZoneCode: string;
  onSelectZone: (code: string) => void;
}

export function ZoneTelemetryTable({
  zones,
  selectedZoneCode,
  onSelectZone,
}: ZoneTelemetryTableProps) {
  const [filterTab, setFilterTab] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'MED' | 'LOW'>('ALL');

  // Count zones by level
  const criticalCount = zones.filter((z) => z.current_risk_score >= 80).length;
  const highCount = zones.filter((z) => z.current_risk_score >= 65 && z.current_risk_score < 80).length;
  const medCount = zones.filter((z) => z.current_risk_score >= 45 && z.current_risk_score < 65).length;
  const lowCount = zones.filter((z) => z.current_risk_score < 45).length;

  const filteredZones = zones.filter((zone) => {
    if (filterTab === 'CRITICAL') return zone.current_risk_score >= 80;
    if (filterTab === 'HIGH') return zone.current_risk_score >= 65 && zone.current_risk_score < 80;
    if (filterTab === 'MED') return zone.current_risk_score >= 45 && zone.current_risk_score < 65;
    if (filterTab === 'LOW') return zone.current_risk_score < 45;
    return true;
  });

  return (
    <div className="space-y-2 font-mono">
      {/* Header and Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Table className="h-4 w-4 text-cyan-400" />
          <h2 className="text-xs font-bold tracking-wider uppercase text-white">
            AFFECTED ZONES TELEMETRY MATRIX
          </h2>
        </div>

        {/* Filter Tabs matching Stitch design */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setFilterTab('ALL')}
            className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
              filterTab === 'ALL'
                ? 'bg-slate-800 text-white border-slate-600'
                : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            ALL ({zones.length})
          </button>
          <button
            onClick={() => setFilterTab('CRITICAL')}
            className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
              filterTab === 'CRITICAL'
                ? 'bg-red-950/80 text-red-300 border-red-500'
                : 'bg-slate-950/60 text-red-400/70 border-slate-800 hover:text-red-300'
            }`}
          >
            CRITICAL ({criticalCount})
          </button>
          <button
            onClick={() => setFilterTab('HIGH')}
            className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
              filterTab === 'HIGH'
                ? 'bg-orange-950/80 text-orange-300 border-orange-500'
                : 'bg-slate-950/60 text-orange-400/70 border-slate-800 hover:text-orange-300'
            }`}
          >
            HIGH ({highCount})
          </button>
          <button
            onClick={() => setFilterTab('MED')}
            className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
              filterTab === 'MED'
                ? 'bg-amber-950/80 text-amber-300 border-amber-500'
                : 'bg-slate-950/60 text-amber-400/70 border-slate-800 hover:text-amber-300'
            }`}
          >
            MED ({medCount})
          </button>
          <button
            onClick={() => setFilterTab('LOW')}
            className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
              filterTab === 'LOW'
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500'
                : 'bg-slate-950/60 text-emerald-400/70 border-slate-800 hover:text-emerald-300'
            }`}
          >
            LOW ({lowCount})
          </button>
        </div>
      </div>

      {/* Telemetry Table */}
      <div className="rounded border border-slate-800 bg-[#0f172a]/70 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#090d14] text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3 font-bold">ZONE ID</th>
                <th className="py-2.5 px-2 font-bold text-center">RISK</th>
                <th className="py-2.5 px-3 font-bold">POPULATION</th>
                <th className="py-2.5 px-3 font-bold">SEVERITY</th>
                <th className="py-2.5 px-3 font-bold">ACCESSIBILITY</th>
                <th className="py-2.5 px-3 font-bold">MED NEED</th>
                <th className="py-2.5 px-3 font-bold">TEAMS REQ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredZones.map((zone) => {
                const isSelected = zone.code === selectedZoneCode;
                const score = zone.current_risk_score;

                let badgeStyle = 'bg-emerald-950/60 text-emerald-400 border-emerald-800';
                if (score >= 80) {
                  badgeStyle = 'bg-red-950/80 text-red-400 border-red-700 font-bold';
                } else if (score >= 65) {
                  badgeStyle = 'bg-orange-950/80 text-orange-400 border-orange-700 font-bold';
                } else if (score >= 50) {
                  badgeStyle = 'bg-amber-950/80 text-amber-400 border-amber-700';
                }

                let severityStyle = 'text-slate-300';
                if (zone.severity_label === 'CATASTROPHIC') severityStyle = 'text-red-400 font-bold';
                if (zone.severity_label === 'SEVERE') severityStyle = 'text-orange-400 font-bold';
                if (zone.severity_label === 'ELEVATED') severityStyle = 'text-amber-400';

                return (
                  <tr
                    key={zone.code}
                    onClick={() => onSelectZone(zone.code)}
                    className={`cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-cyan-950/40 text-white border-l-2 border-cyan-400'
                        : 'hover:bg-slate-800/40 text-slate-300'
                    }`}
                  >
                    <td className="py-2.5 px-3 font-bold whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className={isSelected ? 'text-cyan-400' : 'text-white'}>
                          {zone.code}
                        </span>
                        <span className="text-slate-400 text-[11px] font-normal">
                          [{zone.name}]
                        </span>
                      </div>
                    </td>

                    <td className="py-2.5 px-2 text-center whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-xs border ${badgeStyle}`}>
                        {score}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 whitespace-nowrap font-medium">
                      {zone.population.toLocaleString()}
                    </td>

                    <td className={`py-2.5 px-3 whitespace-nowrap text-[11px] ${severityStyle}`}>
                      {zone.severity_label || 'MODERATE'}
                    </td>

                    <td className="py-2.5 px-3 whitespace-nowrap text-[11px] text-slate-300">
                      {zone.accessibility_label || 'Open'}
                    </td>

                    <td className="py-2.5 px-3 whitespace-nowrap text-[11px]">
                      <span
                        className={
                          zone.medical_need_label === 'IMMEDIATE'
                            ? 'text-red-400 font-bold'
                            : zone.medical_need_label === 'High'
                            ? 'text-amber-400'
                            : 'text-slate-300'
                        }
                      >
                        {zone.medical_need_label || 'Normal'}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 whitespace-nowrap text-[11px] text-slate-400">
                      {zone.teams_required_label || '1 Team'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import {
  Layers,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Ship,
  Truck,
  HeartHandshake,
  Activity,
  LifeBuoy,
  Database,
  Sparkles,
  Calculator,
  Download,
} from 'lucide-react';
import {
  ResourceMatrixPayload,
  AllocationsApiResponse,
  ResourceType,
} from '@/types/allocations';
import { EnrichedZoneRecord } from '@/lib/data-access/zones';

interface ResourceMatrixViewProps {
  zones?: EnrichedZoneRecord[];
  incidentName?: string;
}

export function ResourceMatrixView({ incidentName = 'Pakistan Flood Emergency - 2026' }: ResourceMatrixViewProps) {
  const [data, setData] = useState<ResourceMatrixPayload | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  // Load existing allocations on mount
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const res = await fetch('/api/allocations');
        if (res.ok) {
          const json: AllocationsApiResponse = await res.json();
          if (json.status === 'ok' && json.data) {
            setData(json.data);
            setLastUpdated(new Date().toLocaleTimeString());
          }
        }
      } catch {
        // Safe initial load fallback
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const handleRecalculate = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/allocations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const json: AllocationsApiResponse = await res.json();
      if (!res.ok || json.status === 'error') {
        setError(json.message || 'Failed to calculate and persist resource allocations.');
        return;
      }

      if (json.data) {
        setData(json.data);
        setLastUpdated(new Date().toLocaleTimeString());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error recalculating allocations.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DEPLOYED':
        return 'bg-emerald-950/70 border-emerald-700 text-emerald-400';
      case 'EN_ROUTE':
        return 'bg-cyan-950/70 border-cyan-700 text-cyan-400';
      default:
        return 'bg-amber-950/70 border-amber-700 text-amber-400';
    }
  };

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-red-500/20 text-red-400 border-red-500/50';
      case 2:
        return 'bg-orange-500/20 text-orange-400 border-orange-500/50';
      case 3:
        return 'bg-amber-500/20 text-amber-400 border-amber-500/50';
      case 4:
        return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50';
      default:
        return 'bg-slate-700/30 text-slate-300 border-slate-700';
    }
  };

  const getResourceIcon = (type: ResourceType) => {
    switch (type) {
      case 'RESCUE_TEAMS':
        return Activity;
      case 'RESCUE_BOATS':
        return Ship;
      case 'AMBULANCES':
        return Truck;
      case 'MEDICAL_UNITS':
        return HeartHandshake;
      case 'WATER_UNITS':
        return LifeBuoy;
    }
  };

  const handleExportCSV = () => {
    if (!data) return;
    const headers = 'Zone Code,Zone Name,Priority Rank,Risk Score,Status,Rescue Teams,Rescue Boats,Medical Units,Ambulances,Water Units,Total Allocated,Rationale\n';
    const rows = data.zone_allocations
      .map(
        (za) =>
          `"${za.zone_code}","${za.zone_name}",${za.priority_rank},${za.risk_score},"${za.status}",${za.rescue_teams},${za.boats},${za.medical_units},${za.ambulances},${za.water_units},${za.total_allocated},"${za.rationale.replace(/"/g, '""')}"`
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CrisisOS-Resource-Allocations-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 font-mono select-none">
      {/* 1. Header Bar & Controls */}
      <div className="rounded border border-slate-800 bg-[#0f172a]/90 p-4 shadow-md backdrop-blur">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                <Layers className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-white flex flex-wrap items-center gap-2">
                  <span>TACTICAL RESOURCE ALLOCATION MATRIX</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950/80 border border-amber-700 text-amber-300">
                    SIMULATED DEMO INVENTORY
                  </span>
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Deterministic quota allocation calculated from Supabase risk scores &bull; Explanations synthesized by Gemini 3.6 Flash.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleRecalculate}
              disabled={isLoading}
              className="py-2 px-4 bg-cyan-400 hover:bg-cyan-300 disabled:bg-cyan-800 text-slate-950 font-bold text-xs rounded uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-cyan-400/20 transition-all cursor-pointer disabled:cursor-not-allowed"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'CALCULATING ALLOCATIONS...' : 'RECALCULATE ALLOCATIONS'}
            </button>

            {data && (
              <button
                onClick={handleExportCSV}
                className="py-2 px-3 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all"
                title="Export allocation spreadsheet"
              >
                <Download className="h-3.5 w-3.5 text-cyan-400" />
                <span>CSV</span>
              </button>
            )}
          </div>
        </div>

        {/* Data Provenance Badges Sub-bar */}
        <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-700 text-cyan-300 text-[10px] font-bold">
              <Database className="h-3 w-3" />
              <span>SUPABASE DATA</span>
            </span>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-700 text-emerald-300 text-[10px] font-bold">
              <Calculator className="h-3 w-3" />
              <span>DETERMINISTIC ALLOCATION</span>
            </span>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-purple-950/60 border border-purple-700 text-purple-300 text-[10px] font-bold">
              <Sparkles className="h-3 w-3" />
              <span>AI EXPLANATION</span>
            </span>
          </div>

          <div className="flex items-center gap-3 text-[10px]">
            <span>INCIDENT: <strong className="text-white">{incidentName}</strong></span>
            {lastUpdated && <span className="text-slate-500">SYNCED: {lastUpdated}</span>}
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="rounded border border-red-800 bg-red-950/60 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-xs font-bold text-red-200 uppercase tracking-wider">
                ALLOCATION ERROR
              </h3>
              <p className="text-xs text-red-300 mt-0.5">{error}</p>
            </div>
          </div>
          <button
            onClick={handleRecalculate}
            disabled={isLoading}
            className="px-3 py-1.5 rounded bg-red-900/80 hover:bg-red-800 text-red-200 border border-red-700 text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5 flex-shrink-0 cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>RETRY ALLOCATION</span>
          </button>
        </div>
      )}

      {/* 2. Inventory Summary Cards (Available vs Allocated) */}
      {data && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {data.inventory.map((item) => {
            const Icon = getResourceIcon(item.resource_type);
            const percentAllocated = Math.round(
              (item.total_allocated / Math.max(1, item.total_available)) * 100
            );
            const isFull = percentAllocated >= 100;

            return (
              <div
                key={item.resource_type}
                className="rounded border border-slate-800 bg-[#090d14] p-3 flex flex-col justify-between space-y-2 shadow-sm"
              >
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold">
                  <span className="truncate max-w-[120px]">{item.display_name.split('&')[0]}</span>
                  <Icon className="h-3.5 w-3.5 text-cyan-400 flex-shrink-0" />
                </div>

                <div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-lg font-bold text-white tracking-tight">
                      {item.total_allocated}
                    </span>
                    <span className="text-xs text-slate-400">/ {item.total_available} TOTAL</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden mt-1.5 border border-slate-800">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isFull ? 'bg-amber-400' : 'bg-cyan-400'
                      }`}
                      style={{ width: `${Math.min(100, percentAllocated)}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-800/80">
                  <span className={isFull ? 'text-amber-400 font-bold' : 'text-emerald-400'}>
                    {percentAllocated}% COMMITTED
                  </span>
                  <span className="text-[9px] text-slate-500 uppercase">{item.status}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 3. Gemini Strategic Rationale Box */}
      {data && (
        <div className="rounded border border-slate-800 bg-[#0f172a]/90 p-4 space-y-2 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                AI STRATEGIC ALLOCATION RATIONALE
              </h3>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-950/70 border border-purple-800 text-purple-300">
              GROUNDED IN SUPABASE RISK SCORES
            </span>
          </div>
          <p className="text-xs text-slate-200 leading-relaxed font-sans">{data.strategic_explanation}</p>
        </div>
      )}

      {/* 4. Functional Resource Matrix Table (Resource | Available | Allocated | Zone | Priority | Status) */}
      {data && (
        <div className="rounded border border-slate-800 bg-[#090d14] overflow-hidden shadow-md">
          <div className="p-3 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="h-3.5 w-3.5 text-cyan-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                TACTICAL RESOURCE MATRIX // RESOURCE &bull; AVAILABLE &bull; ALLOCATED &bull; ZONE &bull; PRIORITY &bull; STATUS
              </h3>
            </div>
            <span className="text-[10px] text-slate-400 font-bold">
              CAPACITY QUOTA: <strong className="text-cyan-400">{data.total_allocated}</strong> / {data.total_inventory} ALLOCATED
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/60 text-[10px] text-slate-400 uppercase tracking-wider">
                  <th className="p-3">RESOURCE</th>
                  <th className="p-3 text-center">AVAILABLE</th>
                  <th className="p-3 text-center">ALLOCATED</th>
                  <th className="p-3">ZONE</th>
                  <th className="p-3">PRIORITY</th>
                  <th className="p-3">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {data.inventory.map((item) => {
                  const Icon = getResourceIcon(item.resource_type);
                  const matchingZones = data.zone_allocations
                    .map((z) => {
                      let qty = 0;
                      if (item.resource_type === 'RESCUE_TEAMS') qty = z.rescue_teams;
                      else if (item.resource_type === 'RESCUE_BOATS') qty = z.boats;
                      else if (item.resource_type === 'MEDICAL_UNITS') qty = z.medical_units;
                      else if (item.resource_type === 'AMBULANCES') qty = z.ambulances;
                      else if (item.resource_type === 'WATER_UNITS') qty = z.water_units;
                      return { code: z.zone_code, rank: z.priority_rank, qty };
                    })
                    .filter((z) => z.qty > 0);

                  const firstAllocationZone = matchingZones[0];

                  return (
                    <tr key={item.resource_type} className="hover:bg-slate-900/40 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-2.5">
                          <Icon className="h-4 w-4 text-cyan-400 flex-shrink-0" />
                          <div>
                            <div className="font-bold text-white">{item.display_name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{item.resource_type}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-center font-bold text-slate-300">
                        {item.total_available}
                      </td>
                      <td className="p-3 text-center font-bold text-cyan-300">
                        {item.total_allocated}
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1.5 max-w-md">
                          {matchingZones.map((mz) => (
                            <span
                              key={mz.code}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono"
                            >
                              <strong className="text-white">{mz.code}</strong> ({mz.qty})
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-3">
                        {firstAllocationZone ? (
                          <span
                            className={`text-[11px] font-bold px-2 py-0.5 rounded border inline-block ${
                              firstAllocationZone.rank === 1
                                ? 'bg-red-950/60 border-red-700 text-red-300'
                                : 'bg-slate-800 border-slate-700 text-slate-300'
                            }`}
                          >
                            {firstAllocationZone.rank === 1
                              ? `${firstAllocationZone.code} — Priority #1 — receives first allocation`
                              : `Priority #${firstAllocationZone.rank} (${firstAllocationZone.code})`}
                          </span>
                        ) : (
                          <span className="text-slate-500">None</span>
                        )}
                      </td>
                      <td className="p-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                            item.total_allocated >= item.total_available
                              ? 'bg-amber-950/70 border-amber-700 text-amber-300'
                              : 'bg-emerald-950/70 border-emerald-700 text-emerald-300'
                          }`}
                        >
                          {item.total_allocated >= item.total_available
                            ? 'FULLY ALLOCATED'
                            : `${item.total_available - item.total_allocated} STANDBY`}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Main Zone Resource Allocation Matrix Table */}
      {data && (
        <div className="rounded border border-slate-800 bg-[#090d14] overflow-hidden shadow-md">
          <div className="p-3 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-3.5 w-3.5 text-cyan-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                ZONE ALLOCATION BREAKDOWN // DETERMINISTIC ORDER
              </h3>
            </div>
            <span className="text-[10px] text-slate-400 font-bold">
              TOTAL ASSETS DEPLOYED: <strong className="text-cyan-400">{data.total_allocated}</strong> / {data.total_inventory}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/60 text-[10px] text-slate-400 uppercase tracking-wider">
                  <th className="p-3">ZONE</th>
                  <th className="p-3">PRIORITY</th>
                  <th className="p-3">RISK SCORE</th>
                  <th className="p-3 text-center">RESCUE TEAMS</th>
                  <th className="p-3 text-center">BOATS</th>
                  <th className="p-3 text-center">MEDICAL</th>
                  <th className="p-3 text-center">AMBULANCES</th>
                  <th className="p-3 text-center">WATER</th>
                  <th className="p-3 text-center font-bold text-white">TOTAL</th>
                  <th className="p-3">STATUS</th>
                  <th className="p-3">CALCULATION RATIONALE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {data.zone_allocations.map((zone) => {
                  const rankBadge = getRankBadgeColor(zone.priority_rank);
                  const statusBadge = getStatusBadge(zone.status);

                  return (
                    <tr key={zone.zone_code} className="hover:bg-slate-900/40 transition-colors">
                      {/* Zone Name & Code */}
                      <td className="p-3">
                        <div className="font-bold text-white">{zone.zone_code}</div>
                        <div className="text-[10px] text-slate-400">{zone.zone_name}</div>
                      </td>

                      {/* Priority Rank */}
                      <td className="p-3">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded border ${rankBadge}`}>
                          #{zone.priority_rank}
                        </span>
                      </td>

                      {/* Deterministic Risk Score */}
                      <td className="p-3">
                        <div className="font-bold text-white">{zone.risk_score}/100</div>
                        <div className="text-[10px] text-slate-500 uppercase">{zone.medical_need} MED</div>
                      </td>

                      {/* Individual Quantities */}
                      <td className="p-3 text-center font-bold text-cyan-300">{zone.rescue_teams}</td>
                      <td className="p-3 text-center font-bold text-cyan-300">{zone.boats}</td>
                      <td className="p-3 text-center font-bold text-cyan-300">{zone.medical_units}</td>
                      <td className="p-3 text-center font-bold text-cyan-300">{zone.ambulances}</td>
                      <td className="p-3 text-center font-bold text-cyan-300">{zone.water_units}</td>

                      {/* Total Allocated */}
                      <td className="p-3 text-center">
                        <span className="font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded">
                          {zone.total_allocated}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="p-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${statusBadge}`}>
                          {zone.status}
                        </span>
                      </td>

                      {/* Rationale */}
                      <td className="p-3 max-w-xs text-[11px] text-slate-300 font-sans leading-relaxed">
                        {zone.rationale}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-3 border-t border-slate-800/80 bg-slate-950/60 flex flex-wrap items-center justify-between text-[10px] text-slate-500">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              <span>All allocations strictly clamped against available demo inventory. No over-allocation possible.</span>
            </div>
            <span>PERSISTED TO SUPABASE: <strong className="text-emerald-400">{data.persisted ? 'YES' : 'PENDING'}</strong></span>
          </div>
        </div>
      )}
    </div>
  );
}

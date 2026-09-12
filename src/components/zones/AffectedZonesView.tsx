'use client';

import React from 'react';
import { MapPin, Activity, Truck } from 'lucide-react';
import { EnrichedZoneRecord } from '@/lib/data-access/zones';
import { ZoneTelemetryTable } from './ZoneTelemetryTable';

export interface AffectedZonesViewProps {
  zones: EnrichedZoneRecord[];
  selectedZone: EnrichedZoneRecord;
  onSelectZone: (code: string) => void;
  onExecuteDispatch?: (zoneCode: string) => void;
  onViewRiskAnalysis?: () => void;
}

export function AffectedZonesView({
  zones,
  selectedZone,
  onSelectZone,
  onExecuteDispatch,
  onViewRiskAnalysis,
}: AffectedZonesViewProps) {
  const totalPopulation = zones.reduce((acc, z) => acc + (z.population || 0), 0);
  const totalAffected = zones.reduce((acc, z) => acc + (z.affected_population || Math.round((z.population || 0) * 0.7)), 0);
  const criticalCount = zones.filter((z) => z.current_risk_score >= 80).length;

  return (
    <div className="space-y-4 font-mono">
      {/* Top Banner: Affected Zones Command Overview */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
            <MapPin className="h-4 w-4" />
            <span>OPERATIONAL SECTORS // AFFECTED ZONES REGISTRY</span>
          </div>
          <h1 className="text-xl font-bold text-white mt-1">
            5 Active Inundation Sectors Monitored
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time geospatial telemetry synchronized with Supabase database records.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-950 border border-slate-800 px-3 py-2 rounded">
            <span className="text-[10px] text-slate-400 block uppercase">Total Inundated</span>
            <span className="text-sm font-bold text-red-400">{totalAffected.toLocaleString()} / {totalPopulation.toLocaleString()}</span>
          </div>
          <div className="bg-slate-950 border border-slate-800 px-3 py-2 rounded">
            <span className="text-[10px] text-slate-400 block uppercase">Critical Sectors</span>
            <span className="text-sm font-bold text-red-500 flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
              {criticalCount} of {zones.length} ZONES
            </span>
          </div>
        </div>
      </div>

      {/* Main Table Component */}
      <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-4">
        <ZoneTelemetryTable
          zones={zones}
          selectedZoneCode={selectedZone.code}
          onSelectZone={onSelectZone}
        />
      </div>

      {/* Selected Sector Ground Telemetry Inspector */}
      <div className="bg-slate-900/60 border border-cyan-900/40 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-cyan-400" />
            <h3 className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
              INSPECTION DOSSIER: SECTOR {selectedZone.code} ({selectedZone.name})
            </h3>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-400">
            RANK #{selectedZone.priorityRank} &bull; COMPOSITE RISK: {selectedZone.current_risk_score}/100
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="bg-slate-950/80 border border-slate-800 p-2.5 rounded">
            <span className="text-[10px] text-slate-400 block uppercase">Sector Location</span>
            <span className="text-xs font-bold text-white">{selectedZone.sector || selectedZone.name}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Lat: {selectedZone.coordinates.lat}&deg;, Lng: {selectedZone.coordinates.lng}&deg;
            </span>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 p-2.5 rounded">
            <span className="text-[10px] text-slate-400 block uppercase">Ground Accessibility</span>
            <span className="text-xs font-bold text-amber-400">
              {selectedZone.accessibility || selectedZone.accessibility_label || 'VERY DIFFICULT'}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Severity: {selectedZone.severity_label || selectedZone.severity || 'CRITICAL'}
            </span>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 p-2.5 rounded">
            <span className="text-[10px] text-slate-400 block uppercase">Population Exposure</span>
            <span className="text-xs font-bold text-red-400">
              {(selectedZone.affected_population || selectedZone.population).toLocaleString()} Citizens
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Census: {selectedZone.population.toLocaleString()} residents
            </span>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 p-2.5 rounded">
            <span className="text-[10px] text-slate-400 block uppercase">Recommended Assets</span>
            <span className="text-xs font-bold text-cyan-300">
              {selectedZone.teams_required_label || 'Amphibious Craft & Swiftwater Teams'}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Triage: {selectedZone.triageWindow || '< 2 HOURS STABILIZATION'}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800">
          <p className="text-xs text-slate-300 italic max-w-2xl">
            &ldquo;{selectedZone.aiRationale || 'Priority extraction required due to compromised infrastructure and flood crest.'}&rdquo;
          </p>

          <div className="flex items-center gap-2">
            {onViewRiskAnalysis && (
              <button
                onClick={onViewRiskAnalysis}
                className="px-3 py-1.5 rounded text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1 transition-colors"
              >
                <Activity className="h-3.5 w-3.5 text-cyan-400" />
                <span>View Risk Analysis</span>
              </button>
            )}
            {onExecuteDispatch && (
              <button
                onClick={() => onExecuteDispatch(selectedZone.code)}
                className="px-3 py-1.5 rounded text-xs font-bold bg-red-600 hover:bg-red-500 text-white flex items-center gap-1 transition-colors"
              >
                <Truck className="h-3.5 w-3.5" />
                <span>Dispatch to {selectedZone.code}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

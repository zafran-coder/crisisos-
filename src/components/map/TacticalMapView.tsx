'use client';

import React from 'react';
import { Map, Crosshair } from 'lucide-react';
import { EnrichedZoneRecord } from '@/lib/data-access/zones';
import { DisasterMap } from './DisasterMap';

export interface TacticalMapViewProps {
  zones: EnrichedZoneRecord[];
  selectedZoneCode: string;
  onSelectZone: (code: string) => void;
}

export function TacticalMapView({
  zones,
  selectedZoneCode,
  onSelectZone,
}: TacticalMapViewProps) {
  const selectedZone = zones.find((z) => z.code === selectedZoneCode) || zones[0];

  return (
    <div className="space-y-3 font-mono">
      {/* Top Map Header & Controls */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-950/60 border border-cyan-800 rounded text-cyan-400">
            <Map className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span>GEOSPATIAL SITUATIONAL RADAR</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold">
                ESRI TACTICAL DARK CANVAS
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Interactive high-resolution radar with 5 operational flood sectors and real-time polygon boundary analysis.
            </p>
          </div>
        </div>

        {/* Zone Selector Chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-slate-400 mr-1 flex items-center gap-1">
            <Crosshair className="h-3.5 w-3.5 text-cyan-400" />
            <span>FOCUS SECTOR:</span>
          </span>
          {zones.map((zone) => {
            const isSelected = zone.code === selectedZoneCode;
            const isCritical = zone.current_risk_score >= 80;
            return (
              <button
                key={zone.code}
                onClick={() => onSelectZone(zone.code)}
                className={`px-2.5 py-1 rounded text-xs font-bold border transition-all ${
                  isSelected
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md shadow-cyan-500/20'
                    : isCritical
                    ? 'bg-red-950/60 text-red-300 border-red-800 hover:bg-red-900/60'
                    : 'bg-slate-950/80 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                {zone.code} ({zone.current_risk_score})
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Expansive Tactical Map */}
      <div className="h-[620px] rounded-lg overflow-hidden border border-slate-800">
        <DisasterMap
          zones={zones}
          selectedZoneCode={selectedZoneCode}
          onSelectZone={onSelectZone}
        />
      </div>

      {/* Map Telemetry Footer Strip */}
      {selectedZone && (
        <div className="bg-slate-950/90 border border-slate-800 rounded-lg p-3 grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
          <div>
            <span className="text-slate-500 block text-[10px] uppercase">Active Target</span>
            <span className="font-bold text-cyan-400">{selectedZone.code} &bull; {selectedZone.name}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase">Center Coordinates</span>
            <span className="text-slate-300">{selectedZone.coordinates.lat}&deg; N, {selectedZone.coordinates.lng}&deg; E</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase">Composite Risk</span>
            <span className="font-bold text-red-400">{selectedZone.current_risk_score} / 100 (Rank #{selectedZone.priorityRank})</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase">Ground Status</span>
            <span className="text-amber-400 font-bold">{selectedZone.accessibility || selectedZone.accessibility_label || 'VERY DIFFICULT'}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase">Inundated Population</span>
            <span className="text-white font-bold">{(selectedZone.affected_population || selectedZone.population).toLocaleString()}</span>
          </div>
        </div>
      )}
    </div>
  );
}

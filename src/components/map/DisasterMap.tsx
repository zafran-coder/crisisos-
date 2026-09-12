'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { Radar } from 'lucide-react';
import { EnrichedZoneRecord } from '@/lib/data-access/zones';

// Dynamically import Leaflet map with SSR completely disabled to prevent `window is not defined`
const LeafletMapInner = dynamic(
  () => import('./LeafletMapInner').then((mod) => mod.LeafletMapInner),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[420px] rounded border border-slate-800 bg-[#090d14] flex flex-col items-center justify-center font-mono text-xs text-slate-400">
        <div className="flex items-center gap-2 text-cyan-400">
          <Radar className="h-5 w-5 animate-spin" />
          <span className="tracking-wider font-bold">INITIALIZING GEOSPATIAL RADAR...</span>
        </div>
        <span className="text-[11px] text-slate-400 mt-1">Connecting to GOES-16 downlink</span>
      </div>
    ),
  }
);

export interface DisasterMapProps {
  zones: EnrichedZoneRecord[];
  selectedZoneCode: string;
  onSelectZone: (code: string) => void;
}

export function DisasterMap({
  zones,
  selectedZoneCode,
  onSelectZone,
}: DisasterMapProps) {
  const [activeFilter, setActiveFilter] = useState('Flood Heatmap');

  const filters = [
    'Flood Heatmap',
    'Road Blocks',
    'Hospitals',
    'Drone Telemetry',
    'Power Grid',
  ];

  return (
    <div className="space-y-2 font-mono">
      {/* Map Header & Filter Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Radar className="h-4 w-4 text-cyan-400" />
          <h2 className="text-xs font-bold tracking-wider uppercase text-white">
            GEOSPATIAL SITUATIONAL RADAR
          </h2>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-800 text-cyan-400">
            LIVE SIT-04
          </span>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {filters.map((filter) => {
            const isActive = activeFilter === filter;
            return (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider transition-all whitespace-nowrap border ${
                  isActive
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-sm shadow-cyan-500/30'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {filter}
              </button>
            );
          })}
        </div>
      </div>

      {/* Render the Map */}
      <LeafletMapInner
        zones={zones}
        selectedZoneCode={selectedZoneCode}
        onSelectZone={onSelectZone}
        activeFilter={activeFilter}
      />
    </div>
  );
}

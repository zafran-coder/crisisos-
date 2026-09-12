'use client';

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Polygon, Tooltip, useMap } from 'react-leaflet';
import { EnrichedZoneRecord } from '@/lib/data-access/zones';

export interface LeafletMapInnerProps {
  zones: EnrichedZoneRecord[];
  selectedZoneCode: string;
  onSelectZone: (code: string) => void;
  activeFilter: string;
}

/**
 * Controller hook to center/pan when a zone is selected.
 */
function MapCenterController({
  selectedZone,
}: {
  selectedZone?: EnrichedZoneRecord;
}) {
  const map = useMap();

  useEffect(() => {
    if (selectedZone && selectedZone.coordinates) {
      map.flyTo([selectedZone.coordinates.lat, selectedZone.coordinates.lng], 13.5, {
        duration: 1.2,
      });
    }
  }, [selectedZone, map]);

  return null;
}

export function LeafletMapInner({
  zones,
  selectedZoneCode,
  onSelectZone,
  activeFilter,
}: LeafletMapInnerProps) {
  const centerLat = 33.5950;
  const centerLng = 73.0450;
  const selectedZone = zones.find((z) => z.code === selectedZoneCode);

  // Helper for polygon styling by risk score
  const getZoneStyle = (zone: EnrichedZoneRecord) => {
    const isSelected = zone.code === selectedZoneCode;
    const score = zone.current_risk_score;

    let fillColor = '#10B981'; // green / safe
    let color = '#059669';

    if (score >= 80) {
      fillColor = '#EF4444'; // critical red
      color = '#DC2626';
    } else if (score >= 65) {
      fillColor = '#F97316'; // orange
      color = '#EA580C';
    } else if (score >= 50) {
      fillColor = '#F59E0B'; // amber
      color = '#D97706';
    }

    return {
      fillColor,
      fillOpacity: isSelected ? 0.55 : 0.35,
      color: isSelected ? '#38BDF8' : color, // cyan border when selected
      weight: isSelected ? 3 : 1.5,
      dashArray: isSelected ? undefined : '4, 4',
    };
  };

  return (
    <div className="relative w-full h-[420px] rounded overflow-hidden border border-slate-800 bg-[#090d14]">
      {/* Top Map Coordinates Bar */}
      <div className="absolute top-2 left-2 z-[400] bg-slate-950/80 border border-slate-800 px-2.5 py-1 rounded text-[10px] font-mono text-cyan-400 tracking-wider backdrop-blur-sm pointer-events-none">
        LAT: 28.5383° N | LON: 81.3792° W | ACTIVE FILTER: {activeFilter.toUpperCase()}
      </div>

      {/* Map Scale & Drone Telemetry Overlay */}
      <div className="absolute bottom-2 left-2 z-[400] bg-slate-950/80 border border-slate-800 px-2.5 py-1 rounded text-[10px] font-mono text-slate-300 backdrop-blur-sm pointer-events-none flex items-center gap-3">
        <span>SCALE: 2.0 KM</span>
        <span className="text-cyan-400 flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
          DRONE RECON FLIGHT: CIRCLING F-03
        </span>
      </div>

      <MapContainer
        center={[centerLat, centerLng]}
        zoom={12.5}
        scrollWheelZoom={false}
        className="w-full h-full"
        attributionControl={false}
      >
        {/* Tactical Dark Basemap - Esri Dark Gray Canvas (Clean, Free, Zero Watermarks, No API Key Required) */}
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
          maxZoom={18}
        />
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}"
          maxZoom={18}
        />

        <MapCenterController selectedZone={selectedZone} />

        {/* 5 Tactical Polygonal Sectors */}
        {zones.map((zone) => {
          if (!zone.bounds || zone.bounds.length < 3) return null;
          const isSelected = zone.code === selectedZoneCode;
          const isPriorityOne = zone.code === 'F-03';

          return (
            <Polygon
              key={zone.code}
              positions={zone.bounds}
              pathOptions={getZoneStyle(zone)}
              eventHandlers={{
                click: () => onSelectZone(zone.code),
              }}
            >
              <Tooltip
                permanent
                direction="center"
                className="tactical-tooltip"
              >
                <div
                  className={`px-2 py-1 rounded text-[10px] font-mono font-bold tracking-wider cursor-pointer border ${
                    isSelected
                      ? 'bg-cyan-950 text-cyan-300 border-cyan-400 shadow-md shadow-cyan-500/20'
                      : isPriorityOne
                      ? 'bg-red-950/90 text-red-300 border-red-500'
                      : 'bg-slate-950/80 text-slate-200 border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1">
                    {isPriorityOne && <span className="text-white text-xs">⌖</span>}
                    <span>
                      ZONE {zone.code} {isPriorityOne ? '[PRIORITY 01]' : ''}
                    </span>
                  </div>
                  <div className="text-[9px] text-slate-300 font-normal">
                    {`RISK ${zone.current_risk_score} // POP: ${zone.population.toLocaleString()}`}
                  </div>
                </div>
              </Tooltip>
            </Polygon>
          );
        })}
      </MapContainer>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  Volume2,
  VolumeX,
  AlertTriangle,
  Bell,
  Cpu,
  Radio,
} from 'lucide-react';

export interface TopStatusBarProps {
  incidentName?: string;
  disasterType?: string;
  locationName?: string;
  defconLevel?: string;
  zuluTime?: string;
  isSimulation?: boolean;
  onToggleSimulation?: () => void;
  searchFilter: string;
  onSearchChange: (val: string) => void;
  dataSource?: 'supabase' | 'fallback';
}

export function TopStatusBar({
  incidentName = 'FL-ALPHA',
  disasterType = 'FLASH FLOOD CAT-4',
  locationName = 'SECTOR 04 // METRO DELTA BASIN',
  defconLevel = 'DEFCON 2',
  zuluTime,
  isSimulation = false,
  onToggleSimulation,
  searchFilter,
  onSearchChange,
  dataSource = 'fallback',
}: TopStatusBarProps) {
  const [audioOn, setAudioOn] = useState(true);
  const [liveZulu, setLiveZulu] = useState(zuluTime || '14:32:08');

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const hours = String(now.getUTCHours()).padStart(2, '0');
      const minutes = String(now.getUTCMinutes()).padStart(2, '0');
      const seconds = String(now.getUTCSeconds()).padStart(2, '0');
      setLiveZulu(`${hours}:${minutes}:${seconds}`);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="h-14 bg-[#090d14] border-b border-slate-800 flex items-center justify-between px-4 select-none sticky top-0 z-30 font-mono">
      {/* Left Incident Brand & Alert Box */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-sm bg-cyan-400 animate-pulse" />
          <span className="text-xs font-bold tracking-widest text-white uppercase">
            CRISISOS // {incidentName}
          </span>
        </div>

        {/* High-visibility active incident badge */}
        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 bg-red-600 text-white rounded text-[11px] font-bold tracking-wider uppercase border border-red-500 shadow-sm shadow-red-600/30">
          <span className="inline-block h-2 w-2 rounded-full bg-white animate-ping" />
          <span>ACTIVE INCIDENT | {disasterType}</span>
        </div>

        {/* Subtle Data-Source Indicator: LIVE SUPABASE or FALLBACK CACHE */}
        <div
          className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase border ${
            dataSource === 'supabase'
              ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
              : 'bg-amber-950/50 border-amber-600/40 text-amber-300'
          }`}
          title={
            dataSource === 'supabase'
              ? 'Connected to live Supabase Postgres database'
              : 'Operating on deterministic fallback cache'
          }
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              dataSource === 'supabase' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
            }`}
          />
          <span>{dataSource === 'supabase' ? 'LIVE SUPABASE' : 'FALLBACK CACHE'}</span>
        </div>
      </div>

      {/* Middle Telemetry Readout */}
      <div className="hidden lg:flex items-center gap-6 text-xs text-slate-300">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400">LOCATION:</span>
          <span className="text-white font-bold tracking-wide">{locationName}</span>
        </div>

        <div className="flex items-center gap-2 px-2 py-0.5 rounded bg-slate-900 border border-slate-700">
          <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-red-400 font-bold">{defconLevel} ACTIVE</span>
        </div>

        <div className="flex items-center gap-1.5 text-cyan-400">
          <span className="text-slate-400">ZULU</span>
          <span className="font-bold tracking-widest">{liveZulu}</span>
        </div>
      </div>

      {/* Right Operational Controls */}
      <div className="flex items-center gap-2.5">
        {/* Search / Filter Input */}
        <div className="relative hidden md:block w-48">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="FILTER ASSETS OR SE"
            className="w-full pl-8 pr-2 py-1 bg-slate-900/80 border border-slate-800 rounded text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
          />
        </div>

        {/* Simulation Toggle */}
        <button
          onClick={onToggleSimulation}
          className={`px-2.5 py-1 rounded text-[11px] font-bold tracking-wide transition-all border ${
            isSimulation
              ? 'bg-amber-500/20 border-amber-500 text-amber-300'
              : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Cpu className="h-3 w-3 text-cyan-400" />
            SIMULATION MODE
          </span>
        </button>

        {/* Audio Toggle */}
        <button
          onClick={() => setAudioOn(!audioOn)}
          className="p-1.5 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          title={audioOn ? 'Audio Alerts Enabled' : 'Audio Muted'}
        >
          {audioOn ? (
            <Volume2 className="h-3.5 w-3.5 text-cyan-400" />
          ) : (
            <VolumeX className="h-3.5 w-3.5 text-slate-400" />
          )}
        </button>

        {/* Alert status indicators */}
        <div className="flex items-center gap-1 pl-1 border-l border-slate-800 text-slate-400">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-400 hover:text-amber-300 cursor-pointer" />
          <Radio className="h-3.5 w-3.5 text-red-400 hover:text-red-300 cursor-pointer" />
          <Bell className="h-3.5 w-3.5 text-cyan-400 hover:text-cyan-300 cursor-pointer" />
        </div>
      </div>
    </header>
  );
}

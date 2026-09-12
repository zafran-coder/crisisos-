'use client';

import React from 'react';
import { Settings, Shield, Cpu, Database, Radio, Lock } from 'lucide-react';

export interface SettingsViewProps {
  defconLevel?: string;
  isSimulation?: boolean;
  onToggleSimulation?: () => void;
  dataSource?: 'supabase' | 'fallback';
}

export function SettingsView({
  defconLevel = 'DEFCON-2',
  isSimulation = false,
  onToggleSimulation,
  dataSource = 'supabase',
}: SettingsViewProps) {
  return (
    <div className="space-y-4 font-mono">
      {/* Top Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
            <Settings className="h-4 w-4" />
            <span>OPERATIONS CONSOLE // ENCLAVE CONFIGURATION</span>
          </div>
          <h1 className="text-xl font-bold text-white mt-1">
            CrisisOS System Settings
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Operational telemetry controls, security policies, AI reasoning enclaves, and live database links.
          </p>
        </div>

        <span className="text-[10px] font-bold px-2.5 py-1 rounded bg-emerald-950 border border-emerald-800 text-emerald-400 self-start md:self-auto flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          SYSTEM HEALTH: 99.98% NOMINAL
        </span>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Emergency DEFCON & Operations */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Shield className="h-4 w-4 text-red-400" />
            <span>INCIDENT READINESS LEVEL</span>
          </div>

          <div className="p-3 bg-slate-900/60 rounded border border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Current Threat Level:</span>
              <span className="text-red-400 font-bold px-2 py-0.5 rounded bg-red-950/80 border border-red-800">
                {defconLevel} {'//'} ACTIVE FLOOD
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Tactical Simulation Mode:</span>
              <button
                onClick={onToggleSimulation}
                className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                  isSimulation
                    ? 'bg-amber-500 text-slate-950 border-amber-400'
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                {isSimulation ? 'SIMULATION ACTIVE' : 'LIVE TELEMETRY'}
              </button>
            </div>
          </div>
        </div>

        {/* Card 2: Supabase & RLS Security Status */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Database className="h-4 w-4 text-cyan-400" />
            <span>DATABASE &amp; ROW LEVEL SECURITY (RLS)</span>
          </div>

          <div className="p-3 bg-slate-900/60 rounded border border-slate-800 space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Supabase Ingress:</span>
              <span className="text-cyan-400 font-bold uppercase">{dataSource}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Row Level Security:</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <Lock className="h-3 w-3" />
                ENABLED ON ALL TABLES
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Security Architecture:</span>
              <span className="text-slate-300">SECURITY DEFINER RPCs</span>
            </div>
          </div>
        </div>

        {/* Card 3: Gemini AI Model Configuration */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Cpu className="h-4 w-4 text-cyan-400" />
            <span>GEMINI AI CONFIRMED MODELS</span>
          </div>

          <div className="p-3 bg-slate-900/60 rounded border border-slate-800 space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Primary Reasoning:</span>
              <span className="text-cyan-300 font-bold">gemini-3.8-flash</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Fallback Tier 1:</span>
              <span className="text-slate-300">gemini-3.5-flash</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Fallback Tier 2:</span>
              <span className="text-slate-300">gemini-flash-latest</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Secret Redaction:</span>
              <span className="text-emerald-400 font-bold">STRICT SERVER-ONLY</span>
            </div>
          </div>
        </div>

        {/* Card 4: Satellite & Downlink Telemetry */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Radio className="h-4 w-4 text-emerald-400" />
            <span>SATELLITE DOWNLINK TELEMETRY</span>
          </div>

          <div className="p-3 bg-slate-900/60 rounded border border-slate-800 space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Primary Orbit Link:</span>
              <span className="text-emerald-400 font-bold">GOES-16 ACTIVE</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Radar Ingest Interval:</span>
              <span className="text-slate-300">24 SECONDS</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Active Operator Session:</span>
              <span className="text-cyan-400 font-bold">C. VANCE (ENCLAVE #04)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

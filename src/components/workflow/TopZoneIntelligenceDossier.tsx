'use client';

import React from 'react';
import {
  ShieldAlert,
  Calculator,
  Camera,
  BookOpen,
  Sparkles,
  Layers,
  MapPin,
  Users,
} from 'lucide-react';
import { EnrichedZoneRecord } from '@/lib/data-access/zones';
import { StructuredResponsePlan } from '@/types/response-plan';
import { ResourceMatrixPayload } from '@/types/allocations';

export interface TopZoneIntelligenceDossierProps {
  zone: EnrichedZoneRecord | null;
  visionFindings?: {
    water_level?: string;
    infrastructure_damage?: string;
    hazards?: string[];
    summary?: string;
  } | null;
  guidelines?: Array<{
    protocol_code?: string;
    title?: string;
    category?: string;
    protocol_text?: string;
  }>;
  plan?: StructuredResponsePlan | null;
  allocations?: ResourceMatrixPayload | null;
}

export function TopZoneIntelligenceDossier({
  zone,
  visionFindings,
  guidelines = [],
  plan,
  allocations,
}: TopZoneIntelligenceDossierProps) {
  if (!zone) {
    return (
      <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-lg text-xs font-mono text-slate-400">
        No active zone telemetry loaded from Supabase.
      </div>
    );
  }

  // Find plan details for this zone
  const planZone = plan?.priority_zones?.find(
    (pz) => pz.zone_code.toUpperCase() === zone.code.toUpperCase()
  );

  // Find resource allocation details for this zone
  const allocZone = allocations?.zone_allocations?.find(
    (za) => za.zone_code.toUpperCase() === zone.code.toUpperCase()
  );

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-lg overflow-hidden font-mono text-slate-200 shadow-xl space-y-3">
      {/* 1. Header with Title & Top Priority Indicators */}
      <div className="p-3 bg-slate-800/90 border-b border-slate-700 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
            <ShieldAlert className="h-3.5 w-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                TOP-PRIORITY THREAT DOSSIER {'//'} ZONE {zone.code}
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 border border-emerald-700 text-emerald-400 font-bold">
                SUPABASE
              </span>
            </div>
            <span className="text-[11px] text-slate-400">
              {zone.name} &bull; Sector {zone.sector || 'Not available'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-950/80 border border-red-500 text-red-400 flex items-center gap-1 animate-pulse">
            <span>RANK #{zone.priorityRank}</span>
          </span>
          <div className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300 font-bold text-xs flex items-center gap-1">
            <span className="text-[10px] text-slate-400">RISK:</span>
            <span className="text-red-400 font-bold">{zone.current_risk_score}/100</span>
          </div>
        </div>
      </div>

      <div className="p-3 space-y-3">
        {/* 2. Top Metric Row: Supabase Facts & Deterministic Risk */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* Card A: Zone Identification */}
          <div className="p-2.5 bg-slate-950/70 border border-slate-800 rounded space-y-1">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-slate-400">SECTOR / CODE</span>
              <span className="px-1.5 py-0.2 rounded bg-emerald-950/60 border border-emerald-800 text-emerald-400 font-bold text-[9px]">
                SUPABASE
              </span>
            </div>
            <div className="text-xs font-bold text-white flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-cyan-400 flex-shrink-0" />
              <span className="truncate">{zone.name} ({zone.code})</span>
            </div>
            <div className="text-[10px] text-slate-400">
              Status: {zone.status || 'ACTIVE'}
            </div>
          </div>

          {/* Card B: Population Exposure */}
          <div className="p-2.5 bg-slate-950/70 border border-slate-800 rounded space-y-1">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-slate-400">POPULATION AT RISK</span>
              <span className="px-1.5 py-0.2 rounded bg-emerald-950/60 border border-emerald-800 text-emerald-400 font-bold text-[9px]">
                SUPABASE
              </span>
            </div>
            <div className="text-xs font-bold text-red-400 flex items-center gap-1">
              <Users className="h-3.5 w-3.5 flex-shrink-0" />
              <span>
                {zone.affected_population
                  ? `${zone.affected_population.toLocaleString()} affected`
                  : 'Not available'}
              </span>
            </div>
            <div className="text-[10px] text-slate-400">
              Total Census: {zone.population ? zone.population.toLocaleString() : 'Not available'}
            </div>
          </div>

          {/* Card C: Deterministic Risk Score */}
          <div className="p-2.5 bg-slate-950/70 border border-red-900/40 rounded space-y-1">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-slate-400">DETERMINISTIC RISK</span>
              <span className="px-1.5 py-0.2 rounded bg-red-950/60 border border-red-800 text-red-400 font-bold text-[9px]">
                DETERMINISTIC RISK
              </span>
            </div>
            <div className="text-xs font-bold text-white flex items-center gap-1">
              <Calculator className="h-3.5 w-3.5 text-red-400 flex-shrink-0" />
              <span>{zone.current_risk_score} / 100</span>
              <span className="text-[10px] text-red-400 ml-1 font-normal">
                (Rank #{zone.priorityRank})
              </span>
            </div>
            <div className="text-[10px] text-slate-400">
              Formula locked &bull; No LLM override
            </div>
          </div>

          {/* Card D: Severity & Accessibility */}
          <div className="p-2.5 bg-slate-950/70 border border-slate-800 rounded space-y-1">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-slate-400">GROUND ACCESS</span>
              <span className="px-1.5 py-0.2 rounded bg-emerald-950/60 border border-emerald-800 text-emerald-400 font-bold text-[9px]">
                SUPABASE
              </span>
            </div>
            <div className="text-xs font-bold text-amber-400 truncate">
              {zone.accessibility || 'Not available'}
            </div>
            <div className="text-[10px] text-slate-400">
              Severity: {zone.severity_label || zone.severity || 'Not available'}
            </div>
          </div>
        </div>

        {/* 3. Operational Evidence Grid (Vision, RAG, Actions, Allocations) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* Section 1: Vision Findings */}
          <div className="p-3 bg-slate-950/70 border border-purple-900/40 rounded-lg space-y-2">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <div className="flex items-center gap-1.5">
                <Camera className="h-3.5 w-3.5 text-purple-400" />
                <span className="text-xs font-bold text-purple-400 uppercase tracking-wide">
                  VISION AI RECON FINDINGS
                </span>
              </div>
              <span className="px-1.5 py-0.2 rounded bg-purple-950/80 border border-purple-800 text-purple-300 font-bold text-[9px]">
                VISION AI
              </span>
            </div>

            {visionFindings ? (
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Water Level:</span>
                  <span className="font-bold text-cyan-400">
                    {visionFindings.water_level || 'Not available'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Infrastructure Damage:</span>
                  <span className="font-bold text-red-400 truncate max-w-[240px]">
                    {visionFindings.infrastructure_damage || 'Not available'}
                  </span>
                </div>
                {visionFindings.hazards && visionFindings.hazards.length > 0 && (
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-1">Visible Hazards:</span>
                    <div className="flex flex-wrap gap-1">
                      {visionFindings.hazards.map((h, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] px-1.5 py-0.2 rounded bg-purple-950/60 border border-purple-800 text-purple-200"
                        >
                          &bull; {h}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {visionFindings.summary && (
                  <p className="text-[11px] text-slate-300 leading-snug pt-1">
                    {visionFindings.summary}
                  </p>
                )}
              </div>
            ) : (
              <div className="p-3 text-center text-slate-500 text-[11px] space-y-1">
                <span>Not available &mdash; No aerial visual recon record for this zone.</span>
                <span className="block text-[10px] text-purple-400 font-bold">
                  Click &ldquo;Analyze Image&rdquo; above to run Gemini Vision.
                </span>
              </div>
            )}
          </div>

          {/* Section 2: RAG Guidance */}
          <div className="p-3 bg-slate-950/70 border border-cyan-900/40 rounded-lg space-y-2">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <div className="flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5 text-cyan-400" />
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-wide">
                  EMERGENCY GUIDANCE (RAG SOP)
                </span>
              </div>
              <span className="px-1.5 py-0.2 rounded bg-cyan-950/80 border border-cyan-800 text-cyan-300 font-bold text-[9px]">
                RAG
              </span>
            </div>

            {guidelines.length > 0 ? (
              <div className="space-y-1.5">
                {guidelines.slice(0, 3).map((g, idx) => (
                  <div key={idx} className="p-1.5 bg-slate-900/60 rounded border border-slate-800 text-xs">
                    <div className="flex items-center justify-between font-bold text-cyan-300">
                      <span>[{g.protocol_code || 'SOP'}] {g.title || 'Emergency Protocol'}</span>
                      <span className="text-[9px] text-slate-400 font-normal">{g.category}</span>
                    </div>
                    {g.protocol_text && (
                      <p className="text-[10px] text-slate-400 mt-0.5 leading-tight line-clamp-2">
                        {g.protocol_text}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 text-center text-slate-500 text-[11px] space-y-1">
                <span>Not available &mdash; No emergency SOP guidelines retrieved.</span>
                <span className="block text-[10px] text-cyan-400 font-bold">
                  Click &ldquo;Get Emergency Guidance&rdquo; above to query pgvector.
                </span>
              </div>
            )}
          </div>

          {/* Section 3: Response Actions */}
          <div className="p-3 bg-slate-950/70 border border-blue-900/40 rounded-lg space-y-2">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-blue-400" />
                <span className="text-xs font-bold text-blue-400 uppercase tracking-wide">
                  TACTICAL RESPONSE ACTIONS
                </span>
              </div>
              <span className="px-1.5 py-0.2 rounded bg-blue-950/80 border border-blue-800 text-blue-300 font-bold text-[9px]">
                GEMINI
              </span>
            </div>

            {planZone?.immediate_actions && planZone.immediate_actions.length > 0 ? (
              <div className="space-y-1 text-xs">
                {planZone.immediate_actions.map((act, idx) => (
                  <div key={idx} className="flex items-start gap-1.5 text-slate-300 text-[11px]">
                    <span className="text-cyan-400 font-bold">&bull;</span>
                    <span>{act}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 text-center text-slate-500 text-[11px] space-y-1">
                <span>Not available &mdash; Operational plan not yet synthesized.</span>
                <span className="block text-[10px] text-blue-400 font-bold">
                  Click &ldquo;Generate Response Plan&rdquo; above.
                </span>
              </div>
            )}
          </div>

          {/* Section 4: Allocated Resources */}
          <div className="p-3 bg-slate-950/70 border border-amber-900/40 rounded-lg space-y-2">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <div className="flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-amber-400" />
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wide">
                  ALLOCATED RESCUE ASSETS
                </span>
              </div>
              <span className="px-1.5 py-0.2 rounded bg-amber-950/80 border border-amber-800 text-amber-300 font-bold text-[9px]">
                ALLOCATION ENGINE
              </span>
            </div>

            {allocZone ? (
              <div className="space-y-2">
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 text-center text-xs">
                  <div className="p-1.5 bg-slate-900 rounded border border-slate-800">
                    <span className="text-[9px] text-slate-400 block">Teams</span>
                    <span className="text-sm font-bold text-white">{allocZone.rescue_teams}</span>
                  </div>
                  <div className="p-1.5 bg-slate-900 rounded border border-slate-800">
                    <span className="text-[9px] text-slate-400 block">Boats</span>
                    <span className="text-sm font-bold text-cyan-400">{allocZone.boats}</span>
                  </div>
                  <div className="p-1.5 bg-slate-900 rounded border border-slate-800">
                    <span className="text-[9px] text-slate-400 block">Medical</span>
                    <span className="text-sm font-bold text-white">{allocZone.medical_units}</span>
                  </div>
                  <div className="p-1.5 bg-slate-900 rounded border border-slate-800">
                    <span className="text-[9px] text-slate-400 block">Ambulances</span>
                    <span className="text-sm font-bold text-amber-400">{allocZone.ambulances}</span>
                  </div>
                  <div className="p-1.5 bg-slate-900 rounded border border-slate-800">
                    <span className="text-[9px] text-slate-400 block">Water</span>
                    <span className="text-sm font-bold text-white">{allocZone.water_units}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                  <span>Total Allocated: <strong className="text-white">{allocZone.total_allocated} units</strong></span>
                  <span className="text-emerald-400 font-bold">Status: {allocZone.status}</span>
                </div>
              </div>
            ) : (
              <div className="p-3 text-center text-slate-500 text-[11px] space-y-1">
                <span>Not available &mdash; Resource allocations not yet computed.</span>
                <span className="block text-[10px] text-amber-400 font-bold">
                  Click &ldquo;Allocate Resources&rdquo; above.
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

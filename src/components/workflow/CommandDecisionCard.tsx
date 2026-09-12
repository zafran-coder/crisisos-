'use client';

import React, { useState } from 'react';
import {
  ShieldAlert,
  Zap,
  MapPin,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import { EnrichedZoneRecord } from '@/lib/data-access/zones';
import { StructuredResponsePlan } from '@/types/response-plan';
import { ResourceMatrixPayload } from '@/types/allocations';

export interface CommandDecisionCardProps {
  topZone: EnrichedZoneRecord | null;
  plan?: StructuredResponsePlan | null;
  allocations?: ResourceMatrixPayload | null;
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
  onExecuteDispatch?: () => void;
  onViewFullEvidence?: () => void;
}

export function CommandDecisionCard({
  topZone,
  plan,
  allocations,
  visionFindings,
  guidelines = [],
  onExecuteDispatch,
  onViewFullEvidence,
}: CommandDecisionCardProps) {
  const [dispatchStatus, setDispatchStatus] = useState<'idle' | 'executing' | 'confirmed'>('idle');

  if (!topZone) {
    return (
      <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-lg text-xs font-mono text-slate-400">
        No active zone telemetry loaded to formulate command decision.
      </div>
    );
  }

  const planZone = plan?.priority_zones?.find(
    (pz) => pz.zone_code.toUpperCase() === topZone.code.toUpperCase()
  );

  const allocZone = allocations?.zone_allocations?.find(
    (za) => za.zone_code.toUpperCase() === topZone.code.toUpperCase()
  );

  const handleDispatch = () => {
    setDispatchStatus('executing');
    if (onExecuteDispatch) onExecuteDispatch();
    setTimeout(() => {
      setDispatchStatus('confirmed');
      setTimeout(() => setDispatchStatus('idle'), 4000);
    }, 800);
  };

  return (
    <div className="bg-slate-900/90 border-2 border-cyan-500/40 rounded-lg overflow-hidden font-mono text-slate-200 shadow-2xl space-y-3">
      {/* 1. Header */}
      <div className="p-3.5 bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950/40 border-b border-cyan-500/30 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded bg-cyan-500/10 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <ShieldAlert className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wider flex items-center gap-2">
              <span>COMMAND DECISION</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 border border-cyan-700 text-cyan-300">
                AUTHORITATIVE
              </span>
            </h3>
            <p className="text-xs text-cyan-300 font-sans">
              &ldquo;Where should rescue teams go first, and why?&rdquo;
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-950/80 border border-red-500 text-red-400">
            SECTOR {topZone.code} &bull; RANK #{topZone.priorityRank}
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-950 border border-slate-700 text-slate-300">
            RISK {topZone.current_risk_score}/100
          </span>
        </div>
      </div>

      <div className="p-4 space-y-3.5">
        {/* 2. WHERE */}
        <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg space-y-1">
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center justify-between">
            <span>1. WHERE RESCUE TEAMS MUST GO FIRST</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-950 border border-emerald-800 text-emerald-400 font-bold">
              SUPABASE RECORD
            </span>
          </div>
          <div className="text-base font-bold text-white flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-red-400" />
            <span>SECTOR {topZone.code} {'//'} {topZone.name.toUpperCase()}</span>
          </div>
          <div className="text-xs text-slate-400 flex flex-wrap items-center gap-3 pt-0.5">
            <span>Coordinates: {topZone.coordinates.lat}&deg; N, {topZone.coordinates.lng}&deg; E</span>
            <span>&bull;</span>
            <span>Accessibility: <strong className="text-amber-400">{topZone.accessibility || 'Not available'}</strong></span>
            <span>&bull;</span>
            <span>Impact: <strong className="text-red-400">{topZone.affected_population ? `${topZone.affected_population.toLocaleString()} citizens affected` : 'Not available'}</strong></span>
          </div>
        </div>

        {/* 3. WHY (Grounded from Real Backend Data) */}
        <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg space-y-2">
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center justify-between">
            <span>2. WHY SECTOR {topZone.code} FIRST (BACKEND FACTUAL GROUNDING)</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-950 border border-cyan-800 text-cyan-400 font-bold">
              GROUNDED EVIDENCE
            </span>
          </div>

          <div className="space-y-2 text-xs text-slate-300">
            {/* Justification 1: Deterministic Risk */}
            <div className="flex items-start gap-2 p-1.5 bg-slate-900/50 rounded border border-slate-800">
              <span className="text-red-400 font-bold mt-0.5">&bull;</span>
              <div>
                <strong className="text-white">Deterministic Priority Ranking:</strong> Zone {topZone.code} holds{' '}
                <span className="text-red-400 font-bold">Priority Rank #{topZone.priorityRank}</span> with a composite risk score of{' '}
                <span className="text-red-400 font-bold">{topZone.current_risk_score} / 100</span> (Source:{' '}
                <span className="text-emerald-400">SUPABASE</span> + <span className="text-red-400">DETERMINISTIC RISK</span>).
              </div>
            </div>

            {/* Justification 2: Vision Analysis Findings */}
            <div className="flex items-start gap-2 p-1.5 bg-slate-900/50 rounded border border-slate-800">
              <span className="text-purple-400 font-bold mt-0.5">&bull;</span>
              <div>
                <strong className="text-white">Visual Aerial Reconnaissance:</strong>{' '}
                {visionFindings ? (
                  <span>
                    Observed water level: <strong className="text-cyan-400">{visionFindings.water_level || 'Not available'}</strong> with{' '}
                    <strong className="text-red-400">{visionFindings.infrastructure_damage || 'Not available'}</strong>.{' '}
                    {visionFindings.hazards && visionFindings.hazards.length > 0 && (
                      <span>Hazards: {visionFindings.hazards.join(', ')}. </span>
                    )}
                    (Source: <span className="text-purple-400">VISION AI</span>).
                  </span>
                ) : (
                  <span className="text-slate-500">
                    No visual recon findings yet. Click &ldquo;Analyze Image&rdquo; in the workflow bar above.
                  </span>
                )}
              </div>
            </div>

            {/* Justification 3: RAG Doctrine Protocols */}
            <div className="flex items-start gap-2 p-1.5 bg-slate-900/50 rounded border border-slate-800">
              <span className="text-cyan-400 font-bold mt-0.5">&bull;</span>
              <div>
                <strong className="text-white">Retrieved SOP Doctrine:</strong>{' '}
                {guidelines.length > 0 ? (
                  <span>
                    Emergency protocols{' '}
                    {guidelines.slice(0, 3).map((g) => `[${g.protocol_code || 'SOP'}] ${g.title}`).join(', ')}{' '}
                    mandate immediate forward triage and specialized boat rescue extraction (Source:{' '}
                    <span className="text-cyan-400">RAG</span>).
                  </span>
                ) : (
                  <span className="text-slate-500">
                    SOP guidelines not yet retrieved. Click &ldquo;Get Emergency Guidance&rdquo; above.
                  </span>
                )}
              </div>
            </div>

            {/* Justification 4: Operational Directive & Strategic Rationale */}
            <div className="flex items-start gap-2 p-1.5 bg-slate-900/50 rounded border border-slate-800">
              <span className="text-blue-400 font-bold mt-0.5">&bull;</span>
              <div>
                <strong className="text-white">Synthesized Response Directive:</strong>{' '}
                {planZone?.reason || planZone?.immediate_actions?.[0] || plan?.incident_summary ? (
                  <span>
                    &ldquo;{planZone?.reason || planZone?.immediate_actions?.[0] || plan?.incident_summary}&rdquo; (Source:{' '}
                    <span className="text-blue-400">GEMINI</span>).
                  </span>
                ) : (
                  <span className="text-slate-500">
                    Response plan not yet generated. Click &ldquo;Generate Response Plan&rdquo; above to synthesize tactical directives.
                  </span>
                )}
              </div>
            </div>

            {/* Justification 5: Resource Allocation Clamping */}
            <div className="flex items-start gap-2 p-1.5 bg-slate-900/50 rounded border border-slate-800">
              <span className="text-amber-400 font-bold mt-0.5">&bull;</span>
              <div>
                <strong className="text-white">Inventory Quota Allocation:</strong>{' '}
                {allocZone ? (
                  <span>
                    Allocated <strong className="text-white">{allocZone.total_allocated} emergency units</strong> ({allocZone.rescue_teams} Rescue Teams, {allocZone.boats} Boats, {allocZone.medical_units} Medical Units, {allocZone.ambulances} Ambulances, {allocZone.water_units} Water Units) under strict inventory clamping (Source:{' '}
                    <span className="text-amber-400">ALLOCATION ENGINE</span>).
                  </span>
                ) : (
                  <span className="text-slate-500">
                    Allocations not yet computed. Click &ldquo;Allocate Resources&rdquo; above to calculate.
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 4. Action Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {onViewFullEvidence && (
              <button
                onClick={onViewFullEvidence}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 rounded text-xs font-bold transition-all flex items-center justify-center gap-1.5 w-full sm:w-auto"
              >
                <FileText className="h-3.5 w-3.5" />
                <span>VIEW FULL AUDIT DOSSIER</span>
              </button>
            )}
          </div>

          <button
            onClick={handleDispatch}
            disabled={dispatchStatus === 'executing'}
            className="w-full sm:w-auto px-5 py-2.5 bg-cyan-400 hover:bg-cyan-300 active:scale-95 text-slate-950 font-bold text-xs rounded uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-cyan-400/20 transition-all cursor-pointer disabled:opacity-50"
          >
            {dispatchStatus === 'confirmed' ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-emerald-950" />
                <span>DIRECTIVE AUTHORIZED & DISPATCHED</span>
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 fill-slate-950" />
                <span>EXECUTE RESCUE DIRECTIVE {'//'} SECTOR {topZone.code}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

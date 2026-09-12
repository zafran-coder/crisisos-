'use client';

import React from 'react';
import { BookOpen, Sparkles, ShieldCheck } from 'lucide-react';
import { EnrichedZoneRecord } from '@/lib/data-access/zones';

export interface ExplainabilityBoxProps {
  zone: EnrichedZoneRecord;
  onViewEvidence?: () => void;
}

export function ExplainabilityBox({ zone, onViewEvidence }: ExplainabilityBoxProps) {
  const contributions = zone.riskResult?.contributions || [];

  return (
    <div className="rounded border border-slate-800 bg-[#0f172a]/80 p-3 font-mono space-y-3 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">
            DECISION EXPLAINABILITY MATRIX
          </h3>
        </div>
        <span className="text-[10px] text-slate-400 uppercase font-semibold">
          WHY ZONE {zone.code} FIRST?
        </span>
      </div>

      {/* 5 Deterministic Factor Bars */}
      <div className="space-y-2.5">
        {contributions.map((c) => {
          const weightLabel = `${Math.round(c.weight * 100)}% WEIGHT`;
          const detail = c.detailText ? ` (${c.detailText})` : '';

          // Visual bar color based on severity
          let barColor = 'bg-cyan-500';
          if (c.rawScore >= 85) barColor = 'bg-red-500';
          else if (c.rawScore >= 70) barColor = 'bg-orange-500';
          else if (c.rawScore >= 50) barColor = 'bg-amber-500';

          return (
            <div key={c.factor} className="space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <div className="truncate pr-2">
                  <span className="font-semibold text-slate-200">{c.shortLabel}</span>
                  <span className="text-slate-400 text-[10px]">{detail}</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[10px] font-bold text-cyan-400 tracking-wider">
                    {weightLabel}
                  </span>
                  <span className="text-[10px] font-bold text-white w-7 text-right">
                    {c.rawScore}
                  </span>
                </div>
              </div>

              {/* Progress track */}
              <div className="h-1.5 w-full bg-slate-900 rounded overflow-hidden flex">
                <div
                  className={`h-full rounded ${barColor} transition-all duration-500`}
                  style={{ width: `${c.rawScore}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* AI Rationale Box */}
      <div className="rounded border border-slate-800 bg-[#090d14] p-2.5 space-y-1">
        <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
          AI RATIONALE:
        </div>
        <p className="text-[11px] leading-relaxed text-slate-300 font-sans">
          &ldquo;{zone.aiRationale || zone.riskResult?.explanation}&rdquo;
        </p>
      </div>

      {/* Trusted RAG Citation Box */}
      <div className="flex items-center justify-between p-2 rounded border border-cyan-900/40 bg-cyan-950/20 text-[10px]">
        <div className="flex items-center gap-1.5 text-cyan-400">
          <BookOpen className="h-3.5 w-3.5" />
          <span className="font-bold uppercase tracking-wider">TRUSTED RAG CITATION:</span>
        </div>
        <span className="text-slate-300 font-mono truncate max-w-[210px]" title={zone.ragCitation}>
          {zone.ragCitation || 'FEMA-P-1052 §4.2 & CDC SVI 2024'}
        </span>
      </div>

      {/* Link to Full Evidence & Audit Dossier */}
      {onViewEvidence && (
        <button
          onClick={onViewEvidence}
          className="w-full py-2 px-2.5 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-400 border border-emerald-800/60 rounded text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.99]"
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>VIEW FULL EVIDENCE & AUDIT TRAIL</span>
        </button>
      )}
    </div>
  );
}

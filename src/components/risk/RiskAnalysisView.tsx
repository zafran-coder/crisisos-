'use client';

import React from 'react';
import { Activity, Calculator } from 'lucide-react';
import { EnrichedZoneRecord } from '@/lib/data-access/zones';
import { RiskEngineCard } from './RiskEngineCard';
import { ExplainabilityBox } from './ExplainabilityBox';

export interface RiskAnalysisViewProps {
  zones: EnrichedZoneRecord[];
  selectedZone: EnrichedZoneRecord;
  onSelectZone: (code: string) => void;
  onViewEvidence?: () => void;
}

export function RiskAnalysisView({
  zones,
  selectedZone,
  onSelectZone,
  onViewEvidence,
}: RiskAnalysisViewProps) {
  return (
    <div className="space-y-4 font-mono">
      {/* Top Engine Header */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-red-400 text-xs font-bold uppercase tracking-wider">
            <Activity className="h-4 w-4" />
            <span>AI &amp; DETERMINISTIC RISK ENGINE // MULTI-FACTOR ANALYSIS</span>
          </div>
          <h1 className="text-xl font-bold text-white mt-1">
            Mathematical 5-Factor Risk Scoring
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Deterministic algorithmic framework ensuring objective life-safety prioritization without subjective LLM drift.
          </p>
        </div>

        {/* Formula Badge */}
        <div className="bg-slate-950 border border-red-900/40 p-3 rounded text-right">
          <span className="text-[10px] text-slate-400 block uppercase">Algorithmic Weights</span>
          <span className="text-xs font-bold text-cyan-300">
            Pop 30% &bull; Sev 25% &bull; Med 20% &bull; Access 15% &bull; Infra 10%
          </span>
          <span className="text-[10px] text-emerald-400 block mt-0.5">
            &bull; Mathematically Locked &bull; ISO 22320 Compliant
          </span>
        </div>
      </div>

      {/* Zone Selector Strip */}
      <div className="flex flex-wrap items-center gap-2 p-2.5 bg-slate-950/70 border border-slate-800 rounded-lg">
        <span className="text-xs text-slate-400 font-bold uppercase mr-1">Select Sector:</span>
        {zones.map((zone) => {
          const isSelected = zone.code === selectedZone.code;
          return (
            <button
              key={zone.code}
              onClick={() => onSelectZone(zone.code)}
              className={`px-3 py-1.5 rounded text-xs font-bold border transition-all ${
                isSelected
                  ? 'bg-red-500 text-white border-red-400 shadow-md shadow-red-500/20'
                  : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
              }`}
            >
              Sector {zone.code} &mdash; Score: {zone.current_risk_score}/100
            </button>
          );
        })}
      </div>

      {/* Comparative Cross-Zone Matrix */}
      <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-4 space-y-3">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <Calculator className="h-4 w-4 text-cyan-400" />
          <span>Cross-Sector Factor Breakdown Comparison</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {zones.map((z) => {
            const isTop = z.priorityRank === 1;
            const isSelected = z.code === selectedZone.code;
            return (
              <div
                key={z.code}
                onClick={() => onSelectZone(z.code)}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-slate-900 border-cyan-400 shadow-sm'
                    : isTop
                    ? 'bg-slate-950/90 border-red-600/50'
                    : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold mb-2">
                  <span className="text-white">Zone {z.code}</span>
                  <span className={z.current_risk_score >= 80 ? 'text-red-400' : 'text-amber-400'}>
                    {z.current_risk_score}/100
                  </span>
                </div>

                <div className="space-y-1.5 text-[10px]">
                  <div>
                    <div className="flex justify-between text-slate-400">
                      <span>Pop Exposure</span>
                      <span>{z.factors.populationExposure}</span>
                    </div>
                    <div className="h-1 bg-slate-800 rounded overflow-hidden">
                      <div className="h-full bg-cyan-400" style={{ width: `${z.factors.populationExposure}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-400">
                      <span>Severity</span>
                      <span>{z.factors.disasterSeverity}</span>
                    </div>
                    <div className="h-1 bg-slate-800 rounded overflow-hidden">
                      <div className="h-full bg-red-400" style={{ width: `${z.factors.disasterSeverity}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-400">
                      <span>Medical Strain</span>
                      <span>{z.factors.medicalNeed}</span>
                    </div>
                    <div className="h-1 bg-slate-800 rounded overflow-hidden">
                      <div className="h-full bg-amber-400" style={{ width: `${z.factors.medicalNeed}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-400">
                      <span>Access Difficulty</span>
                      <span>{z.factors.accessibility}</span>
                    </div>
                    <div className="h-1 bg-slate-800 rounded overflow-hidden">
                      <div className="h-full bg-orange-400" style={{ width: `${z.factors.accessibility}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-400">
                      <span>Infra Damage</span>
                      <span>{z.factors.infrastructureDamage}</span>
                    </div>
                    <div className="h-1 bg-slate-800 rounded overflow-hidden">
                      <div className="h-full bg-purple-400" style={{ width: `${z.factors.infrastructureDamage}%` }} />
                    </div>
                  </div>
                </div>

                <div className="mt-2 text-center text-[9px] text-slate-500 font-bold uppercase">
                  Rank #{z.priorityRank}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dedicated Inspector for Selected Zone */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
        <RiskEngineCard zone={selectedZone} />
        <ExplainabilityBox zone={selectedZone} onViewEvidence={onViewEvidence} />
      </div>
    </div>
  );
}

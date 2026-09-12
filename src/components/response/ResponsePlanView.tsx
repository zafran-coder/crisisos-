'use client';

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Clock,
  ArrowRight,
  Layers,
  LifeBuoy,
  Ship,
  Truck,
  HeartHandshake,
  Activity,
  Database,
  AlertOctagon,
  Info,
  ChevronDown,
  ChevronUp,
  Download,
} from 'lucide-react';
import {
  StructuredResponsePlan,
  ResponsePlanApiResponse,
} from '@/types/response-plan';
import { EnrichedZoneRecord } from '@/lib/data-access/zones';

interface ResponsePlanViewProps {
  zones: EnrichedZoneRecord[];
  incidentName?: string;
}

export function ResponsePlanView({ zones, incidentName = 'Pakistan Flood Emergency - 2026' }: ResponsePlanViewProps) {
  const [plan, setPlan] = useState<StructuredResponsePlan | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [persistenceInfo, setPersistenceInfo] = useState<{
    persisted: boolean;
    planId?: string;
    allocationsCount?: number;
    error?: string | null;
  } | null>(null);
  const [operatorNotes, setOperatorNotes] = useState<string>('');
  const [showNotesInput, setShowNotesInput] = useState<boolean>(false);
  const [expandedZone, setExpandedZone] = useState<string | null>('F-03');
  const [generationTimestamp, setGenerationTimestamp] = useState<string | null>(null);

  // Attempt to load existing plan from DB on mount
  useEffect(() => {
    async function loadExisting() {
      try {
        const res = await fetch('/api/response-plan');
        if (res.ok) {
          const json = await res.json();
          if (json.status === 'ok' && json.plan) {
            setPlan(json.plan);
            setPersistenceInfo(json.databaseRecords || null);
            setGenerationTimestamp(new Date().toLocaleTimeString());
          }
        }
      } catch {
        // Safe ignore on initial load
      }
    }
    loadExisting();
  }, []);

  const handleGeneratePlan = async () => {
    setIsLoading(true);
    setError(null);
    setLoadingStep('Connecting to Supabase telemetry & deterministic risk engine...');

    try {
      // Step simulation indicators for operator feedback
      const timer1 = setTimeout(() => {
        setLoadingStep('Retrieving Vision AI recon & emergency guidelines...');
      }, 1200);

      const timer2 = setTimeout(() => {
        setLoadingStep('Synthesizing operational directives via Gemini 3.6 Flash...');
      }, 2600);

      const res = await fetch('/api/response-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operator_notes: operatorNotes.trim() || undefined,
        }),
      });

      clearTimeout(timer1);
      clearTimeout(timer2);

      setLoadingStep('Persisting plan & allocations to Supabase response_plans...');

      const data: ResponsePlanApiResponse = await res.json();

      if (!res.ok || data.status === 'error') {
        const errMessage = data.message || 'Failed to generate operational response plan.';
        setError(errMessage);
        if (data.databaseRecords) {
          setPersistenceInfo(data.databaseRecords);
        }
        return;
      }

      if (data.plan) {
        setPlan(data.plan);
        setPersistenceInfo(data.databaseRecords || null);
        setGenerationTimestamp(new Date().toLocaleTimeString());
        if (data.plan.priority_zones && data.plan.priority_zones.length > 0) {
          setExpandedZone(data.plan.priority_zones[0].zone_code);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network failure communicating with response planning service.');
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-red-500/20 text-red-400 border-red-500/50 shadow-red-950/40';
      case 2:
        return 'bg-orange-500/20 text-orange-400 border-orange-500/50 shadow-orange-950/40';
      case 3:
        return 'bg-amber-500/20 text-amber-400 border-amber-500/50 shadow-amber-950/40';
      case 4:
        return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50 shadow-cyan-950/40';
      default:
        return 'bg-slate-700/30 text-slate-300 border-slate-700 shadow-slate-950/40';
    }
  };

  const getRiskScoreBadge = (score: number) => {
    if (score >= 90) return 'text-red-400 bg-red-950/60 border-red-700';
    if (score >= 80) return 'text-orange-400 bg-orange-950/60 border-orange-700';
    if (score >= 70) return 'text-amber-400 bg-amber-950/60 border-amber-700';
    if (score >= 50) return 'text-cyan-400 bg-cyan-950/60 border-cyan-700';
    return 'text-emerald-400 bg-emerald-950/60 border-emerald-700';
  };

  const handleExportText = () => {
    if (!plan) return;
    const content = `CRISISOS OPERATIONAL RESPONSE PLAN
Incident: ${plan.incident_name}
Generated: ${new Date().toISOString()}
Database Plan ID: ${persistenceInfo?.planId || 'N/A'}
Persisted to Supabase: ${persistenceInfo?.persisted ? 'YES' : 'NO'}

==================================================
EXECUTIVE SUMMARY:
${plan.incident_summary}

==================================================
RECOMMENDED SEQUENCE:
${plan.recommended_sequence.join('\n')}

==================================================
PRIORITY ZONES BREAKDOWN:
${plan.priority_zones
  .map(
    (z) => `
#${z.priority_rank} ZONE ${z.zone_code}: ${z.zone_name} (Risk: ${z.risk_score}/100)
Why This Order: ${z.reason}
Immediate Actions:
${z.immediate_actions.map((a) => `  - ${a}`).join('\n')}
Safety Considerations:
${z.safety_considerations.map((s) => `  - ${s}`).join('\n')}
Recommended Resource Types:
${z.recommended_resource_types.map((r) => `  - ${r}`).join('\n')}
Allocated Units:
  Rescue Teams: ${z.allocated_units.rescue_teams} | Medical: ${z.allocated_units.medical_units} | Boats: ${z.allocated_units.boats} | Ambulances: ${z.allocated_units.ambulances} | Water Units: ${z.allocated_units.water_units}
`
  )
  .join('\n--------------------------------------------------\n')}

==================================================
CRITICAL WARNINGS:
${plan.critical_warnings.map((w) => `! ${w}`).join('\n')}

==================================================
PLANNING ASSUMPTIONS & RESOURCE DISCLAIMER:
Disclaimer: ${plan.resource_status_disclaimer}
${plan.assumptions.map((a) => `* ${a}`).join('\n')}
`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CrisisOS-Response-Plan-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 font-mono select-none">
      {/* 1. Header & Tactical Control Bar */}
      <div className="rounded border border-slate-800 bg-[#0f172a]/90 p-4 shadow-md backdrop-blur">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
                  <span>AI EMERGENCY RESPONSE PLAN</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-700 text-cyan-300">
                    GEMINI 3.6 FLASH + SUPABASE RAG
                  </span>
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Grounded operational directives synthesized from deterministic risk rankings, Vision AI recon, and emergency guidelines.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowNotesInput(!showNotesInput)}
              className="py-2 px-3 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold transition-all"
            >
              {showNotesInput ? 'HIDE NOTES' : 'OPERATOR NOTES'}
            </button>

            {plan ? (
              <button
                onClick={handleGeneratePlan}
                disabled={isLoading}
                className="py-2 px-4 bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-800 text-slate-950 font-bold text-xs rounded uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer disabled:cursor-not-allowed"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? 'GENERATING FRESH PLAN...' : 'REGENERATE PLAN'}
              </button>
            ) : (
              <button
                onClick={handleGeneratePlan}
                disabled={isLoading}
                className="py-2 px-4 bg-cyan-400 hover:bg-cyan-300 disabled:bg-cyan-800 text-slate-950 font-bold text-xs rounded uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-cyan-400/20 transition-all cursor-pointer disabled:cursor-not-allowed"
              >
                <Sparkles className="h-3.5 w-3.5 fill-slate-950" />
                {isLoading ? 'SYNTHESIZING PLAN...' : 'GENERATE RESPONSE PLAN'}
              </button>
            )}

            {plan && (
              <button
                onClick={handleExportText}
                className="py-2 px-3 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all"
                title="Export operational sitrep text"
              >
                <Download className="h-3.5 w-3.5 text-cyan-400" />
                <span>EXPORT</span>
              </button>
            )}
          </div>
        </div>

        {/* Optional Operator Notes Input Drawer */}
        {showNotesInput && (
          <div className="mt-3 pt-3 border-t border-slate-800 space-y-1.5 animate-in fade-in duration-150">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center justify-between">
              <span>Incident Commander Directives / Special Conditions</span>
              <span className="text-slate-500">Will be supplied directly to Gemini context</span>
            </label>
            <textarea
              value={operatorNotes}
              onChange={(e) => setOperatorNotes(e.target.value)}
              placeholder="e.g. Bridge 12 collapsed; prioritize boat extraction over road routing; aerial recon reports secondary surge in Delta Basin."
              className="w-full h-16 p-2 rounded bg-[#090d14] border border-slate-700 text-slate-200 text-xs font-mono placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
            />
          </div>
        )}

        {/* Status & Persistence Feedback Sub-bar */}
        <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2">
          <div className="flex items-center gap-2">
            <Database className="h-3.5 w-3.5 text-cyan-400" />
            <span>INCIDENT:</span>
            <span className="text-slate-200 font-bold">{incidentName}</span>
            <span className="text-slate-600">|</span>
            <span>ACTIVE SECTOR ZONES:</span>
            <span className="text-cyan-400 font-bold">{zones.length}</span>
          </div>

          <div className="flex items-center gap-3">
            {persistenceInfo && (
              <span
                className={`px-2 py-0.5 rounded border text-[10px] font-bold flex items-center gap-1 ${
                  persistenceInfo.persisted
                    ? 'bg-emerald-950/60 border-emerald-700 text-emerald-300'
                    : 'bg-red-950/60 border-red-700 text-red-300'
                }`}
              >
                {persistenceInfo.persisted ? (
                  <>
                    <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                    <span>SUPABASE PERSISTED (ID: {persistenceInfo.planId?.slice(0, 8)}...)</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-3 w-3 text-red-400" />
                    <span>PERSISTENCE PENDING (RLS/KEY)</span>
                  </>
                )}
              </span>
            )}

            {generationTimestamp && (
              <span className="flex items-center gap-1 text-slate-500 text-[10px]">
                <Clock className="h-3 w-3" />
                <span>SYNCED: {generationTimestamp}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 2. Loading State Display */}
      {isLoading && (
        <div className="rounded border border-cyan-800/60 bg-[#0f172a]/95 p-6 text-center space-y-3 shadow-lg">
          <div className="flex justify-center">
            <RefreshCw className="h-8 w-8 text-cyan-400 animate-spin" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              OPERATIONAL SYNTHESIS IN PROGRESS
            </h3>
            <p className="text-xs text-cyan-300 font-mono mt-1">{loadingStep}</p>
          </div>
          <div className="w-full max-w-md mx-auto bg-slate-900 rounded-full h-1.5 overflow-hidden border border-slate-800">
            <div className="bg-cyan-400 h-full w-2/3 animate-pulse rounded-full" />
          </div>
          <p className="text-[10px] text-slate-500">
            Grounding risk scores from Supabase PostgreSQL &bull; Enforcing deterministic ranking &bull; Integrating Vision AI
          </p>
        </div>
      )}

      {/* 3. Error Banner */}
      {error && !isLoading && (
        <div className="rounded border border-red-800 bg-red-950/60 p-4 space-y-2">
          <div className="flex items-start gap-2.5">
            <AlertOctagon className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-red-200 uppercase tracking-wider">
                RESPONSE PLAN OPERATION ERROR
              </h3>
              <p className="text-xs text-red-300">{error}</p>
            </div>
          </div>
          <div className="pt-2 flex justify-end">
            <button
              onClick={handleGeneratePlan}
              className="py-1.5 px-3 bg-red-900/60 hover:bg-red-800 border border-red-700 text-red-100 rounded text-xs font-bold uppercase tracking-wider transition-colors"
            >
              RETRY GENERATION
            </button>
          </div>
        </div>
      )}

      {/* 4. Main Plan Display */}
      {plan && !isLoading && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Executive Situational Summary */}
          <div className="rounded border border-slate-800 bg-[#0f172a]/90 p-4 space-y-2 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-cyan-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  EXECUTIVE SITUATION SUMMARY
                </h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-950/70 border border-cyan-800 text-cyan-300">
                DEFCON-1 PROTOCOL ACTIVE
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">{plan.incident_summary}</p>

            {/* Recommended Priority Sequence Pills */}
            <div className="pt-2">
              <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1.5">
                RECOMMENDED OPERATIONAL DISPATCH SEQUENCE:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {plan.recommended_sequence.map((seq, idx) => (
                  <span
                    key={idx}
                    className="text-[11px] font-mono font-bold px-2.5 py-1 rounded bg-[#090d14] border border-slate-800 text-slate-200 flex items-center gap-1.5"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                    <span>{seq}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Priority Zones Grid Cards (Numbered #1 to #5) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5 text-cyan-400" />
                <span>SECTOR ACTION DIRECTIVES (DETERMINISTIC RANKING)</span>
              </h3>
              <span className="text-[10px] text-slate-500">
                Click any zone card to expand/collapse tactical details
              </span>
            </div>

            {plan.priority_zones.map((zone) => {
              const isExpanded = expandedZone === zone.zone_code;
              const rankColor = getRankBadgeColor(zone.priority_rank);
              const riskColor = getRiskScoreBadge(zone.risk_score);

              return (
                <div
                  key={zone.zone_code}
                  className={`rounded border transition-all ${
                    isExpanded
                      ? 'border-cyan-500/50 bg-[#0f172a] shadow-lg shadow-cyan-950/20'
                      : 'border-slate-800 bg-[#090d14]/90 hover:border-slate-700'
                  }`}
                >
                  {/* Zone Header Bar */}
                  <div
                    onClick={() => setExpandedZone(isExpanded ? null : zone.zone_code)}
                    className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      {/* Priority Rank Badge */}
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded border shadow-sm ${rankColor}`}
                      >
                        #{zone.priority_rank}
                      </span>

                      {/* Zone Code & Name */}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">
                            {zone.zone_code} &mdash; {zone.zone_name}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${riskColor}`}
                          >
                            RISK {zone.risk_score}/100
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-xl mt-0.5">
                          {zone.reason}
                        </div>
                      </div>
                    </div>

                    {/* Right-side preview metrics & toggle arrow */}
                    <div className="flex items-center gap-3 self-end sm:self-center">
                      <div className="hidden md:flex items-center gap-2 text-[10px] text-slate-400 bg-slate-900/80 px-2 py-1 rounded border border-slate-800">
                        <span>TEAMS: {zone.allocated_units.rescue_teams}</span>
                        <span>&bull;</span>
                        <span>BOATS: {zone.allocated_units.boats}</span>
                        <span>&bull;</span>
                        <span>MED: {zone.allocated_units.medical_units}</span>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-cyan-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-slate-500" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Zone Operational Details */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-1 border-t border-slate-800/80 space-y-4 animate-in fade-in duration-150">
                      {/* Rationale: Why this zone is ranked here */}
                      <div className="p-2.5 rounded bg-slate-950/70 border border-slate-800/80">
                        <div className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider mb-1 flex items-center gap-1">
                          <Info className="h-3 w-3" />
                          <span>
                            WHY RANK #{zone.priority_rank} ({zone.zone_code}):
                          </span>
                        </div>
                        <p className="text-xs text-slate-200 leading-relaxed font-sans">{zone.reason}</p>
                      </div>

                      {/* Immediate Tactical Actions */}
                      <div>
                        <div className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider mb-2 flex items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>IMMEDIATE ACTIONS REQUIRED:</span>
                        </div>
                        <ul className="space-y-1.5">
                          {zone.immediate_actions.map((act, idx) => (
                            <li
                              key={idx}
                              className="text-xs text-slate-200 bg-[#090d14] p-2 rounded border border-slate-800 flex items-start gap-2"
                            >
                              <ArrowRight className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                              <span className="font-sans">{act}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Safety Considerations & Operational Hazards */}
                      {zone.safety_considerations && zone.safety_considerations.length > 0 && (
                        <div>
                          <div className="text-[10px] uppercase font-bold text-amber-400 tracking-wider mb-2 flex items-center gap-1.5">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            <span>SAFETY HAZARDS &amp; OPERATIONAL CONSIDERATIONS:</span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {zone.safety_considerations.map((safety, idx) => (
                              <div
                                key={idx}
                                className="text-xs text-amber-200/90 bg-amber-950/20 border border-amber-900/40 p-2 rounded flex items-start gap-2 font-sans"
                              >
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                                <span>{safety}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Resource Allocation & Units Table */}
                      <div className="rounded border border-slate-800 bg-[#090d14] p-3 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-800 pb-2">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-white uppercase tracking-wider">
                            <Layers className="h-3.5 w-3.5 text-cyan-400" />
                            <span>TACTICAL ASSET ALLOCATION // ZONE {zone.zone_code}</span>
                          </div>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-400">
                            {plan.resource_status_disclaimer}
                          </span>
                        </div>

                        {/* Numeric Allocated Units Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
                          <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
                            <div className="flex items-center justify-center text-cyan-400 mb-1">
                              <Activity className="h-3.5 w-3.5" />
                            </div>
                            <div className="text-[10px] text-slate-400 font-bold uppercase">RESCUE TEAMS</div>
                            <div className="text-sm font-bold text-white mt-0.5">
                              {zone.allocated_units.rescue_teams}
                            </div>
                          </div>

                          <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
                            <div className="flex items-center justify-center text-cyan-400 mb-1">
                              <Ship className="h-3.5 w-3.5" />
                            </div>
                            <div className="text-[10px] text-slate-400 font-bold uppercase">EVAC BOATS</div>
                            <div className="text-sm font-bold text-white mt-0.5">
                              {zone.allocated_units.boats}
                            </div>
                          </div>

                          <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
                            <div className="flex items-center justify-center text-cyan-400 mb-1">
                              <HeartHandshake className="h-3.5 w-3.5" />
                            </div>
                            <div className="text-[10px] text-slate-400 font-bold uppercase">MEDICAL POSTS</div>
                            <div className="text-sm font-bold text-white mt-0.5">
                              {zone.allocated_units.medical_units}
                            </div>
                          </div>

                          <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
                            <div className="flex items-center justify-center text-cyan-400 mb-1">
                              <Truck className="h-3.5 w-3.5" />
                            </div>
                            <div className="text-[10px] text-slate-400 font-bold uppercase">AMBULANCES</div>
                            <div className="text-sm font-bold text-white mt-0.5">
                              {zone.allocated_units.ambulances}
                            </div>
                          </div>

                          <div className="p-2 rounded bg-slate-900/60 border border-slate-800 col-span-2 sm:col-span-1">
                            <div className="flex items-center justify-center text-cyan-400 mb-1">
                              <LifeBuoy className="h-3.5 w-3.5" />
                            </div>
                            <div className="text-[10px] text-slate-400 font-bold uppercase">WATER UNITS</div>
                            <div className="text-sm font-bold text-white mt-0.5">
                              {zone.allocated_units.water_units}
                            </div>
                          </div>
                        </div>

                        {/* Distinction: Recommended Resource Types vs Availability */}
                        <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                          <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                            RECOMMENDED RESOURCE TYPES NEEDED:
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {zone.recommended_resource_types.map((type, idx) => (
                              <span
                                key={idx}
                                className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-cyan-800/50 text-cyan-300 font-mono"
                              >
                                {type}
                              </span>
                            ))}
                          </div>
                          <p className="text-[10px] text-amber-400/80 italic">
                            Notice: Actual inventory tracking not provided in database; asset numbers represent tactical operational recommendations.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Critical Warnings & Assumptions Footer Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Critical Warnings */}
            <div className="rounded border border-amber-900/60 bg-amber-950/20 p-3.5 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-300 uppercase tracking-wider">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                <span>CRITICAL TACTICAL WARNINGS</span>
              </div>
              <ul className="space-y-1.5 text-xs text-amber-200/90 font-sans">
                {plan.critical_warnings.map((warn, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-amber-400 font-bold font-mono">!</span>
                    <span>{warn}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Assumptions & Disclaimers */}
            <div className="rounded border border-slate-800 bg-[#0f172a]/90 p-3.5 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
                <Info className="h-4 w-4 text-cyan-400" />
                <span>PLANNING ASSUMPTIONS &amp; CONSTRAINTS</span>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-400 font-sans">
                {plan.assumptions.map((assump, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-cyan-400 font-bold font-mono">&bull;</span>
                    <span>{assump}</span>
                  </li>
                ))}
                <li className="flex items-start gap-2 text-amber-400/90">
                  <span className="font-bold font-mono">&bull;</span>
                  <span>Resource status: {plan.resource_status_disclaimer}. Recommended equipment must be confirmed with field logistics dispatch.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* 5. Blank Slate / Initial Prompt State */}
      {!plan && !isLoading && !error && (
        <div className="rounded border border-dashed border-slate-800 bg-[#0f172a]/40 p-8 text-center space-y-3">
          <div className="flex justify-center">
            <div className="p-3 rounded-full bg-slate-900 border border-slate-800 text-cyan-400">
              <FileText className="h-6 w-6" />
            </div>
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              NO OPERATIONAL RESPONSE PLAN ACTIVE
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              Click <span className="text-cyan-400 font-bold">&quot;GENERATE RESPONSE PLAN&quot;</span> to load live telemetry from Supabase, evaluate deterministic risk rankings, integrate Vision AI recon evidence, and synthesize tactical response directives.
            </p>
          </div>
          <button
            onClick={handleGeneratePlan}
            className="py-2.5 px-5 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs rounded uppercase tracking-wider inline-flex items-center gap-2 shadow-lg shadow-cyan-400/20 transition-all cursor-pointer"
          >
            <Sparkles className="h-4 w-4 fill-slate-950" />
            GENERATE RESPONSE PLAN
          </button>
        </div>
      )}
    </div>
  );
}

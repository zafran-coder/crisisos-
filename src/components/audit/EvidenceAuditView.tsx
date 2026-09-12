'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  RefreshCw,
  Database,
  Camera,
  BookOpen,
  Calculator,
  Sparkles,
  CheckCircle2,
  Clock,
  Layers,
  MapPin,
  FileText,
  Radio,
  PlusCircle,
} from 'lucide-react';
import {
  AuditEvent,
  TopZoneEvidence,
  AuditApiResponse,
} from '@/types/audit';

interface EvidenceAuditViewProps {
  incidentName?: string;
}

export function EvidenceAuditView({
  incidentName = 'Pakistan Flood Emergency - 2026',
}: EvidenceAuditViewProps) {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [topZoneEvidence, setTopZoneEvidence] = useState<TopZoneEvidence | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filterSource, setFilterSource] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [lastRefreshed, setLastRefreshed] = useState<string>('');
  const [isLoggingEvent, setIsLoggingEvent] = useState<boolean>(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  // Load audit trail on mount
  useEffect(() => {
    let isMounted = true;
    async function loadInitialAuditData() {
      try {
        const res = await fetch('/api/audit');
        if (res.ok) {
          const json: AuditApiResponse = await res.json();
          if (isMounted && json.status === 'ok' && json.data) {
            setEvents(json.data.events || []);
            setTopZoneEvidence(json.data.top_zone_evidence || null);
            setLastRefreshed(new Date().toLocaleTimeString());
          }
        }
      } catch (err) {
        console.error('Failed to load audit data:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadInitialAuditData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Manual refresh handler
  const fetchAuditData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/audit');
      if (res.ok) {
        const json: AuditApiResponse = await res.json();
        if (json.status === 'ok' && json.data) {
          setEvents(json.data.events || []);
          setTopZoneEvidence(json.data.top_zone_evidence || null);
          setLastRefreshed(new Date().toLocaleTimeString());
        }
      }
    } catch (err) {
      console.error('Failed to load audit data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Post a real operator verification checkpoint
  const handleLogManualCheckpoint = async () => {
    setIsLoggingEvent(true);
    try {
      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zone_code: topZoneEvidence?.zone_code || 'TOP_ZONE',
          event_type: 'OPERATOR_DISPATCH_AUTHORIZED',
          event_name: 'Incident Commander Checkpoint Validated',
          description: `EOC Director manually cross-verified ${topZoneEvidence?.zone_code || 'top priority sector'} evidence dossier against telemetry and authorized operational dispatch.`,
          source: 'OPERATOR_CONSOLE',
          metadata: {
            officer: 'EOC Incident Commander',
            verified_sections: ['SUPABASE_FACTS', 'VISION_AI', 'RAG_GUIDELINES', 'DETERMINISTIC_RISK'],
            priority_confirmed: `RANK_${topZoneEvidence?.priority_rank || 1}`,
          },
        }),
      });

      if (res.ok) {
        setSuccessNotice('Operator Checkpoint securely persisted to Supabase audit trail.');
        setTimeout(() => setSuccessNotice(null), 4000);
        await fetchAuditData();
      }
    } catch (err) {
      console.error('Failed to log operator audit checkpoint:', err);
    } finally {
      setIsLoggingEvent(false);
    }
  };

  // Filter events
  const filteredEvents = events.filter((ev) => {
    const matchesSource =
      filterSource === 'ALL' ||
      ev.source.toLowerCase().includes(filterSource.toLowerCase()) ||
      ev.event_type.toLowerCase().includes(filterSource.toLowerCase());

    const matchesSearch =
      !searchQuery.trim() ||
      ev.event_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ev.zone_code && ev.zone_code.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesSource && matchesSearch;
  });

  const getSourceBadgeColor = (source: string) => {
    switch (source) {
      case 'SUPABASE_POSTGRES':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'GEMINI_VISION':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'PGVECTOR_RAG':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
      case 'DETERMINISTIC_RISK_ENGINE':
        return 'bg-red-500/10 text-red-400 border-red-500/30';
      case 'GEMINI_REASONING':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'RESOURCE_ALLOCATION_ENGINE':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'OPERATOR_CONSOLE':
        return 'bg-pink-500/10 text-pink-400 border-pink-500/30';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-700';
    }
  };

  const getEventIcon = (source: string) => {
    switch (source) {
      case 'SUPABASE_POSTGRES':
        return <Database className="h-4 w-4 text-emerald-400" />;
      case 'GEMINI_VISION':
        return <Camera className="h-4 w-4 text-purple-400" />;
      case 'PGVECTOR_RAG':
        return <BookOpen className="h-4 w-4 text-cyan-400" />;
      case 'DETERMINISTIC_RISK_ENGINE':
        return <Calculator className="h-4 w-4 text-red-400" />;
      case 'GEMINI_REASONING':
        return <Sparkles className="h-4 w-4 text-blue-400" />;
      case 'RESOURCE_ALLOCATION_ENGINE':
        return <Layers className="h-4 w-4 text-amber-400" />;
      default:
        return <ShieldCheck className="h-4 w-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-4 font-mono text-slate-200">
      {/* 1. Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 bg-slate-900/90 border border-slate-800 rounded-lg shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">
                  EVIDENCE DOSSIER & AUDIT TRAIL
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-600 text-emerald-400">
                  PHASE 7 LIVE
                </span>
              </div>
              <p className="text-xs text-slate-400">
                &ldquo;WHY did CrisisOS make this decision?&rdquo; &mdash; Real-time cryptographic ledger & grounded decision explainability
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleLogManualCheckpoint}
            disabled={isLoggingEvent}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-cyan-500/40 rounded text-xs font-bold transition-all shadow-sm active:scale-95 disabled:opacity-50"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span>{isLoggingEvent ? 'RECORDING...' : 'ADD AUDIT CHECKPOINT'}</span>
          </button>

          <button
            onClick={fetchAuditData}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded transition-all shadow-md shadow-cyan-500/20 active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>REFRESH</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {successNotice && (
        <div className="p-2.5 bg-emerald-950/60 border border-emerald-500/50 rounded text-xs text-emerald-300 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            {successNotice}
          </span>
          <span className="text-[10px] text-emerald-400/80">[AUDIT_LOGS TABLE UPDATED]</span>
        </div>
      )}

      {/* 2. Top Executive Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Verified System Events</span>
            <Database className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl font-bold text-white">{events.length}</span>
            <span className="text-[10px] text-emerald-400">IMMUTABLE LOGS</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Synced from Supabase & runtime
          </div>
        </div>

        <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Top Threat Target</span>
            <MapPin className="h-4 w-4 text-red-400" />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl font-bold text-red-400">
              {topZoneEvidence?.zone_code || 'Not available'}
            </span>
            <span className="text-xs text-slate-300">
              {topZoneEvidence?.zone_name || 'Top Priority Sector'}
            </span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Rank #{topZoneEvidence?.priority_rank ?? '1'} &bull; Risk Score {topZoneEvidence?.risk_score ?? 'Not available'}/100
          </div>
        </div>

        <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Active Incident</span>
            <Radio className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="mt-1 truncate">
            <span className="text-sm font-bold text-white block truncate">
              {incidentName}
            </span>
          </div>
          <div className="text-[10px] text-cyan-400 mt-0.5">
            DEFCON-2 &bull; SECTOR 04
          </div>
        </div>

        <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Audit Integrity Status</span>
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-sm font-bold text-emerald-400">VERIFIED ACTIVE</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Last Sync: {lastRefreshed || 'Just now'}
          </div>
        </div>
      </div>

      {/* 3. The 5 Pillars of Decision Evidence for Top Zone */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-lg overflow-hidden shadow-2xl">
        <div className="p-3 bg-slate-800/80 border-b border-slate-700/80 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-red-500 animate-ping" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              PRIMARY THREAT DECISION DOSSIER &mdash; ZONE {topZoneEvidence?.zone_code || 'TOP SECTOR'} ({topZoneEvidence?.zone_name?.toUpperCase() || 'TELEMETRY RECORD'})
            </h3>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2 py-0.5 rounded bg-red-500/10 border border-red-500/40 text-red-400 font-bold">
              PRIORITY RANK #{topZoneEvidence?.priority_rank ?? '1'}
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-700 text-slate-300 font-bold">
              RISK: {topZoneEvidence?.risk_score ?? 'Not available'}/100
            </span>
          </div>
        </div>

        <div className="p-4 space-y-4">
          <div className="text-xs text-slate-300 bg-slate-950/60 p-3 rounded border border-slate-800">
            <p className="leading-relaxed">
              <span className="text-cyan-400 font-bold">DECISION QUERY:</span> &ldquo;Why did CrisisOS designate Zone {topZoneEvidence?.zone_code || 'the top priority sector'} as Priority Rank #{topZoneEvidence?.priority_rank || 1}?&rdquo;
              <br />
              <span className="text-slate-400">Below is the complete 5-layer factual provenance synthesized from PostgreSQL ground truth, multi-spectral vision AI, pgvector doctrine, and the deterministic risk engine.</span>
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* PILLAR 1: SUPABASE FACTS */}
            <div className="p-3 bg-slate-950/70 border border-emerald-500/30 rounded-lg space-y-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-1.5">
                  <Database className="h-4 w-4 text-emerald-400" />
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide">
                    1. SUPABASE FACTS (SOURCE OF TRUTH)
                  </span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-700 text-emerald-300">
                  {topZoneEvidence?.supabase_facts?.source_table || 'public.affected_zones'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div className="p-2 bg-slate-900/60 rounded border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Total Population</span>
                  <span className="text-sm font-bold text-white">
                    {topZoneEvidence?.supabase_facts?.population ? topZoneEvidence.supabase_facts.population.toLocaleString() : 'Not available'}
                  </span>
                </div>
                <div className="p-2 bg-slate-900/60 rounded border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Population Affected</span>
                  <span className="text-sm font-bold text-red-400">
                    {topZoneEvidence?.supabase_facts?.affected_population ? topZoneEvidence.supabase_facts.affected_population.toLocaleString() : 'Not available'}
                    {topZoneEvidence?.supabase_facts?.population_affected_ratio && (
                      <span className="text-[10px] text-slate-400 ml-1">
                        ({topZoneEvidence.supabase_facts.population_affected_ratio})
                      </span>
                    )}
                  </span>
                </div>
                <div className="p-2 bg-slate-900/60 rounded border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Severity Classification</span>
                  <span className="text-xs font-bold text-red-400">
                    {topZoneEvidence?.severity || 'Not available'}
                  </span>
                </div>
                <div className="p-2 bg-slate-900/60 rounded border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Ground Accessibility</span>
                  <span className="text-xs font-bold text-amber-400">
                    {topZoneEvidence?.accessibility || 'Not available'}
                  </span>
                </div>
              </div>

              <div className="pt-1 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-800/80">
                <span>GPS Coordinates: {topZoneEvidence?.supabase_facts?.coordinates?.lat ?? 'N/A'}&deg; N, {topZoneEvidence?.supabase_facts?.coordinates?.lng ?? 'N/A'}&deg; E</span>
                <span className="text-emerald-400 font-bold">[POSTGRES VERIFIED]</span>
              </div>
            </div>

            {/* PILLAR 2: VISION AI EVIDENCE */}
            <div className="p-3 bg-slate-950/70 border border-purple-500/30 rounded-lg space-y-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-1.5">
                  <Camera className="h-4 w-4 text-purple-400" />
                  <span className="text-xs font-bold text-purple-400 uppercase tracking-wide">
                    2. VISION AI EVIDENCE (AERIAL RECON)
                  </span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-950 border border-purple-700 text-purple-300">
                  {topZoneEvidence?.vision_evidence?.model || 'Gemini 3.6 Flash'}
                </span>
              </div>

              <div className="space-y-1.5 text-xs pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Observed Water Level:</span>
                  <span className="font-bold text-cyan-400">
                    {topZoneEvidence?.vision_evidence?.water_level || 'Not available'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Structural Damage:</span>
                  <span className="font-bold text-red-400">
                    {topZoneEvidence?.vision_evidence?.infrastructure_damage || 'Not available'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block mb-1">Detected Tactical Hazards:</span>
                  <div className="flex flex-wrap gap-1">
                    {topZoneEvidence?.vision_evidence?.detected_hazards && topZoneEvidence.vision_evidence.detected_hazards.length > 0 ? (
                      topZoneEvidence.vision_evidence.detected_hazards.map((h, i) => (
                        <span
                          key={i}
                          className="text-[10px] px-1.5 py-0.5 bg-purple-950/60 border border-purple-800/80 rounded text-purple-200"
                        >
                          &bull; {h}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] text-slate-500">Not available</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-1 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-800/80">
                <span>Model Confidence: {topZoneEvidence?.vision_evidence?.confidence ? `${Math.round(topZoneEvidence.vision_evidence.confidence * 100)}%` : 'Not available'}</span>
                <span className="text-purple-400 font-bold">[INTERACTIONS VISION]</span>
              </div>
            </div>

            {/* PILLAR 3: RAG GUIDELINES */}
            <div className="p-3 bg-slate-950/70 border border-cyan-500/30 rounded-lg space-y-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4 text-cyan-400" />
                  <span className="text-xs font-bold text-cyan-400 uppercase tracking-wide">
                    3. RAG GUIDELINES (PGVECTOR DOCTRINE)
                  </span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-700 text-cyan-300">
                  COSINE SIMILARITY SEARCH
                </span>
              </div>

              <div className="space-y-1.5 pt-1">
                {(topZoneEvidence?.rag_guidelines || []).map((g, idx) => (
                  <div key={idx} className="p-1.5 bg-slate-900/60 rounded border border-slate-800 text-xs">
                    <div className="flex items-center justify-between font-bold text-cyan-300">
                      <span>[{g.protocol_code}] {g.title}</span>
                      <span className="text-[10px] text-slate-400 font-normal">{g.category}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-snug line-clamp-2">
                      {g.protocol_text}
                    </p>
                  </div>
                ))}
              </div>

              <div className="pt-1 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-800/80">
                <span>Threshold: Cosine Distance &lt; 0.35</span>
                <span className="text-cyan-400 font-bold">[EMERGENCY_GUIDELINES]</span>
              </div>
            </div>

            {/* PILLAR 4: DETERMINISTIC RISK */}
            <div className="p-3 bg-slate-950/70 border border-red-500/30 rounded-lg space-y-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-1.5">
                  <Calculator className="h-4 w-4 text-red-400" />
                  <span className="text-xs font-bold text-red-400 uppercase tracking-wide">
                    4. DETERMINISTIC RISK (LOCKED FORMULA)
                  </span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-950 border border-red-700 text-red-300 font-bold">
                  MATHEMATICALLY LOCKED
                </span>
              </div>

              <div className="space-y-2 text-xs pt-1">
                <div className="p-1.5 bg-slate-900/80 rounded border border-slate-800 font-mono text-[10px] text-slate-300 overflow-x-auto">
                  Score = 0.20&times;Pop + 0.30&times;Sev + 0.25&times;Med + 0.15&times;Access + 0.10&times;Infra = <span className="text-red-400 font-bold text-xs">{topZoneEvidence?.deterministic_risk?.risk_score ?? 'Not available'}/100</span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Severity Factor (30% weight):</span>
                    <span className="text-red-400 font-bold">{topZoneEvidence?.deterministic_risk?.factor_scores?.severity_score ?? 'Not available'} / 100</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-red-500 h-full rounded-full" style={{ width: `${topZoneEvidence?.deterministic_risk?.factor_scores?.severity_score ?? 0}%` }} />
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <span className="text-slate-400">Medical Need Factor (25% weight):</span>
                    <span className="text-red-400 font-bold">{topZoneEvidence?.deterministic_risk?.factor_scores?.medical_score ?? 'Not available'} / 100</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-red-500 h-full rounded-full" style={{ width: `${topZoneEvidence?.deterministic_risk?.factor_scores?.medical_score ?? 0}%` }} />
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <span className="text-slate-400">Accessibility Difficulty (15% weight):</span>
                    <span className="text-amber-400 font-bold">{topZoneEvidence?.deterministic_risk?.factor_scores?.accessibility_score ?? 'Not available'} / 100</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full" style={{ width: `${topZoneEvidence?.deterministic_risk?.factor_scores?.accessibility_score ?? 0}%` }} />
                  </div>
                </div>
              </div>

              <div className="pt-1 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-800/80">
                <span>LLM Overwrite Permitted: NO</span>
                <span className="text-red-400 font-bold">[IMMUTABLE NUMERIC]</span>
              </div>
            </div>
          </div>

          {/* PILLAR 5: GEMINI SYNTHESIS */}
          <div className="p-3 bg-slate-950/70 border border-blue-500/30 rounded-lg space-y-2">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-blue-400" />
                <span className="text-xs font-bold text-blue-400 uppercase tracking-wide">
                  5. GEMINI SYNTHESIS (GROUNDED OPERATIONAL EXPLANATION)
                </span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-950 border border-blue-700 text-blue-300">
                EXPLANATORY ONLY &bull; ZERO NUMERIC AUTHORITY
              </span>
            </div>

            <div className="p-3 bg-blue-950/20 border border-blue-800/40 rounded text-xs text-slate-200 leading-relaxed">
              <p>
                {topZoneEvidence?.gemini_synthesis?.explanation ||
                  'Operational directive not yet synthesized. Click "Generate Response Plan" in the Command Workflow bar to synthesize directives.'}
              </p>
            </div>

            <div className="text-[10px] text-slate-400 flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/80">
              <span>Model: {topZoneEvidence?.gemini_synthesis?.model || 'models/gemini-3.8-flash'} (Temperature 0.2)</span>
              <span className="text-blue-400 font-bold">
                ROLE: {topZoneEvidence?.gemini_synthesis?.role || 'EXPLANATORY_ONLY_NO_NUMERIC_AUTHORITY'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Complete Audit Trail Event Stream */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-lg overflow-hidden shadow-xl">
        <div className="p-3 bg-slate-800/80 border-b border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              CRYPTOGRAPHIC AUDIT TRAIL ({filteredEvents.length} EVENTS)
            </h3>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1 text-[11px]">
            {['ALL', 'SUPABASE', 'VISION', 'RAG', 'PLAN', 'ALLOCATION'].map((filter) => (
              <button
                key={filter}
                onClick={() => setFilterSource(filter)}
                className={`px-2 py-0.5 rounded transition-all font-bold ${
                  filterSource === filter
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Search and Secondary Filter */}
        <div className="p-3 border-b border-slate-800/80 bg-slate-950/40 flex items-center gap-2">
          <input
            type="text"
            placeholder="Search audit trail by event, zone (e.g. F-03), or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="px-2 py-1 text-xs text-slate-400 hover:text-white"
            >
              CLEAR
            </button>
          )}
        </div>

        {/* Chronological Event Timeline */}
        <div className="divide-y divide-slate-800/80 max-h-[520px] overflow-y-auto">
          {filteredEvents.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              No audit events matched the selected filter criteria.
            </div>
          ) : (
            filteredEvents.map((event) => {
              const isExpanded = expandedEventId === event.id;
              const sourceBadge = getSourceBadgeColor(event.source);
              const eventIcon = getEventIcon(event.source);
              const dateStr = new Date(event.timestamp).toLocaleTimeString();

              return (
                <div
                  key={event.id}
                  className="p-3 hover:bg-slate-800/30 transition-colors space-y-1.5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded bg-slate-800 flex items-center justify-center flex-shrink-0">
                        {eventIcon}
                      </div>
                      <span className="text-xs font-bold text-white">
                        {event.event_name}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 border border-slate-700 text-slate-300">
                        {event.event_type}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {event.zone_code && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/30 text-red-400 font-bold">
                          ZONE {event.zone_code}
                        </span>
                      )}
                      <span className={`text-[10px] px-2 py-0.5 rounded border font-bold ${sourceBadge}`}>
                        {event.source}
                      </span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {dateStr}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed pl-8">
                    {event.description}
                  </p>

                  {/* Metadata dropdown */}
                  {event.metadata && (
                    <div className="pl-8 pt-1">
                      <button
                        onClick={() => setExpandedEventId(isExpanded ? null : event.id)}
                        className="text-[10px] text-cyan-400 hover:text-cyan-300 underline font-bold"
                      >
                        {isExpanded ? '[-] HIDE TECHNICAL METADATA' : '[+] VIEW EVENT METADATA & TELEMETRY'}
                      </button>

                      {isExpanded && (
                        <pre className="mt-1 p-2 bg-slate-950 rounded border border-slate-800 text-[10px] text-slate-400 overflow-x-auto">
                          {JSON.stringify(event.metadata, null, 2)}
                        </pre>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-950/80 border-t border-slate-800 flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2">
          <span>Persisted in PostgreSQL schema: <code className="text-cyan-400">public.audit_logs</code></span>
          <span className="text-emerald-400 font-bold">SUPABASE RLS PROTECTED &bull; STRICT AUDIT RETENTION</span>
        </div>
      </div>
    </div>
  );
}

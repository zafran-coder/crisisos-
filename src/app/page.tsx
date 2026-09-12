'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopStatusBar } from '@/components/layout/TopStatusBar';
import { KPICards } from '@/components/dashboard/KPICards';
import { DisasterMap } from '@/components/map/DisasterMap';
import { ZoneTelemetryTable } from '@/components/zones/ZoneTelemetryTable';
import { RiskEngineCard } from '@/components/risk/RiskEngineCard';
import { ExplainabilityBox } from '@/components/risk/ExplainabilityBox';
import { ResponsePlanCard } from '@/components/response/ResponsePlanCard';
import { ResponsePlanView } from '@/components/response/ResponsePlanView';
import { ResourceMatrixView } from '@/components/resources/ResourceMatrixView';
import { ImageAnalysisView } from '@/components/vision/ImageAnalysisView';
import { EvidenceAuditView } from '@/components/audit/EvidenceAuditView';
import { TacticalMapView } from '@/components/map/TacticalMapView';
import { AffectedZonesView } from '@/components/zones/AffectedZonesView';
import { RiskAnalysisView } from '@/components/risk/RiskAnalysisView';
import { PriorityRankingView } from '@/components/priority/PriorityRankingView';
import { EmergencyGuidelinesView } from '@/components/guidelines/EmergencyGuidelinesView';
import { SettingsView } from '@/components/settings/SettingsView';
import { OperatorWorkflowBar } from '@/components/workflow/OperatorWorkflowBar';
import { TopZoneIntelligenceDossier } from '@/components/workflow/TopZoneIntelligenceDossier';
import { CommandDecisionCard } from '@/components/workflow/CommandDecisionCard';
import { getFallbackZonesWithRisk, FALLBACK_INCIDENT } from '@/data/fallback-zones';
import { EnrichedZoneRecord } from '@/lib/data-access/zones';
import { StructuredResponsePlan } from '@/types/response-plan';
import { ResourceMatrixPayload } from '@/types/allocations';
import { Database } from 'lucide-react';

export default function CommandCenter() {
  const [zones, setZones] = useState<EnrichedZoneRecord[]>([]);
  const [selectedZoneCode, setSelectedZoneCode] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [isSimulation, setIsSimulation] = useState<boolean>(false);
  const [dataSource, setDataSource] = useState<'supabase' | 'fallback'>('fallback');
  const [incident, setIncident] = useState(FALLBACK_INCIDENT);
  const [dispatchAlert, setDispatchAlert] = useState<string | null>(null);

  // Dynamic workflow states connecting real backend data
  const [visionFindings, setVisionFindings] = useState<{
    water_level?: string;
    infrastructure_damage?: string;
    hazards?: string[];
    summary?: string;
  } | null>(null);

  const [guidelines, setGuidelines] = useState<
    Array<{ protocol_code?: string; title?: string; category?: string; protocol_text?: string }>
  >([]);

  const [plan, setPlan] = useState<StructuredResponsePlan | null>(null);
  const [allocations, setAllocations] = useState<ResourceMatrixPayload | null>(null);

  // Load initial operational data & pre-load persisted artifacts from Supabase
  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/zones');
        if (res.ok) {
          const json = await res.json();
          if (json.incident) {
            setIncident(json.incident);
          }
          if (json.zones && json.zones.length > 0) {
            setZones(json.zones);
            setDataSource(json.source || 'fallback');
            // Dynamically select the highest priority zone (lowest priorityRank) from backend
            const sorted = [...json.zones].sort((a, b) => a.priorityRank - b.priorityRank);
            if (sorted[0]?.code) {
              setSelectedZoneCode(sorted[0].code);
            }
          }
        }
      } catch {
        // Safe fallback if API fetch fails
      }

      // Pre-load existing allocations from backend if available
      try {
        const allocRes = await fetch('/api/allocations');
        if (allocRes.ok) {
          const allocJson = await allocRes.json();
          if (allocJson.status === 'ok' && allocJson.data) {
            setAllocations(allocJson.data);
          }
        }
      } catch {
        // Non-blocking
      }

      // Pre-load existing audit & evidence from backend if available
      try {
        const auditRes = await fetch('/api/audit');
        if (auditRes.ok) {
          const auditJson = await auditRes.json();
          if (auditJson.status === 'ok' && auditJson.data?.top_zone_evidence) {
            const te = auditJson.data.top_zone_evidence;
            if (te.vision_evidence && te.vision_evidence.status === 'AVAILABLE') {
              setVisionFindings({
                water_level: te.vision_evidence.water_level,
                infrastructure_damage: te.vision_evidence.infrastructure_damage,
                hazards: te.vision_evidence.detected_hazards,
                summary: te.vision_evidence.summary,
              });
            }
            if (te.rag_guidelines && te.rag_guidelines.length > 0) {
              setGuidelines(te.rag_guidelines);
            }
          }
        }
      } catch {
        // Non-blocking
      }
    }

    loadData();
  }, []);

  // Filtered zones based on search filter
  const filteredZones = zones.filter((z) => {
    if (!searchFilter.trim()) return true;
    const query = searchFilter.toLowerCase();
    return (
      z.code.toLowerCase().includes(query) ||
      z.name.toLowerCase().includes(query) ||
      z.sector.toLowerCase().includes(query)
    );
  });

  const fallbackZones = getFallbackZonesWithRisk().map((z) => ({
    ...z,
    source: 'fallback' as const,
  }));

  const activeZoneList = zones.length > 0 ? zones : fallbackZones;
  const sortedByRank = [...activeZoneList].sort((a, b) => a.priorityRank - b.priorityRank);
  const topPriorityZone = sortedByRank[0] || fallbackZones[0];

  // Currently selected zone (defaults to highest priority zone)
  const selectedZone =
    zones.find((z) => z.code.toUpperCase() === selectedZoneCode.toUpperCase()) ||
    topPriorityZone;

  const handleExecuteGlobalDispatch = () => {
    setDispatchAlert(
      `GLOBAL DISPATCH DIRECTIVE EXECUTED: All available rescue assets mobilized for Sector ${selectedZone.code} (${selectedZone.name}).`
    );
    setTimeout(() => {
      setDispatchAlert(null);
    }, 5000);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0b0f17] text-slate-100 select-none">
      {/* 1. Left Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        zoneCount={zones.length}
        defconLevel={FALLBACK_INCIDENT.severity_level}
        onExecuteDispatch={handleExecuteGlobalDispatch}
      />

      {/* Main Command Center Stage */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* 2. Top Incident Status Header */}
        <TopStatusBar
          incidentName={incident.name}
          disasterType={incident.disaster_type}
          locationName={incident.location_name || incident.sector}
          defconLevel={incident.severity || 'CRITICAL'}
          zuluTime={FALLBACK_INCIDENT.zulu_time}
          isSimulation={isSimulation}
          onToggleSimulation={() => setIsSimulation(!isSimulation)}
          searchFilter={searchFilter}
          onSearchChange={setSearchFilter}
          dataSource={dataSource}
        />

        {/* Global Dispatch Broadcast Banner */}
        {dispatchAlert && (
          <div className="bg-cyan-500 text-slate-950 px-4 py-1.5 text-xs font-mono font-bold flex items-center justify-between border-b border-cyan-400 animate-in slide-in-from-top duration-200">
            <span>{dispatchAlert}</span>
            <button
              onClick={() => setDispatchAlert(null)}
              className="text-slate-900 hover:text-black font-bold uppercase"
            >
              [DISMISS]
            </button>
          </div>
        )}

        {/* 3. Operational Grid Content Body */}
        <main className="flex-1 p-3 sm:p-4 overflow-y-auto space-y-3">
          {/* Top Row: 6 KPI Cards */}
          <KPICards
            zones={activeZoneList}
            rescueTeams={{
              deployed: FALLBACK_INCIDENT.metrics.rescue_teams_deployed,
              total: FALLBACK_INCIDENT.metrics.rescue_teams_total,
              standbyLabel: FALLBACK_INCIDENT.metrics.rescue_teams_standby,
            }}
            medicalUnits={{
              deployed: FALLBACK_INCIDENT.metrics.medical_units_deployed,
              total: FALLBACK_INCIDENT.metrics.medical_units_total,
              enRouteLabel: FALLBACK_INCIDENT.metrics.medical_units_en_route,
            }}
            severityScore={FALLBACK_INCIDENT.metrics.incident_severity}
          />

          {/* Central Operator Workflow Controller: Action Buttons Calling REAL Backend Endpoints */}
          <OperatorWorkflowBar
            activeTopZone={topPriorityZone}
            onSelectTab={setActiveTab}
            onSelectZone={setSelectedZoneCode}
            onVisionAnalysisComplete={(findings) => setVisionFindings(findings)}
            onGuidelinesRetrieved={(retrieved) => setGuidelines(retrieved)}
            onPlanGenerated={(generatedPlan) => setPlan(generatedPlan)}
            onAllocationsGenerated={(newAllocations) => setAllocations(newAllocations)}
            hasVisionFindings={Boolean(visionFindings)}
            hasGuidelines={guidelines.length > 0}
            hasResponsePlan={Boolean(plan)}
            hasAllocations={Boolean(allocations)}
          />

          {/* Dynamic View Router: Renders the exact portion of the page clicked on the left sidebar */}
          {activeTab === 'map' ? (
            <TacticalMapView
              zones={activeZoneList}
              selectedZoneCode={selectedZone.code}
              onSelectZone={setSelectedZoneCode}
            />
          ) : activeTab === 'zones' ? (
            <AffectedZonesView
              zones={activeZoneList}
              selectedZone={selectedZone}
              onSelectZone={setSelectedZoneCode}
              onExecuteDispatch={handleExecuteGlobalDispatch}
              onViewRiskAnalysis={() => setActiveTab('risk')}
            />
          ) : activeTab === 'risk' ? (
            <RiskAnalysisView
              zones={activeZoneList}
              selectedZone={selectedZone}
              onSelectZone={setSelectedZoneCode}
              onViewEvidence={() => setActiveTab('audit')}
            />
          ) : activeTab === 'priority' ? (
            <PriorityRankingView
              zones={activeZoneList}
              onSelectZone={setSelectedZoneCode}
              onExecuteDispatch={handleExecuteGlobalDispatch}
              onViewResponsePlan={() => setActiveTab('response')}
            />
          ) : activeTab === 'vision' ? (
            <ImageAnalysisView
              zones={activeZoneList}
              selectedZone={selectedZone}
              onSelectZone={setSelectedZoneCode}
            />
          ) : activeTab === 'resources' ? (
            <ResourceMatrixView
              zones={activeZoneList}
              incidentName={incident.name}
            />
          ) : activeTab === 'response' ? (
            <ResponsePlanView
              zones={activeZoneList}
              incidentName={incident.name}
            />
          ) : activeTab === 'guidelines' ? (
            <EmergencyGuidelinesView initialGuidelines={guidelines} />
          ) : activeTab === 'audit' ? (
            <EvidenceAuditView incidentName={incident.name} />
          ) : activeTab === 'settings' ? (
            <SettingsView
              defconLevel={incident.severity || 'CRITICAL'}
              isSimulation={isSimulation}
              onToggleSimulation={() => setIsSimulation(!isSimulation)}
              dataSource={dataSource}
            />
          ) : (
            /* Core Dual-Column Overview Layout matching Google Stitch design */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
              {/* Left & Center: Geospatial Situational Radar + Affected Zones Matrix (7 cols on 1440p) */}
              <div className="lg:col-span-7 space-y-3">
                {/* Tactical Disaster Map */}
                <div id="section-map">
                  <DisasterMap
                    zones={filteredZones.length > 0 ? filteredZones : zones}
                    selectedZoneCode={selectedZone.code}
                    onSelectZone={setSelectedZoneCode}
                  />
                </div>

                {/* Affected Zones Telemetry Matrix Table */}
                <div id="section-zones">
                  <ZoneTelemetryTable
                    zones={filteredZones.length > 0 ? filteredZones : zones}
                    selectedZoneCode={selectedZone.code}
                    onSelectZone={setSelectedZoneCode}
                  />
                </div>
              </div>

              {/* Right: AI Real-Time Triage + Command Decision + Top Intelligence Dossier (5 cols on 1440p) */}
              <div className="lg:col-span-5 space-y-3">
                {/* Authoritative Command Decision Panel: Where should rescue teams go first, and why? */}
                <CommandDecisionCard
                  topZone={topPriorityZone}
                  plan={plan}
                  allocations={allocations}
                  visionFindings={visionFindings}
                  guidelines={guidelines}
                  onExecuteDispatch={() =>
                    setDispatchAlert(
                      `DISPATCH DIRECTIVE AUTHORIZED FOR SECTOR ${topPriorityZone.code}: Tactical emergency assets deployed.`
                    )
                  }
                  onViewFullEvidence={() => setActiveTab('audit')}
                />

                {/* Top-Priority Zone Comprehensive Intelligence Dossier with Strict Source Badges */}
                <TopZoneIntelligenceDossier
                  zone={topPriorityZone}
                  visionFindings={visionFindings}
                  guidelines={guidelines}
                  plan={plan}
                  allocations={allocations}
                />

                {/* Immediate Rescue Target & Composite Score Card for currently selected zone */}
                <RiskEngineCard zone={selectedZone} />

                {/* 5-Factor Decision Explainability Matrix */}
                <ExplainabilityBox
                  zone={selectedZone}
                  onViewEvidence={() => setActiveTab('audit')}
                />

                {/* Recommended Allocation & Response Dispatch Plan */}
                <ResponsePlanCard
                  zone={selectedZone}
                  onViewFullPlan={() => setActiveTab('response')}
                  onExecuteDispatch={() =>
                    setDispatchAlert(
                      `DISPATCH AUTHORIZED FOR ZONE ${selectedZone.code}: Tactical rescue units deployed.`
                    )
                  }
                />
              </div>
            </div>
          )}
        </main>

        {/* 4. Bottom Global Ticker Status Bar */}
        <footer className="h-7 bg-[#090d14] border-t border-slate-800 flex items-center justify-between px-4 font-mono text-[10px] text-slate-400 select-none flex-shrink-0">
          <div className="flex items-center gap-3 overflow-hidden truncate">
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              SYSTEM INTEGRITY: 99.98%
            </span>
            <span className="text-slate-600">|</span>
            <span>SATELLITE DOWNLINK: GOES-16 ACTIVE</span>
            <span className="text-slate-600">|</span>
            <span>NWS FLOOD RADAR SYNC: 24 SEC AGO</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">crisis.os secure enclave #04</span>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <span className="flex items-center gap-1">
              <Database className="h-3 w-3 text-cyan-400" />
              <span className="text-slate-400">DATA:</span>
              <span className="text-cyan-400 font-bold uppercase">
                {dataSource === 'supabase' ? 'LIVE SUPABASE' : 'FALLBACK CACHE'}
              </span>
            </span>
            <span className="text-slate-300 font-bold bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded">
              [SESSION AUTH: C. VANCE]
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}

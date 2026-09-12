'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Upload,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Loader2,
  Eye,
  AlertOctagon,
  LifeBuoy,
  Layers,
  Database,
  ArrowRight,
  Info,
  RotateCcw,
} from 'lucide-react';
import { EnrichedZoneRecord } from '@/lib/data-access/zones';
import { VisionApiResponse } from '@/types/vision';

interface ImageAnalysisViewProps {
  zones: EnrichedZoneRecord[];
  selectedZone: EnrichedZoneRecord;
  onSelectZone: (zoneCode: string) => void;
}

// Demo Presets: Curated royalty-free / SVG tactical disaster scenes for instant 1-click hackathon demonstrations
const DEMO_PRESETS = [
  {
    id: 'flood-delta',
    title: 'Delta Basin Confluence',
    description: 'Submerged residential structures and rising river flood line',
    zoneCode: 'F-03',
    // Realistic SVG rendering of aerial flood scene for zero-dependency instant testing
    svgData: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
      <defs>
        <linearGradient id="water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#1e3a5f"/>
          <stop offset="100%" stop-color="#0f172a"/>
        </linearGradient>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#334155" stroke-width="0.5"/>
        </pattern>
      </defs>
      <rect width="800" height="600" fill="#0f172a"/>
      <rect width="800" height="600" fill="url(#grid)"/>
      <path d="M 0 320 Q 200 280, 400 340 T 800 300 L 800 600 L 0 600 Z" fill="url(#water)" opacity="0.9"/>
      <rect x="140" y="240" width="120" height="100" fill="#475569" stroke="#94a3b8" stroke-width="2"/>
      <polygon points="130,240 200,180 270,240" fill="#dc2626"/>
      <circle cx="200" cy="205" r="8" fill="#fbbf24"/>
      <circle cx="215" cy="210" r="7" fill="#fbbf24"/>
      <rect x="360" y="290" width="140" height="80" fill="#334155" stroke="#64748b" stroke-width="2"/>
      <polygon points="350,290 430,230 510,290" fill="#991b1b"/>
      <rect x="580" y="220" width="100" height="120" fill="#475569" stroke="#94a3b8" stroke-width="2"/>
      <polygon points="570,220 630,170 690,220" fill="#b91c1c"/>
      <path d="M 0 350 Q 300 360, 800 340" stroke="#38bdf8" stroke-width="6" fill="none" stroke-dasharray="10 5"/>
      <text x="20" y="40" fill="#ef4444" font-family="monospace" font-size="20" font-weight="bold">CRISIS.OS // RECON DRONE FEED 04-A</text>
      <text x="20" y="70" fill="#38bdf8" font-family="monospace" font-size="14">SECTOR: F-03 DELTA BASIN // WATER LEVEL: +3.8M OVER BANK</text>
      <text x="180" y="170" fill="#fbbf24" font-family="monospace" font-size="12" font-weight="bold">SURVIVORS ON ROOF (2)</text>
    </svg>`,
  },
  {
    id: 'bridge-collapse',
    title: 'River Bend Crossing',
    description: 'Bridge structural failure and roadway washout',
    zoneCode: 'B-02',
    svgData: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
      <rect width="800" height="600" fill="#090d14"/>
      <path d="M 0 200 L 800 380 L 800 480 L 0 300 Z" fill="#1e293b"/>
      <path d="M 0 0 L 800 600" stroke="#0ea5e9" stroke-width="120" opacity="0.6"/>
      <rect x="340" y="270" width="120" height="60" fill="#090d14"/>
      <path d="M 330 260 L 460 340" stroke="#ef4444" stroke-width="6" stroke-dasharray="8 4"/>
      <text x="320" y="240" fill="#ef4444" font-family="monospace" font-size="16" font-weight="bold">ROAD CUT // ACCESS BLOCKED</text>
      <text x="20" y="40" fill="#ef4444" font-family="monospace" font-size="20" font-weight="bold">CRISIS.OS // BRIDGE CORRIDOR B-02</text>
      <text x="20" y="70" fill="#38bdf8" font-family="monospace" font-size="14">SPAN DECK COLLAPSE // VEHICULAR TRAFFIC IMPASSABLE</text>
    </svg>`,
  },
  {
    id: 'rooftop-evac',
    title: 'North Sector Residential',
    description: 'Isolated rooftop survivors signaling for immediate airboat extraction',
    zoneCode: 'A-01',
    svgData: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
      <rect width="800" height="600" fill="#020617"/>
      <rect width="800" height="600" fill="#0369a1" opacity="0.7"/>
      <rect x="250" y="180" width="300" height="240" fill="#334155" stroke="#cbd5e1" stroke-width="3"/>
      <polygon points="230,180 400,90 570,180" fill="#7f1d1d"/>
      <circle cx="360" cy="115" r="10" fill="#facc15"/>
      <circle cx="390" cy="110" r="10" fill="#facc15"/>
      <circle cx="420" cy="120" r="10" fill="#facc15"/>
      <circle cx="450" cy="115" r="10" fill="#facc15"/>
      <text x="340" y="75" fill="#facc15" font-family="monospace" font-size="14" font-weight="bold">CIVILIAN CLUSTER (4)</text>
      <text x="20" y="40" fill="#ef4444" font-family="monospace" font-size="20" font-weight="bold">CRISIS.OS // NORTH SECTOR A-01</text>
      <text x="20" y="70" fill="#38bdf8" font-family="monospace" font-size="14">URGENT ROOFTOP RESCUE // AIR EXTRACTION REQUIRED</text>
    </svg>`,
  },
];

interface VisionErrorState {
  message: string;
  code?: string;
  isTransient?: boolean;
}

export function ImageAnalysisView({
  zones,
  selectedZone,
  onSelectZone,
}: ImageAnalysisViewProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [operatorNotes, setOperatorNotes] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRetrying, setIsRetrying] = useState<boolean>(false);
  const [apiResult, setApiResult] = useState<VisionApiResponse | null>(null);
  const [errorState, setErrorState] = useState<VisionErrorState | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const retryTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Hydrate saved analysis for the selected zone on initial mount or when zone changes
  useEffect(() => {
    let isCurrent = true;

    async function fetchSavedAnalysis() {
      if (!selectedZone?.code) return;
      // Keep existing active result if it matches current selected zone
      if (apiResult?.grounding?.zone_code === selectedZone.code) return;

      try {
        const queryParams = new URLSearchParams({
          zoneCode: selectedZone.code,
          zoneId: selectedZone.id,
        });
        const res = await fetch(`/api/vision?${queryParams.toString()}`);
        if (res.ok) {
          const data = (await res.json()) as VisionApiResponse;
          if (data.status === 'ok' && data.analysis && isCurrent) {
            setApiResult(data);
          }
        }
      } catch {
        // Safe fallback if offline or network error
      }
    }

    fetchSavedAnalysis();

    return () => {
      isCurrent = false;
    };
  }, [selectedZone?.code, selectedZone?.id, apiResult?.grounding?.zone_code]);

  // Helper to convert SVG to Data URL
  const loadSvgPreset = (preset: (typeof DEMO_PRESETS)[0]) => {
    onSelectZone(preset.zoneCode);
    const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(preset.svgData)}`;
    setPreviewUrl(dataUrl);
    setSelectedFile(null);
    setApiResult(null);
    setErrorState(null);
    setOperatorNotes(`Preset reconnaissance feed: ${preset.title} (${preset.zoneCode})`);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorState({
        message: 'Please select a valid image file (JPEG, PNG, WEBP, GIF).',
        isTransient: false,
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorState({
        message: 'File size exceeds the 5 MB limit.',
        isTransient: false,
      });
      return;
    }

    setSelectedFile(file);
    setErrorState(null);
    setApiResult(null);

    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorState({
        message: 'Please drop an image file (JPEG, PNG, WEBP, GIF).',
        isTransient: false,
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorState({
        message: 'File size exceeds 5 MB limit.',
        isTransient: false,
      });
      return;
    }

    setSelectedFile(file);
    setErrorState(null);
    setApiResult(null);

    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!previewUrl) {
      setErrorState({
        message: 'Please upload or select an image to analyze.',
        isTransient: false,
      });
      return;
    }

    setIsLoading(true);
    setIsRetrying(false);
    setErrorState(null);

    // If request takes longer than normal single attempt (~2.2s),
    // automated server retry backoff is in progress
    retryTimerRef.current = setTimeout(() => {
      setIsRetrying(true);
    }, 2200);

    try {
      let response: Response;

      // If user uploaded a physical File, use multipart/form-data
      if (selectedFile) {
        const formData = new FormData();
        formData.append('image', selectedFile);
        formData.append('zoneCode', selectedZone.code);
        formData.append('zoneId', selectedZone.id);
        if (operatorNotes.trim()) {
          formData.append('notes', operatorNotes.trim());
        }

        response = await fetch('/api/vision', {
          method: 'POST',
          body: formData,
        });
      } else {
        // Preset / Base64 Data URL payload
        response = await fetch('/api/vision', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            image: previewUrl,
            zoneCode: selectedZone.code,
            zoneId: selectedZone.id,
            notes: operatorNotes.trim() || undefined,
          }),
        });
      }

      const json = (await response.json()) as VisionApiResponse;

      if (!response.ok || json.status === 'error') {
        const isTransient =
          json.code === 'GEMINI_TEMPORARILY_UNAVAILABLE' ||
          json.transient === true ||
          response.status === 503 ||
          response.status === 429 ||
          response.status === 408;

        setErrorState({
          message:
            json.message ||
            (isTransient
              ? 'Gemini Vision is temporarily overloaded. Please retry the analysis.'
              : `Server returned error status ${response.status}`),
          code: json.code,
          isTransient,
        });
        return;
      }

      setApiResult(json);
    } catch (err) {
      const errMsg =
        err instanceof Error ? err.message : 'Visual analysis request failed.';
      const isTransient =
        errMsg.includes('503') ||
        errMsg.includes('overloaded') ||
        errMsg.includes('GEMINI_TEMPORARILY_UNAVAILABLE');

      setErrorState({
        message: isTransient
          ? 'Gemini Vision is temporarily overloaded. Please retry the analysis.'
          : errMsg,
        code: isTransient ? 'GEMINI_TEMPORARILY_UNAVAILABLE' : undefined,
        isTransient,
      });
    } finally {
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
      setIsLoading(false);
      setIsRetrying(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner & Control Strip */}
      <div className="bg-[#0f172a]/90 border border-slate-800 rounded-lg p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Camera className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-mono text-sm font-bold tracking-wider text-white">
                OPTICAL DISASTER RECONNAISSANCE // GEMINI VISION
              </h2>
              <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-700 text-cyan-300">
                GEMINI 3.6 FLASH
              </span>
            </div>
            <p className="font-mono text-xs text-slate-400">
              Multimodal visual damage assessment, hazard extraction & Supabase ground-truth linkage
            </p>
          </div>
        </div>

        {/* Target Zone Selector */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded p-1">
          <span className="font-mono text-[11px] text-slate-400 px-2">SECTOR:</span>
          <select
            value={selectedZone.code}
            onChange={(e) => onSelectZone(e.target.value)}
            className="bg-[#0b0f17] text-cyan-400 font-mono text-xs font-bold px-2.5 py-1 rounded border border-slate-700 focus:outline-none focus:border-cyan-400 cursor-pointer"
          >
            {zones.map((z) => (
              <option key={z.code} value={z.code}>
                {z.code} — {z.name} (Risk {z.current_risk_score})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Dual-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Column: Image Upload, Presets & Live Preview (5 Cols) */}
        <div className="lg:col-span-5 space-y-3">
          {/* 1-Click Hackathon Presets */}
          <div className="bg-[#0f172a] border border-slate-800 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                DEMO RECON PRESETS [1-CLICK LOAD]
              </span>
              <span className="font-mono text-[10px] text-slate-400">TACTICAL FEED</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {DEMO_PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => loadSvgPreset(p)}
                  className="p-2 text-left rounded bg-slate-900/90 border border-slate-800 hover:border-cyan-500/60 transition-all group"
                >
                  <div className="font-mono text-[11px] font-bold text-slate-200 group-hover:text-cyan-300 truncate">
                    {p.zoneCode}: {p.title}
                  </div>
                  <div className="font-mono text-[9px] text-slate-400 truncate mt-0.5">
                    {p.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Upload & Drop Box */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all ${
              isDragOver
                ? 'border-cyan-400 bg-cyan-950/20'
                : 'border-slate-700 hover:border-slate-500 bg-[#090d14]/70'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="flex flex-col items-center justify-center gap-1.5">
              <Upload className="h-6 w-6 text-cyan-400" />
              <div className="font-mono text-xs font-bold text-slate-200">
                DRAG & DROP DISASTER IMAGE OR <span className="text-cyan-400 underline">BROWSE</span>
              </div>
              <div className="font-mono text-[10px] text-slate-400">
                JPEG, PNG, WEBP up to 5 MB // Drone, Satellite or Ground Feeds
              </div>
            </div>
          </div>

          {/* Image Preview Canvas */}
          {previewUrl && (
            <div className="bg-[#090d14] border border-slate-800 rounded-lg p-2 relative overflow-hidden">
              <div className="absolute top-3 left-3 bg-black/70 border border-slate-700 px-2 py-0.5 rounded font-mono text-[10px] text-cyan-400 z-10 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
                TARGET ZONE: {selectedZone.code}
              </div>
              <div className="h-56 w-full rounded bg-slate-950 flex items-center justify-center overflow-hidden border border-slate-900 relative">
                {/* Visual optical crosshairs */}
                <div className="absolute inset-0 pointer-events-none border border-cyan-500/20 grid grid-cols-2 grid-rows-2">
                  <div className="border-r border-b border-cyan-500/20" />
                  <div className="border-b border-cyan-500/20" />
                  <div className="border-r border-cyan-500/20" />
                  <div />
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="Disaster Reconnaissance Target"
                  className="max-h-full max-w-full object-contain"
                />
              </div>

              {/* Operator Field Notes (Optional) */}
              <div className="mt-2">
                <input
                  type="text"
                  value={operatorNotes}
                  onChange={(e) => setOperatorNotes(e.target.value)}
                  placeholder="Optional field context (e.g. UAV flight altitude 80m, upstream river cresting)..."
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* Action Button */}
              <button
                onClick={handleAnalyze}
                disabled={isLoading}
                className={`mt-2.5 w-full py-2.5 px-4 font-mono font-bold text-xs uppercase tracking-wider rounded flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer ${
                  isLoading
                    ? isRetrying
                      ? 'bg-amber-950/80 border border-amber-600 text-amber-300 shadow-amber-950/40'
                      : 'bg-slate-800 text-slate-400 cursor-not-allowed'
                    : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/20 hover:shadow-cyan-400/30'
                }`}
              >
                {isLoading ? (
                  isRetrying ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
                      <span className="text-amber-300">GEMINI VISION ANALYSIS — RETRYING...</span>
                    </>
                  ) : (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      GEMINI VISION ANALYSIS IN PROGRESS...
                    </>
                  )
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    ANALYZE IMAGE WITH GEMINI VISION
                  </>
                )}
              </button>
            </div>
          )}

          {/* Error Message Callout */}
          {errorState && errorState.isTransient && (
            <div className="p-3.5 bg-amber-950/40 border border-amber-600/70 rounded-lg space-y-2.5">
              <div className="flex items-start gap-2.5">
                <RotateCcw className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-amber-300 tracking-wider">
                      GEMINI VISION TEMPORARILY OVERLOADED
                    </span>
                    <span className="font-mono text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-900/60 border border-amber-700 text-amber-200">
                      HTTP 503
                    </span>
                  </div>
                  <p className="font-mono text-xs text-amber-200/90 leading-relaxed">
                    {errorState.message}
                  </p>
                  <p className="font-mono text-[10px] text-slate-400">
                    Automated server retries were bounded and exhausted. Upstream capacity constraint is temporary.
                  </p>
                </div>
              </div>

              <div className="pt-1 flex items-center gap-2">
                <button
                  onClick={handleAnalyze}
                  disabled={isLoading}
                  className="px-3 py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  RETRY ANALYSIS
                </button>
                <button
                  onClick={() => setErrorState(null)}
                  className="px-2.5 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 font-mono text-xs border border-slate-700 transition-all cursor-pointer"
                >
                  DISMISS
                </button>
              </div>
            </div>
          )}

          {errorState && !errorState.isTransient && (
            <div className="p-3 bg-red-950/50 border border-red-800/80 rounded-lg flex items-start gap-2.5 text-xs font-mono text-red-300">
              <AlertTriangle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">TRIAGE FAILURE: </span>
                <span>{errorState.message}</span>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: AI Visual Assessment & Grounded Supabase Truth (7 Cols) */}
        <div className="lg:col-span-7 space-y-3">
          {/* Loading Radar HUD */}
          {isLoading && (
            <div
              className={`bg-[#0f172a] border rounded-lg p-8 flex flex-col items-center justify-center text-center space-y-4 transition-all ${
                isRetrying
                  ? 'border-amber-500/50 shadow-lg shadow-amber-950/30'
                  : 'border-cyan-500/40'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <div
                  className={`h-20 w-20 rounded-full border-2 border-t-transparent animate-spin ${
                    isRetrying
                      ? 'border-amber-500/30 border-t-amber-400'
                      : 'border-cyan-500/30 border-t-cyan-400'
                  }`}
                />
                {isRetrying ? (
                  <RotateCcw className="h-8 w-8 text-amber-400 absolute animate-pulse" />
                ) : (
                  <Eye className="h-8 w-8 text-cyan-400 absolute" />
                )}
              </div>
              <div>
                <div
                  className={`font-mono text-sm font-bold tracking-wider animate-pulse ${
                    isRetrying ? 'text-amber-400' : 'text-cyan-400'
                  }`}
                >
                  {isRetrying
                    ? 'GEMINI VISION ANALYSIS — RETRYING...'
                    : 'GEMINI VISION ANALYSIS IN PROGRESS'}
                </div>
                <div className="font-mono text-xs text-slate-400 mt-1 max-w-md">
                  {isRetrying
                    ? 'Upstream capacity constraint detected. Performing bounded exponential backoff with jitter to recover analysis...'
                    : 'Extracting structural wall failure, flood lines, road blockages & survivor indicators...'}
                </div>
                {isRetrying && (
                  <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-950/70 border border-amber-800 text-[10px] font-mono text-amber-300 font-bold">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-ping" />
                    AUTOMATED TRANSIENT RESILIENCE IN PROGRESS
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Completed Visual Assessment Result */}
          {!isLoading && apiResult && apiResult.analysis && (
            <div className="space-y-3 animate-in fade-in duration-300">
              {/* Header Badge */}
              <div className="bg-cyan-950/40 border border-cyan-800/80 rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-mono text-xs font-bold text-cyan-300 tracking-wider">
                    AI VISUAL ASSESSMENT // VERIFIED EVIDENCE
                  </span>
                </div>
                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="text-slate-400">CONFIDENCE:</span>
                  <span className="text-emerald-400 font-bold">
                    {Math.round(apiResult.analysis.confidence * 100)}%
                  </span>
                  <span className="text-slate-600">|</span>
                  <span className="text-slate-400">{apiResult.latencyMs}ms</span>
                </div>
              </div>

              {/* Visual Summary Box */}
              <div className="bg-[#0f172a] border border-slate-800 rounded-lg p-3.5 space-y-1.5">
                <div className="font-mono text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Eye className="h-3.5 w-3.5 text-cyan-400" />
                  Visual Scene Summary
                </div>
                <p className="text-xs text-slate-200 leading-relaxed font-sans">
                  {apiResult.analysis.summary}
                </p>
              </div>

              {/* Telemetry Matrix Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded">
                  <span className="font-mono text-[10px] text-slate-400 block uppercase">Disaster Type</span>
                  <span className="font-mono text-xs font-bold text-cyan-300 uppercase">
                    {apiResult.analysis.disaster_type}
                  </span>
                </div>
                <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded">
                  <span className="font-mono text-[10px] text-slate-400 block uppercase">Observed Severity</span>
                  <span
                    className={`font-mono text-xs font-bold uppercase ${
                      apiResult.analysis.severity_observation === 'critical'
                        ? 'text-red-400'
                        : apiResult.analysis.severity_observation === 'high'
                        ? 'text-orange-400'
                        : 'text-yellow-400'
                    }`}
                  >
                    {apiResult.analysis.severity_observation}
                  </span>
                </div>
                <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded">
                  <span className="font-mono text-[10px] text-slate-400 block uppercase">Road Access</span>
                  <span className="font-mono text-xs font-bold text-amber-300 uppercase">
                    {apiResult.analysis.road_accessibility}
                  </span>
                </div>
                <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded">
                  <span className="font-mono text-[10px] text-slate-400 block uppercase">Water Observed</span>
                  <span
                    className={`font-mono text-xs font-bold uppercase ${
                      apiResult.analysis.water_or_flooding_observed ? 'text-blue-400' : 'text-slate-400'
                    }`}
                  >
                    {apiResult.analysis.water_or_flooding_observed ? 'YES // FLOODING' : 'NO'}
                  </span>
                </div>
                <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded">
                  <span className="font-mono text-[10px] text-slate-400 block uppercase">People Detected</span>
                  <span className="font-mono text-xs font-bold text-emerald-400">
                    {apiResult.analysis.people_visible
                      ? `${apiResult.analysis.estimated_people_visible ?? 'Visible'} (Estimate)`
                      : 'None Visible'}
                  </span>
                </div>
                <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded">
                  <span className="font-mono text-[10px] text-slate-400 block uppercase">Medical Concern</span>
                  <span className="font-mono text-xs font-bold text-red-300 uppercase">
                    {apiResult.analysis.medical_concern_observed}
                  </span>
                </div>
              </div>

              {/* Visible Hazards Pill Tags */}
              <div className="bg-[#0f172a] border border-slate-800 rounded-lg p-3 space-y-2">
                <span className="font-mono text-[11px] font-bold text-slate-300 flex items-center gap-1.5 uppercase">
                  <AlertOctagon className="h-3.5 w-3.5 text-red-400" />
                  Identified Visible Hazards
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {apiResult.analysis.visible_hazards.length > 0 ? (
                    apiResult.analysis.visible_hazards.map((h, i) => (
                      <span
                        key={i}
                        className="bg-red-950/60 border border-red-800/80 text-red-300 font-mono text-[11px] px-2 py-0.5 rounded flex items-center gap-1"
                      >
                        <span className="h-1 w-1 rounded-full bg-red-400" />
                        {h}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 font-mono">No acute hazards identified</span>
                  )}
                </div>
              </div>

              {/* Infrastructure Damage Findings */}
              <div className="bg-[#0f172a] border border-slate-800 rounded-lg p-3 space-y-2">
                <span className="font-mono text-[11px] font-bold text-slate-300 flex items-center gap-1.5 uppercase">
                  <Layers className="h-3.5 w-3.5 text-amber-400" />
                  Infrastructure Damage Findings
                </span>
                <ul className="space-y-1">
                  {apiResult.analysis.infrastructure_damage.map((d, i) => (
                    <li key={i} className="text-xs font-mono text-slate-300 flex items-start gap-2">
                      <span className="text-amber-400 font-bold">•</span>
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Rescue-Relevant Tactical Evidence */}
              <div className="bg-[#0f172a] border border-slate-800 rounded-lg p-3 space-y-2">
                <span className="font-mono text-[11px] font-bold text-slate-300 flex items-center gap-1.5 uppercase">
                  <LifeBuoy className="h-3.5 w-3.5 text-cyan-400" />
                  Rescue-Relevant Tactical Evidence
                </span>
                <ul className="space-y-1">
                  {apiResult.analysis.rescue_relevant_evidence.map((ev, i) => (
                    <li key={i} className="text-xs font-mono text-slate-300 flex items-start gap-2">
                      <span className="text-cyan-400 font-bold">»</span>
                      <span>{ev}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Limitations & Sensor Boundaries */}
              {apiResult.analysis.limitations.length > 0 && (
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-lg p-2.5 text-[11px] font-mono text-slate-400 space-y-1">
                  <span className="font-bold text-slate-400 flex items-center gap-1">
                    <Info className="h-3 w-3 text-slate-400" />
                    LIMITATIONS & OBSERVATIONAL BOUNDARIES:
                  </span>
                  <div className="text-slate-400 leading-snug">
                    {apiResult.analysis.limitations.join(' | ')}
                  </div>
                </div>
              )}

              {/* Supabase Grounding Context: Primary Source of Truth */}
              {apiResult.grounding && (
                <div className="bg-slate-900/90 border border-slate-700 rounded-lg p-3.5 space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4 text-cyan-400" />
                      <span className="font-mono text-xs font-bold text-white tracking-wider">
                        SUPABASE DETERMINISTIC RISK [PRIMARY SOURCE OF TRUTH]
                      </span>
                    </div>
                    <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-800 text-emerald-400">
                      ZONE {apiResult.grounding.zone_code}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">DETERMINISTIC RISK</span>
                      <span className="text-red-400 font-bold text-sm">
                        {apiResult.grounding.risk_score} / 100
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">PRIORITY RANK</span>
                      <span className="text-white font-bold text-sm">
                        RANK #{apiResult.grounding.priority_rank}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">AFFECTED POPULATION</span>
                      <span className="text-slate-200 font-bold text-sm">
                        {apiResult.grounding.affected_population.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">SEVERITY LEVEL</span>
                      <span className="text-amber-300 font-bold text-sm">
                        {apiResult.grounding.severity_label}
                      </span>
                    </div>
                  </div>

                  <div className="bg-amber-950/30 border border-amber-800/40 rounded p-2 text-[10px] font-mono text-amber-300/90 flex items-start gap-2">
                    <ShieldAlert className="h-3.5 w-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <span>
                      CRITICAL GOVERNANCE: Numeric risk scores are calculated exclusively by the Supabase deterministic 5-factor engine (30% Pop, 25% Sev, 20% Med, 15% Acc, 10% Inf). Gemini Vision findings provide grounded observational evidence only and never alter the official risk score.
                    </span>
                  </div>
                </div>
              )}

              {/* Database Persistence Status Bar */}
              {apiResult.persistence && (
                <div
                  className={`rounded p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono border ${
                    apiResult.persistence.persisted && apiResult.source === 'supabase'
                      ? 'bg-[#090d14] border-emerald-800/80 text-emerald-300'
                      : 'bg-amber-950/20 border-amber-800/70 text-amber-300'
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-2">
                    <Database
                      className={`h-4 w-4 mt-0.5 sm:mt-0 flex-shrink-0 ${
                        apiResult.persistence.persisted && apiResult.source === 'supabase'
                          ? 'text-emerald-400'
                          : 'text-amber-400'
                      }`}
                    />
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-slate-400 font-bold">DATABASE STATUS:</span>
                        {apiResult.persistence.persisted && apiResult.source === 'supabase' ? (
                          <span className="text-emerald-400 font-bold flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                            PERSISTED TO SUPABASE (disaster_images & vision_analysis)
                          </span>
                        ) : (
                          <span className="text-amber-400 font-bold flex items-center gap-1">
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                            NOT PERSISTED // TEMPORARY SERVER CACHE ONLY
                          </span>
                        )}
                      </div>
                      {!apiResult.persistence.persisted && (
                        <p className="text-[11px] text-amber-200/80 leading-snug">
                          {apiResult.persistence.error ||
                            'Database write was rejected (RLS policy restriction). Record is temporarily available in server memory only and will not persist across restarts.'}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center font-mono text-[10px]">
                    <span
                      className={`px-1.5 py-0.5 rounded border uppercase font-bold ${
                        apiResult.persistence.persisted && apiResult.source === 'supabase'
                          ? 'bg-emerald-950/70 border-emerald-700 text-emerald-300'
                          : 'bg-amber-950/70 border-amber-700 text-amber-300'
                      }`}
                    >
                      SOURCE: {apiResult.source === 'supabase' ? 'SUPABASE DB' : 'TEMPORARY SERVER CACHE'}
                    </span>
                    {apiResult.persistence.imageId && (
                      <span className="text-slate-400 hidden sm:inline">
                        ID: {apiResult.persistence.imageId.slice(0, 8)}...
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Idle Placeholder when no analysis has run */}
          {!isLoading && !apiResult && (
            <div className="bg-[#0f172a]/60 border border-dashed border-slate-800 rounded-lg p-12 text-center flex flex-col items-center justify-center space-y-3">
              <div className="h-12 w-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
                <Eye className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-mono text-sm font-bold text-slate-300">
                  AWAITING OPTICAL RECONNAISSANCE UPLOAD
                </h3>
                <p className="font-mono text-xs text-slate-400 max-w-md mx-auto mt-1">
                  Upload an aerial, UAV, or ground-level disaster image on the left, or choose a 1-click tactical preset to execute server-side Gemini Vision damage triage.
                </p>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-mono text-cyan-400 pt-2">
                <span>1. Select Image</span>
                <ArrowRight className="h-3 w-3" />
                <span>2. Run Gemini Vision</span>
                <ArrowRight className="h-3 w-3" />
                <span>3. Ground with Supabase</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import {
  Zap,
  Download,
  FileText,
  CheckCircle2,
  Truck,
  Ship,
  HeartHandshake,
  Activity,
} from 'lucide-react';
import { EnrichedZoneRecord } from '@/lib/data-access/zones';

export interface ResponsePlanCardProps {
  zone: EnrichedZoneRecord;
  onExecuteDispatch?: () => void;
  onViewFullPlan?: () => void;
}

export function ResponsePlanCard({ zone, onExecuteDispatch, onViewFullPlan }: ResponsePlanCardProps) {
  const [dispatchStatus, setDispatchStatus] = useState<'idle' | 'dispatched'>('idle');

  const allocations = zone.allocations || [
    { category: 'SWIFT WATER TEAMS', count: 'Tactical Rescue Teams', status: 'Assigned' },
    { category: 'EVACUATION CRAFT', count: 'Motorized Watercraft', status: 'Ready' },
    { category: 'CRITICAL AMBULANCES', count: 'Advanced Life Support', status: 'Staged' },
    { category: 'FIELD MEDICAL', count: 'Mobile Clinic Post', status: 'Active' },
  ];

  const handleDispatch = () => {
    setDispatchStatus('dispatched');
    if (onExecuteDispatch) onExecuteDispatch();
    setTimeout(() => {
      setDispatchStatus('idle');
    }, 4000);
  };

  const getCategoryIcon = (category: string) => {
    if (category.includes('SWIFT') || category.includes('PATROL')) return Activity;
    if (category.includes('CRAFT') || category.includes('BOAT')) return Ship;
    if (category.includes('AMBULANCE')) return Truck;
    return HeartHandshake;
  };

  return (
    <div className="rounded border border-slate-800 bg-[#0f172a]/80 p-3 font-mono space-y-3 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5 text-cyan-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">
            RECOMMENDED ALLOCATION // ZONE {zone.code}
          </h3>
        </div>
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-800 text-emerald-400">
          AUTO-OPTIMIZED
        </span>
      </div>

      {/* 2x2 Resource Allocation Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        {allocations.map((item, idx) => {
          const Icon = getCategoryIcon(item.category);
          return (
            <div
              key={idx}
              className="rounded border border-slate-800/80 bg-[#090d14] p-2 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold mb-1">
                <span>{item.category}</span>
                <Icon className="h-3 w-3 text-cyan-400" />
              </div>
              <div className="text-[11px] font-bold text-white tracking-tight my-0.5">
                {item.count}
              </div>
              <div className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span>{item.status}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dispatch Action Notification if active */}
      {dispatchStatus === 'dispatched' && (
        <div className="p-2 rounded bg-emerald-950/80 border border-emerald-500 text-emerald-300 text-[11px] flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
          <span>
            TACTICAL DIRECTIVE DISPATCHED: Rescue flotilla and ALS units routed to Zone {zone.code}.
          </span>
        </div>
      )}

      {/* Primary Rescue Dispatch Button */}
      <button
        onClick={handleDispatch}
        className="w-full py-2.5 px-3 bg-cyan-400 hover:bg-cyan-300 active:scale-[0.99] text-slate-950 font-mono font-bold text-xs rounded uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-cyan-400/20 transition-all cursor-pointer"
      >
        <Zap className="h-4 w-4 fill-slate-950" />
        EXECUTE RESCUE DISPATCH // PLAN ALPHA
      </button>

      {/* Secondary Report & Export Buttons */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => {
            if (onViewFullPlan) {
              onViewFullPlan();
            } else {
              alert(`Full Risk Audit for Zone ${zone.code}:\n- Score: ${zone.current_risk_score}/100\n- Primary Driver: ${zone.riskResult?.primaryDriver}\n- Rationale: ${zone.aiRationale}`);
            }
          }}
          className="py-1.5 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-cyan-400 hover:text-cyan-300 rounded text-[10px] font-bold tracking-wider uppercase transition-colors flex items-center justify-center gap-1"
        >
          <FileText className="h-3 w-3" />
          <span>FULL AI PLAN</span>
        </button>
        <button
          onClick={() => {
            const report = `CRISISOS EOC SITREP - ZONE ${zone.code}\n==============================\nDate: ${new Date().toISOString()}\nRisk: ${zone.current_risk_score}/100\nPop: ${zone.population}\nSeverity: ${zone.severity_label}\nAllocations: ${allocations.map(a => `${a.category}: ${a.count}`).join(', ')}`;
            const blob = new Blob([report], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `CrisisOS-Report-${zone.code}.txt`;
            a.click();
            URL.revokeObjectURL(url);
          }}
          className="py-1.5 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded text-[10px] font-bold tracking-wider uppercase flex items-center justify-center gap-1.5 transition-colors"
        >
          <Download className="h-3 w-3" />
          EXPORT EOC REPORT
        </button>
      </div>
    </div>
  );
}

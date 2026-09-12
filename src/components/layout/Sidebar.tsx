'use client';

import React from 'react';
import {
  LayoutDashboard,
  Map,
  MapPin,
  Activity,
  Camera,
  BarChart3,
  Layers,
  FileText,
  BookOpen,
  Settings,
  Plus,
  Radio,
  Terminal,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';

export interface SidebarProps {
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  zoneCount?: number;
  defconLevel?: string;
  onExecuteDispatch?: () => void;
}

export function Sidebar({
  activeTab,
  onSelectTab,
  zoneCount = 5,
  defconLevel = 'DEFCON-2',
  onExecuteDispatch,
}: SidebarProps) {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'map', label: 'Disaster Map', icon: Map },
    { id: 'zones', label: 'Affected Zones', icon: MapPin, badge: zoneCount, badgeColor: 'bg-red-500/20 text-red-400 border-red-500/40' },
    { id: 'risk', label: 'AI Risk Analysis', icon: Activity },
    { id: 'vision', label: 'Image Analysis', icon: Camera },
    { id: 'priority', label: 'Priority Ranking', icon: BarChart3 },
    { id: 'resources', label: 'Resource Matrix', icon: Layers },
    { id: 'response', label: 'Response Plan', icon: FileText },
    { id: 'guidelines', label: 'Emergency Guidelines', icon: BookOpen, badge: 'AI', badgeColor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40' },
    { id: 'audit', label: 'Evidence & Audit', icon: ShieldCheck, badge: 'LIVE', badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 flex-shrink-0 bg-[#090d14] border-r border-slate-800 flex flex-col justify-between select-none h-full min-h-screen">
      {/* Brand & System Header */}
      <div>
        <div className="p-4 border-b border-slate-800/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded bg-red-500/10 border border-red-500/30 text-red-400">
                <ShieldAlert className="h-4 w-4" />
              </div>
              <span className="font-mono font-bold tracking-wider text-sm text-white">
                CRISIS.OS v4.2
              </span>
            </div>
            <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-950/60 border border-red-800 text-red-400">
              {defconLevel}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 font-mono text-[11px] text-slate-400">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>SECTOR 04 // ACTIVE</span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-2 space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded text-xs font-mono transition-all ${
                  isActive
                    ? 'bg-slate-800 text-cyan-400 border-l-2 border-cyan-400 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`h-4 w-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${item.badgeColor}`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Primary Action Button */}
        <div className="p-3">
          <button
            onClick={onExecuteDispatch}
            className="w-full py-2.5 px-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono font-bold text-xs rounded uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all hover:shadow-cyan-400/30 active:scale-[0.99]"
          >
            <Plus className="h-4 w-4 stroke-[3]" />
            EXECUTE DISPATCH
          </button>
        </div>
      </div>

      {/* Footer Diagnostic Bar */}
      <div className="p-4 border-t border-slate-800/80 space-y-2 text-[11px] font-mono">
        <div className="flex items-center justify-between text-slate-400">
          <div className="flex items-center gap-1.5">
            <Radio className="h-3.5 w-3.5 text-emerald-400" />
            <span>Comms Grid</span>
          </div>
          <span className="text-emerald-400 font-bold">[Online]</span>
        </div>
        <div className="flex items-center justify-between text-slate-400">
          <div className="flex items-center gap-1.5">
            <Terminal className="h-3.5 w-3.5 text-slate-400" />
            <span>System Logs</span>
          </div>
          <span className="text-slate-400">[Clear]</span>
        </div>
        <div className="pt-2 border-t border-slate-800/50 text-[10px] text-slate-400 tracking-wider">
          HOTLINE: 1-800-EOC-SAFE
        </div>
      </div>
    </aside>
  );
}

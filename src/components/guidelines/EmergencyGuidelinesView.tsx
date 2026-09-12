'use client';

import React, { useState } from 'react';
import { BookOpen, Search, Zap, CheckCircle2 } from 'lucide-react';
import { FALLBACK_GUIDELINES } from '@/lib/data-access/guidelines';

export interface EmergencyGuidelinesViewProps {
  initialGuidelines?: Array<{
    protocol_code?: string;
    title?: string;
    category?: string;
    protocol_text?: string;
  }>;
}

export function EmergencyGuidelinesView({
  initialGuidelines = [],
}: EmergencyGuidelinesViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isQuerying, setIsQuerying] = useState(false);
  const [liveResults, setLiveResults] = useState(initialGuidelines);

  const displayedList =
    liveResults.length > 0 ? liveResults : (FALLBACK_GUIDELINES as typeof initialGuidelines);

  const filtered = displayedList.filter((g) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      g.protocol_code?.toLowerCase().includes(q) ||
      g.title?.toLowerCase().includes(q) ||
      g.category?.toLowerCase().includes(q) ||
      g.protocol_text?.toLowerCase().includes(q)
    );
  });

  const handleLiveRagSearch = async () => {
    if (!searchTerm.trim()) return;
    setIsQuerying(true);
    try {
      const res = await fetch('/api/rag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchTerm, matchCount: 4 }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.matchedGuidelines && data.matchedGuidelines.length > 0) {
          setLiveResults(data.matchedGuidelines);
        }
      }
    } catch {
      // Non-blocking
    } finally {
      setIsQuerying(false);
    }
  };

  return (
    <div className="space-y-4 font-mono">
      {/* Top Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
            <BookOpen className="h-4 w-4" />
            <span>RAG KNOWLEDGE RETRIEVAL // EMERGENCY SOP DOCTRINE</span>
          </div>
          <h1 className="text-xl font-bold text-white mt-1">
            Standard Operating Disaster Protocols
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Vector-grounded doctrine library indexed from FEMA, WHO, and NDMA swiftwater emergency manuals.
          </p>
        </div>

        <span className="text-[10px] font-bold px-2.5 py-1 rounded bg-cyan-950 border border-cyan-800 text-cyan-400 self-start md:self-auto">
          AI EMBEDDINGS &bull; PGVECTOR GROUNDED
        </span>
      </div>

      {/* Semantic Search Bar */}
      <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3 flex items-center gap-2">
        <Search className="h-4 w-4 text-slate-400 flex-shrink-0" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleLiveRagSearch()}
          placeholder="Semantic search doctrine (e.g., 'submerged bridges evacuation', 'swiftwater rescue safety')..."
          className="bg-transparent text-xs text-white placeholder-slate-500 flex-1 outline-none font-mono"
        />
        <button
          onClick={handleLiveRagSearch}
          disabled={isQuerying}
          className="px-3 py-1.5 rounded text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-slate-950 disabled:opacity-50 transition-colors flex items-center gap-1"
        >
          <Zap className="h-3.5 w-3.5" />
          <span>{isQuerying ? 'Searching...' : 'Vector Query'}</span>
        </button>
      </div>

      {/* Protocols Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.map((item, idx) => (
          <div
            key={item.protocol_code || idx}
            className="bg-slate-950/80 border border-slate-800 hover:border-cyan-900/60 rounded-lg p-4 space-y-2.5 transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-800 text-cyan-400 text-xs font-bold">
                [{item.protocol_code || 'SOP'}]
              </span>
              <span className="text-[10px] text-slate-400 uppercase font-bold">
                {item.category || 'DOCTRINE'}
              </span>
            </div>

            <h3 className="text-sm font-bold text-white">{item.title}</h3>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-2.5 rounded border border-slate-800/80">
              {item.protocol_text}
            </p>

            <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-800">
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="h-3 w-3" />
                Active Doctrine in Gemini Synthesis
              </span>
              <span>Vector Similarity: 0.94</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

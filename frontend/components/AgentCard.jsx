"use client";

import { CheckCircle2, AlertTriangle } from "lucide-react";

export default function AgentCard({ name, icon, data }) {
  if (!data) return null;
  const rawScore = data.signal_score || 300;
  
  // Convert 300-900 range to 0-100 percentage for visualization
  const pct = Math.round(((rawScore - 300) / 600) * 100);
  
  const color =
    pct >= 70 ? "#10b981" : // emerald-500
    pct >= 50 ? "#3b82f6" : // blue-500
    pct >= 35 ? "#f59e0b" : // amber-500
    "#f43f5e";              // rose-500

  return (
    <div className="bg-surface border border-border rounded-xl p-6 transition-all hover:scale-[1.02] hover:shadow-md hover:border-text-muted">
      <div className="flex justify-between items-center mb-3">
        <div className="text-sm font-semibold text-text-muted flex items-center gap-2">
          {icon} {name}
        </div>
        <div className="font-mono text-2xl font-bold" style={{ color }}>
          {rawScore}
        </div>
      </div>
      <div className="h-1.5 bg-border rounded-full my-3 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <div className="text-sm text-text-muted leading-relaxed mb-2">{data.summary || "Analysis in progress..."}</div>
      <div className="font-mono text-xs text-text-subtle mb-4">
        confidence: {Math.round((data.confidence || 0) * 100)}%
      </div>
      <div className="flex flex-col gap-2">
        {data.positive_signals?.slice(0, 2).map((s, i) => (
          <span key={i} className="group cursor-pointer hover:border-text-muted hover:bg-surface2 transition-colors duration-300 text-xs px-2.5 py-1.5 rounded-lg font-medium flex items-start gap-1.5 border border-border text-text-muted">
            <CheckCircle2 size={12} className="mt-[2px] shrink-0 text-text-muted group-hover:scale-125 group-hover:text-text transition-all duration-300" /> <span className="leading-snug">{s}</span>
          </span>
        ))}
        {data.risk_signals?.slice(0, 1).map((s, i) => (
          <span key={i} className="group cursor-pointer hover:border-rose-500/40 hover:bg-rose-500/10 transition-colors duration-300 text-xs px-2.5 py-1.5 rounded-lg font-medium flex items-start gap-1.5 border border-rose-500/20 bg-rose-500/5 text-rose-500">
            <AlertTriangle size={12} className="mt-[2px] shrink-0 text-rose-500 group-hover:scale-125 transition-transform duration-300" /> <span className="leading-snug">{s}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

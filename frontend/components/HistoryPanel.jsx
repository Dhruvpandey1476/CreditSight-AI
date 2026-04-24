"use client";

import { useState, useEffect } from "react";
import { ClipboardList } from "lucide-react";

const TIER_CONFIG = {
  A: { color: "var(--color-primary)", bg: "var(--color-primary-light)" },
  B: { color: "#4ECDC4", bg: "rgba(78,205,196,0.12)" },
  C: { color: "#FFB347", bg: "rgba(255,179,71,0.12)" },
  D: { color: "#FF6B6B", bg: "rgba(255,107,107,0.12)" },
};

export default function HistoryPanel() {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    fetch("/api/history?limit=20")
      .then((r) => r.json())
      .then(setHistory)
      .catch(() => {});
  }, []);

  if (!history.length) {
    return (
      <div className="bg-surface border border-border rounded-2xl p-8">
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-4 text-text-muted">
          <ClipboardList size={48} className="text-primary/50" />
          <div className="text-lg font-semibold text-text">
            No assessments yet
          </div>
          <div className="text-sm">Run a scoring to see history</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-2xl p-6 md:p-8 overflow-hidden">
      <div className="text-lg font-semibold mb-6 text-text">Recent Assessments</div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm text-left">
          <thead className="bg-surface2">
            <tr>
              <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider border-b border-border rounded-tl-lg">Borrower</th>
              <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider border-b border-border">Score</th>
              <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider border-b border-border">Tier</th>
              <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider border-b border-border">Employment</th>
              <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider border-b border-border">Income</th>
              <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider border-b border-border rounded-tr-lg">Time</th>
            </tr>
          </thead>
          <tbody>
            {history.map((r, i) => {
              const cfg = TIER_CONFIG[r.credit_tier] || TIER_CONFIG.C;
              return (
                <tr key={r.id} className={`hover:bg-surface2/50 transition-colors ${i !== history.length - 1 ? 'border-b border-border/50' : ''}`}>
                  <td className="px-4 py-4 text-text font-medium">{r.borrower_name}</td>
                  <td className="px-4 py-4 font-mono font-bold" style={{ color: cfg.color }}>
                    {r.final_score}
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className="inline-block px-3 py-1 rounded text-xs font-bold font-mono"
                      style={{ background: cfg.bg, color: cfg.color }}
                    >
                      {r.credit_tier}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-text-muted">{r.employment_type}</td>
                  <td className="px-4 py-4 font-mono text-sm text-text">
                    ₹{Math.round(r.monthly_income / 1000)}k
                  </td>
                  <td className="px-4 py-4 text-text-subtle text-xs">
                    {new Date(r.created_at).toLocaleTimeString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

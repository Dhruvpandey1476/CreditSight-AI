"use client";

import { RadialBarChart, RadialBar, ResponsiveContainer } from "recharts";

const TIER_CONFIG = {
  A: { color: "#FFFFFF", bg: "rgba(255,255,255,0.05)", label: "Excellent" },
  B: { color: "#E5E5E5", bg: "rgba(255,255,255,0.03)", label: "Good" },
  C: { color: "#A3A3A3", bg: "rgba(163,163,163,0.05)", label: "Fair" },
  D: { color: "#737373", bg: "rgba(115,115,115,0.05)", label: "Poor" },
};

export default function ScoreGauge({
  score,
  tier,
  ml_score,
  agent_composite_score,
  score_breakdown,
}) {
  const cfg = TIER_CONFIG[tier] || TIER_CONFIG.C;
  
  if (ml_score !== undefined && agent_composite_score !== undefined) {
    return (
      <div className="flex flex-col gap-6 p-6 md:p-8 bg-surface border border-border rounded-2xl">
        {/* MAIN: Hybrid Score as focal point */}
        <div className="flex flex-col items-center gap-4">
          <div className="text-center">
            <div className="text-xs font-semibold text-text-muted tracking-wider uppercase mb-3">
              Final Credit Score
            </div>
          </div>

          <div className="relative w-40 h-28">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                cx="50%"
                cy="100%"
                innerRadius="70%"
                outerRadius="100%"
                startAngle={180}
                endAngle={0}
                data={[
                  { value: 100, fill: "var(--color-border)" },
                  {
                    value: ((score - 300) / 600) * 100,
                    fill: "url(#scoreGradient)",
                  },
                ]}
              >
                <defs>
                  <linearGradient id="scoreGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#0ea5e9" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                </defs>
                <RadialBar
                  dataKey="value"
                  cornerRadius={4}
                  background={false}
                />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute bottom-[60px] left-1/2 -translate-x-1/2 text-center">
              <div className="text-6xl font-bold font-mono leading-none text-slate-800 dark:text-slate-100">
                {score}
              </div>
              <div className="text-xs text-text-muted mt-1.5">/ 900</div>
            </div>
          </div>

          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold border"
            style={{
              background: cfg.bg,
              color: cfg.color,
              borderColor: `${cfg.color}40`,
            }}
          >
            <span className="text-sm">◆</span> Tier {tier} — {cfg.label}
          </div>
        </div>

        {/* SUPPORTING: ML & Agent Scores */}
        <div className="flex flex-col gap-3 mt-4">
          {/* ML Score Card */}
          <div className="flex justify-between items-center px-4 py-3 bg-surface2 border border-sky-500/30 rounded-xl hover:scale-[1.02] hover:shadow-md transition-all cursor-default">
            <div className="flex flex-col">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">ML Score</div>
              <div className="text-[10px] text-text-subtle mt-0.5">XGBoost (60%)</div>
            </div>
            <div className="text-2xl font-bold font-mono text-text">
              {ml_score}
            </div>
          </div>

          {/* Agent Score Card */}
          <div className="flex justify-between items-center px-4 py-3 bg-surface2 border border-emerald-500/30 rounded-xl hover:scale-[1.02] hover:shadow-md transition-all cursor-default">
            <div className="flex flex-col">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Agent Score</div>
              <div className="text-[10px] text-text-subtle mt-0.5">LLM Agents (40%)</div>
            </div>
            <div className="text-2xl font-bold font-mono text-text">
              {agent_composite_score}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Fallback to single score display if individual scores not provided
  const data = [
    { value: 100, fill: "var(--color-border)" },
    { value: ((score - 300) / 600) * 100, fill: "url(#scoreGradientFallback)" },
  ];

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8 bg-surface border border-border rounded-2xl">
      <div className="flex flex-col items-center gap-4">
        <div className="text-center">
          <div className="text-xs font-semibold text-text-muted tracking-wider uppercase mb-3">
            Credit Score
          </div>
        </div>

        <div className="relative w-40 h-28">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              cx="50%"
              cy="100%"
              innerRadius="70%"
              outerRadius="100%"
              startAngle={180}
              endAngle={0}
              data={data}
            >
              <defs>
                <linearGradient id="scoreGradientFallback" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#0ea5e9" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>
              <RadialBar dataKey="value" cornerRadius={4} background={false} />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="absolute bottom-[60px] left-1/2 -translate-x-1/2 text-center">
            <div className="text-6xl font-bold font-mono leading-none text-slate-800 dark:text-slate-100">
              {score}
            </div>
            <div className="text-xs text-text-muted mt-1.5">/ 900</div>
          </div>
        </div>

        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold border"
          style={{
            background: cfg.bg,
            color: cfg.color,
            borderColor: `${cfg.color}40`,
          }}
        >
          <span className="text-sm">◆</span> Tier {tier} — {cfg.label}
        </div>
      </div>
    </div>
  );
}

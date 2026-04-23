"use client";

import { RadialBarChart, RadialBar, ResponsiveContainer } from "recharts";

const TIER_CONFIG = {
  A: { color: "#00D4AA", bg: "rgba(0,212,170,0.12)", label: "Excellent" },
  B: { color: "#4ECDC4", bg: "rgba(78,205,196,0.12)", label: "Good" },
  C: { color: "#FFB347", bg: "rgba(255,179,71,0.12)", label: "Fair" },
  D: { color: "#FF6B6B", bg: "rgba(255,107,107,0.12)", label: "Poor" },
};

const styles = `
  .gauge-container {
    display: flex;
    flex-direction: column;
    gap: 24px;
    padding: 24px;
    background: rgba(13,20,32,0.6);
    border: 1px solid rgba(30,58,95,0.4);
    border-radius: 16px;
  }

  .main-score-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }

  .radial-gauge-wrapper {
    width: 160px;
    height: 100px;
    position: relative;
  }

  .gauge-center-text {
    position: absolute;
    bottom: 60px;
    left: 50%;
    transform: translateX(-50%);
    text-align: center;
  }

  .gauge-number {
    font-size: 64px;
    font-weight: 700;
    line-height: 1;
    font-family: monospace;
  }

  .gauge-label {
    font-size: 11px;
    color: #4A6FA5;
    margin-top: 4px;
  }

  .tier-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 700;
    border: 1px solid;
  }

  .supporting-scores-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }

  .score-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 16px 12px;
    background: rgba(30,58,95,0.2);
    border: 1px solid rgba(30,58,95,0.3);
    border-radius: 12px;
  }

  .score-card-label {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    color: #4A6FA5;
  }

  .score-card-value {
    font-size: 36px;
    font-weight: 700;
    font-family: monospace;
  }

  .score-card-sub {
    font-size: 9px;
    color: #4A6FA5;
    margin-top: 2px;
  }

  .weight-badge {
    font-size: 9px;
    padding: 2px 6px;
    border-radius: 3px;
    background: rgba(30,58,95,0.5);
    color: #7A9BC4;
    font-weight: 500;
    margin-top: 4px;
  }

  @media (max-width: 900px) {
    .gauge-container {
      padding: 16px;
      gap: 16px;
    }

    .supporting-scores-row {
      grid-template-columns: 1fr 1fr;
    }

    .score-card-value {
      font-size: 28px;
    }
  }
`;

export default function ScoreGauge({
  score,
  tier,
  ml_score,
  agent_composite_score,
  score_breakdown,
}) {
  const cfg = TIER_CONFIG[tier] || TIER_CONFIG.C;

  // If we have all three scores, show the 3-score breakdown
  if (ml_score !== undefined && agent_composite_score !== undefined) {
    return (
      <>
        <style>{styles}</style>
        <div className="gauge-container">
          {/* MAIN: Hybrid Score as focal point */}
          <div className="main-score-section">
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#4A6FA5", letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: 12 }}>
                Final Credit Score
              </div>
            </div>

            <div className="radial-gauge-wrapper">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  cx="50%"
                  cy="100%"
                  innerRadius="70%"
                  outerRadius="100%"
                  startAngle={180}
                  endAngle={0}
                  data={[
                    { value: 100, fill: "rgba(30,58,95,0.3)" },
                    {
                      value: ((score - 300) / 600) * 100,
                      fill: cfg.color,
                    },
                  ]}
                >
                  <RadialBar
                    dataKey="value"
                    cornerRadius={4}
                    background={false}
                  />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="gauge-center-text">
                <div className="gauge-number" style={{ color: cfg.color, fontSize: 56 }}>
                  {score}
                </div>
                <div className="gauge-label">/ 900</div>
              </div>
            </div>

            <div
              className="tier-badge"
              style={{
                background: cfg.bg,
                color: cfg.color,
                borderColor: cfg.color + "40",
              }}
            >
              <span style={{ fontSize: 13 }}>◆</span> Tier {tier} — {cfg.label}
            </div>
          </div>

          {/* SUPPORTING: ML & Agent Scores */}
          <div className="supporting-scores-row">
            {/* ML Score Card */}
            <div className="score-card" style={{ borderColor: "rgba(0,212,170,0.3)" }}>
              <div className="score-card-label" style={{ color: "#00D4AA" }}>ML Score</div>
              <div className="score-card-value" style={{ color: "#00D4AA" }}>
                {ml_score}
              </div>
              <div className="score-card-sub">XGBoost</div>
              <div className="weight-badge" style={{ background: "rgba(0,212,170,0.1)", color: "#00D4AA", borderColor: "rgba(0,212,170,0.2)", border: "1px solid" }}>
                60% weight
              </div>
            </div>

            {/* Agent Score Card */}
            <div className="score-card" style={{ borderColor: "rgba(78,205,196,0.3)" }}>
              <div className="score-card-label" style={{ color: "#4ECDC4" }}>Agent Score</div>
              <div className="score-card-value" style={{ color: "#4ECDC4" }}>
                {agent_composite_score}
              </div>
              <div className="score-card-sub">LLM Agents</div>
              <div className="weight-badge" style={{ background: "rgba(78,205,196,0.1)", color: "#4ECDC4", borderColor: "rgba(78,205,196,0.2)", border: "1px solid" }}>
                40% weight
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Fallback to single score display if individual scores not provided
  const data = [
    { value: 100, fill: "rgba(30,58,95,0.3)" },
    { value: ((score - 300) / 600) * 100, fill: cfg.color },
  ];

  return (
    <>
      <style>{styles}</style>
      <div className="gauge-container">
        <div className="main-score-section">
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#4A6FA5", letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: 12 }}>
              Credit Score
            </div>
          </div>

          <div className="radial-gauge-wrapper">
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
                <RadialBar dataKey="value" cornerRadius={4} background={false} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="gauge-center-text">
              <div className="gauge-number" style={{ color: cfg.color }}>
                {score}
              </div>
              <div className="gauge-label">/ 900</div>
            </div>
          </div>

          <div
            className="tier-badge"
            style={{
              background: cfg.bg,
              color: cfg.color,
              borderColor: cfg.color + "40",
            }}
          >
            <span style={{ fontSize: 13 }}>◆</span> Tier {tier} — {cfg.label}
          </div>
        </div>
      </div>
    </>
  );
}

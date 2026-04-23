"use client";

import { useState, useEffect } from "react";
import ScoreGauge from "../components/ScoreGauge";
import AgentCard from "../components/AgentCard";
import ShapChart from "../components/ShapChart";
import LoadingView from "../components/LoadingView";
import HistoryPanel from "../components/HistoryPanel";
import BulkPanel from "../components/BulkPanel";

const TIER_CONFIG = {
  A: { color: "#00D4AA", bg: "rgba(0,212,170,0.12)", label: "Excellent", desc: "Approve — low risk" },
  B: { color: "#4ECDC4", bg: "rgba(78,205,196,0.12)", label: "Good", desc: "Approve — standard terms" },
  C: { color: "#FFB347", bg: "rgba(255,179,71,0.12)", label: "Fair", desc: "Approve with conditions" },
  D: { color: "#FF6B6B", bg: "rgba(255,107,107,0.12)", label: "Poor", desc: "Decline or secured loan only" },
};

const DEFAULT_PROFILE = {
  borrower_name: "Ramesh Kumar",
  upi_monthly_txn_count: 45,
  upi_avg_monthly_inflow: 22000,
  upi_avg_monthly_outflow: 17000,
  upi_merchant_diversity: 0.72,
  upi_salary_regularity: 0.78,
  upi_savings_ratio: 0.23,
  upi_large_txn_flag: 0,
  employment_type: "gig",
  monthly_income_est: 21000,
  income_stability_score: 0.65,
  job_tenure_months: 22,
  has_employer_epf: 0,
  income_growth_trend: 0.02,
  rent_payment_on_time_rate: 0.85,
  utility_on_time_rate: 0.9,
  rental_tenure_months: 24,
  has_rental_agreement: 1,
  bill_types_paid: 3,
  device_type: "mid_range",
  location_stability_score: 0.75,
  app_usage_tier: 0.7,
  sim_tenure_months: 36,
  night_txn_ratio: 0.15,
};

const styles = `
  .app { min-height: 100vh; background: #080C14; }

  .header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 18px 40px;
    background: rgba(8,12,20,0.95);
    border-bottom: 1px solid rgba(30,58,95,0.5);
    backdrop-filter: blur(12px);
    position: sticky; top: 0; z-index: 100;
  }
  .logo { display: flex; align-items: center; gap: 10px; }
  .logo-icon {
    width: 36px; height: 36px; border-radius: 8px;
    background: linear-gradient(135deg, #00D4AA, #0066FF);
    display: flex; align-items: center; justify-content: center;
    font-size: 18px; color: white; font-weight: 700;
  }
  .logo-text { font-size: 20px; font-weight: 700; letter-spacing: -0.5px; color: #E8EDF5; }
  .logo-text span { color: #00D4AA; }
  .header-badge {
    font-family: monospace; font-size: 11px; color: #00D4AA;
    border: 1px solid rgba(0,212,170,0.3); padding: 4px 10px;
    border-radius: 4px; background: rgba(0,212,170,0.05);
  }
  .header-badges { display: flex; gap: 8px; }

  .main { display: flex; min-height: calc(100vh - 61px); }

  .sidebar {
    width: 340px; background: #0B1018;
    border-right: 1px solid rgba(30,58,95,0.4);
    padding: 24px; flex-shrink: 0; overflow-y: auto;
  }

  .content { flex: 1; padding: 28px 32px; overflow-y: auto; }

  .section-title {
    font-size: 11px; font-weight: 600; letter-spacing: 1.5px;
    color: #4A6FA5; text-transform: uppercase; margin-bottom: 14px;
  }

  .demo-grid { display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; }
  .demo-card {
    padding: 10px 12px; border-radius: 8px;
    border: 1px solid rgba(30,58,95,0.4); cursor: pointer;
    transition: all 0.2s; background: rgba(13,20,32,0.6);
  }
  .demo-card:hover { border-color: rgba(0,212,170,0.4); background: rgba(0,212,170,0.05); }
  .demo-card.active { border-color: rgba(0,212,170,0.7); background: rgba(0,212,170,0.08); }
  .demo-label { font-size: 12px; font-weight: 600; margin-bottom: 2px; color: #E8EDF5; }
  .demo-desc { font-size: 10px; color: #4A6FA5; }

  .form-group { margin-bottom: 14px; }
  .form-label { display: block; font-size: 11px; color: #7A9BC4; margin-bottom: 5px; font-weight: 500; }
  .form-input, .form-select {
    width: 100%; padding: 8px 10px;
    background: rgba(13,20,32,0.8);
    border: 1px solid rgba(30,58,95,0.6);
    border-radius: 6px; color: #E8EDF5;
    font-family: monospace; font-size: 12px;
    transition: border-color 0.2s; appearance: none;
  }
  .form-input:focus, .form-select:focus {
    outline: none; border-color: rgba(0,212,170,0.5);
  }
  .form-select option { background: #0B1018; }
  .input-row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }

  .btn-analyze {
    width: 100%; padding: 13px;
    background: linear-gradient(135deg, #00D4AA, #0066FF);
    border: none; border-radius: 8px; color: #fff;
    font-size: 14px; font-weight: 700; letter-spacing: 0.3px;
    cursor: pointer; transition: all 0.2s; margin-top: 8px;
  }
  .btn-analyze:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(0,212,170,0.25); }
  .btn-analyze:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

  .error-box {
    margin-top: 12px; padding: 10px;
    background: rgba(255,107,107,0.1);
    border: 1px solid rgba(255,107,107,0.3);
    border-radius: 8px; font-size: 12px; color: #FF6B6B;
  }

  .tabs { display: flex; gap: 4px; margin-bottom: 24px; }
  .tab {
    padding: 8px 16px; border-radius: 6px;
    font-size: 13px; font-weight: 500; cursor: pointer;
    border: none; background: transparent; color: #4A6FA5;
    transition: all 0.15s; font-family: inherit;
  }
  .tab.active { background: rgba(0,212,170,0.1); color: #00D4AA; }
  .tab:hover:not(.active) { background: rgba(30,58,95,0.3); color: #7A9BC4; }

  .elapsed-badge {
    font-family: monospace; font-size: 11px; color: #2A4A6F;
    padding: 3px 8px; border-radius: 4px;
    background: rgba(30,58,95,0.2); margin-left: auto; align-self: center;
  }

  .empty-state {
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    min-height: 400px; gap: 12px; color: #2A4A6F;
  }
  .empty-icon { font-size: 48px; }
  .empty-title { font-size: 16px; font-weight: 600; color: #3A5A7F; }
  .empty-sub { font-size: 13px; text-align: center; }

  .agent-pill {
    padding: 6px 14px; border-radius: 20px;
    border: 1px solid rgba(30,58,95,0.5);
    font-size: 11px; color: #4A6FA5;
  }
  .agent-pills { display: flex; gap: 12px; flex-wrap: wrap; justify-content: center; margin-top: 20px; }

  .score-hero {
    display: grid; grid-template-columns: 220px 1fr;
    gap: 24px; align-items: center; margin-bottom: 28px;
  }

  .resolver-card {
    background: rgba(13,20,32,0.6);
    border: 1px solid rgba(30,58,95,0.4);
    border-radius: 16px; padding: 20px;
    display: flex; flex-direction: column; gap: 14px;
  }
  .resolver-name { font-size: 18px; font-weight: 700; color: #E8EDF5; }
  .resolver-id { font-size: 12px; color: #4A6FA5; margin-top: 2px; }

  .recommendation-box {
    padding: 12px 16px; border-radius: 8px;
    font-size: 13px; font-weight: 500;
  }
  .resolver-reasoning { font-size: 13px; color: #7A9BC4; line-height: 1.6; }

  .signals-section-title { font-size: 11px; color: #4A6FA5; margin-bottom: 6px; }
  .signals-row { display: flex; gap: 8px; flex-wrap: wrap; }
  .signal-tag {
    font-size: 11px; padding: 3px 10px; border-radius: 20px; font-weight: 500;
  }
  .signal-tag.positive {
    background: rgba(0,212,170,0.1); color: #00D4AA;
    border: 1px solid rgba(0,212,170,0.2);
  }
  .signal-tag.risk {
    background: rgba(255,107,107,0.1); color: #FF6B6B;
    border: 1px solid rgba(255,107,107,0.2);
  }

  .conflict-banner {
    padding: 10px 14px; border-radius: 8px;
    background: rgba(255,179,71,0.08);
    border: 1px solid rgba(255,179,71,0.3);
    font-size: 12px; color: #FFB347;
  }

  .agents-grid {
    display: grid; grid-template-columns: 1fr 1fr;
    gap: 16px; margin-bottom: 24px;
  }

  .log-container {
    background: rgba(5,8,14,0.8); border-radius: 8px;
    padding: 14px; font-family: monospace;
    font-size: 11px; color: #4A6FA5;
    max-height: 120px; overflow-y: auto;
    border: 1px solid rgba(30,58,95,0.3);
  }
  .log-line { margin-bottom: 4px; }
  .log-line.success { color: #00D4AA; }

  .compliance-note {
    padding: 10px 14px; border-radius: 8px;
    background: rgba(30,58,95,0.2);
    border: 1px solid rgba(30,58,95,0.4);
    font-size: 11px; color: #3A5A7F;
    margin-top: 16px; line-height: 1.5;
  }

  @media (max-width: 900px) {
    .main { flex-direction: column; }
    .sidebar { width: 100%; border-right: none; border-bottom: 1px solid rgba(30,58,95,0.4); }
    .agents-grid { grid-template-columns: 1fr; }
    .score-hero { grid-template-columns: 1fr; }
    .header { padding: 14px 20px; }
    .header-badges { display: none; }
  }
`;

export default function Home() {
  const [tab, setTab] = useState("score");
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [demoProfiles, setDemoProfiles] = useState([]);
  const [activeDemo, setActiveDemo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("/api/demo-profiles")
      .then((r) => r.json())
      .then(setDemoProfiles)
      .catch(() => {});
  }, []);

  useEffect(() => {
    let t;
    if (loading) {
      setElapsed(0);
      t = setInterval(() => setElapsed((e) => +(e + 0.1).toFixed(1)), 100);
    }
    return () => clearInterval(t);
  }, [loading]);

  const selectDemo = (dp, idx) => {
    setActiveDemo(idx);
    setProfile({ ...dp.profile });
  };

  const update = (k, v) => setProfile((p) => ({ ...p, [k]: v }));

  const analyze = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setResult(data);
      setTab("result");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const tier = result?.credit_tier;
  const cfg = tier ? TIER_CONFIG[tier] : null;

  return (
    <>
      <style>{styles}</style>
      <div className="app">
        {/* Header */}
        <header className="header">
          <div className="logo">
            <div className="logo-icon">◆</div>
            <div className="logo-text">
              Credit<span>Sight</span>
            </div>
          </div>
          <div className="header-badges">
            <span className="header-badge">4-AGENT LANGGRAPH</span>
            <span className="header-badge">LLAMA 3.3 · GROQ</span>
            <span className="header-badge">190M CREDIT-INVISIBLE</span>
          </div>
        </header>

        <div className="main">
          {/* Sidebar */}
          <aside className="sidebar">
            <div className="section-title">Demo Profiles</div>
            <div className="demo-grid">
              {demoProfiles.map((dp, i) => (
                <div
                  key={i}
                  className={`demo-card ${activeDemo === i ? "active" : ""}`}
                  onClick={() => selectDemo(dp, i)}
                >
                  <div className="demo-label">{dp.label}</div>
                  <div className="demo-desc">{dp.description}</div>
                </div>
              ))}
            </div>

            <div className="section-title">Borrower Details</div>

            <div className="form-group">
              <label className="form-label">Borrower Name</label>
              <input
                className="form-input"
                value={profile.borrower_name}
                onChange={(e) => update("borrower_name", e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Employment Type</label>
              <select
                className="form-select"
                value={profile.employment_type}
                onChange={(e) => update("employment_type", e.target.value)}
              >
                <option value="salaried">Salaried</option>
                <option value="self_employed">Self Employed</option>
                <option value="gig">Gig Worker</option>
                <option value="informal">Informal</option>
              </select>
            </div>

            <div className="input-row">
              <div className="form-group">
                <label className="form-label">Monthly Income (₹)</label>
                <input
                  className="form-input"
                  type="number"
                  value={profile.monthly_income_est}
                  onChange={(e) => update("monthly_income_est", +e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">UPI Inflow (₹)</label>
                <input
                  className="form-input"
                  type="number"
                  value={profile.upi_avg_monthly_inflow}
                  onChange={(e) => update("upi_avg_monthly_inflow", +e.target.value)}
                />
              </div>
            </div>

            <div className="input-row">
              <div className="form-group">
                <label className="form-label">Salary Regularity (0-1)</label>
                <input
                  className="form-input"
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={profile.upi_salary_regularity}
                  onChange={(e) => update("upi_salary_regularity", +e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Rent On-Time Rate</label>
                <input
                  className="form-input"
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={profile.rent_payment_on_time_rate}
                  onChange={(e) => update("rent_payment_on_time_rate", +e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Job Tenure (months)</label>
              <input
                className="form-input"
                type="number"
                value={profile.job_tenure_months}
                onChange={(e) => update("job_tenure_months", +e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Device Type</label>
              <select
                className="form-select"
                value={profile.device_type}
                onChange={(e) => update("device_type", e.target.value)}
              >
                <option value="premium">Premium</option>
                <option value="mid_range">Mid Range</option>
                <option value="budget">Budget</option>
              </select>
            </div>

            <button className="btn-analyze" onClick={analyze} disabled={loading}>
              {loading ? "Analyzing..." : "⚡ Run Credit Assessment"}
            </button>

            {error && <div className="error-box">⚠ {error}</div>}
          </aside>

          {/* Main content */}
          <main className="content">
            <div className="tabs">
              {["score", "result", "history", "bulk"].map((t) => (
                <button
                  key={t}
                  className={`tab ${tab === t ? "active" : ""}`}
                  onClick={() => setTab(t)}
                >
                  {t === "score" ? "⚡ Score" : t === "result" ? "📊 Results" : t === "history" ? "📋 History" : "📤 Bulk"}
                </button>
              ))}
              {result && (
                <span className="elapsed-badge">⏱ {result.elapsed_seconds}s</span>
              )}
            </div>

            {/* Score tab */}
            {tab === "score" && !loading && (
              <div className="empty-state">
                <div className="empty-icon">◆</div>
                <div className="empty-title">CreditSight — Alternative Credit Intelligence</div>
                <div className="empty-sub">
                  Select a demo profile or fill borrower details,
                  <br />
                  then click{" "}
                  <strong style={{ color: "#00D4AA" }}>Run Credit Assessment</strong>
                </div>
                <div className="agent-pills">
                  {["UPI Agent", "Income Agent", "Rental Agent", "Behavioral Agent"].map((a) => (
                    <div key={a} className="agent-pill">◆ {a}</div>
                  ))}
                </div>
              </div>
            )}
            {tab === "score" && loading && <LoadingView elapsed={elapsed} />}

            {/* Result tab */}
            {tab === "result" && loading && <LoadingView elapsed={elapsed} />}
            {tab === "result" && !result && !loading && (
              <div className="empty-state">
                <div className="empty-icon">📊</div>
                <div className="empty-title">No results yet</div>
                <div className="empty-sub">Run an assessment to see results</div>
              </div>
            )}

            {tab === "result" && result && !loading && (
              <>
                {/* Score hero */}
                <div className="score-hero">
                  <ScoreGauge
                    score={result.final_score}
                    tier={result.credit_tier}
                    ml_score={result.ml_score}
                    agent_composite_score={result.agent_composite_score}
                    score_breakdown={result.score_breakdown}
                  />
                  <div className="resolver-card">
                    <div>
                      <div className="resolver-name">{result.borrower_name}</div>
                      <div className="resolver-id">Assessment ID: {result.assessment_id}</div>
                    </div>

                    {result.resolver_output?.conflicts_detected?.length > 0 && (
                      <div className="conflict-banner">
                        ⚠ Conflicts resolved:{" "}
                        {result.resolver_output.conflicts_detected.join(" · ")}
                      </div>
                    )}

                    <div
                      className="recommendation-box"
                      style={{
                        background: cfg?.bg,
                        border: `1px solid ${cfg?.color}30`,
                        color: cfg?.color,
                      }}
                    >
                      🏦 {result.resolver_output?.lender_recommendation}
                    </div>

                    <div className="resolver-reasoning">
                      {result.resolver_output?.resolution_reasoning}
                    </div>

                    <div>
                      <div className="signals-section-title">KEY STRENGTHS</div>
                      <div className="signals-row">
                        {result.resolver_output?.key_strengths?.map((s, i) => (
                          <span key={i} className="signal-tag positive">✓ {s}</span>
                        ))}
                      </div>
                    </div>

                    {result.resolver_output?.key_risks?.length > 0 && (
                      <div>
                        <div className="signals-section-title">KEY RISKS</div>
                        <div className="signals-row">
                          {result.resolver_output.key_risks.map((s, i) => (
                            <span key={i} className="signal-tag risk">⚠ {s}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Agent cards */}
                <div className="section-title">Specialist Agent Outputs</div>
                <div className="agents-grid">
                  <AgentCard name="UPI Transaction" icon="💳" data={result.upi_analysis} />
                  <AgentCard name="Income & Employment" icon="💼" data={result.income_analysis} />
                  <AgentCard name="Rental & Bills" icon="🏠" data={result.rental_analysis} />
                  <AgentCard name="Behavioral Profile" icon="📱" data={result.behavioral_analysis} />
                </div>

                {/* SHAP */}
                <ShapChart shapValues={result.shap_values} />

                {/* Log */}
                <div style={{ marginBottom: 24 }}>
                  <div className="section-title">Pipeline Execution Log</div>
                  <div className="log-container">
                    {result.processing_log?.map((line, i) => (
                      <div
                        key={i}
                        className={`log-line ${line.startsWith("✅") ? "success" : ""}`}
                      >
                        {line}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="compliance-note">
                  ⚖ {result.resolver_output?.compliance_note}
                </div>
              </>
            )}

            {/* History tab */}
            {tab === "history" && <HistoryPanel />}

            {/* Bulk scoring tab */}
            {tab === "bulk" && <BulkPanel />}
          </main>
        </div>
      </div>
    </>
  );
}


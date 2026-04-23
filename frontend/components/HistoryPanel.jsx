"use client";

import { useState, useEffect } from "react";

const TIER_CONFIG = {
  A: { color: "#00D4AA", bg: "rgba(0,212,170,0.12)" },
  B: { color: "#4ECDC4", bg: "rgba(78,205,196,0.12)" },
  C: { color: "#FFB347", bg: "rgba(255,179,71,0.12)" },
  D: { color: "#FF6B6B", bg: "rgba(255,107,107,0.12)" },
};

const styles = `
  .history-card {
    background: rgba(13,20,32,0.6);
    border: 1px solid rgba(30,58,95,0.4);
    border-radius: 16px; padding: 20px;
  }
  .history-title { font-size: 14px; font-weight: 600; margin-bottom: 16px; color: #E8EDF5; }
  .history-table { width: 100%; border-collapse: collapse; }
  .history-table th {
    font-size: 10px; color: #4A6FA5; font-weight: 600;
    text-transform: uppercase; letter-spacing: 1px;
    padding: 8px 12px; text-align: left;
    border-bottom: 1px solid rgba(30,58,95,0.4);
  }
  .history-table td {
    padding: 10px 12px; font-size: 12px; color: #E8EDF5;
    border-bottom: 1px solid rgba(30,58,95,0.2);
  }
  .history-table tr:hover td { background: rgba(13,20,32,0.4); }
  .tier-pill {
    display: inline-block; padding: 2px 8px; border-radius: 4px;
    font-size: 11px; font-weight: 700; font-family: monospace;
  }
  .history-empty {
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    min-height: 300px; gap: 12px; color: #2A4A6F;
  }
`;

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
      <>
        <style>{styles}</style>
        <div className="history-card">
          <div className="history-empty">
            <div style={{ fontSize: 40 }}>📋</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: "#3A5A7F" }}>
              No assessments yet
            </div>
            <div style={{ fontSize: 13 }}>Run a scoring to see history</div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{styles}</style>
      <div className="history-card">
        <div className="history-title">Recent Assessments</div>
        <table className="history-table">
          <thead>
            <tr>
              <th>Borrower</th>
              <th>Score</th>
              <th>Tier</th>
              <th>Employment</th>
              <th>Income</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {history.map((r) => {
              const cfg = TIER_CONFIG[r.credit_tier] || TIER_CONFIG.C;
              return (
                <tr key={r.id}>
                  <td>{r.borrower_name}</td>
                  <td style={{ fontFamily: "monospace", color: cfg.color }}>
                    {r.final_score}
                  </td>
                  <td>
                    <span
                      className="tier-pill"
                      style={{ background: cfg.bg, color: cfg.color }}
                    >
                      {r.credit_tier}
                    </span>
                  </td>
                  <td style={{ color: "#7A9BC4" }}>{r.employment_type}</td>
                  <td style={{ fontFamily: "monospace", fontSize: 11 }}>
                    ₹{Math.round(r.monthly_income / 1000)}k
                  </td>
                  <td style={{ color: "#2A4A6F", fontSize: 11 }}>
                    {new Date(r.created_at).toLocaleTimeString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

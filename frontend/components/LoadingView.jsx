"use client";

import { useState, useEffect } from "react";

const STEPS = [
  "Initializing LangGraph pipeline...",
  "Running UPI Transaction Agent...",
  "Running Income Stability Agent...",
  "Running Rental Payment Agent...",
  "Running Behavioral Agent...",
  "Resolver synthesizing outputs...",
  "XGBoost scoring + SHAP analysis...",
  "Generating lender report...",
];

const styles = `
  .loading-wrap {
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    min-height: 400px; gap: 20px;
  }
  .loading-ring {
    width: 64px; height: 64px; border-radius: 50%;
    border: 3px solid rgba(0,212,170,0.15);
    border-top-color: #00D4AA;
    animation: spin 1s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .loading-label { font-size: 14px; color: #00D4AA; text-align: center; }
  .loading-elapsed { font-family: monospace; font-size: 11px; color: #2A4A6F; }
  .loading-steps { display: flex; flex-direction: column; gap: 8px; }
  .loading-step {
    display: flex; align-items: center; gap: 10px;
    font-size: 13px; color: #4A6FA5; transition: color 0.3s;
  }
  .loading-step.active { color: #00D4AA; }
  .step-dot {
    width: 8px; height: 8px; border-radius: 50%;
    background: #1E3A5F; flex-shrink: 0; transition: background 0.3s;
  }
  .step-dot.active { background: #00D4AA; box-shadow: 0 0 8px #00D4AA; }
`;

export default function LoadingView({ elapsed }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const t = setInterval(
      () => setStep((s) => Math.min(s + 1, STEPS.length - 1)),
      1200
    );
    return () => clearInterval(t);
  }, []);

  return (
    <>
      <style>{styles}</style>
      <div className="loading-wrap">
        <div className="loading-ring" />
        <div style={{ textAlign: "center" }}>
          <div className="loading-label">Analyzing borrower profile...</div>
          <div className="loading-elapsed">{elapsed.toFixed(1)}s elapsed</div>
        </div>
        <div className="loading-steps">
          {STEPS.map((s, i) => (
            <div key={i} className={`loading-step ${i <= step ? "active" : ""}`}>
              <div className={`step-dot ${i <= step ? "active" : ""}`} />
              {s}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

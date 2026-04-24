"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

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
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-6">
      <Loader2 size={64} className="text-primary animate-spin" />
      <div className="text-center">
        <div className="text-sm font-semibold text-primary tracking-wide uppercase mb-1">Analyzing borrower profile...</div>
        <div className="font-mono text-xs text-text-muted">{elapsed.toFixed(1)}s elapsed</div>
      </div>
      <div className="flex flex-col gap-3 mt-4">
        {STEPS.map((s, i) => (
          <div key={i} className={`flex items-center gap-3 text-sm transition-colors duration-300 ${i <= step ? "text-primary font-medium" : "text-text-subtle"}`}>
            <div className={`w-2 h-2 rounded-full shrink-0 transition-all duration-300 ${i <= step ? "bg-primary shadow-[0_0_8px_var(--color-primary)]" : "bg-border"}`} />
            {s}
          </div>
        ))}
      </div>
    </div>
  );
}

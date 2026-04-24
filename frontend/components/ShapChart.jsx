"use client";

import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  CartesianGrid, Cell, ResponsiveContainer,
} from "recharts";
import { AlertCircle } from "lucide-react";

const FEATURE_LABELS = {
  upi_salary_regularity: "UPI Salary Regularity",
  upi_savings_ratio: "Savings Ratio",
  upi_merchant_diversity: "Merchant Diversity",
  upi_avg_monthly_inflow: "Monthly Inflow",
  upi_monthly_txn_count: "Monthly Transactions",
  income_stability_score: "Income Stability",
  monthly_income_est: "Income Estimate",
  job_tenure_months: "Job Tenure",
  has_employer_epf: "EPF Coverage",
  rent_payment_on_time_rate: "Rent Timeliness",
  utility_on_time_rate: "Utility Timeliness",
  rental_tenure_months: "Rental Tenure",
  location_stability_score: "Location Stability",
  app_usage_tier: "Financial App Usage",
  sim_tenure_months: "SIM Tenure",
  night_txn_ratio: "Night Transaction Risk",
  income_growth_trend: "Income Growth",
};

export default function ShapChart({ shapValues }) {
  if (!shapValues) return null;

  const data = Object.entries(shapValues)
    .filter(([key, val]) => typeof val === 'number')
    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
    .slice(0, 8)
    .map(([key, val]) => ({
      name: FEATURE_LABELS[key] || key,
      value: typeof val === 'number' ? parseFloat(val.toFixed ? val.toFixed(3) : val) : 0,
      color: val >= 0 ? "var(--color-primary)" : "#FF6B6B",
    }));

  if (data.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-2xl p-6 md:p-8 mb-8">
        <div className="text-lg font-semibold text-text mb-1">Score Explainability (Feature Importance)</div>
        <div className="text-sm text-text-muted mb-6">
          Feature importance shows how each input signal influenced the final score
        </div>
        <div className="flex items-center gap-2 text-sm text-text-muted py-6">
          <AlertCircle size={16} /> Model analysis unavailable. Please check the pipeline logs.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-2xl p-6 md:p-8 mb-8">
      <div className="text-lg font-semibold text-text mb-1">Score Explainability (Feature Importance)</div>
      <div className="text-sm text-text-muted mb-6">
        How each signal influenced the final score
      </div>
      <div className="w-full h-[260px] -ml-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--color-border)"
              horizontal={false}
            />
            <XAxis
              type="number"
              tick={{ fill: "var(--color-text-muted)", fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: "var(--color-border)" }}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fill: "var(--color-text)", fontSize: 11, fontWeight: 500 }}
              width={160}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                background: "var(--color-surface2)",
                border: "1px solid var(--color-border)",
                borderRadius: "8px",
                fontSize: 12,
                color: "var(--color-text)",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
              }}
              cursor={{ fill: "var(--color-border)", opacity: 0.4 }}
              formatter={(v) => [v > 0 ? `+${v}` : v, "SHAP Impact"]}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {data.map((d, i) => (
                <Cell key={i} fill={d.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

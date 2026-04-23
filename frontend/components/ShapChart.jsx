"use client";

import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  CartesianGrid, Cell, ResponsiveContainer,
} from "recharts";

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

const styles = `
  .chart-card {
    background: rgba(13,20,32,0.6);
    border: 1px solid rgba(30,58,95,0.4);
    border-radius: 16px; padding: 20px; margin-bottom: 24px;
  }
  .chart-title { font-size: 14px; font-weight: 600; margin-bottom: 4px; color: #E8EDF5; }
  .chart-subtitle { font-size: 11px; color: #4A6FA5; margin-bottom: 16px; }
`;

export default function ShapChart({ shapValues }) {
  if (!shapValues) return null;

  // Filter out non-numeric values and convert to data format
  const data = Object.entries(shapValues)
    .filter(([key, val]) => typeof val === 'number')  // Only keep numeric values
    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
    .slice(0, 8)
    .map(([key, val]) => ({
      name: FEATURE_LABELS[key] || key,
      value: typeof val === 'number' ? parseFloat(val.toFixed ? val.toFixed(3) : val) : 0,
      color: val >= 0 ? "#00D4AA" : "#FF6B6B",
    }));

  // Show message if no numeric explainability values available
  if (data.length === 0) {
    return (
      <>
        <style>{styles}</style>
        <div className="chart-card">
          <div className="chart-title">Score Explainability (Feature Importance)</div>
          <div className="chart-subtitle">
            Feature importance shows how each input signal influenced the final score
          </div>
          <div style={{ color: "#7A9BC4", fontSize: 12, padding: "20px 0" }}>
            Model analysis unavailable. Please check the pipeline logs.
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{styles}</style>
      <div className="chart-card">
        <div className="chart-title">Score Explainability (Feature Importance)</div>
        <div className="chart-subtitle">
          How each signal influenced the final score
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} layout="vertical" margin={{ left: 20, right: 40 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(30,58,95,0.2)"
              horizontal={false}
            />
            <XAxis
              type="number"
              tick={{ fill: "#4A6FA5", fontSize: 10 }}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fill: "#7A9BC4", fontSize: 10 }}
              width={155}
            />
            <Tooltip
              contentStyle={{
                background: "#0B1018",
                border: "1px solid rgba(30,58,95,0.5)",
                fontSize: 12,
                color: "#E8EDF5",
              }}
              formatter={(v) => [v > 0 ? `+${v}` : v, "SHAP Impact"]}
            />
            <Bar dataKey="value" radius={[0, 3, 3, 0]}>
              {data.map((d, i) => (
                <Cell key={i} fill={d.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}

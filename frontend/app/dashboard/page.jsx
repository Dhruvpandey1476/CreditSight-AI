"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import {
  Moon, Sun, Zap, BarChart3, ClipboardList, Upload, CheckCircle2,
  AlertTriangle, Building, Scale, CreditCard, Briefcase,
  Home as HomeIcon, Smartphone, LayoutGrid, Target, Database, Users, Settings, Menu, X, ChevronLeft, ChevronRight, Download, RotateCcw, LogOut
} from "lucide-react";
import ScoreGauge from "../../components/ScoreGauge";
import AgentCard from "../../components/AgentCard";
import ShapChart from "../../components/ShapChart";
import LoadingView from "../../components/LoadingView";
import HistoryPanel from "../../components/HistoryPanel";
import BulkPanel from "../../components/BulkPanel";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

const TIER_CONFIG = {
  A: { color: "var(--color-primary)", bg: "var(--color-primary-light)", label: "Excellent", desc: "Approve — low risk" },
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

export default function Dashboard() {
  const { theme, setTheme } = useTheme();
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [activeNav, setActiveNav] = useState("overview");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [demoProfiles, setDemoProfiles] = useState([]);
  const [historyData, setHistoryData] = useState([]);
  const [activeDemo, setActiveDemo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    setMounted(true);
    fetch("/api/demo-profiles")
      .then((r) => r.json())
      .then(setDemoProfiles)
      .catch(() => { });

    const token = localStorage.getItem("token");
    if (token) {
      fetch("/api/history?limit=1000", {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(r => r.json())
        .then(data => {
          if (Array.isArray(data)) setHistoryData(data);
        })
        .catch(() => { });
    }
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
      const token = localStorage.getItem("token");
      const res = await fetch("/api/score", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(profile),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const tier = result?.credit_tier;
  const cfg = tier ? TIER_CONFIG[tier] : null;

  const renderOverview = () => {
    const totalUsers = historyData.length;
    const highRiskFlags = historyData.filter(d => ['C', 'D'].includes(d.credit_tier)).length;
    const avgScore = totalUsers > 0 ? Math.round(historyData.reduce((acc, curr) => acc + curr.final_score, 0) / totalUsers) : 0;
    const approvalRate = totalUsers > 0 ? Math.round((historyData.filter(d => ['A', 'B'].includes(d.credit_tier)).length / totalUsers) * 100) : 0;

    const chartData = [
      { name: 'Tier A (Excellent)', count: historyData.filter(d => d.credit_tier === 'A').length, fill: 'var(--color-primary)' },
      { name: 'Tier B (Good)', count: historyData.filter(d => d.credit_tier === 'B').length, fill: '#4ECDC4' },
      { name: 'Tier C (Fair)', count: historyData.filter(d => d.credit_tier === 'C').length, fill: '#FFB347' },
      { name: 'Tier D (Poor)', count: historyData.filter(d => d.credit_tier === 'D').length, fill: '#FF6B6B' },
    ];

    return (
      <div className="flex flex-col gap-6 w-full h-full animate-fade-in-up overflow-y-auto custom-scrollbar pr-2 pb-12">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-bold text-text mb-1">Overview</h1>
            <p className="text-sm text-text-muted">Monitor your overall credit risk metrics and system health.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-2">
          {[
            { label: "Total Profiles Analyzed", value: totalUsers.toString(), trend: "Live", icon: Users, colorClass: "text-blue-500", bgClass: "bg-blue-500/10", borderClass: "border-blue-500/20", trendClass: "text-blue-500" },
            { label: "High Risk Flags", value: highRiskFlags.toString(), trend: "Live", icon: AlertTriangle, colorClass: "text-rose-500", bgClass: "bg-rose-500/10", borderClass: "border-rose-500/20", trendClass: "text-rose-500" },
            { label: "Avg. Credit Score", value: avgScore.toString(), trend: "Live", icon: Zap, colorClass: "text-amber-500", bgClass: "bg-amber-500/10", borderClass: "border-amber-500/20", trendClass: "text-amber-500" },
            { label: "Approval Rate", value: `${approvalRate}%`, trend: "Live", icon: CheckCircle2, colorClass: "text-emerald-500", bgClass: "bg-emerald-500/10", borderClass: "border-emerald-500/20", trendClass: "text-emerald-500" },
          ].map((stat, i) => (
            <div key={i} className="p-5 rounded-2xl bg-surface border border-border flex flex-col gap-4 relative hover:-translate-y-1 hover:shadow-md transition-all cursor-default" style={{ animationDelay: `${i * 100}ms` }}>
              <div className="flex justify-between items-start">
                <div className={`p-2 rounded-lg border ${stat.bgClass} ${stat.borderClass}`}>
                  <stat.icon size={16} className={stat.colorClass} />
                </div>
                <span className={`text-xs font-medium ${stat.trendClass}`}>{stat.trend}</span>
              </div>
              <div>
                <div className="text-xs font-medium text-text-muted mb-1">{stat.label}</div>
                <div className="text-2xl font-bold text-text tracking-tight">{stat.value}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-2">
          <div className="lg:col-span-2 p-6 rounded-2xl bg-surface border border-border min-h-[300px] flex flex-col hover:shadow-sm transition-shadow min-w-0">
            <div className="text-sm font-semibold text-text mb-6">Risk Distribution</div>
            <div className="flex-1 min-h-[200px] -ml-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} />
                  <RechartsTooltip
                    cursor={{ fill: 'var(--color-surface2)' }}
                    contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', borderRadius: '8px' }}
                    itemStyle={{ color: 'var(--color-text)' }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="p-6 rounded-2xl bg-surface border border-border flex flex-col hover:shadow-sm transition-shadow min-w-0">
            <div className="text-sm font-semibold text-text mb-6">Agent Activity</div>
            <div className="flex-1 min-h-[200px] flex flex-col justify-center relative -mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: "UPI Agent", val: 120, color: "#3b82f6" },
                      { name: "Income Agent", val: 65, color: "#10b981" },
                      { name: "Rental Agent", val: 35, color: "#f59e0b" },
                      { name: "Behavioral Agent", val: 15, color: "#6366f1" },
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="val"
                    stroke="none"
                    cornerRadius={4}
                  >
                    {[
                      { color: "#3b82f6" },
                      { color: "#10b981" },
                      { color: "#f59e0b" },
                      { color: "#6366f1" },
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                    itemStyle={{ color: 'var(--color-text)', fontSize: '12px', fontWeight: '600' }}
                    labelStyle={{ display: 'none' }}
                  />
                  <text x="50%" y="45%" textAnchor="middle" dominantBaseline="middle" className="fill-text text-xl font-bold">235</text>
                  <text x="50%" y="58%" textAnchor="middle" dominantBaseline="middle" className="fill-text-muted text-[10px] font-medium tracking-wider uppercase">Signals</text>
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-y-3 gap-x-6 mt-4 pt-4 border-t border-border">
              {[
                { name: "UPI Agent", val: 120, color: "#3b82f6" },
                { name: "Income Agent", val: 65, color: "#10b981" },
                { name: "Rental Agent", val: 35, color: "#f59e0b" },
                { name: "Behavioral Agent", val: 15, color: "#6366f1" },
              ].map((ag, i) => (
                <div key={i} className="flex items-center justify-between text-xs text-text-muted hover:text-text transition-colors cursor-default">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ag.color }}></div>
                    <span className="truncate">{ag.name}</span>
                  </div>
                  <span className="font-semibold text-text">{ag.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderScoreChecker = () => (
    <div className="flex flex-col gap-6 h-full w-full animate-fade-in-up overflow-y-auto lg:overflow-hidden custom-scrollbar pr-2 pb-12 lg:pb-0">
      <div className="shrink-0">
        <h1 className="text-2xl font-bold text-text mb-1">Score Checker</h1>
        <p className="text-sm text-text-muted">Run individual credit assessments on prospective borrowers.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 flex-1 lg:min-h-0 pb-12 lg:pb-0">
        {/* Form Column Wrapper */}
        <div className="w-full lg:w-[380px] shrink-0 bg-surface border border-border rounded-2xl shadow-sm lg:h-full flex flex-col lg:overflow-hidden">
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-6">
            <div className="p-6 pb-0">
              <div className="text-xs font-semibold tracking-wider text-text-muted uppercase mb-4">Demo Profiles</div>
              <div className="flex flex-col gap-2 mb-8">
                {demoProfiles.map((dp, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-sm hover:-translate-y-[1px] ${activeDemo === i
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border bg-surface hover:border-text-muted"
                      }`}
                    onClick={() => selectDemo(dp, i)}
                  >
                    <div className={`text-sm font-semibold mb-1 ${activeDemo === i ? "text-primary" : "text-text"}`}>{dp.label}</div>
                    <div className="text-xs text-text-muted">{dp.description}</div>
                  </div>
                ))}
              </div>

              <div className="text-xs font-semibold tracking-wider text-text-muted uppercase mb-4">Borrower Details</div>

              <div className="mb-4">
                <label className="block text-xs text-text-muted mb-1.5 font-medium">Borrower Name</label>
                <input
                  className="w-full px-3 py-2.5 bg-surface2 border border-border rounded-lg text-text text-sm transition-colors focus:outline-none focus:border-text-muted focus:bg-surface appearance-none"
                  value={profile.borrower_name}
                  onChange={(e) => update("borrower_name", e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-xs text-text-muted mb-1.5 font-medium">Employment Type</label>
                  <select
                    className="w-full px-3 py-2.5 bg-surface2 border border-border rounded-lg text-text text-sm transition-colors focus:outline-none focus:border-text-muted focus:bg-surface appearance-none"
                    value={profile.employment_type}
                    onChange={(e) => update("employment_type", e.target.value)}
                  >
                    <option value="salaried">Salaried</option>
                    <option value="self_employed">Self Employed</option>
                    <option value="gig">Gig Worker</option>
                    <option value="informal">Informal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-text-muted mb-1.5 font-medium">Job Tenure (mos)</label>
                  <input
                    className="w-full px-3 py-2.5 bg-surface2 border border-border rounded-lg text-text font-mono text-sm transition-colors focus:outline-none focus:border-text-muted focus:bg-surface appearance-none"
                    type="number"
                    value={profile.job_tenure_months}
                    onChange={(e) => update("job_tenure_months", +e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-xs text-text-muted mb-1.5 font-medium">Monthly Income (₹)</label>
                  <input
                    className="w-full px-3 py-2.5 bg-surface2 border border-border rounded-lg text-text font-mono text-sm transition-colors focus:outline-none focus:border-text-muted focus:bg-surface appearance-none"
                    type="number"
                    value={profile.monthly_income_est}
                    onChange={(e) => update("monthly_income_est", +e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs text-text-muted mb-1.5 font-medium">Salary Regularity</label>
                  <input
                    className="w-full px-3 py-2.5 bg-surface2 border border-border rounded-lg text-text font-mono text-sm transition-colors focus:outline-none focus:border-text-muted focus:bg-surface appearance-none"
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={profile.upi_salary_regularity}
                    onChange={(e) => update("upi_salary_regularity", +e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-xs text-text-muted mb-1.5 font-medium">UPI Inflow (₹)</label>
                  <input
                    className="w-full px-3 py-2.5 bg-surface2 border border-border rounded-lg text-text font-mono text-sm transition-colors focus:outline-none focus:border-text-muted focus:bg-surface appearance-none"
                    type="number"
                    value={profile.upi_avg_monthly_inflow}
                    onChange={(e) => update("upi_avg_monthly_inflow", +e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs text-text-muted mb-1.5 font-medium">UPI Outflow (₹)</label>
                  <input
                    className="w-full px-3 py-2.5 bg-surface2 border border-border rounded-lg text-text font-mono text-sm transition-colors focus:outline-none focus:border-text-muted focus:bg-surface appearance-none"
                    type="number"
                    value={profile.upi_avg_monthly_outflow}
                    onChange={(e) => update("upi_avg_monthly_outflow", +e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-xs text-text-muted mb-1.5 font-medium">Merchant Diversity</label>
                  <input
                    className="w-full px-3 py-2.5 bg-surface2 border border-border rounded-lg text-text font-mono text-sm transition-colors focus:outline-none focus:border-text-muted focus:bg-surface appearance-none"
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={profile.upi_merchant_diversity}
                    onChange={(e) => update("upi_merchant_diversity", +e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs text-text-muted mb-1.5 font-medium">Rent On-Time</label>
                  <input
                    className="w-full px-3 py-2.5 bg-surface2 border border-border rounded-lg text-text font-mono text-sm transition-colors focus:outline-none focus:border-text-muted focus:bg-surface appearance-none"
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={profile.rent_payment_on_time_rate}
                    onChange={(e) => update("rent_payment_on_time_rate", +e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-xs text-text-muted mb-1.5 font-medium">Utility On-Time</label>
                  <input
                    className="w-full px-3 py-2.5 bg-surface2 border border-border rounded-lg text-text font-mono text-sm transition-colors focus:outline-none focus:border-text-muted focus:bg-surface appearance-none"
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={profile.utility_on_time_rate}
                    onChange={(e) => update("utility_on_time_rate", +e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs text-text-muted mb-1.5 font-medium">SIM Tenure (mos)</label>
                  <input
                    className="w-full px-3 py-2.5 bg-surface2 border border-border rounded-lg text-text font-mono text-sm transition-colors focus:outline-none focus:border-text-muted focus:bg-surface appearance-none"
                    type="number"
                    value={profile.sim_tenure_months}
                    onChange={(e) => update("sim_tenure_months", +e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <div>
                  <label className="block text-xs text-text-muted mb-1.5 font-medium">Device Type</label>
                  <select
                    className="w-full px-3 py-2.5 bg-surface2 border border-border rounded-lg text-text text-sm transition-colors focus:outline-none focus:border-text-muted focus:bg-surface appearance-none"
                    value={profile.device_type}
                    onChange={(e) => update("device_type", e.target.value)}
                  >
                    <option value="premium">Premium</option>
                    <option value="mid_range">Mid Range</option>
                    <option value="budget">Budget</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-text-muted mb-1.5 font-medium">Location Stability</label>
                  <input
                    className="w-full px-3 py-2.5 bg-surface2 border border-border rounded-lg text-text font-mono text-sm transition-colors focus:outline-none focus:border-text-muted focus:bg-surface appearance-none"
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={profile.location_stability_score}
                    onChange={(e) => update("location_stability_score", +e.target.value)}
                  />
                </div>
              </div>

              <button
                className="w-full py-3 bg-primary text-primary-foreground border-none rounded-lg text-sm font-semibold cursor-pointer transition-all hover:scale-[1.02] active:scale-95 hover:shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                onClick={analyze}
                disabled={loading}
              >
                {loading ? "Analyzing..." : "Run Credit Assessment"}
              </button>

              {error && (
                <div className="mt-4 p-3 bg-red/10 border border-red/30 rounded-lg text-xs text-red flex items-start gap-2 animate-fade-in">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Results Column Wrapper */}
        <div className="flex-1 relative flex flex-col lg:h-full min-h-0">
          {/* Scroll Masks */}
          <div className="absolute top-0 left-0 right-2 h-4 bg-gradient-to-b from-bg to-transparent z-20 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 right-2 h-6 bg-gradient-to-t from-bg to-transparent z-20 pointer-events-none"></div>

          {/* Placeholders */}
          {!loading && !result && (
            <div className="absolute inset-y-4 left-0 right-4 border border-dashed border-border rounded-2xl flex flex-col items-center justify-center text-text-muted z-10 pointer-events-none">
              <Target size={40} className="mb-4 opacity-50" />
              <div className="text-sm font-medium">Awaiting Assessment</div>
              <div className="text-xs text-text-subtle mt-1">Select a profile and run analysis.</div>
            </div>
          )}

          {loading && (
            <div className="absolute inset-y-4 left-0 right-4 border border-border rounded-2xl flex items-center justify-center bg-surface z-10 pointer-events-none">
              <LoadingView elapsed={elapsed} />
            </div>
          )}

          {/* Results Scroll Container */}
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-10 pt-4 flex flex-col">
            {!loading && result && (
              <div className="flex flex-col md:flex-row gap-8 animate-fade-in-up items-start">
                {/* Sticky Score Gauge on the left */}
                <div className="w-full md:w-[280px] shrink-0 sticky top-0 self-start z-10">
                  <ScoreGauge
                    score={result.final_score}
                    tier={result.credit_tier}
                    ml_score={result.ml_score}
                    agent_composite_score={result.agent_composite_score}
                    score_breakdown={result.score_breakdown}
                  />
                </div>

                {/* Scrolling Content on the right */}
                <div className="flex-1 flex flex-col gap-8 w-full">
                  {/* Assessment Text Card */}
                  <div className="bg-surface border border-border rounded-2xl p-6 flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <div className="text-xl font-bold text-text">{result.borrower_name}</div>
                        <div className="text-xs text-text-muted mt-0.5 font-mono">ID: {result.assessment_id}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setResult(null)}
                          className="flex shrink-0 items-center justify-center w-8 h-8 rounded-lg text-text-muted bg-surface2 border border-border hover:text-text hover:bg-surface hover:border-text-muted transition-all cursor-pointer group"
                          title="Clear Results"
                        >
                          <RotateCcw size={14} className="group-hover:-rotate-180 transition-transform duration-500" />
                        </button>
                        <button
                          onClick={() => window.open(`http://localhost:8000/api/assessment/${result.assessment_id}/download`, '_blank')}
                          className="flex shrink-0 items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold bg-surface2 border border-border text-text hover:text-text hover:bg-surface hover:border-text-muted transition-all cursor-pointer group"
                        >
                          <Download size={14} className="group-hover:-translate-y-[1px] transition-transform text-text-muted group-hover:text-text" />
                          Download PDF
                        </button>
                      </div>
                    </div>

                    <div className="px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-3 bg-surface2 border border-border text-text">
                      <Building size={16} className="text-text-muted" />
                      {result.resolver_output?.lender_recommendation}
                    </div>

                    <div className="text-sm text-text-muted leading-relaxed">
                      {result.resolver_output?.resolution_reasoning}
                    </div>

                    <div className="flex gap-4 mt-2">
                      <div className="flex-1">
                        <div className="text-[10px] text-text-subtle mb-2 font-semibold tracking-wider">STRENGTHS</div>
                        <div className="flex flex-col gap-1.5">
                          {result.resolver_output?.key_strengths?.slice(0, 2).map((s, i) => (
                            <div key={i} className="text-xs text-text-muted flex items-start gap-1.5">
                              <CheckCircle2 size={12} className="mt-0.5 text-emerald-500" /> <span className="leading-tight">{s}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      {result.resolver_output?.key_risks?.length > 0 && (
                        <div className="flex-1">
                          <div className="text-[10px] text-text-subtle mb-2 font-semibold tracking-wider">RISKS</div>
                          <div className="flex flex-col gap-1.5">
                            {result.resolver_output.key_risks.slice(0, 2).map((s, i) => (
                              <div key={i} className="text-xs text-text-muted flex items-start gap-1.5">
                                <AlertTriangle size={12} className="mt-0.5 text-rose-500" /> <span className="leading-tight">{s}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  {/* SHAP */}
                  <ShapChart shapValues={result.shap_values} />
                  {/* Agent cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <AgentCard name="UPI Transaction" icon={<CreditCard size={16} />} data={result.upi_analysis} />
                    <AgentCard name="Income & Employment" icon={<Briefcase size={16} />} data={result.income_analysis} />
                    <AgentCard name="Rental & Bills" icon={<HomeIcon size={16} />} data={result.rental_analysis} />
                    <AgentCard name="Behavioral Profile" icon={<Smartphone size={16} />} data={result.behavioral_analysis} />
                  </div>


                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-screen w-full bg-bg text-text flex relative overflow-hidden">
      {/* Subtle Diagonal Background Pattern */}
      <div
        className="absolute inset-0 z-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none"
        style={{
          backgroundImage: `repeating-linear-gradient(45deg, var(--color-text) 0, var(--color-text) 1px, transparent 1px, transparent 40px)`
        }}
      />
      {/* Ambient BG */}
      <div className="absolute top-[10%] left-[20%] w-[50%] h-[50%] rounded-full bg-blue-500/5 blur-[120px] -z-10 pointer-events-none" />

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden animate-fade-in"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`fixed lg:relative top-0 left-0 z-50 bg-bg border-r border-border flex flex-col shrink-0 h-screen transition-all duration-300 shadow-xl lg:shadow-none ${isSidebarOpen ? 'translate-x-0 w-[240px]' : '-translate-x-full w-[240px] lg:translate-x-0 lg:w-[68px]'}`}>
        {/* Border Toggler */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="hidden lg:flex absolute -right-3 top-8 w-6 h-6 rounded-full bg-surface border border-border items-center justify-center text-text-muted hover:text-text hover:bg-surface2 hover:scale-110 transition-all shadow-sm z-50"
        >
          {isSidebarOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
        </button>
        <div className="p-5 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
            <div className="w-7 h-7 rounded-md bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs shadow-sm">
              CS
            </div>
            <div className={`text-base font-bold tracking-tight text-text whitespace-nowrap transition-opacity ${!isSidebarOpen ? 'lg:opacity-0' : 'opacity-100'}`}>
              CreditSight
            </div>
          </Link>
          <button className="lg:hidden text-text-muted hover:text-text" onClick={() => setIsSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-x-hidden overflow-y-auto custom-scrollbar">
          {[
            { id: "overview", label: "Overview", icon: LayoutGrid },
            { id: "score", label: "Score Checker", icon: Target },
            { id: "batch", label: "Batch Inference", icon: Database },
          ].map((item) => (
            <button
              key={item.id}
              title={!isSidebarOpen ? item.label : undefined}
              onClick={() => {
                setActiveNav(item.id);
                if (window.innerWidth < 1024) setIsSidebarOpen(false);
              }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap overflow-hidden hover:scale-[1.02] active:scale-95 ${activeNav === item.id
                  ? "bg-surface2 text-text shadow-sm"
                  : "text-text-muted hover:text-text hover:bg-surface"
                }`}
            >
              <item.icon size={18} className="shrink-0" />
              <span className={`transition-opacity ${!isSidebarOpen ? 'lg:opacity-0' : 'opacity-100'}`}>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-border overflow-hidden whitespace-nowrap flex flex-col gap-4">
          {mounted && (
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-text-muted hover:text-text hover:bg-surface transition-all w-full overflow-hidden"
            >
              <div className="relative w-4 h-4 flex items-center justify-center shrink-0">
                <Moon size={18} className={`absolute transition-all duration-500 ${theme === "dark" ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-50 opacity-0"}`} />
                <Sun size={18} className={`absolute transition-all duration-500 ${theme === "dark" ? "rotate-90 scale-50 opacity-0" : "rotate-0 scale-100 opacity-100"}`} />
              </div>
              <span className={`transition-opacity ${!isSidebarOpen ? 'lg:opacity-0 lg:w-0' : 'opacity-100'}`}>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
            </button>
          )}
          <div className="flex items-center justify-between px-1 w-full group">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-surface2 flex items-center justify-center text-xs font-semibold text-text border border-border shrink-0 transition-colors uppercase">
                {user?.username ? user.username.charAt(0) : "N"}
              </div>
              <div className={`transition-opacity ${!isSidebarOpen ? 'lg:opacity-0' : 'opacity-100'}`}>
                <div className="text-xs font-medium text-text truncate max-w-[120px]">{user?.username || "User"}</div>
                <div className="text-[10px] text-text-subtle truncate max-w-[120px]">{user?.email || "NBFC Lender"}</div>
              </div>
            </div>

            <button
              onClick={logout}
              className={`text-text-muted hover:text-red-500 transition-colors p-1.5 rounded-md hover:bg-red-500/10 ${!isSidebarOpen ? 'lg:hidden' : 'opacity-0 group-hover:opacity-100'}`}
              title="Log Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-transparent h-screen flex flex-col z-10 relative overflow-hidden">
        {/* Header with Toggler */}
        <header className="px-8 py-5 flex items-center gap-4 lg:hidden border-b border-border bg-bg/80 backdrop-blur-sm sticky top-0 z-30">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="text-text-muted hover:text-text transition-colors"
          >
            <Menu size={24} />
          </button>
          <Link href="/" className="text-base font-bold tracking-tight text-text hover:opacity-90 transition-opacity">CreditSight</Link>
        </header>

        {/* Content Area */}
        <div className="p-8 lg:p-10 flex-1 relative flex flex-col min-h-0 overflow-hidden">

          {activeNav === "overview" && renderOverview()}
          {activeNav === "score" && renderScoreChecker()}
          {activeNav === "batch" && (
            <div className="w-full h-full animate-fade-in-up flex flex-col min-h-0 pr-2">
              <div className="mb-6 shrink-0">
                <h1 className="text-2xl font-bold text-text mb-1 tracking-tight">Batch Inference</h1>
                <p className="text-sm text-text-muted">Upload a CSV containing user data to score thousands of profiles simultaneously.</p>
              </div>
              <div className="flex-1 min-h-0 flex flex-col">
                <BulkPanel />
              </div>
            </div>
          )}
          {activeNav === "users" && (
            <div className="w-full h-full animate-fade-in-up overflow-y-auto custom-scrollbar pr-4 pb-12">
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-text mb-1 tracking-tight">Users & Agents</h1>
                <p className="text-sm text-text-muted">Manage system users and configure LLM agent parameters.</p>
              </div>
              <div className="p-12 border border-dashed border-border rounded-2xl text-center text-text-muted text-sm bg-surface/50">
                User management coming soon.
              </div>
            </div>
          )}
          {activeNav === "settings" && (
            <div className="w-full h-full animate-fade-in-up overflow-y-auto custom-scrollbar pr-4 pb-12">
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-text mb-1 tracking-tight">Settings</h1>
                <p className="text-sm text-text-muted">Configure application preferences and integrations.</p>
              </div>
              <div className="p-12 border border-dashed border-border rounded-2xl text-center text-text-muted text-sm bg-surface/50">
                Settings panel coming soon.
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

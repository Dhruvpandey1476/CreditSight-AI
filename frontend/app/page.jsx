"use client";

import Link from "next/link";
import { Moon, Sun, Search, User, LayoutDashboard, Rocket, Activity, Users, Settings } from "lucide-react";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";

export default function LandingPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-bg text-text selection:bg-primary/20 font-sans flex flex-col relative overflow-hidden">
      {/* Subtle Diagonal Background Pattern */}
      <div 
        className="absolute inset-0 z-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none"
        style={{
          backgroundImage: `repeating-linear-gradient(45deg, var(--color-text) 0, var(--color-text) 1px, transparent 1px, transparent 40px)`
        }}
      />

      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 md:px-12 py-6 relative z-50 animate-fade-in">
        {/* Logo Left */}
        <div className="flex items-center gap-3 cursor-pointer w-48">
          <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm tracking-tighter shadow-sm">
            CS
          </div>
          <span className="font-bold text-lg tracking-tight">CreditSight</span>
        </div>
        
        {/* Center Links */}
        <div className="hidden md:flex items-center justify-center gap-10 text-sm font-medium text-text-muted">
          <span className="hover:text-text cursor-pointer transition-colors">Features</span>
          <span className="hover:text-text cursor-pointer transition-colors">Pricing</span>
          <span className="hover:text-text cursor-pointer transition-colors">Contact</span>
        </div>

        {/* Right Actions */}
        <div className="flex items-center justify-end gap-6 w-48">
          {mounted && (
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="text-text-muted hover:text-text transition-colors relative w-5 h-5 flex items-center justify-center"
              aria-label="Toggle theme"
            >
               <Moon size={16} className={`absolute transition-all duration-500 ${theme === "dark" ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-50 opacity-0"}`} />
               <Sun size={16} className={`absolute transition-all duration-500 ${theme === "dark" ? "rotate-90 scale-50 opacity-0" : "rotate-0 scale-100 opacity-100"}`} />
            </button>
          )}
          <span className="text-sm font-bold hover:text-text-muted cursor-pointer transition-colors hidden sm:block">Login</span>
          <Link href="/dashboard" className="bg-surface text-text border border-border px-4 py-2 rounded-lg text-sm font-bold hover:bg-surface2 active:scale-95 transition-all shadow-sm">
            Dashboard
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-start text-center px-6 pt-24 pb-0 relative z-10">
        
        <h1 className="opacity-0 animate-[fade-in-up_0.6s_ease-out_0.1s_forwards] text-5xl md:text-[80px] font-bold tracking-tight leading-[1.05] mb-8 max-w-5xl mx-auto text-text-muted">
          Assess credit risk <br className="hidden md:block" />
          in seconds, <span className="text-text font-black">not hours.</span>
        </h1>
        
        <p className="opacity-0 animate-[fade-in-up_0.6s_ease-out_0.2s_forwards] text-lg text-text-muted max-w-2xl mx-auto mb-12 leading-relaxed">
          With our state of the art, cutting edge alternative data engine, you can score your borrowers in seconds.
        </p>
        
        {/* Buttons */}
        <div className="opacity-0 animate-[fade-in-up_0.6s_ease-out_0.3s_forwards] flex flex-col sm:flex-row items-center gap-4 relative">
          <Link href="/dashboard" className="px-6 py-3 rounded-lg bg-primary text-primary-foreground font-bold hover:scale-[1.02] active:scale-95 shadow-md transition-all w-full sm:w-auto min-w-[160px] text-center">
            Create account
          </Link>
          <button className="px-6 py-3 rounded-lg bg-surface text-text font-bold hover:bg-surface2 hover:scale-[1.02] active:scale-95 transition-all border border-border shadow-sm w-full sm:w-auto min-w-[160px]">
            Book a call
          </button>

          {/* Spark Particles */}
          <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-20 h-20 pointer-events-none">
             <div className="absolute top-4 left-6 w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse blur-[1px]"></div>
             <div className="absolute top-8 left-10 w-2 h-2 bg-amber-500 rounded-full animate-pulse blur-[1px]"></div>
             <div className="absolute top-6 left-12 w-1 h-1 bg-amber-300 rounded-full animate-pulse blur-[1px]"></div>
             <div className="absolute top-10 left-5 w-2 h-2 bg-orange-500 rounded-full animate-pulse blur-[2px]"></div>
          </div>
        </div>

        {/* Dashboard Mockup Peek */}
        <div className="opacity-0 animate-[fade-in-up_0.8s_ease-out_0.5s_forwards] mt-24 w-full max-w-5xl mx-auto bg-surface border-t border-x border-border rounded-t-2xl shadow-2xl flex flex-col md:flex-row text-left overflow-hidden h-[400px]">
          {/* Mockup Sidebar */}
          <div className="w-64 border-r border-border p-6 hidden md:flex flex-col gap-8 bg-bg/50">
             <div className="text-xl font-bold tracking-tight">CreditSight</div>
             <div className="flex flex-col gap-4 text-sm font-medium text-text-muted">
                <div className="flex items-center gap-3 text-text bg-surface2 px-3 py-2 rounded-md"><LayoutDashboard size={18}/> Dashboard</div>
                <div className="flex items-center gap-3 px-3 py-2"><Rocket size={18}/> Assessments</div>
                <div className="flex items-center gap-3 px-3 py-2"><Activity size={18}/> Analytics</div>
                <div className="flex items-center gap-3 px-3 py-2"><Users size={18}/> Team</div>
                <div className="flex items-center gap-3 px-3 py-2"><Settings size={18}/> Settings</div>
             </div>
          </div>
          {/* Mockup Main */}
          <div className="flex-1 bg-surface2/30 flex flex-col">
             {/* Mockup Header */}
             <div className="h-20 border-b border-border flex items-center justify-between px-8 bg-surface/50">
                <div className="font-bold text-lg">Assessments</div>
                <div className="flex items-center gap-4">
                   <div className="flex items-center gap-2 px-3 py-1.5 border border-border bg-bg rounded-md text-sm text-text-muted w-64">
                      <Search size={14}/> Search borrowers...
                   </div>
                   <div className="w-8 h-8 rounded-full border border-border flex items-center justify-center bg-bg"><User size={14}/></div>
                </div>
             </div>
             {/* Mockup Content */}
             <div className="p-8 flex-1">
                <div className="flex items-center justify-between mb-6">
                   <div className="font-bold text-base">Recent Assessments</div>
                   <div className="px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-md">+ New Score</div>
                </div>
                {/* Mockup Table */}
                <div className="w-full bg-surface border border-border rounded-lg overflow-hidden">
                   <div className="grid grid-cols-4 gap-4 px-6 py-3 border-b border-border text-xs font-semibold text-text-muted">
                      <div>Name</div>
                      <div>Status</div>
                      <div>Last Scored</div>
                      <div className="text-right">Actions</div>
                   </div>
                   {[
                     { name: "Ramesh Kumar", date: "26/07/2024, 03:25:23", status: "High Risk" },
                     { name: "Priya Singh", date: "06/05/2024, 11:15:12", status: "Low Risk" },
                     { name: "Arjun Verma", date: "20/08/2024, 03:54:03", status: "Moderate" }
                   ].map((row, i) => (
                     <div key={i} className="grid grid-cols-4 gap-4 px-6 py-4 border-b border-border text-sm items-center">
                        <div className="font-medium">{row.name}</div>
                        <div><span className={`px-2.5 py-1 text-bg text-[10px] font-bold rounded-full uppercase tracking-wider ${row.status === 'High Risk' ? 'bg-rose-500' : row.status === 'Low Risk' ? 'bg-emerald-500' : 'bg-amber-500'}`}>{row.status}</span></div>
                        <div className="text-text-muted">{row.date}</div>
                        <div className="text-right flex justify-end"><div className="w-1 h-4 border-l-2 border-dotted border-text-muted"></div></div>
                     </div>
                   ))}
                </div>
             </div>
          </div>
        </div>


      </main>

      {/* Agent Use Case Section */}
      <section className="w-full max-w-6xl mx-auto px-6 mt-32 mb-32 z-10 opacity-0 animate-[fade-in-up_1s_ease-out_0.7s_forwards]">
        <div className="relative border border-border/40 rounded-[32px] p-10 md:p-16 overflow-hidden bg-bg/40 backdrop-blur-md shadow-2xl">
          {/* Inner Card Glow - Thematic smoke-like glow at bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-[80%] bg-gradient-to-t from-indigo-500/20 via-indigo-500/5 to-transparent pointer-events-none"></div>
          <div className="absolute -bottom-32 left-1/2 -translate-x-1/2 w-3/4 h-80 bg-indigo-500/20 blur-[120px] rounded-full pointer-events-none"></div>

          <div className="relative z-10 flex flex-col items-center text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-text mb-6">Powered by specialized AI agents</h2>
            <p className="text-text-muted max-w-2xl text-lg">
              Our ensemble of context-aware LLM agents cross-references alternative data footprints to build a holistic credit profile for every borrower.
            </p>
          </div>

          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
            {/* Agent 1 */}
            <div className="relative bg-surface/90 backdrop-blur-xl border border-border/60 rounded-2xl p-8 transition-all hover:-translate-y-1 hover:border-indigo-500/50 hover:shadow-[0_8px_30px_rgb(99,102,241,0.12)] group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative z-10">
                <div className="text-2xl font-bold text-text mb-4 group-hover:text-primary transition-colors">UPI Data</div>
                <p className="text-sm text-text-muted leading-relaxed">
                  Evaluates digital transaction footprint, velocity, and consistency to determine cash-flow health.
                </p>
              </div>
            </div>

            {/* Agent 2 */}
            <div className="relative bg-surface/90 backdrop-blur-xl border border-border/60 rounded-2xl p-8 transition-all hover:-translate-y-1 hover:border-indigo-500/50 hover:shadow-[0_8px_30px_rgb(99,102,241,0.12)] group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative z-10">
                <div className="text-2xl font-bold text-text mb-4 group-hover:text-primary transition-colors">Income</div>
                <p className="text-sm text-text-muted leading-relaxed">
                  Verifies stable income sources, employment tenure, and identifies high-risk gig employment volatility.
                </p>
              </div>
            </div>

            {/* Agent 3 */}
            <div className="relative bg-surface/90 backdrop-blur-xl border border-border/60 rounded-2xl p-8 transition-all hover:-translate-y-1 hover:border-indigo-500/50 hover:shadow-[0_8px_30px_rgb(99,102,241,0.12)] group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative z-10">
                <div className="text-2xl font-bold text-text mb-4 group-hover:text-primary transition-colors">Behavioral</div>
                <p className="text-sm text-text-muted leading-relaxed">
                  Analyzes spending habits and financial discipline to catch hidden liabilities or risky saving ratios.
                </p>
              </div>
            </div>

            {/* Agent 4 */}
            <div className="relative bg-surface/90 backdrop-blur-xl border border-border/60 rounded-2xl p-8 transition-all hover:-translate-y-1 hover:border-indigo-500/50 hover:shadow-[0_8px_30px_rgb(99,102,241,0.12)] group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative z-10">
                <div className="text-2xl font-bold text-text mb-4 group-hover:text-primary transition-colors">Rental</div>
                <p className="text-sm text-text-muted leading-relaxed">
                  Cross-references landlord records and utility payments to confirm location stability and on-time reliability.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

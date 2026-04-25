"use client";

import Link from "next/link";
import { Moon, Sun, Search, User, LayoutDashboard, Rocket, Activity, Users, Settings, ArrowRight, Menu, X } from "lucide-react";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

export default function LandingPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();

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
        <div className="flex items-center gap-3 cursor-pointer lg:w-64 w-auto z-50">
          <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm tracking-tighter shadow-sm">
            CS
          </div>
          <span className="font-bold text-lg tracking-tight">CreditSight</span>
        </div>
        
        {/* Mobile Menu Toggle */}
        <button 
          className="md:hidden flex items-center justify-center text-text z-50 p-2"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        
        {/* Center Links (Desktop) */}
        <div className="hidden md:flex items-center justify-center gap-10 text-sm font-medium text-text-muted">
          <Link href="/docs" className="hover:text-text cursor-pointer transition-colors">Docs</Link>
        </div>

        {/* Right Actions (Desktop) */}
        <div className="hidden md:flex items-center justify-end gap-4 md:gap-6 lg:w-64 w-auto">
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
          {mounted && user ? (
            <>
              <button onClick={logout} className="text-sm font-bold hover:text-text-muted cursor-pointer transition-colors hidden sm:block">Logout</button>
              <Link href="/dashboard" className="bg-surface text-text border border-border px-4 py-2 rounded-lg text-sm font-bold hover:bg-surface2 active:scale-95 transition-all shadow-sm whitespace-nowrap">
                Dashboard
              </Link>
            </>
          ) : mounted ? (
            <>
              <Link href="/login" className="text-sm font-bold hover:text-text-muted cursor-pointer transition-colors hidden sm:block">Login</Link>
              <Link href="/register" className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-bold hover:scale-105 active:scale-95 transition-all shadow-md whitespace-nowrap">
                Start Free Trial
              </Link>
            </>
          ) : (
            <div className="w-24"></div>
          )}
        </div>

        {/* Mobile Dropdown Menu */}
        {isMobileMenuOpen && (
          <div className="absolute top-0 left-0 w-full bg-bg border-b border-border z-40 px-6 pt-24 pb-8 flex flex-col gap-6 shadow-xl animate-fade-in md:hidden">
            <Link href="/docs" onClick={() => setIsMobileMenuOpen(false)} className="text-base font-bold text-text hover:text-primary transition-colors">Docs</Link>
            <div className="h-px bg-border w-full"></div>
            {mounted && (
              <div className="flex items-center justify-between">
                <span className="font-semibold text-text">Theme</span>
                <button
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="bg-surface border border-border p-2 rounded-md text-text"
                >
                   {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
                </button>
              </div>
            )}
            <div className="flex flex-col gap-3 mt-4">
              {mounted && user ? (
                <>
                  <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="w-full text-center bg-primary text-primary-foreground px-4 py-3 rounded-lg text-sm font-bold transition-all shadow-md">Dashboard</Link>
                  <button onClick={() => { logout(); setIsMobileMenuOpen(false); }} className="w-full text-center border border-border text-text px-4 py-3 rounded-lg text-sm font-bold transition-all">Logout</button>
                </>
              ) : (
                <>
                  <Link href="/register" onClick={() => setIsMobileMenuOpen(false)} className="w-full text-center bg-primary text-primary-foreground px-4 py-3 rounded-lg text-sm font-bold transition-all shadow-md">Start Free Trial</Link>
                  <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="w-full text-center border border-border text-text px-4 py-3 rounded-lg text-sm font-bold transition-all">Login</Link>
                </>
              )}
            </div>
          </div>
        )}
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
          <Link href={user ? "/dashboard" : "/register"} className="px-6 py-3 rounded-lg bg-primary text-primary-foreground font-bold hover:scale-[1.02] active:scale-95 shadow-md transition-all w-full sm:w-auto min-w-[160px] text-center">
            {user ? "Go to Dashboard" : "Create account"}
          </Link>
          <Link href={user ? "/dashboard" : "/login"} className="px-6 py-3 rounded-lg bg-surface text-text font-bold hover:bg-surface2 hover:scale-[1.02] active:scale-95 transition-all border border-border shadow-sm w-full sm:w-auto min-w-[160px] flex items-center justify-center gap-2">
            Explore <ArrowRight size={16} />
          </Link>

          {/* Spark Particles */}
          <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-20 h-20 pointer-events-none">
             <div className="absolute top-4 left-6 w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse blur-[1px]"></div>
             <div className="absolute top-8 left-10 w-2 h-2 bg-amber-500 rounded-full animate-pulse blur-[1px]"></div>
             <div className="absolute top-6 left-12 w-1 h-1 bg-amber-300 rounded-full animate-pulse blur-[1px]"></div>
             <div className="absolute top-10 left-5 w-2 h-2 bg-orange-500 rounded-full animate-pulse blur-[2px]"></div>
          </div>
        </div>

        {/* Dashboard Mockup Peek */}
        <div className="opacity-0 animate-[fade-in-up_0.8s_ease-out_0.5s_forwards] mt-24 w-full max-w-5xl mx-auto bg-surface border-t border-x border-border rounded-t-2xl shadow-2xl flex flex-col md:flex-row text-left overflow-x-hidden overflow-y-hidden h-[400px] hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-shadow duration-500">
          {/* Mockup Sidebar */}
          <div className="w-64 border-r border-border p-6 hidden md:flex flex-col gap-8 bg-bg/50">
             <div className="text-xl font-bold tracking-tight">CreditSight</div>
             <div className="flex flex-col gap-2 text-sm font-medium text-text-muted">
                <div className="flex items-center gap-3 text-text bg-surface2 px-3 py-2 rounded-md transition-colors"><LayoutDashboard size={18}/> Dashboard</div>
                <div className="flex items-center gap-3 px-3 py-2 hover:bg-surface hover:text-text hover:translate-x-1 cursor-pointer transition-all rounded-md"><Rocket size={18}/> Assessments</div>
                <div className="flex items-center gap-3 px-3 py-2 hover:bg-surface hover:text-text hover:translate-x-1 cursor-pointer transition-all rounded-md"><Activity size={18}/> Analytics</div>
                <div className="flex items-center gap-3 px-3 py-2 hover:bg-surface hover:text-text hover:translate-x-1 cursor-pointer transition-all rounded-md"><Users size={18}/> Team</div>
                <div className="flex items-center gap-3 px-3 py-2 hover:bg-surface hover:text-text hover:translate-x-1 cursor-pointer transition-all rounded-md"><Settings size={18}/> Settings</div>
             </div>
          </div>
          {/* Mockup Main */}
          <div className="flex-1 bg-surface2/30 flex flex-col">
             {/* Mockup Header */}
             <div className="h-20 border-b border-border flex items-center justify-between px-8 bg-surface/50">
                <div className="font-bold text-lg">Assessments</div>
                <div className="flex items-center gap-4">
                   <div className="flex items-center gap-2 px-3 py-1.5 border border-border bg-bg rounded-md text-sm text-text-muted w-64 hover:border-text-muted focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20 transition-all cursor-text group">
                      <Search size={14} className="group-hover:text-text transition-colors"/> Search borrowers...
                   </div>
                   <div className="w-8 h-8 rounded-full border border-border flex items-center justify-center bg-bg hover:bg-surface2 hover:text-text hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-sm"><User size={14}/></div>
                </div>
             </div>
             {/* Mockup Content */}
             <div className="p-8 flex-1">
                <div className="flex items-center justify-between mb-6">
                   <div className="font-bold text-base">Recent Assessments</div>
                   <div className="px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-md hover:bg-primary/90 hover:-translate-y-0.5 hover:shadow-md active:scale-95 transition-all cursor-pointer">+ New Score</div>
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
                     <div key={i} className="grid grid-cols-4 gap-4 px-6 py-4 border-b border-border text-sm items-center hover:bg-surface2/50 transition-colors cursor-pointer group">
                        <div className="font-medium group-hover:text-primary transition-colors">{row.name}</div>
                        <div><span className={`px-2.5 py-1 text-bg text-[10px] font-bold rounded-full uppercase tracking-wider shadow-sm ${row.status === 'High Risk' ? 'bg-rose-500' : row.status === 'Low Risk' ? 'bg-emerald-500' : 'bg-amber-500'}`}>{row.status}</span></div>
                        <div className="text-text-muted">{row.date}</div>
                        <div className="text-right flex justify-end">
                           <div className="w-8 h-8 rounded-md flex items-center justify-center hover:bg-border transition-colors">
                              <div className="w-1 h-4 border-l-2 border-dotted border-text-muted group-hover:border-text transition-colors"></div>
                           </div>
                        </div>
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

      {/* Footer Section */}
      <footer className="relative w-full border-t border-border bg-bg pt-16 pb-8 overflow-hidden z-20">
        <div className="max-w-6xl mx-auto px-6 relative z-10 flex flex-col md:flex-row justify-between gap-12 mb-12">
          
          {/* Logo & Copyright */}
          <div className="flex flex-col gap-4 max-w-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm tracking-tighter shadow-sm">
                CS
              </div>
              <span className="font-bold text-lg tracking-tight">CreditSight</span>
            </div>
            <p className="text-sm text-text-muted mt-2">
              © copyright CreditSight 2024. All rights reserved.
            </p>
          </div>

          {/* Links Columns */}
          <div className="flex gap-16 md:gap-32 text-sm">
            <div className="flex flex-col gap-4">
              <h4 className="font-bold text-text">Team</h4>
              <span className="text-text-muted">Anjishnu</span>
              <span className="text-text-muted">Dhruv</span>
              <span className="text-text-muted">Nikhil</span>
              <span className="text-text-muted">Harshit</span>
            </div>
            <div className="flex flex-col gap-4">
              <h4 className="font-bold text-text">App</h4>
              <Link href="/register" className="text-text-muted hover:text-primary transition-colors">Sign Up</Link>
              <Link href="/login" className="text-text-muted hover:text-primary transition-colors">Login</Link>
            </div>
          </div>
        </div>

        {/* Faded Background Text */}
        <div className="relative w-full overflow-hidden flex justify-center pointer-events-none select-none z-0 -mt-8">
          <h1 
            className="text-[12vw] font-black text-text tracking-tighter leading-none opacity-5 dark:opacity-10"
            style={{ WebkitMaskImage: 'linear-gradient(to bottom, black 20%, transparent 100%)', maskImage: 'linear-gradient(to bottom, black 20%, transparent 100%)' }}
          >
            CreditSight
          </h1>
        </div>
      </footer>
    </div>
  );
}

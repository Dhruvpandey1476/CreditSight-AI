"use client";

import Link from "next/link";
import { ArrowLeft, BookOpen, ShieldCheck, Zap, Database, Cpu, CheckCircle2 } from "lucide-react";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";

export default function DocsPage() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-bg text-text selection:bg-primary/20 font-sans pb-20 relative">
      {/* Subtle Background Pattern */}
      <div 
        className="fixed inset-0 z-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none"
        style={{
          backgroundImage: `repeating-linear-gradient(45deg, var(--color-text) 0, var(--color-text) 1px, transparent 1px, transparent 40px)`
        }}
      />
      
      {/* Navbar / Header */}
      <nav className="sticky top-0 z-50 bg-bg/80 backdrop-blur-md border-b border-border flex items-center px-6 md:px-12 py-4">
        <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-text-muted hover:text-text transition-colors">
          <ArrowLeft size={16} /> Back to Home
        </Link>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 max-w-4xl mx-auto px-6 pt-12 animate-fade-in-up">
        
        {/* Header Section */}
        <div className="mb-12 border-b border-border pb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-md">
              <BookOpen size={20} />
            </div>
            <h1 className="text-4xl font-bold tracking-tight">CreditSight Documentation</h1>
          </div>
          <p className="text-lg text-text-muted leading-relaxed">
            Welcome to the official documentation for CreditSight AI. Here you'll find everything you need to understand how our alternative credit intelligence engine works.
          </p>
        </div>

        {/* Section 1: Overview */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Zap size={20} className="text-amber-500" /> System Overview
          </h2>
          <div className="bg-surface border border-border rounded-xl p-6 shadow-sm text-text-muted leading-relaxed space-y-4 text-sm md:text-base">
            <p>
              Traditional credit scoring models often fail to properly evaluate individuals with thin credit files or those operating in the gig economy. <strong>CreditSight</strong> solves this problem by leveraging <strong className="text-text">Alternative Data</strong>.
            </p>
            <p>
              By analyzing massive volumes of non-traditional data—such as digital payment histories (UPI), device telemetry, and utility bill payments—our AI engine can generate a highly accurate, predictive credit risk score in mere seconds.
            </p>
            <p className="bg-surface2/50 border border-border p-4 rounded-lg mt-2 text-text">
              <strong>B2B Focus:</strong> CreditSight is exclusively designed to empower <strong>B2B Lenders, FinTechs, and Financial Institutions</strong>. We provide the enterprise-grade intelligence infrastructure needed to underwrite loans securely, at scale, and with unprecedented speed.
            </p>
          </div>
        </section>

        {/* Section 2: Core Architecture */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Cpu size={20} className="text-blue-500" /> How It Works (The Multi-Agent System)
          </h2>
          <p className="text-text-muted mb-6">
            CreditSight uses an advanced multi-agent architecture combined with an XGBoost Machine Learning model. Each "Agent" specializes in extracting specific signals from raw data.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-surface border border-border p-5 rounded-xl hover:shadow-md transition-all">
              <h3 className="font-bold text-text mb-2 text-base flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div> UPI Intelligence Agent
              </h3>
              <p className="text-sm text-text-muted">Analyzes incoming/outgoing transaction volumes, merchant diversity, and salary regularity via digital payment logs.</p>
            </div>
            
            <div className="bg-surface border border-border p-5 rounded-xl hover:shadow-md transition-all">
              <h3 className="font-bold text-text mb-2 text-base flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Income Validation Agent
              </h3>
              <p className="text-sm text-text-muted">Identifies employment stability, gig-economy income patterns, and verifies employer EPF contributions.</p>
            </div>

            <div className="bg-surface border border-border p-5 rounded-xl hover:shadow-md transition-all">
              <h3 className="font-bold text-text mb-2 text-base flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-500"></div> Rental & Utilities Agent
              </h3>
              <p className="text-sm text-text-muted">Checks obligation footprints like timely rent payments, Wi-Fi bills, and other recurring monthly expenditures.</p>
            </div>

            <div className="bg-surface border border-border p-5 rounded-xl hover:shadow-md transition-all">
              <h3 className="font-bold text-text mb-2 text-base flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-indigo-500"></div> Behavioral Agent
              </h3>
              <p className="text-sm text-text-muted">Assesses device type, location stability, app usage tiers, and risky behaviors like late-night transaction ratios.</p>
            </div>
          </div>
        </section>

        {/* Section 3: Data Security */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <ShieldCheck size={20} className="text-rose-500" /> Data Security & Compliance
          </h2>
          <div className="bg-surface border border-border rounded-xl p-6 shadow-sm text-text-muted leading-relaxed space-y-4 text-sm md:text-base">
            <p>
              CreditSight is built from the ground up for B2B Lenders and FinTech platforms. We understand that handling financial data requires strict compliance.
            </p>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                <span>All assessments run via stateless API endpoints.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                <span>Passwords and sensitive login metrics are cryptographically hashed using <code className="bg-surface2 px-1.5 py-0.5 rounded text-xs text-text border border-border">bcrypt</code>.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                <span>Authentication is secured using short-lived JWT Bearer tokens.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                <span>Generated PDF reports are strictly bound to authenticated lender sessions.</span>
              </li>
            </ul>
          </div>
        </section>

      </main>
    </div>
  );
}

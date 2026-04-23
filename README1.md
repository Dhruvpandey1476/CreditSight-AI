# ◆ CreditSight — Alternative Credit Intelligence

> **InOut Hacks 2026 | Track: COGNIFY — AI & Automation | Problem 25IOH08**

An agentic AI system that scores India's **190 million credit-invisible borrowers** using non-traditional financial signals — no CIBIL required.

---

## 🏗 Architecture

```
Browser (Next.js 14 Dashboard)
        ↓ POST /api/score
FastAPI Backend
        ↓
LangGraph Orchestrator
   ├── Node 1: UPI Transaction Agent      (parallel)
   ├── Node 2: Income Stability Agent     (parallel)
   ├── Node 3: Rental/Bill Payment Agent  (parallel)
   └── Node 4: Behavioral Profile Agent   (parallel)
        ↓
Resolver Agent (Llama 3.3 70B via Groq) — conflict resolution + reasoning
        ↓
XGBoost Scorer (R² = 0.98, MAE = 2.3)
        ↓
SHAP Explainability Layer
        ↓
Next.js Dashboard — Score Gauge, Agent Cards, SHAP Chart, Lender Report
```

---

## ⚡ Quick Start

### 1. Clone & setup
```bash
git clone <repo>
cd creditsight
cp .env.example .env
# Add your GROQ_API_KEY to .env
# Get free key at: console.groq.com
```

### 2. Install Python dependencies
```bash
pip install -r requirements.txt
```

### 3. Generate data & train model
```bash
cd backend
python data/generate_data.py     # generates 2000 synthetic Indian borrower profiles
python models/train_model.py     # trains XGBoost (R²=0.98)
cd ..
```

### 4. Start backend
```bash
cd backend
uvicorn main:app --reload --port 8000
# API docs: http://localhost:8000/docs
```

### 5. Start frontend
```bash
cd frontend
npm install
npm run dev
# App: http://localhost:3000
```

Or use the one-command startup:
```bash
chmod +x start.sh && ./start.sh
```

---

## 📁 Project Structure

```
creditsight/
├── backend/
│   ├── main.py                      # FastAPI app, all endpoints
│   ├── agents/
│   │   └── orchestrator.py          # LangGraph pipeline, 4 agents + resolver
│   ├── models/
│   │   ├── train_model.py           # XGBoost training script
│   │   ├── xgb_credit_model.json    # Trained model (auto-generated)
│   │   ├── encoders.pkl             # Label encoders (auto-generated)
│   │   └── features.json            # Feature list (auto-generated)
│   └── data/
│       ├── generate_data.py         # Synthetic data generator
│       └── synthetic_borrowers.csv  # 2000 profiles (auto-generated)
├── frontend/
│   ├── app/
│   │   ├── page.jsx                 # Main dashboard page (use client)
│   │   ├── layout.jsx               # Root layout + font imports
│   │   └── globals.css              # Global styles + CSS variables
│   ├── components/
│   │   ├── ScoreGauge.jsx           # Radial score chart (use client)
│   │   ├── AgentCard.jsx            # Individual agent signal card
│   │   ├── ShapChart.jsx            # SHAP horizontal bar chart
│   │   ├── LoadingView.jsx          # Pipeline loading animation
│   │   └── HistoryPanel.jsx         # Assessment history table
│   ├── next.config.js               # API proxy to FastAPI backend
│   └── package.json
├── requirements.txt
├── .env.example
├── start.sh
└── README.md
```

---

## ⚙️ Next.js Configuration

### next.config.js — API Proxy Setup
```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8000/api/:path*',
      },
    ]
  },
}

module.exports = nextConfig
```

This proxies all `/api/*` calls from the Next.js frontend directly
to the FastAPI backend running on port 8000.
No CORS configuration needed on either side.

### "use client" Directive

Next.js 14 uses React Server Components by default. Any component
that uses `useState`, `useEffect`, event handlers, or Recharts
**must** declare `"use client"` at the very top of the file
(before even imports):

```jsx
"use client"
import { useState, useEffect } from "react"
```

These files all require this directive:
- `app/page.jsx` — manages all scoring state
- `components/ScoreGauge.jsx` — uses Recharts RadialBarChart
- `components/ShapChart.jsx` — uses Recharts BarChart
- `components/HistoryPanel.jsx` — uses useEffect for data fetching
- `components/LoadingView.jsx` — uses useState for step animation

### layout.jsx — Root Layout
```jsx
import { Space_Grotesk } from "next/font/google"

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
})

export const metadata = {
  title: "CreditSight — Alternative Credit Intelligence",
  description: "AI-powered credit scoring for India's credit-invisible borrowers",
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={spaceGrotesk.variable}>
        {children}
      </body>
    </html>
  )
}
```

### package.json scripts
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  }
}
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/score` | Run full credit assessment pipeline |
| GET | `/api/demo-profiles` | 4 pre-built demo borrower profiles |
| GET | `/api/history?limit=10` | Recent assessments from DB |
| GET | `/api/assessment/{id}` | Full result for one assessment |
| GET | `/api/health` | Health check |

### Sample Request
```json
POST /api/score
{
  "borrower_name": "Ramesh Kumar",
  "employment_type": "gig",
  "monthly_income_est": 21000,
  "upi_avg_monthly_inflow": 22000,
  "upi_salary_regularity": 0.78,
  "rent_payment_on_time_rate": 0.85,
  ...
}
```

### Sample Response
```json
{
  "assessment_id": "a3f7b2c1",
  "borrower_name": "Ramesh Kumar",
  "final_score": 70,
  "credit_tier": "B",
  "elapsed_seconds": 8.4,
  "upi_analysis": { "signal_score": 74, "confidence": 0.82 },
  "income_analysis": { "signal_score": 61, "confidence": 0.75 },
  "rental_analysis": { "signal_score": 78, "confidence": 0.88 },
  "behavioral_analysis": { "signal_score": 68, "confidence": 0.71 },
  "resolver_output": {
    "conflicts_detected": [],
    "resolution_reasoning": "Strong rental payment history...",
    "recommended_tier": "B",
    "lender_recommendation": "Approve — standard terms",
    "key_strengths": ["Regular UPI inflows", "Consistent rent payments"],
    "key_risks": ["Gig employment income variance"]
  },
  "shap_values": {
    "upi_salary_regularity": 4.2,
    "rent_payment_on_time_rate": 3.8
  }
}
```

---

## 🤖 The 4 Agents

| Agent | Signals Analyzed | LLM Task |
|-------|-----------------|----------|
| **UPI Transaction** | Monthly inflow/outflow, merchant diversity, salary regularity, savings ratio | Analyze spending discipline and income patterns |
| **Income & Employment** | Employment type, EPF coverage, job tenure, income stability, growth trend | Assess employment stability and income reliability |
| **Rental & Bills** | Rent on-time rate, utility payments, rental tenure, bill diversity | Measure payment discipline — strongest credit proxy |
| **Behavioral Profile** | Device tier, location stability, SIM tenure, financial app usage | Infer financial sophistication and stability |

All 4 run **in parallel** via `asyncio.gather()`, then the
**Resolver Agent** synthesizes outputs, detects conflicts, and
produces lender-ready reasoning.

---

## 🧠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Agent Orchestration** | LangGraph |
| **LLM** | Llama 3.3 70B via Groq API (free tier) |
| **ML Scorer** | XGBoost |
| **Explainability** | SHAP TreeExplainer |
| **Parallel Execution** | asyncio.gather() |
| **Backend** | FastAPI + Uvicorn |
| **Database** | SQLite via aiosqlite |
| **Frontend** | Next.js 14 (App Router) |
| **Charts** | Recharts |
| **Styling** | CSS Variables + Google Fonts (next/font) |
| **Data Validation** | Pydantic v2 |

> **Groq API** — Free tier supports 14,400 requests/day with
> Llama 3.3 70B. Faster than OpenAI for inference.
> Sign up at console.groq.com — no credit card required.

---

## 📊 Model Performance

- **Algorithm**: XGBoost Regressor
- **Training data**: 2000 synthetic Indian borrower profiles (23 features)
- **MAE**: 2.3 points (out of 100)
- **R²**: 0.98
- **Explainability**: SHAP TreeExplainer — top 8 features shown per assessment

---

## �🇳 India-Specific Design Decisions

- Signals chosen based on **RBI's Alternative Data Framework** discussion paper (2023)
- Income in **₹ (rupees)** — realistic Indian salary distributions
- Employment types: salaried / self_employed / gig / informal (reflects India's workforce)
- UPI transaction patterns — India's dominant payment rail (500M+ users)
- EPF as formal employment marker
- Compliance note on every output: not a substitute for regulatory CIBIL check

---

## 🏆 Hackathon Demo Flow

1. Open `http://localhost:3000`
2. Click **"🛵 Ramesh — Gig Delivery Worker"** (no CIBIL, gig worker)
3. Click **"⚡ Run Credit Assessment"**
4. Watch 4 agents fire in parallel on the loading screen
5. See Score Gauge → Agent Cards → SHAP chart → Lender Recommendation
6. Switch to **"🚧 Sunita — High Risk"** to show contrast
7. Hit **History tab** to show persistent multi-borrower tracking

**Talking points for judges:**
- "190 million credit-invisible Indians can't get loans — we solve that"
- "4 specialist agents run in parallel, not sequentially — under 30 seconds"
- "Resolver detects when agents conflict and explains its reasoning"
- "SHAP makes every score auditable — lenders can defend decisions to regulators"
- "XGBoost R² of 0.98 on our synthetic dataset — production pipeline ready"

---

## 👥 Team Roles

| Member | Responsibility |
|--------|---------------|
| **AI/ML Lead** | LangGraph orchestrator, XGBoost + SHAP, agent prompts, Groq API integration, feature engineering |
| **Backend Dev** | FastAPI endpoints, SQLite DB, API testing, deployment, start.sh |
| **Frontend Dev** | Next.js 14 App Router, Score Gauge, SHAP chart, Agent cards, next.config.js proxy setup |
| **AI/ML + Docs** | Synthetic data generation, model evaluation, PPT, README, demo script, video |

---

## 🌿 Environment Variables

```bash
# .env
GROQ_API_KEY=your_groq_api_key_here
```

Get your free Groq API key at **console.groq.com** → API Keys → Create Key.
No credit card required. Free tier is enough for the entire hackathon.

---

## 🐛 Common Issues & Fixes

**Frontend can't reach backend (404 on /api routes)**
Make sure `next.config.js` has the rewrites config shown above
and FastAPI is running on port 8000 before starting Next.js.

**"use client" error / hooks not working**
Any file using hooks, Recharts, or event handlers needs
`"use client"` as the absolute first line — before even imports.
If you forget this, Next.js will throw a hydration error.

**Groq rate limit hit**
Free tier allows 30 requests/minute. For hackathon demo this
is fine. If you hit limits during heavy testing, add a small
`await asyncio.sleep(1)` between agent calls in orchestrator.py.

**Model not found error on startup**
Always run data generation and training from inside the
`backend/` directory, not the project root:
```bash
cd backend
python data/generate_data.py
python models/train_model.py
```

**Port 3000 already in use**
Next.js will automatically try port 3001. Either free port 3000
or run `npm run dev -- -p 3001`. If you change the backend port
from 8000, update the destination in `next.config.js` to match.

**Recharts SSR error in Next.js**
If Recharts throws a window/document error during build,
make sure the component file has `"use client"` at the top.
Recharts is a client-only library and cannot run server-side.

---

*Built for InOut Hacks 2026 — JSS Institutions, Noida*
*ABES Institute of Technology, Ghaziabad*

"""
CreditSight FastAPI Backend
Endpoints: /api/score, /api/history, /api/demo-profiles
"""

import os, json, time, uuid, asyncio
from datetime import datetime
from typing import Optional
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, UploadFile
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel,Field
from typing import List
import aiosqlite
import pandas as pd
import io
import traceback


# Load environment variables from .env file
load_dotenv()

from agents.orchestrator import run_credit_pipeline

app = FastAPI(title="CreditSight API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = os.path.join(os.path.dirname(__file__), "creditsight.db")

# ─────────────────────────── DB Setup ────────────────────────────────────────

async def init_db():
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS assessments (
                id TEXT PRIMARY KEY,
                borrower_name TEXT,
                created_at TEXT,
                final_score INTEGER,
                credit_tier TEXT,
                employment_type TEXT,
                monthly_income_est REAL,
                result_json TEXT
            )
        """)
        await db.commit()

@app.on_event("startup")
async def startup():
    await init_db()

# ─────────────────────────── Request Models ──────────────────────────────────

class BorrowerProfile(BaseModel):
    borrower_name: str = "Anonymous"
    # UPI
    upi_monthly_txn_count: int = 25
    upi_avg_monthly_inflow: float = 18000
    upi_avg_monthly_outflow: float = 14000
    upi_merchant_diversity: float = 0.55
    upi_salary_regularity: float = 0.6
    upi_savings_ratio: float = 0.22
    upi_large_txn_flag: int = 0
    # Income
    employment_type: str = "gig"
    monthly_income_est: float = 18000
    income_stability_score: float = 0.55
    job_tenure_months: int = 14
    has_employer_epf: int = 0
    income_growth_trend: float = 0.01
    # Rental
    rent_payment_on_time_rate: float = 0.75
    utility_on_time_rate: float = 0.8
    rental_tenure_months: int = 18
    has_rental_agreement: int = 1
    bill_types_paid: int = 3
    # Behavioral
    device_type: str = "mid_range"
    location_stability_score: float = 0.65
    app_usage_tier: float = 0.6
    sim_tenure_months: int = 30
    night_txn_ratio: float = 0.2

# ─────────────────────────── Score Endpoint ──────────────────────────────────

@app.post("/api/score")
async def score_borrower(profile: BorrowerProfile):
    start = time.time()
    profile_dict = profile.model_dump()
    borrower_name = profile_dict.pop("borrower_name", "Anonymous")

    try:
        result = await run_credit_pipeline(profile_dict)
    except Exception as e:
        error_msg = f"Pipeline error: {str(e)}"
        print(f"\n❌ ERROR in /api/score: {error_msg}")
        print(f"Traceback:\n{traceback.format_exc()}\n")
        raise HTTPException(status_code=500, detail=error_msg)

    elapsed = round(time.time() - start, 2)

    assessment_id = str(uuid.uuid4())[:8]
    payload = {
        "assessment_id": assessment_id,
        "borrower_name": borrower_name,
        "final_score": result["final_score"],
        "credit_tier": result["credit_tier"],
        "elapsed_seconds": elapsed,
        "upi_analysis": result["upi_analysis"],
        "income_analysis": result["income_analysis"],
        "rental_analysis": result["rental_analysis"],
        "behavioral_analysis": result["behavioral_analysis"],
        "resolver_output": result["resolver_output"],
        "shap_values": result["shap_values"],
        "processing_log": result["processing_log"],
        "created_at": datetime.utcnow().isoformat(),
        "ml_score":              result["ml_score"],
        "agent_composite_score": result["agent_composite_score"],
        "score_breakdown":       result["score_breakdown"],
    }

    # Persist to DB
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
            INSERT INTO assessments VALUES (?,?,?,?,?,?,?,?)
        """, (
            assessment_id,
            borrower_name,
            payload["created_at"],
            result["final_score"],
            result["credit_tier"],
            profile_dict.get("employment_type"),
            profile_dict.get("monthly_income_est"),
            json.dumps(payload),
        ))
        await db.commit()

    return payload

# ─────────────────────────── History Endpoint ────────────────────────────────

@app.get("/api/history")
async def get_history(limit: int = 10):
    async with aiosqlite.connect(DB_PATH) as db:
        async with db.execute(
            "SELECT id, borrower_name, created_at, final_score, credit_tier, employment_type, monthly_income_est "
            "FROM assessments ORDER BY created_at DESC LIMIT ?", (limit,)
        ) as cursor:
            rows = await cursor.fetchall()
    return [
        {
            "id": r[0], "borrower_name": r[1], "created_at": r[2],
            "final_score": r[3], "credit_tier": r[4],
            "employment_type": r[5], "monthly_income": r[6],
        }
        for r in rows
    ]

@app.get("/api/assessment/{assessment_id}")
async def get_assessment(assessment_id: str):
    async with aiosqlite.connect(DB_PATH) as db:
        async with db.execute(
            "SELECT result_json FROM assessments WHERE id=?", (assessment_id,)
        ) as cursor:
            row = await cursor.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Assessment not found")
    return json.loads(row[0])

# ─────────────────────────── Demo Profiles ───────────────────────────────────

@app.get("/api/demo-profiles")
async def demo_profiles():
    return [
        {
            "label": "🛵 Ramesh — Gig Delivery Worker",
            "description": "28 yr old, Zomato delivery, no credit history",
            "profile": {
                "borrower_name": "Ramesh Kumar",
                "upi_monthly_txn_count": 45, "upi_avg_monthly_inflow": 22000,
                "upi_avg_monthly_outflow": 17000, "upi_merchant_diversity": 0.72,
                "upi_salary_regularity": 0.78, "upi_savings_ratio": 0.23,
                "upi_large_txn_flag": 0, "employment_type": "gig",
                "monthly_income_est": 21000, "income_stability_score": 0.65,
                "job_tenure_months": 22, "has_employer_epf": 0,
                "income_growth_trend": 0.02, "rent_payment_on_time_rate": 0.85,
                "utility_on_time_rate": 0.9, "rental_tenure_months": 24,
                "has_rental_agreement": 1, "bill_types_paid": 3,
                "device_type": "mid_range", "location_stability_score": 0.75,
                "app_usage_tier": 0.7, "sim_tenure_months": 36, "night_txn_ratio": 0.15,
            }
        },
        {
            "label": "🏪 Priya — Small Business Owner",
            "description": "35 yr old, runs a kiryana store, informal income",
            "profile": {
                "borrower_name": "Priya Sharma",
                "upi_monthly_txn_count": 120, "upi_avg_monthly_inflow": 65000,
                "upi_avg_monthly_outflow": 52000, "upi_merchant_diversity": 0.88,
                "upi_salary_regularity": 0.45, "upi_savings_ratio": 0.2,
                "upi_large_txn_flag": 1, "employment_type": "self_employed",
                "monthly_income_est": 55000, "income_stability_score": 0.5,
                "job_tenure_months": 48, "has_employer_epf": 0,
                "income_growth_trend": 0.03, "rent_payment_on_time_rate": 0.9,
                "utility_on_time_rate": 0.88, "rental_tenure_months": 48,
                "has_rental_agreement": 0, "bill_types_paid": 4,
                "device_type": "mid_range", "location_stability_score": 0.9,
                "app_usage_tier": 0.55, "sim_tenure_months": 60, "night_txn_ratio": 0.25,
            }
        },
        {
            "label": "👨‍💼 Arjun — Salaried IT Employee",
            "description": "27 yr old, junior dev, has salary slips but no CIBIL",
            "profile": {
                "borrower_name": "Arjun Mehta",
                "upi_monthly_txn_count": 38, "upi_avg_monthly_inflow": 42000,
                "upi_avg_monthly_outflow": 31000, "upi_merchant_diversity": 0.65,
                "upi_salary_regularity": 0.95, "upi_savings_ratio": 0.26,
                "upi_large_txn_flag": 0, "employment_type": "salaried",
                "monthly_income_est": 40000, "income_stability_score": 0.9,
                "job_tenure_months": 10, "has_employer_epf": 1,
                "income_growth_trend": 0.01, "rent_payment_on_time_rate": 0.95,
                "utility_on_time_rate": 1.0, "rental_tenure_months": 10,
                "has_rental_agreement": 1, "bill_types_paid": 4,
                "device_type": "premium", "location_stability_score": 0.8,
                "app_usage_tier": 0.85, "sim_tenure_months": 24, "night_txn_ratio": 0.1,
            }
        },
        {
            "label": "🚧 Sunita — High Risk Informal Worker",
            "description": "42 yr old, construction labour, irregular income",
            "profile": {
                "borrower_name": "Sunita Devi",
                "upi_monthly_txn_count": 8, "upi_avg_monthly_inflow": 9000,
                "upi_avg_monthly_outflow": 8500, "upi_merchant_diversity": 0.2,
                "upi_salary_regularity": 0.2, "upi_savings_ratio": 0.06,
                "upi_large_txn_flag": 0, "employment_type": "informal",
                "monthly_income_est": 8500, "income_stability_score": 0.2,
                "job_tenure_months": 4, "has_employer_epf": 0,
                "income_growth_trend": -0.01, "rent_payment_on_time_rate": 0.4,
                "utility_on_time_rate": 0.5, "rental_tenure_months": 6,
                "has_rental_agreement": 0, "bill_types_paid": 1,
                "device_type": "budget", "location_stability_score": 0.3,
                "app_usage_tier": 0.2, "sim_tenure_months": 8, "night_txn_ratio": 0.55,
            }
        },
    ]

@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "CreditSight API"}

class BulkRequest(BaseModel):
    profiles: List[BorrowerProfile] = Field(..., max_length=20)
    
def xgboost_only_score(profile: dict) -> dict:
    # Same XGBoost + SHAP logic as xgboost_scorer_node
    # but takes profile dict directly, no state needed
    # Returns: final_score, credit_tier, shap_values, recommendation
    # No LLM calls at all
    
    tier_recommendations = {
        "A": "Approve — low risk",
        "B": "Approve — standard terms", 
        "C": "Approve with conditions",
        "D": "Decline or secured loan only"
    }
    ...
    return {
        "final_score": score,
        "credit_tier": tier,
        "shap_values": top_shap,
        "lender_recommendation": tier_recommendations[tier],
        "scoring_mode": "ml_only"  # flag so frontend knows
    }    

@app.post("/api/score/bulk")
async def score_bulk(request: BulkRequest):
    results = []
    for profile in request.profiles:
        # Skip LLM agents entirely — XGBoost + SHAP only
        result = xgboost_only_score(profile.model_dump())
        results.append(result)
    return {"total": len(results), "results": results}


@app.post("/api/score/csv-upload")
async def score_csv(file: UploadFile):
    try:
        print("📥 Reading CSV file...")
        df = pd.read_csv(file.file)
        print(f"📊 Loaded {len(df)} records with columns: {df.columns.tolist()}")
        
        # Default values for missing fields
        DEFAULTS = {
            "borrower_name": "Borrower",
            "upi_monthly_txn_count": 25,
            "upi_avg_monthly_inflow": 18000,
            "upi_avg_monthly_outflow": 14000,
            "upi_merchant_diversity": 0.55,
            "upi_salary_regularity": 0.6,
            "upi_savings_ratio": 0.22,
            "upi_large_txn_flag": 0,
            "employment_type": "gig",
            "monthly_income_est": 18000,
            "income_stability_score": 0.55,
            "job_tenure_months": 14,
            "has_employer_epf": 0,
            "income_growth_trend": 0.01,
            "rent_payment_on_time_rate": 0.75,
            "utility_on_time_rate": 0.8,
            "rental_tenure_months": 18,
            "has_rental_agreement": 1,
            "bill_types_paid": 3,
            "device_type": "mid_range",
            "location_stability_score": 0.65,
            "app_usage_tier": 0.6,
            "sim_tenure_months": 30,
            "night_txn_ratio": 0.2,
        }
        
        # Fill missing columns with defaults
        for col, default_val in DEFAULTS.items():
            if col not in df.columns:
                df[col] = default_val
                print(f"  ℹ Added missing column '{col}' with default value")
        
        # Convert to dict records
        profiles = df[list(DEFAULTS.keys())].to_dict("records")
        print(f"🚀 Scoring {len(profiles)} profiles...")
        
        # Score all profiles
        results = await asyncio.gather(
            *[run_credit_pipeline(p) for p in profiles],
            return_exceptions=True
        )
        
        # Check for errors in results
        errors = [r for r in results if isinstance(r, Exception)]
        if errors:
            print(f"❌ {len(errors)} profiles failed to score")
            for i, err in enumerate(errors):
                print(f"   Profile {i}: {str(err)[:100]}")
        
        valid_results = [r for r in results if not isinstance(r, Exception)]
        print(f"✅ Successfully scored {len(valid_results)} profiles")
        
        # Add scored columns to original dataframe
        df["final_score"] = [r.get("final_score", 0) if not isinstance(r, Exception) else 0 for r in results]
        df["credit_tier"] = [r.get("credit_tier", "D") if not isinstance(r, Exception) else "D" for r in results]
        df["ml_score"] = [r.get("ml_score", 0) if not isinstance(r, Exception) else 0 for r in results]
        df["agent_composite"] = [r.get("agent_composite_score", 0) if not isinstance(r, Exception) else 0 for r in results]
        
        # Return as CSV string
        csv_string = df.to_csv(index=False)
        print(f"📤 CSV response ready ({len(csv_string)} bytes)")
        
        return StreamingResponse(
            iter([csv_string]),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=scored_results.csv"}
        )
    except Exception as e:
        error_msg = f"CSV upload error: {str(e)}"
        print(f"❌ {error_msg}")
        print(f"Traceback:\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=error_msg)



BATCH_SIZE = 5

async def process_in_batches(profiles):
    results = []
    for i in range(0, len(profiles), BATCH_SIZE):
        batch = profiles[i:i+BATCH_SIZE]
        batch_results = await asyncio.gather(*[run_credit_pipeline(p) for p in batch])
        results.extend(batch_results)
        if i + BATCH_SIZE < len(profiles):
            await asyncio.sleep(0.1)  # Simulate delay between batches
    return results


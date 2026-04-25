"""
CreditSight FastAPI Backend
Endpoints: /api/score, /api/history, /api/demo-profiles
"""

import os, json, time, uuid, asyncio
from datetime import datetime
from typing import Optional
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, UploadFile, Depends, status
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, Field
from typing import List
import aiosqlite
import pandas as pd
import io
import traceback
from utils.pdf_generator import generate_creditsight_pdf
from fastapi.responses import StreamingResponse, FileResponse 


# Load environment variables from .env file
load_dotenv()

from agents.orchestrator import run_credit_pipeline
from auth import verify_password, get_password_hash, create_access_token, decode_access_token

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
        await db.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                created_at TEXT
            )
        """)
        await db.commit()

# ─────────────────────────── Auth Setup ──────────────────────────────────────

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

async def get_current_user(token: str = Depends(oauth2_scheme)):
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
    username: str = payload.get("sub")
    if username is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
    
    async with aiosqlite.connect(DB_PATH) as db:
        async with db.execute("SELECT id, username FROM users WHERE username = ?", (username,)) as cursor:
            user = await cursor.fetchone()
            if user is None:
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
            return {"id": user[0], "username": user[1]}

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

# ─────────────────────────── Auth Endpoints ──────────────────────────────────

class UserCreate(BaseModel):
    username: str
    email: str
    password: str

@app.post("/api/auth/register")
async def register(user: UserCreate):
    try:
        async with aiosqlite.connect(DB_PATH) as db:
            async with db.execute("SELECT id FROM users WHERE username = ? OR email = ?", (user.username, user.email)) as cursor:
                if await cursor.fetchone():
                    raise HTTPException(status_code=400, detail="Username or email already registered")
            
            user_id = str(uuid.uuid4())
            hashed_password = get_password_hash(user.password)
            created_at = datetime.utcnow().isoformat()
            
            await db.execute(
                "INSERT INTO users (id, username, email, password_hash, created_at) VALUES (?, ?, ?, ?, ?)",
                (user_id, user.username, user.email, hashed_password, created_at)
            )
            await db.commit()
        
        return {"message": "User created successfully"}
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        raise HTTPException(status_code=400, detail=f"Error: {str(e)}\n{error_trace}")

@app.post("/api/auth/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    try:
        async with aiosqlite.connect(DB_PATH) as db:
            async with db.execute("SELECT password_hash, username FROM users WHERE username = ? OR email = ?", (form_data.username, form_data.username)) as cursor:
                row = await cursor.fetchone()
                if not row or not verify_password(form_data.password, row[0]):
                    raise HTTPException(status_code=400, detail="Incorrect username or password")
        
        access_token = create_access_token(data={"sub": row[1]})
        return {"access_token": access_token, "token_type": "bearer"}
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        raise HTTPException(status_code=400, detail=f"Error: {str(e)}\n{error_trace}")

@app.get("/api/auth/me")
async def read_users_me(current_user: dict = Depends(get_current_user)):
    return current_user


# ─────────────────────────── Score Endpoint ──────────────────────────────────

@app.post("/api/score")
async def score_borrower(profile: BorrowerProfile, current_user: dict = Depends(get_current_user)):
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

#----------------------------pdf generation endpoint----------------------------


@app.get("/api/assessment/{assessment_id}/download")
async def download_assessment_pdf(assessment_id: str):
    # 1. Fetch the specific assessment from creditsight.db 
    async with aiosqlite.connect(DB_PATH) as db:
        async with db.execute(
            "SELECT result_json, employment_type, monthly_income_est FROM assessments WHERE id=?", (assessment_id,)
        ) as cursor:
            row = await cursor.fetchone()
    
    if not row:
        raise HTTPException(status_code=404, detail="Assessment not found")
    
    # 2. Parse the JSON data and inject DB columns
    data = json.loads(row[0])
    data['employment_type'] = row[1] if row[1] else "Not Provided"
    data['monthly_income_est'] = row[2] if row[2] is not None else 0
    
    # 3. Define a temporary path for the PDF
    temp_filename = f"report_{assessment_id}.pdf"
    
    # 4. Generate the PDF using the stored data
    generate_creditsight_pdf(data, temp_filename)

    # 5. Return the file as a download
    # Note: In a production app, you'd use a BackgroundTask to delete the file after sending
    return FileResponse(
        path=temp_filename, 
        filename=f"{data['borrower_name']}_CreditSight_Report.pdf",
        media_type="application/pdf"
    )


# ─────────────────────────── History Endpoint ────────────────────────────────

@app.get("/api/history")
async def get_history(limit: int = 10, current_user: dict = Depends(get_current_user)):
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
async def get_assessment(assessment_id: str, current_user: dict = Depends(get_current_user)):
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
    """
    ML-only scoring using XGBoost + SHAP.
    No LLM calls — used for bulk CSV scoring to avoid rate limits.
    """
    import os, json, pickle
    import xgboost as xgb
    
    MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")

    model = xgb.XGBRegressor()
    model.load_model(os.path.join(MODEL_DIR, "xgb_credit_model.json"))

    with open(os.path.join(MODEL_DIR, "encoders.pkl"), "rb") as f:
        encoders = pickle.load(f)
    with open(os.path.join(MODEL_DIR, "features.json")) as f:
        feature_cols = json.load(f)

    p = profile
    
    # Helper function to safely convert to float
    def to_float(val, default=0.5):
        try:
            if isinstance(val, str):
                val = val.strip().lower()
                # Map text values to floats
                if val in ['high', 'yes', 'true']: return 0.8
                if val in ['medium', 'medium_range']: return 0.5
                if val in ['low', 'no', 'false']: return 0.2
            return float(val)
        except:
            return default
    
    # Helper function to safely convert to int
    def to_int(val, default=0):
        try:
            if isinstance(val, str):
                # Count pipes if it's a delimited string (e.g., "electricity|wifi")
                if '|' in val:
                    return len(val.split('|'))
                val = val.strip()
            return int(float(val))
        except:
            return default
    
    # Helper function to map categorical values
    def map_employment_type(val):
        val = str(val).strip().lower()
        if 'salaried' in val or 'formal' in val: return 'formal'
        if 'freelancer' in val or 'self' in val: return 'self_employed'
        if 'business' in val: return 'self_employed'
        if 'gig' in val: return 'gig'
        return 'gig'  # default
    
    def map_device_type(val):
        val = str(val).strip().lower()
        if 'premium' in val or 'ios' in val: return 'premium'
        if 'mid' in val or 'android_mid' in val: return 'mid_range'
        if 'budget' in val or 'low' in val or 'android_low' in val: return 'budget'
        return 'mid_range'  # default
    
    row = {
        "upi_monthly_txn_count":    to_int(p.get("upi_monthly_txn_count", 20), 20),
        "upi_avg_monthly_inflow":   to_float(p.get("upi_avg_monthly_inflow", 15000), 15000),
        "upi_avg_monthly_outflow":  to_float(p.get("upi_avg_monthly_outflow", 12000), 12000),
        "upi_merchant_diversity":   to_float(p.get("upi_merchant_diversity", 0.5), 0.5),
        "upi_salary_regularity":    to_float(p.get("upi_salary_regularity", 0.5), 0.5),
        "upi_savings_ratio":        to_float(p.get("upi_savings_ratio", 0.2), 0.2),
        "upi_large_txn_flag":       to_int(p.get("upi_large_txn_flag", 0), 0),
        "monthly_income_est":       to_float(p.get("monthly_income_est", 15000), 15000),
        "income_stability_score":   to_float(p.get("income_stability_score", 0.5), 0.5),
        "job_tenure_months":        to_int(p.get("job_tenure_months", 12), 12),
        "has_employer_epf":         to_int(p.get("has_employer_epf", 0), 0),
        "income_growth_trend":      to_float(p.get("income_growth_trend", 0.01), 0.01),
        "rent_payment_on_time_rate": to_float(p.get("rent_payment_on_time_rate", 0.7), 0.7),
        "utility_on_time_rate":     to_float(p.get("utility_on_time_rate", 0.7), 0.7),
        "rental_tenure_months":     to_int(p.get("rental_tenure_months", 12), 12),
        "has_rental_agreement":     to_int(p.get("has_rental_agreement", 0), 0),
        "bill_types_paid":          to_int(p.get("bill_types_paid", 2), 2),
        "location_stability_score": to_float(p.get("location_stability_score", 0.5), 0.5),
        "app_usage_tier":           to_float(p.get("app_usage_tier", 0.5), 0.5),
        "sim_tenure_months":        to_int(p.get("sim_tenure_months", 24), 24),
        "night_txn_ratio":          to_float(p.get("night_txn_ratio", 0.3), 0.3),
        "employment_type_enc":      encoders["employment_type"].transform([map_employment_type(p.get("employment_type", "gig"))])[0],
        "device_type_enc":          encoders["device_type"].transform([map_device_type(p.get("device_type", "budget"))])[0],
    }

    df = pd.DataFrame([row])[feature_cols]
    raw_score = float(model.predict(df)[0])
    score = int(max(300, min(900, raw_score)))
    tier = "A" if score >= 750 else "B" if score >= 650 else "C" if score >= 550 else "D"
    
    # Load feature importance for explainability
    try:
        with open(os.path.join(MODEL_DIR, "feature_importance.json")) as f:
            importance_dict = json.load(f)
        
        total_importance = sum(importance_dict.values())
        shap_dict = {}
        
        if total_importance > 0:
            for feat, imp_val in importance_dict.items():
                normalized = (imp_val / total_importance) * 10
                shap_dict[feat] = round(normalized, 4)
    except Exception as e:
        shap_dict = {}
    
    # Sort by absolute impact, top 10
    top_shap = dict(sorted(shap_dict.items(), key=lambda x: abs(x[1]), reverse=True)[:10]) if shap_dict else {}
    
    tier_recommendations = {
        "A": "Approve — low risk",
        "B": "Approve — standard terms", 
        "C": "Approve with conditions",
        "D": "Decline or secured loan only"
    }
    
    return {
        "final_score": score,
        "credit_tier": tier,
        "shap_values": top_shap,
        "lender_recommendation": tier_recommendations[tier],
        "scoring_mode": "ml_only"  # flag so frontend knows
    }    

@app.post("/api/score/bulk")
async def score_bulk(request: BulkRequest, current_user: dict = Depends(get_current_user)):
    results = []
    for profile in request.profiles:
        # Skip LLM agents entirely — XGBoost + SHAP only
        result = xgboost_only_score(profile.model_dump())
        results.append(result)
    return {"total": len(results), "results": results}


@app.post("/api/score/csv-upload")
async def score_csv(file: UploadFile, current_user: dict = Depends(get_current_user)):
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
        
        # Define data types for type conversion
        TYPE_MAP = {
            # Strings
            "borrower_name": str,
            "employment_type": str,
            "device_type": str,
            # Integers
            "upi_monthly_txn_count": int,
            "upi_large_txn_flag": int,
            "job_tenure_months": int,
            "has_employer_epf": int,
            "rental_tenure_months": int,
            "has_rental_agreement": int,
            "bill_types_paid": int,
            "sim_tenure_months": int,
            # Floats
            "upi_avg_monthly_inflow": float,
            "upi_avg_monthly_outflow": float,
            "upi_merchant_diversity": float,
            "upi_salary_regularity": float,
            "upi_savings_ratio": float,
            "monthly_income_est": float,
            "income_stability_score": float,
            "income_growth_trend": float,
            "rent_payment_on_time_rate": float,
            "utility_on_time_rate": float,
            "location_stability_score": float,
            "app_usage_tier": float,
            "night_txn_ratio": float,
        }
        
        # Fill missing columns with defaults
        for col, default_val in DEFAULTS.items():
            if col not in df.columns:
                df[col] = default_val
                print(f"  ℹ Added missing column '{col}' with default value")
        
        # Convert columns to proper types
        for col, col_type in TYPE_MAP.items():
            if col in df.columns:
                try:
                    if col == "bill_types_paid":
                        # Count pipe-delimited items (e.g., "electricity|wifi" = 2)
                        df[col] = df[col].apply(lambda x: len(str(x).split('|')) if isinstance(x, str) and '|' in str(x) else int(float(x)))
                    elif col == "app_usage_tier":
                        # Map text values to floats
                        def map_app_tier(val):
                            val_str = str(val).lower().strip()
                            if val_str in ['high', 'yes']: return 0.8
                            if val_str in ['medium', 'medium_range']: return 0.5
                            if val_str in ['low', 'no']: return 0.2
                            try: return float(val)
                            except: return 0.5
                        df[col] = df[col].apply(map_app_tier)
                    elif col == "employment_type":
                        # Map to expected categories
                        def map_employment(val):
                            val_str = str(val).lower()
                            if 'salaried' in val_str or 'formal' in val_str: return 'formal'
                            if 'freelancer' in val_str: return 'freelance'
                            if 'business' in val_str: return 'self_employed'
                            if 'gig' in val_str: return 'gig'
                            return 'gig'
                        df[col] = df[col].apply(map_employment)
                    elif col == "device_type":
                        # Map to expected categories
                        def map_device(val):
                            val_str = str(val).lower()
                            if 'premium' in val_str or 'ios' in val_str: return 'premium'
                            if 'mid' in val_str: return 'mid_range'
                            if 'budget' in val_str or 'low' in val_str: return 'budget'
                            return 'mid_range'
                        df[col] = df[col].apply(map_device)
                    else:
                        df[col] = df[col].astype(col_type)
                except Exception as e:
                    print(f"  ⚠ Could not convert '{col}': {str(e)[:80]}")
                    df[col] = DEFAULTS.get(col, default_val)
        
        # Convert to dict records
        profiles = df[list(DEFAULTS.keys())].to_dict("records")
        print(f"🚀 Scoring {len(profiles)} profiles (ML-only mode, no LLM calls)...")
        
        # Score all profiles using ML-only (no LLM calls to avoid rate limits)
        results = []
        for i, p in enumerate(profiles):
            try:
                result = xgboost_only_score(p)
                results.append(result)
            except Exception as e:
                print(f"❌ Profile {i} error: {str(e)[:100]}")
                results.append({
                    "final_score": 500,
                    "credit_tier": "C",
                    "shap_values": {},
                    "lender_recommendation": "Unable to score",
                    "scoring_mode": "ml_only"
                })
        
        print(f"✅ Successfully scored {len([r for r in results if r is not None])} profiles")
        
        # Add scored columns to original dataframe
        df["final_score"] = [r.get("final_score", 500) for r in results]
        df["credit_tier"] = [r.get("credit_tier", "C") for r in results]
        df["lender_recommendation"] = [r.get("lender_recommendation", "Unable to score") for r in results]
        
        # Select only relevant columns for output
        output_cols = ["borrower_name", "final_score", "credit_tier", "lender_recommendation"]
        output_df = df[output_cols].copy()
        
        # Return as CSV string
        csv_string = output_df.to_csv(index=False)
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


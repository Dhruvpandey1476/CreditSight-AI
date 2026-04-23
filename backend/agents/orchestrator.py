"""
LangGraph orchestrator for CreditSight.
4 specialist agents run in parallel, then a resolver synthesizes outputs.
"""

import os, json, asyncio, pickle
from typing import TypedDict, Optional
import numpy as np
import xgboost as xgb
import pandas as pd

# SHAP is optional - requires C++ build tools
try:
    import shap
    HAS_SHAP = True
except ImportError:
    HAS_SHAP = False

from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage

# ─────────────────────────── Shared State ────────────────────────────────────

class CreditState(TypedDict):
    profile: dict
    upi_analysis: Optional[dict]
    income_analysis: Optional[dict]
    rental_analysis: Optional[dict]
    behavioral_analysis: Optional[dict]
    resolver_output: Optional[dict]
    final_score: Optional[int]
    credit_tier: Optional[str]
    shap_values: Optional[dict]
    processing_log: list
    ml_score: Optional[int]
    agent_composite_score: Optional[int]
    score_breakdown: Optional[dict]

# ─────────────────────────── LLM Setup ───────────────────────────────────────

def get_llm():
    api_key = os.environ.get("GROQ_API_KEY", "")
    return ChatGroq(
        model="llama-3.3-70b-versatile",
        api_key=api_key,
        max_tokens=800,
        temperature=0.1,
    )

# ─────────────────────────── Agent Prompts ───────────────────────────────────

UPI_SYSTEM = """Analyze the borrower's UPI transaction signals and return a JSON object with:
{
  "signal_score": <300-900 integer>,
  "confidence": <0-1 float>,
  "positive_signals": [<list of strings>],
  "risk_signals": [<list of strings>],
  "summary": "<1-2 sentence plain English summary>"
}
Return ONLY valid JSON. No markdown, no explanation outside JSON."""

INCOME_SYSTEM = """You are a specialist income and employment analyst for alternative credit scoring.
Analyze employment and income signals for an Indian borrower and return:
{
  "signal_score": <300-900 integer>,
  "confidence": <0-1 float>,
  "positive_signals": [<list of strings>],
  "risk_signals": [<list of strings>],
  "summary": "<1-2 sentence plain English summary>"
}
Return ONLY valid JSON."""

RENTAL_SYSTEM = """You are a specialist rental and bill payment analyst for credit scoring.
Analyze payment discipline signals and return:
{
  "signal_score": <300-900 integer>,
  "confidence": <0-1 float>,
  "positive_signals": [<list of strings>],
  "risk_signals": [<list of strings>],
  "summary": "<1-2 sentence plain English summary>"
}
Return ONLY valid JSON."""

BEHAVIORAL_SYSTEM = """You are a specialist behavioral and device profile analyst for credit scoring.
Analyze behavioral signals and return:
{
  "signal_score": <300-900 integer>,
  "confidence": <0-1 float>,
  "positive_signals": [<list of strings>],
  "risk_signals": [<list of strings>],
  "summary": "<1-2 sentence plain English summary>"
}
Return ONLY valid JSON."""

RESOLVER_SYSTEM = """You are the chief credit analyst AI for CreditSight.
You receive outputs from 4 specialist agents. Your job:
1. Identify any conflicting signals between agents
2. Resolve conflicts with explicit reasoning
3. Produce a final credit recommendation

Return ONLY this JSON:
{
  "conflicts_detected": [<list of conflict descriptions or empty list>],
  "resolution_reasoning": "<2-3 sentences explaining how you weighted the signals>",
  "recommended_tier": "<A|B|C|D>",
  "lender_recommendation": "<one sentence — approve / approve with conditions / decline>",
  "key_strengths": [<top 3 positive factors>],
  "key_risks": [<top 3 risk factors>],
  "compliance_note": "This score is generated from alternative data signals per RBI guidelines for credit-invisible borrowers. Not a substitute for regulatory CIBIL check."
}
Return ONLY valid JSON."""

# ─────────────────────────── Helper ──────────────────────────────────────────

def safe_parse(text: str, fallback: dict) -> dict:
    """Parse JSON from LLM response with robust error handling."""
    try:
        clean = text.strip()
        
        # Remove markdown code blocks
        if "```json" in clean:
            clean = clean.split("```json")[1].split("```")[0]
        elif "```" in clean:
            clean = clean.split("```")[1].split("```")[0]
        
        # Extract JSON object if embedded in text
        start_idx = clean.find("{")
        end_idx = clean.rfind("}") + 1
        if start_idx >= 0 and end_idx > start_idx:
            clean = clean[start_idx:end_idx]
        
        clean = clean.strip()
        result = json.loads(clean)
        
        # Validate required fields exist
        required = {"signal_score", "confidence", "positive_signals", "risk_signals", "summary"}
        if all(k in result for k in required):
            return result
        else:
            # Add missing fields with defaults
            result.setdefault("signal_score", 500)
            result.setdefault("confidence", 0.5)
            result.setdefault("positive_signals", [])
            result.setdefault("risk_signals", [])
            result.setdefault("summary", "Analysis complete but detailed signals unavailable.")
            return result
            
    except json.JSONDecodeError as e:
        print(f"⚠ JSON parse error: {str(e)[:100]}")
        print(f"⚠ Raw response: {text[:200]}")
        return fallback
    except Exception as e:
        print(f"⚠ Parse error: {str(e)}")
        return fallback

def profile_to_upi_prompt(p: dict) -> str:
    return f"""Borrower UPI signals:
- Monthly transaction count: {p.get('upi_monthly_txn_count', 0)}
- Average monthly inflow: ₹{p.get('upi_avg_monthly_inflow', 0):,.0f}
- Average monthly outflow: ₹{p.get('upi_avg_monthly_outflow', 0):,.0f}
- Merchant diversity score: {p.get('upi_merchant_diversity', 0):.2f} (0=single merchant, 1=diverse)
- Salary regularity score: {p.get('upi_salary_regularity', 0):.2f} (1=very regular)
- Savings ratio: {p.get('upi_savings_ratio', 0):.2f}
- Large transaction flag: {'Yes' if p.get('upi_large_txn_flag') else 'No'}"""

def profile_to_income_prompt(p: dict) -> str:
    return f"""Borrower income/employment signals:
- Employment type: {p.get('employment_type', 'unknown')}
- Estimated monthly income: ₹{p.get('monthly_income_est', 0):,.0f}
- Income stability score: {p.get('income_stability_score', 0):.2f}
- Job tenure: {p.get('job_tenure_months', 0)} months
- Has EPF (formal employment marker): {'Yes' if p.get('has_employer_epf') else 'No'}
- Income growth trend: {p.get('income_growth_trend', 0)*100:.1f}% per month"""

def profile_to_rental_prompt(p: dict) -> str:
    return f"""Borrower rental/bill payment signals:
- Rent paid on time rate: {p.get('rent_payment_on_time_rate', 0)*100:.1f}%
- Utility bills on time rate: {p.get('utility_on_time_rate', 0)*100:.1f}%
- Rental tenure: {p.get('rental_tenure_months', 0)} months
- Has formal rental agreement: {'Yes' if p.get('has_rental_agreement') else 'No'}
- Number of bill types paid regularly: {p.get('bill_types_paid', 0)}"""

def profile_to_behavioral_prompt(p: dict) -> str:
    return f"""Borrower behavioral/device signals:
- Device type: {p.get('device_type', 'unknown')}
- Location stability score: {p.get('location_stability_score', 0):.2f} (1=very stable)
- Financial app usage tier: {p.get('app_usage_tier', 0):.2f} (1=heavy user)
- SIM card tenure: {p.get('sim_tenure_months', 0)} months
- Night transaction ratio: {p.get('night_txn_ratio', 0):.2f} (higher = more risk)"""

# ─────────────────────────── Agent Nodes ─────────────────────────────────────

async def upi_agent_node(state: CreditState) -> CreditState:
    llm = get_llm()
    p = state["profile"]
    msgs = [SystemMessage(content=UPI_SYSTEM), HumanMessage(content=profile_to_upi_prompt(p))]
    resp = await llm.ainvoke(msgs)
    result = safe_parse(resp.content, {"signal_score": 50, "confidence": 0.5,
                                        "positive_signals": [], "risk_signals": [],
                                        "summary": "Unable to analyze UPI signals."})
    log = state.get("processing_log", [])
    log.append(f"✅ UPI Agent: score={result.get('signal_score')} | raw={resp.content[:100]}")
    return {**state, "upi_analysis": result, "processing_log": log}

async def income_agent_node(state: CreditState) -> CreditState:
    llm = get_llm()
    p = state["profile"]
    msgs = [SystemMessage(content=INCOME_SYSTEM), HumanMessage(content=profile_to_income_prompt(p))]
    resp = await llm.ainvoke(msgs)
    result = safe_parse(resp.content, {"signal_score": 50, "confidence": 0.5,
                                        "positive_signals": [], "risk_signals": [],
                                        "summary": "Unable to analyze income signals."})
    log = state.get("processing_log", [])
    log.append(f"✅ Income Agent: score={result.get('signal_score')} | raw={resp.content[:100]}")
    return {**state, "income_analysis": result, "processing_log": log}

async def rental_agent_node(state: CreditState) -> CreditState:
    llm = get_llm()
    p = state["profile"]
    msgs = [SystemMessage(content=RENTAL_SYSTEM), HumanMessage(content=profile_to_rental_prompt(p))]
    resp = await llm.ainvoke(msgs)
    result = safe_parse(resp.content, {"signal_score": 50, "confidence": 0.5,
                                        "positive_signals": [], "risk_signals": [],
                                        "summary": "Unable to analyze rental signals."})
    log = state.get("processing_log", [])
    log.append(f"✅ Rental Agent: score={result.get('signal_score')} | raw={resp.content[:100]}")
    return {**state, "rental_analysis": result, "processing_log": log}

async def behavioral_agent_node(state: CreditState) -> CreditState:
    llm = get_llm()
    p = state["profile"]
    msgs = [SystemMessage(content=BEHAVIORAL_SYSTEM), HumanMessage(content=profile_to_behavioral_prompt(p))]
    resp = await llm.ainvoke(msgs)
    result = safe_parse(resp.content, {"signal_score": 50, "confidence": 0.5,
                                        "positive_signals": [], "risk_signals": [],
                                        "summary": "Unable to analyze behavioral signals."})
    log = state.get("processing_log", [])
    log.append(f"✅ Behavioral Agent: score={result.get('signal_score')} | raw={resp.content[:100]}")
    return {**state, "behavioral_analysis": result, "processing_log": log}

async def parallel_agents_node(state: CreditState) -> CreditState:
    """Run all 4 agents in parallel via asyncio.gather"""
    results = await asyncio.gather(
        upi_agent_node(state),
        income_agent_node(state),
        rental_agent_node(state),
        behavioral_agent_node(state),
    )
    # Merge all results into one state
    merged = {**state}
    for r in results:
        merged["upi_analysis"]        = r.get("upi_analysis") or merged.get("upi_analysis")
        merged["income_analysis"]     = r.get("income_analysis") or merged.get("income_analysis")
        merged["rental_analysis"]     = r.get("rental_analysis") or merged.get("rental_analysis")
        merged["behavioral_analysis"] = r.get("behavioral_analysis") or merged.get("behavioral_analysis")
    merged["processing_log"] = state.get("processing_log", []) + [
        "✅ UPI Agent completed",
        "✅ Income Agent completed",
        "✅ Rental Agent completed",
        "✅ Behavioral Agent completed",
    ]
    return merged

async def resolver_node(state: CreditState) -> CreditState:
    llm = get_llm()
    summary = f"""
UPI Agent     → score: {state['upi_analysis']['signal_score']}, confidence: {state['upi_analysis']['confidence']}
  Positives: {state['upi_analysis']['positive_signals']}
  Risks: {state['upi_analysis']['risk_signals']}
  Summary: {state['upi_analysis']['summary']}

Income Agent  → score: {state['income_analysis']['signal_score']}, confidence: {state['income_analysis']['confidence']}
  Positives: {state['income_analysis']['positive_signals']}
  Risks: {state['income_analysis']['risk_signals']}
  Summary: {state['income_analysis']['summary']}

Rental Agent  → score: {state['rental_analysis']['signal_score']}, confidence: {state['rental_analysis']['confidence']}
  Positives: {state['rental_analysis']['positive_signals']}
  Risks: {state['rental_analysis']['risk_signals']}
  Summary: {state['rental_analysis']['summary']}

Behavioral Agent → score: {state['behavioral_analysis']['signal_score']}, confidence: {state['behavioral_analysis']['confidence']}
  Positives: {state['behavioral_analysis']['positive_signals']}
  Risks: {state['behavioral_analysis']['risk_signals']}
  Summary: {state['behavioral_analysis']['summary']}
"""
    msgs = [SystemMessage(content=RESOLVER_SYSTEM), HumanMessage(content=summary)]
    resp = await llm.ainvoke(msgs)
    result = safe_parse(resp.content, {
        "conflicts_detected": [],
        "resolution_reasoning": "Standard weighted analysis applied.",
        "recommended_tier": "C",
        "lender_recommendation": "Approve with conditions",
        "key_strengths": [],
        "key_risks": [],
        "compliance_note": "Alternative data scoring. Not a substitute for regulatory CIBIL check."
    })
    log = state.get("processing_log", [])
    log.append("✅ Resolver Agent completed")
    return {**state, "resolver_output": result, "processing_log": log}

def xgboost_scorer_node(state: CreditState) -> CreditState:
    """Run XGBoost model + feature importance explainability on the profile"""
    import os, json, pickle
    MODEL_DIR = os.path.join(os.path.dirname(__file__), "../models")

    model = xgb.XGBRegressor()
    model.load_model(os.path.join(MODEL_DIR, "xgb_credit_model.json"))

    with open(os.path.join(MODEL_DIR, "encoders.pkl"), "rb") as f:
        encoders = pickle.load(f)
    with open(os.path.join(MODEL_DIR, "features.json")) as f:
        feature_cols = json.load(f)

    p = state["profile"]
    row = {
        "upi_monthly_txn_count":    p.get("upi_monthly_txn_count", 20),
        "upi_avg_monthly_inflow":   p.get("upi_avg_monthly_inflow", 15000),
        "upi_avg_monthly_outflow":  p.get("upi_avg_monthly_outflow", 12000),
        "upi_merchant_diversity":   p.get("upi_merchant_diversity", 0.5),
        "upi_salary_regularity":    p.get("upi_salary_regularity", 0.5),
        "upi_savings_ratio":        p.get("upi_savings_ratio", 0.2),
        "upi_large_txn_flag":       int(p.get("upi_large_txn_flag", 0)),
        "monthly_income_est":       p.get("monthly_income_est", 15000),
        "income_stability_score":   p.get("income_stability_score", 0.5),
        "job_tenure_months":        p.get("job_tenure_months", 12),
        "has_employer_epf":         int(p.get("has_employer_epf", 0)),
        "income_growth_trend":      p.get("income_growth_trend", 0.01),
        "rent_payment_on_time_rate": p.get("rent_payment_on_time_rate", 0.7),
        "utility_on_time_rate":     p.get("utility_on_time_rate", 0.7),
        "rental_tenure_months":     p.get("rental_tenure_months", 12),
        "has_rental_agreement":     int(p.get("has_rental_agreement", 0)),
        "bill_types_paid":          p.get("bill_types_paid", 2),
        "location_stability_score": p.get("location_stability_score", 0.5),
        "app_usage_tier":           p.get("app_usage_tier", 0.5),
        "sim_tenure_months":        p.get("sim_tenure_months", 24),
        "night_txn_ratio":          p.get("night_txn_ratio", 0.3),
        "employment_type_enc":      encoders["employment_type"].transform([p.get("employment_type", "gig")])[0],
        "device_type_enc":          encoders["device_type"].transform([p.get("device_type", "budget")])[0],
    }

    df = pd.DataFrame([row])[feature_cols]
    raw_score = float(model.predict(df)[0])
    # Model is trained on 300-900 range already, so use raw_score directly
    score = int(max(300, min(900, raw_score)))
    tier = "A" if score >= 750 else "B" if score >= 650 else "C" if score >= 550 else "D"
    
    log = state.get("processing_log", [])
    log.append(f"🤖 XGBoost raw_score={raw_score:.2f} → ml_score={score}")
    
    agent_scores = {
        "upi": state["upi_analysis"]["signal_score"],
        "income": state["income_analysis"]["signal_score"],
        "rental": state["rental_analysis"]["signal_score"],
        "behavioral": state["behavioral_analysis"]["signal_score"],
    }
    
    log.append(f"🤖 Agent scores: UPI={agent_scores['upi']}, Income={agent_scores['income']}, Rental={agent_scores['rental']}, Behavioral={agent_scores['behavioral']}")
    
    agent_weights = {"upi": 0.30, "income": 0.25, "rental": 0.30, "behavioral": 0.15}
    agent_composite = sum(agent_scores[k] * agent_weights[k] for k in agent_weights)
    agent_composite = round(agent_composite)

    # ML score from XGBoost (already computed above as `score`)
    ml_score = score

    # Final hybrid — 60% ML, 40% Agent composite
    # Both ML and agent composite are in 300-900 range
    hybrid_score = int(round(ml_score * 0.60 + agent_composite * 0.40))
    hybrid_score = max(300, min(900, hybrid_score))  # Clamp to 300-900 CIBIL range
    hybrid_tier = "A" if hybrid_score >= 750 else "B" if hybrid_score >= 650 else "C" if hybrid_score >= 550 else "D"

    # Feature importance explainability using XGBoost
    try:
        # Load pre-computed feature importance
        with open(os.path.join(MODEL_DIR, "feature_importance.json")) as f:
            importance_dict = json.load(f)
        
        # Normalize importance scores: multiply by 10 to get visible range
        # Top features will have values around 4-5, less important around 0-1
        total_importance = sum(importance_dict.values())
        shap_dict = {}
        
        if total_importance > 0:
            for feat, imp_val in importance_dict.items():
                normalized = (imp_val / total_importance) * 10
                shap_dict[feat] = round(normalized, 4)
    except Exception as e:
        shap_dict = {}
        log = state.get("processing_log", [])
        log.append(f"⚠ Feature importance unavailable: {str(e)}")
    
    # Sort by absolute impact, top 10
    top_shap = dict(sorted(shap_dict.items(), key=lambda x: abs(x[1]), reverse=True)[:10]) if shap_dict else {}

    log.append(f"✅ Hybrid score: {hybrid_score}/900 (Tier {hybrid_tier})")
    
    return {
        **state,
        "ml_score":             ml_score,           # pure XGBoost
        "agent_composite_score": agent_composite,    # pure LLM agents weighted avg
        "final_score":          hybrid_score,        # 60% ML + 40% agents
        "credit_tier":          hybrid_tier,
        "shap_values":          top_shap,
        "processing_log":       log,
        "score_breakdown": {
            "ml_score":              ml_score,
            "ml_weight":             "60%",
            "agent_composite_score": agent_composite,
            "agent_weight":          "40%",
            "agent_breakdown": {
                "upi_score":        agent_scores["upi"],
                "income_score":     agent_scores["income"],
                "rental_score":     agent_scores["rental"],
                "behavioral_score": agent_scores["behavioral"],
                "weights":          agent_weights,
            },
            "final_hybrid_score":    hybrid_score,
        }
    }

# ─────────────────────────── Build Graph ─────────────────────────────────────

from langgraph.graph import StateGraph, END

def build_graph():
    graph = StateGraph(CreditState)

    graph.add_node("parallel_agents", parallel_agents_node)
    graph.add_node("resolver",        resolver_node)
    graph.add_node("scorer",          xgboost_scorer_node)

    graph.set_entry_point("parallel_agents")
    graph.add_edge("parallel_agents", "resolver")
    graph.add_edge("resolver",        "scorer")
    graph.add_edge("scorer",          END)

    return graph.compile()

# Singleton graph instance
_graph = None

def get_graph():
    global _graph
    if _graph is None:
        _graph = build_graph()
    return _graph

async def run_credit_pipeline(profile: dict) -> CreditState:
    graph = get_graph()
    initial_state: CreditState = {
        "profile": profile,
        "upi_analysis": None,
        "income_analysis": None,
        "rental_analysis": None,
        "behavioral_analysis": None,
        "resolver_output": None,
        "final_score": None,
        "credit_tier": None,
        "shap_values": None,
        "processing_log": ["🚀 Pipeline started"],
    }
    result = await graph.ainvoke(initial_state)
    return result

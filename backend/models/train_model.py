"""
Train XGBoost credit scorer on synthetic data.
Saves model + label encoder + feature list to disk.
"""

import os, json, pickle
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import mean_absolute_error, r2_score
import xgboost as xgb

# SHAP is optional - not required for training
try:
    import shap
    HAS_SHAP = True
except ImportError:
    HAS_SHAP = False

DATA_PATH  = os.path.join(os.path.dirname(__file__), "../data/synthetic_borrowers.csv")
MODEL_DIR  = os.path.dirname(__file__)

CATEGORICAL_COLS = ["employment_type", "device_type"]
TARGET = "credit_score"

FEATURE_COLS = [
    "upi_monthly_txn_count", "upi_avg_monthly_inflow", "upi_avg_monthly_outflow",
    "upi_merchant_diversity", "upi_salary_regularity", "upi_savings_ratio",
    "upi_large_txn_flag",
    "monthly_income_est", "income_stability_score", "job_tenure_months",
    "has_employer_epf", "income_growth_trend",
    "rent_payment_on_time_rate", "utility_on_time_rate", "rental_tenure_months",
    "has_rental_agreement", "bill_types_paid",
    "location_stability_score", "app_usage_tier", "sim_tenure_months",
    "night_txn_ratio",
    # encoded categoricals added at runtime
    "employment_type_enc", "device_type_enc",
]

def train():
    df = pd.read_csv(DATA_PATH)

    # Encode categoricals
    encoders = {}
    for col in CATEGORICAL_COLS:
        le = LabelEncoder()
        df[f"{col}_enc"] = le.fit_transform(df[col])
        encoders[col] = le

    X = df[FEATURE_COLS]
    y = df[TARGET]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    model = xgb.XGBRegressor(
        n_estimators=300,
        max_depth=5,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        random_state=42,
        n_jobs=-1,
    )
    model.fit(X_train, y_train, eval_set=[(X_test, y_test)], verbose=False)

    preds = model.predict(X_test)
    mae = mean_absolute_error(y_test, preds)
    r2  = r2_score(y_test, preds)
    print(f"✅ Model trained | MAE: {mae:.2f} | R²: {r2:.4f}")

    # Save model using booster
    model.get_booster().save_model(os.path.join(MODEL_DIR, "xgb_credit_model.json"))

    # Save encoders
    with open(os.path.join(MODEL_DIR, "encoders.pkl"), "wb") as f:
        pickle.dump(encoders, f)

    # Save feature list
    with open(os.path.join(MODEL_DIR, "features.json"), "w") as f:
        json.dump(FEATURE_COLS, f)

    # Save feature importance for explainability
    # Use sklearn interface feature_importances_
    importance_dict = {}
    for feat, imp in zip(FEATURE_COLS, model.feature_importances_):
        importance_dict[feat] = float(imp)
    
    with open(os.path.join(MODEL_DIR, "feature_importance.json"), "w") as f:
        json.dump(importance_dict, f, indent=2)

    # Pre-compute SHAP explainer on a sample for speed (optional)
    if HAS_SHAP:
        try:
            explainer = shap.TreeExplainer(model)
            sample = X_test.iloc[:50]
            shap_values = explainer.shap_values(sample)
            print(f"✅ SHAP explainer verified. Sample shape: {shap_values.shape}")
        except Exception as e:
            print(f"⚠ SHAP verification skipped: {e}")
    else:
        print("ℹ SHAP not available. Using XGBoost feature importance instead.")

    print("✅ All artifacts saved to", MODEL_DIR)
    return model, encoders

if __name__ == "__main__":
    train()

"""
Synthetic Indian borrower data generator.
Produces 2000 profiles with realistic feature distributions.
"""

import numpy as np
import pandas as pd
from faker import Faker
import json, os

fake = Faker("en_IN")
np.random.seed(42)
N = 2000

def generate_dataset():
    rows = []

    for _ in range(N):
        # ── Credit tier ground truth (A=best, D=worst) weighted distribution
        tier_roll = np.random.random()
        if tier_roll < 0.20:
            tier = "A"
        elif tier_roll < 0.50:
            tier = "B"
        elif tier_roll < 0.80:
            tier = "C"
        else:
            tier = "D"

        quality = {"A": 0.9, "B": 0.7, "C": 0.45, "D": 0.2}[tier]
        noise = lambda base, std: max(0.0, min(1.0, np.random.normal(base, std)))

        # ── UPI Transaction Features
        upi_monthly_txn_count     = int(np.random.normal(quality * 60 + 10, 15))
        upi_avg_monthly_inflow    = round(np.random.normal(quality * 45000 + 8000, 8000), 2)
        upi_avg_monthly_outflow   = round(upi_avg_monthly_inflow * np.random.uniform(0.5, 0.95), 2)
        upi_merchant_diversity    = round(noise(quality, 0.15), 3)       # 0-1
        upi_salary_regularity     = round(noise(quality * 0.95, 0.1), 3) # 0-1
        upi_savings_ratio         = round(max(0, (upi_avg_monthly_inflow - upi_avg_monthly_outflow) / (upi_avg_monthly_inflow + 1)), 3)
        upi_large_txn_flag        = int(np.random.random() > (0.5 + quality * 0.3))

        # ── Income / Employment Features
        employment_type           = np.random.choice(["salaried", "self_employed", "gig", "informal"],
                                                      p=[quality*0.5+0.1, 0.25, 0.15, max(0.0, 1-(quality*0.5+0.1)-0.25-0.15)])
        monthly_income_est        = round(np.random.normal(quality * 50000 + 10000, 10000), 2)
        income_stability_score    = round(noise(quality, 0.15), 3)
        job_tenure_months         = int(np.random.normal(quality * 48 + 3, 12))
        has_employer_epf          = int(np.random.random() < quality * 0.7 + 0.1)
        income_growth_trend       = round(np.random.normal(quality * 0.15, 0.05), 3)  # % monthly growth

        # ── Rental / Bill Payment Features
        rent_payment_on_time_rate = round(noise(quality, 0.12), 3)
        utility_on_time_rate      = round(noise(quality, 0.1), 3)
        rental_tenure_months      = int(np.random.normal(quality * 36 + 3, 10))
        has_rental_agreement      = int(np.random.random() < quality * 0.6 + 0.2)
        bill_types_paid           = int(np.random.normal(quality * 4 + 1, 1))

        # ── Behavioral / Device Features
        device_type               = np.random.choice(["premium", "mid_range", "budget"],
                                                      p=[quality*0.4, 0.4, max(0.0, 1-quality*0.4-0.4)])
        location_stability_score  = round(noise(quality, 0.15), 3)
        app_usage_tier            = round(noise(quality, 0.2), 3)   # financial app usage
        sim_tenure_months         = int(np.random.normal(quality * 60 + 6, 15))
        night_txn_ratio           = round(noise(1 - quality * 0.3, 0.1), 3)  # higher = riskier

        # ── Derived score (ground truth numeric 0-100)
        score = round(
            quality * 360
            + upi_salary_regularity * 60
            + upi_savings_ratio * 48
            + income_stability_score * 42
            + rent_payment_on_time_rate * 48
            + utility_on_time_rate * 30
            + location_stability_score * 12
            - night_txn_ratio * 18
            + np.random.normal(0, 12)
            + 300
        )
        score = int(max(300, min(900, score)))
        tier = "A" if score >= 750 else "B" if score >= 650 else "C" if score >= 550 else "D"

        rows.append({
            # UPI
            "upi_monthly_txn_count": upi_monthly_txn_count,
            "upi_avg_monthly_inflow": upi_avg_monthly_inflow,
            "upi_avg_monthly_outflow": upi_avg_monthly_outflow,
            "upi_merchant_diversity": upi_merchant_diversity,
            "upi_salary_regularity": upi_salary_regularity,
            "upi_savings_ratio": upi_savings_ratio,
            "upi_large_txn_flag": upi_large_txn_flag,
            # Income
            "employment_type": employment_type,
            "monthly_income_est": monthly_income_est,
            "income_stability_score": income_stability_score,
            "job_tenure_months": job_tenure_months,
            "has_employer_epf": has_employer_epf,
            "income_growth_trend": income_growth_trend,
            # Rental
            "rent_payment_on_time_rate": rent_payment_on_time_rate,
            "utility_on_time_rate": utility_on_time_rate,
            "rental_tenure_months": rental_tenure_months,
            "has_rental_agreement": has_rental_agreement,
            "bill_types_paid": bill_types_paid,
            # Behavioral
            "device_type": device_type,
            "location_stability_score": location_stability_score,
            "app_usage_tier": app_usage_tier,
            "sim_tenure_months": sim_tenure_months,
            "night_txn_ratio": night_txn_ratio,
            # Target
            "credit_score": score,
            "credit_tier": tier,
        })

    df = pd.DataFrame(rows)
    out = os.path.join(os.path.dirname(__file__), "synthetic_borrowers.csv")
    df.to_csv(out, index=False)
    print(f"✅ Generated {N} profiles → {out}")
    print(df["credit_tier"].value_counts())
    return df

if __name__ == "__main__":
    generate_dataset()

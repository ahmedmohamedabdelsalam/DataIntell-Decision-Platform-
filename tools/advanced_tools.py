"""
advanced_tools.py — ML Analytics with Leakage Exclusion
Upgrades: auto-drop leaky features, Z-score + IQR hybrid anomaly, robust RF.
"""
import pandas as pd
import numpy as np
import logging
from sklearn.ensemble import RandomForestRegressor

logger = logging.getLogger(__name__)

LEAKAGE_THRESHOLD = 0.95  # Year correlation above this → leaky


def _get_leaky_features(df: pd.DataFrame, time_col: str = 'Year') -> set[str]:
    """Return features with near-perfect time correlation (data leakage)."""
    leaky: set[str] = set()
    if time_col not in df.columns:
        return leaky
    numeric = df.select_dtypes(include=[np.number])
    for col in numeric.columns:
        if col == time_col:
            continue
        try:
            corr = abs(numeric[col].corr(numeric[time_col]))
            if corr >= LEAKAGE_THRESHOLD:
                leaky.add(col)
        except Exception:
            pass
    return leaky


def advanced_analytics_tool(df: pd.DataFrame) -> dict:
    """
    Run skewness, Z-score+IQR hybrid anomaly detection, and
    Random Forest feature importance (with leakage exclusion).
    """
    logger.info("Executing tool: advanced_analytics_tool (Principal v2 — leakage-aware RF).")

    result: dict = {
        "skewness": {},
        "feature_importance": {},
        "trends": [],
        "anomalies_hybrid": {}
    }

    numeric_df = df.select_dtypes(include=[np.number])
    if numeric_df.empty:
        return result

    # ── 1. Skewness ──────────────────────────────────────────────────────
    try:
        for col, val in numeric_df.skew().items():
            if abs(val) > 1.0:
                result["skewness"][col] = {
                    "value": round(float(val), 2),
                    "type": "highly skewed (positive)" if val > 0 else "highly skewed (negative)"
                }
    except Exception as e:
        logger.warning(f"Skewness failed: {e}")

    # ── 2. Hybrid Anomaly: Z-score + IQR ────────────────────────────────
    try:
        for col in numeric_df.columns:
            series = numeric_df[col].dropna()
            if len(series) < 4:
                continue
            mean, std = float(series.mean()), float(series.std())
            q1, q3 = float(series.quantile(0.25)), float(series.quantile(0.75))
            iqr = q3 - q1
            lo_iqr, hi_iqr = q1 - 1.5 * iqr, q3 + 1.5 * iqr
            if std > 0:
                z_scores = (series - mean).abs() / std
                z_out = z_scores > 3
                iqr_out = (series < lo_iqr) | (series > hi_iqr)
                both = z_out & iqr_out  # Only flag if BOTH methods agree
                n_both = int(both.sum())
                if n_both > 0:
                    top_vals = series[both].abs().nlargest(5)
                    result["anomalies_hybrid"][col] = {
                        "count": n_both,
                        "method": "Z-score (>3σ) AND IQR (1.5×IQR) — both required",
                        "max_z": round(float(z_scores[both].max()), 2),
                        "values": top_vals.tolist(),
                        "explanation": (
                            f"{n_both} values in '{col}' flagged by both Z-score and IQR. "
                            f"Capped (not removed) by self-healing pipeline."
                        )
                    }
    except Exception as e:
        logger.warning(f"Hybrid anomaly detection failed: {e}")

    # ── 3. Random Forest Feature Importance (leakage-aware) ───────────────
    target_col = None
    if "Revenue_EUR" in numeric_df.columns:
        target_col = "Revenue_EUR"
    elif "Price" in numeric_df.columns:
        target_col = "Price"
    elif len(numeric_df.columns) > 1:
        target_col = numeric_df.columns[-1]

    if target_col:
        try:
            leaky = _get_leaky_features(df)
            # Drop target + leaky features from X
            drop_cols = {target_col} | leaky
            clean_df = numeric_df.dropna()
            X = clean_df.drop(columns=[c for c in drop_cols if c in clean_df.columns])
            y = clean_df[target_col]

            if len(X) > 10 and len(X.columns) >= 1:
                rf = RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1)
                rf.fit(X, y)
                importances = rf.feature_importances_
                indices = np.argsort(importances)[::-1]
                top_features = {}
                for i in range(min(8, len(importances))):
                    c = X.columns[indices[i]]
                    score = float(importances[indices[i]])
                    if score > 0.03:
                        top_features[c] = round(score, 4)
                result["feature_importance"] = {
                    "target_variable": target_col,
                    "top_drivers": top_features,
                    "excluded_leaky": list(leaky),
                    "note": (
                        f"Features excluded from RF (time leakage ≥{LEAKAGE_THRESHOLD}): "
                        f"{list(leaky) or 'none'}."
                    )
                }
        except Exception as e:
            logger.warning(f"RF feature importance failed: {e}")

    # ── 4. Trend Detection ────────────────────────────────────────────────
    try:
        if target_col and 'Year' in numeric_df.columns and target_col in numeric_df.columns:
            yearly = df.groupby('Year')[target_col].sum()
            if len(yearly) > 1:
                first_yr, last_yr = int(yearly.index.min()), int(yearly.index.max())
                growth = (yearly.iloc[-1] - yearly.iloc[0]) / yearly.iloc[0] * 100
                result["trends"].append(
                    f"From {first_yr} to {last_yr}, total {target_col} grew by {growth:.1f}%."
                )
    except Exception as e:
        logger.warning(f"Trend detection failed: {e}")

    return result

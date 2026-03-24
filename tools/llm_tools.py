import logging
import json
import pandas as pd
from services.llm_service import llm_service
from tools.deterministic_tools import compute_deterministic_insights, fallback_decision_response

logger = logging.getLogger(__name__)

def _build_correlation_snapshot(correlations: dict) -> dict:
    snapshot = {}
    for col, corrs in correlations.items():
        if isinstance(corrs, dict):
            sorted_corrs = sorted(
                [(k, v) for k, v in corrs.items() if k != col],
                key=lambda x: abs(x[1]), reverse=True
            )[:4]
            snapshot[col] = {k: round(v, 3) for k, v in sorted_corrs}
    return snapshot

def generate_insights_tool(df: pd.DataFrame, analysis: dict) -> dict:
    """
    Decision Intelligence System — McKinsey Consultant mode.
    First, it programmatically computes deterministic truths matching the final schema.
    Next, it asks the LLM to explain and formulate the report strictly mapped to this schema.
    If LLM fails, it routes back to a pure deterministic fallback.
    """
    logger.info("Executing tool: generate_insights_tool (Deterministic + LLM Hybrid mode)")

    summary = analysis.get("summary", {})
    anomalies = analysis.get("anomalies", {})
    advanced = analysis.get("advanced_analytics", {})
    correlations = analysis.get("correlations", {})
    correlation_snapshot = _build_correlation_snapshot(correlations)
    
    # 1. Compute Ground Truth (Deterministic Engine)
    det_insights = compute_deterministic_insights(df, analysis)

    payload = {
        "summary_statistics": summary,
        "anomalies_detected": anomalies,
        "advanced_analytics": advanced,
        "key_correlations": correlation_snapshot,
        "PROGRAMMATIC_COMPUTED_BASELINE": det_insights
    }

    data_str = json.dumps(payload, default=str)[:8000]

    prompt = f"""
You are a PRINCIPAL Decision Intelligence AI — McKinsey consultant + Senior Data Scientist combined.
This is NOT a demo. This system is used by executives.

Your goal is a COMPLETE, CONSISTENT, MONETIZED business report.

Dataset statistical context + programmatic baseline:
{data_str}

**MANDATORY**: Adopt `PROGRAMMATIC_COMPUTED_BASELINE` values exactly.
The baseline includes: system_confidence (penalized), leaky_features (must NOT be used), per-segment elasticity, and monetized recommendations.

---
## STRICT RULES

1. DATA TRUST: Never use `leaky_features` for causal insights — they are time proxies.
2. CONFIDENCE: If `system_confidence` < 0.85, tone must reflect skepticism. If uncertainty exists, SAY IT clearly.
3. ELASTICITY: If price effect is NEGATIVE in baseline, you CANNOT claim pricing power.
4. RECOMMENDATIONS: MUST include specific action, segment, expected_impact (€), confidence, feasibility_constraint, and execution_method. NO arbitrary % targets without historical basis.
5. INSIGHTS: MUST be non-obvious, data-backed, explain WHY, and free of contradictions. Trivial statements (e.g. "Revenue depends on volume") are FORBIDDEN.
6. FORECAST: MUST mention limitations (ceteris paribus, no macro shocks).
7. SUMMARY: Max 4 lines. Main driver, biggest risk, top action. No generic fluff.

---
## OUTPUT FORMAT (strict JSON, no markdown fences):

{{
  "executive_summary": "Max 4 lines. Sharp, realistic main driver, key risk, top action.",

  "key_insights": [
    {{
      "insight": "Non-obvious observation with metric",
      "impact": "Quantified (€ or %)",
      "cause": "Deep causal explanation — WHY",
      "evidence": "Data reference (decomposition / correlation / feature importance)"
    }}
  ],

  "recommendations": [
    {{
      "action": "Specific, practical step",
      "segment": "Region or Model name",
      "numeric_target": "+X% units or +Y€ price (from baseline)",
      "expected_impact": "€ amount (X% of total revenue) (from baseline)",
      "risk_level": "low|medium|high",
      "confidence": 0.00,
      "timeline": "short|medium|long",
      "preconditions": "Dependencies",
      "feasibility_constraint": "Cost, operations, or risk constraint",
      "execution_method": "How to execute (e.g., A/B test, pilot)"
    }}
  ],

  "data_quality_issues": [
    {{
      "issue": "Description",
      "severity": "low|medium|high",
      "impact": "Real impact on decision confidence"
    }}
  ],

  "advanced_analysis": {{
    "revenue_decomposition": {{
      "volume_contribution": "from baseline",
      "price_contribution": "from baseline",
      "interaction_effect": "from baseline",
      "volume_effect_eur": "from baseline",
      "price_effect_eur": "from baseline",
      "interaction_effect_eur": "from baseline",
      "growth_type": "volume|price|mixed",
      "total_yoy_delta": "from baseline",
      "mathematical_consistency": "from baseline"
    }},
    "segmentation": {{
      "top_regions": "from baseline",
      "top_models": "from baseline",
      "underperformers": "from baseline",
      "underperformer_rationale": "from baseline"
    }},
    "forecast": {{
      "base": "from baseline",
      "best_case": "from baseline",
      "worst_case": "from baseline",
      "confidence": 0.0,
      "methodology": "from baseline (MUST include limitations)"
    }},
    "concentration_risk": "...",
    "kpis": {{
      "revenue_per_unit_eur": "from baseline",
      "yoy_growth_rate": "from baseline",
      "cagr": "from baseline"
    }},
    "elasticity_analysis": {{
      "price_sensitivity": "from baseline (aggregate)",
      "volume_scalability": "from baseline",
      "scalability_verdict": "from baseline"
    }}
  }}
}}

HARD RULES:
- Minimum 5 key_insights; minimum 3 recommendations.
- Recommendations MUST include constraints and execution_method.
- NEVER invent numbers. Use only what is in the baseline.
- If field is missing → write "INSUFFICIENT DATA".
- Copy-paste consulting language is FORBIDDEN.
"""

    import time
    max_retries = 5
    insights_result = None
    
    for attempt in range(max_retries):
        try:
            res = llm_service.generate_json(prompt)
            if isinstance(res, dict):
                insights_result = res
                logger.info("generate_insights_tool: LLM generated successfully.")
                break
        except Exception as e:
            wait_time = 2 ** attempt
            logger.warning(f"LLM attempt {attempt + 1} failed ({e}). Retrying in {wait_time}s...")
            time.sleep(wait_time)
            
    if not isinstance(insights_result, dict):
        logger.error("generate_insights_tool: LLM completely failed after 5 retries. Formatting deterministic output as primary.")
        return fallback_decision_response(det_insights)

    insights = insights_result

    try:
        logger.info("generate_insights_tool: Applying deterministic enforcement.")

        det_adv    = det_insights.get("advanced_analysis", {})
        det_decomp = det_adv.get("revenue_decomposition", {})
        det_seg    = det_adv.get("segmentation", {})
        det_kpis   = det_adv.get("kpis", {})
        det_fc     = det_adv.get("forecast", {})
        det_el     = det_adv.get("elasticity_analysis", {})

        llm_adv    = insights.setdefault("advanced_analysis", {})
        llm_decomp = llm_adv.setdefault("revenue_decomposition", {})
        llm_seg    = llm_adv.setdefault("segmentation", {})
        llm_kpis   = llm_adv.setdefault("kpis", {})
        llm_fc     = llm_adv.setdefault("forecast", {})
        llm_el     = llm_adv.setdefault("elasticity_analysis", {})

        # Hard-overwrite ALL computed fields — LLM may NOT invent numbers
        for f in ["volume_contribution", "price_contribution", "interaction_effect",
                  "volume_effect_eur", "price_effect_eur", "interaction_effect_eur",
                  "total_yoy_delta", "growth_type", "mathematical_consistency", "validation"]:
            if det_decomp.get(f):
                llm_decomp[f] = det_decomp[f]

        for f in ["top_regions", "top_models", "underperformers", "underperformer_rationale", "concentration_risk"]:
            if det_seg.get(f):
                llm_seg[f] = det_seg[f]

        for f in ["revenue_per_unit_eur", "yoy_growth_rate", "cagr", "metric_contradiction"]:
            if det_kpis.get(f):
                llm_kpis[f] = det_kpis[f]

        for f in ["base", "best_case", "worst_case", "confidence", "methodology"]:
            if det_fc.get(f):
                llm_fc[f] = det_fc[f]

        for f in ["price_sensitivity", "volume_scalability", "scalability_verdict",
                  "by_region", "by_model", "unstable_segments"]:
            if det_el.get(f) is not None:
                llm_el[f] = det_el[f]

        if det_adv.get("concentration_risk"):
            llm_adv["concentration_risk"] = det_adv["concentration_risk"]

        # System metadata (always overwrite)
        llm_adv["system_confidence"] = det_adv.get("system_confidence", 0.90)
        llm_adv["confidence_log"]    = det_adv.get("confidence_log", [])
        llm_adv["leaky_features"]    = det_adv.get("leaky_features", [])

        # DQI: deterministic source is authoritative — merge unique LLM issues
        det_dqi = det_insights.get("data_quality_issues", [])
        llm_dqi = insights.get("data_quality_issues", [])
        seen = {d.get("issue", "") for d in det_dqi}
        insights["data_quality_issues"] = list(det_dqi) + [d for d in llm_dqi if d.get("issue", "") not in seen]

        # Recommendations: use det_insights (monetized) if LLM didn't provide or was suppressed
        llm_recs = insights.get("recommendations", [])
        if not llm_recs:
            insights["recommendations"] = det_insights.get("recommendations", [])
        else:
            # Supplement with monetized det recs that have segment/numeric_target
            existing_actions = {r.get("action", "")[:30] for r in llm_recs}
            for det_r in det_insights.get("recommendations", []):
                if det_r.get("segment") and det_r.get("action", "")[:30] not in existing_actions:
                    # Ensure det recs have segment/numeric_target fields in LLM output too
                    llm_recs.append(det_r)
            insights["recommendations"] = llm_recs

        insights.setdefault("key_insights", det_insights.get("key_insights", []))
        insights.setdefault("visualization_summary", [])
        return insights

    except Exception as e:
        logger.error(f"generate_insights_tool: Enforcement failed ({e}). Returning pristine deterministic output.")
        return fallback_decision_response(det_insights)



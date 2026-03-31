import pandas as pd
import logging
import os
import re
import numpy as np

logger = logging.getLogger(__name__)

UPLOAD_DIR = "uploads"

_STD_COLS = {
    "Year": ["year", "yr", "years"],
    "Revenue_EUR": ["revenue", "revenues", "sales", "turnover", "amount"],
    "Units_Sold": ["units", "unit", "qty", "quantity", "volume", "sold", "count"],
    "Avg_Price_EUR": ["price", "avg_price", "avgprice", "unit_price", "unitprice"],
    "Region": ["region", "country", "market", "territory", "area"],
    "Model": ["model", "product", "sku", "series", "trim"],
}


def _norm_key(s: str) -> str:
    """Normalize a column name for fuzzy matching."""
    s = str(s).strip().lower()
    # Remove spaces/underscores/dashes for easier keyword checks.
    s = re.sub(r"[\s_\-]+", "", s)
    return s


def _coerce_numeric(series: pd.Series) -> pd.Series:
    """Convert common numeric formats to floats; non-convertible values become NaN."""
    return pd.to_numeric(series, errors="coerce")


def _guess_column(df: pd.DataFrame, keywords: list[str]) -> str | None:
    """Pick the best matching existing column for a list of keywords."""
    cols = list(df.columns)
    scored: list[tuple[int, str]] = []
    for c in cols:
        nc = _norm_key(c)
        score = 0
        for kw in keywords:
            nkw = _norm_key(kw)
            if nkw and nkw in nc:
                score += 2
        # Prefer exact-ish matches when available.
        for kw in keywords:
            if _norm_key(kw) == nc:
                score += 3
        if score > 0:
            scored.append((score, c))
    if not scored:
        return None
    scored.sort(key=lambda x: x[0], reverse=True)
    return scored[0][1]


def _normalize_dataset_schema(df: pd.DataFrame) -> tuple[pd.DataFrame, dict]:
    """
    Best-effort schema normalization:
    - Adds standardized columns (Year, Revenue_EUR, Units_Sold, Avg_Price_EUR, Region, Model)
      when it can infer them from alternative names.
    - Never raises on unknown schemas; it just returns fewer standardized columns.
    """
    out = df.copy()
    mapped_from: dict[str, str] = {}

    cols = list(out.columns)

    # 1) Year: explicit year column or derive from date-like columns.
    if "Year" not in out.columns:
        year_col = _guess_column(out, _STD_COLS["Year"])
        if year_col is not None:
            mapped_from["Year"] = year_col
            out["Year"] = _coerce_numeric(out[year_col])
        else:
            date_candidates = [c for c in cols if any(k in _norm_key(c) for k in ["date", "timestamp", "time"])]
            if date_candidates:
                mapped_from["Year"] = date_candidates[0]
                dt = pd.to_datetime(out[date_candidates[0]], errors="coerce", utc=False)
                out["Year"] = dt.dt.year

    # 2) Revenue / Units / Price.
    if "Revenue_EUR" not in out.columns:
        rev_col = _guess_column(out, _STD_COLS["Revenue_EUR"])
        if rev_col is not None:
            mapped_from["Revenue_EUR"] = rev_col
            out["Revenue_EUR"] = _coerce_numeric(out[rev_col])

    if "Units_Sold" not in out.columns:
        units_col = _guess_column(out, _STD_COLS["Units_Sold"])
        if units_col is not None:
            mapped_from["Units_Sold"] = units_col
            out["Units_Sold"] = _coerce_numeric(out[units_col])

    if "Avg_Price_EUR" not in out.columns:
        price_col = _guess_column(out, _STD_COLS["Avg_Price_EUR"])
        if price_col is not None:
            mapped_from["Avg_Price_EUR"] = price_col
            out["Avg_Price_EUR"] = _coerce_numeric(out[price_col])

    # Derived: if we can compute Avg_Price from revenue and units.
    if "Avg_Price_EUR" not in out.columns and "Revenue_EUR" in out.columns and "Units_Sold" in out.columns:
        denom = out["Units_Sold"].replace(0, np.nan)
        out["Avg_Price_EUR"] = out["Revenue_EUR"] / denom
        mapped_from["Avg_Price_EUR"] = "derived: Revenue_EUR / Units_Sold"

    # 3) Region / Model (categorical dimensions).
    if "Region" not in out.columns:
        region_col = _guess_column(out, _STD_COLS["Region"])
        if region_col is not None:
            mapped_from["Region"] = region_col
            out["Region"] = out[region_col].astype(str)

    if "Model" not in out.columns:
        model_col = _guess_column(out, _STD_COLS["Model"])
        if model_col is not None:
            mapped_from["Model"] = model_col
            out["Model"] = out[model_col].astype(str)

    # Ensure standardized numeric columns are numeric when present.
    for c in ["Year", "Revenue_EUR", "Units_Sold", "Avg_Price_EUR"]:
        if c in out.columns:
            out[c] = _coerce_numeric(out[c])

    return out, mapped_from


def load_data_tool(file_id: str) -> pd.DataFrame:
    """Loads a dataset securely from the uploads directory and adds basic profiling metadata."""
    logger.info(f"Executing tool: load_data_tool for file {file_id}")
    file_path = os.path.join(UPLOAD_DIR, file_id)
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Missing file: {file_id}. Please upload it first.")
    
    if file_path.endswith('.csv'):
        df = pd.read_csv(file_path)
    elif file_path.endswith('.xlsx'):
        df = pd.read_excel(file_path)
    else:
        raise ValueError("Unsupported format.")
        
    # Best-effort schema normalization so deterministic engine can work on more uploads.
    df, mapped_from = _normalize_dataset_schema(df)

    # Dataset Type Detection
    has_date = any(col.lower() in ["date", "year", "month", "timestamp"] for col in df.columns)
    dataset_type = "time-series" if has_date else "tabular"
    
    # Inject metadata into attrs so downstream tools know context
    df.attrs['profile'] = {
        "row_count": len(df),
        "column_count": len(df.columns),
        "dataset_type": dataset_type,
        "normalized_columns": mapped_from,
        "missing_values": df.isnull().sum().to_dict()
    }
    return df

def summary_tool(df: pd.DataFrame) -> dict:
    """Generates a statistical summary of the dataset."""
    logger.info("Executing tool: summary_tool")
    return df.describe().to_dict()

def correlation_tool(df: pd.DataFrame) -> dict:
    """Generates correlations for numeric variables."""
    logger.info("Executing tool: correlation_tool")
    numeric_df = df.select_dtypes(include=['number'])
    if numeric_df.empty:
        return {}
    return numeric_df.corr().to_dict()

def anomaly_tool(df: pd.DataFrame) -> dict:
    """Detects anomalies using Z-score, returns exact records & severity."""
    logger.info("Executing tool: anomaly_tool")
    numeric_df = df.select_dtypes(include=['number'])
    anomalies = {}
    
    for col in numeric_df.columns:
        mean = numeric_df[col].mean()
        std = numeric_df[col].std()
        if std > 0:
            z_scores = (df[col] - mean).abs() / std
            outliers_mask = z_scores > 3
            
            if outliers_mask.sum() > 0:
                # Extract the anomalous rows and attach severity
                outlier_rows = df[outliers_mask].copy()
                outlier_rows['z_score'] = z_scores[outliers_mask]
                
                # Severity definition: Z>5 High, Z>4 Medium, else Low
                outlier_rows['severity'] = pd.cut(
                    outlier_rows['z_score'], 
                    bins=[3, 4, 5, float('inf')], 
                    labels=['Low', 'Medium', 'High']
                )
                
                # Cap the maximum returned records per column to 10 to avoid JSON bloat
                top_outliers = outlier_rows.sort_values(by='z_score', ascending=False).head(10)
                
                # Format for output
                records = []
                for _, row in top_outliers.iterrows():
                    record = row.to_dict()
                    # Clean up data types (Pandas Int64/Float to Python native)
                    record = {k: float(v) if pd.api.types.is_numeric_dtype(type(v)) else str(v) for k, v in record.items()}
                    records.append(record)
                    
                anomalies[col] = {
                    "count": int(outliers_mask.sum()),
                    "top_anomalies": records,
                    "explanation": f"Found {outliers_mask.sum()} entries in {col} deviating significantly from the mean ({mean:.2f})."
                }
    return anomalies

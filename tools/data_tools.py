import pandas as pd
import logging
import os

logger = logging.getLogger(__name__)

UPLOAD_DIR = "uploads"

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
        
    # Dataset Type Detection
    has_date = any(col.lower() in ['date', 'year', 'month', 'timestamp'] for col in df.columns)
    dataset_type = "time-series" if has_date else "tabular"
    
    # Inject metadata into attrs so downstream tools know context
    df.attrs['profile'] = {
        "row_count": len(df),
        "column_count": len(df.columns),
        "dataset_type": dataset_type,
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

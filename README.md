# DataIntell — Professional Decision Intelligence Platform

DataIntell is a production-grade Decision Intelligence System designed for executive-level data analysis and strategic forecasting. Built with a deterministic-first engine and high-logic causal analysis, it transforms raw datasets into actionable, monetized business recommendations with strict mathematical consistency.

## Key Capabilities

1.  **Deterministic Logic Engine**: Unlike generic LLM wrappers, DataIntell uses a rigorous Python-based analytical core to calculate revenue decomposition, price elasticity (log-log OLS), and exact interaction effects.
2.  **Self-Healing Data Pipeline**: Automatically detects and fixes data quality issues:
    - **Leakage Protection**: Excludes features with high temporal correlation (|corr| ≥ 0.95) from causal models.
    - **Anomaly Detection**: Hybrid Z-score and IQR-based filtering.
    - **Intelligent Imputation**: Clean data handling for missing or corrupted values.
3.  **Executive-Grade Recommendations**: Generates strategic advice with mandatory `feasibility_constraints` and `execution_methods` (e.g., A/B tests or pilot rollouts).
4.  **Elasticity Stability Gates**: Statistically invalidates pricing power claims if the aggregate price effect is negative or if elasticity is unstable (|ε| > 5).
5.  **Modern Enterprise UI**: A high-performance React dashboard featuring real-time execution logs, multi-page analytics, and interactive charts.

## Technology Stack

- **Backend**: Python 3.10+, FastAPI, Pandas, NumPy, Scikit-Learn, Statsmodels.
- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, Recharts, Zustand.
- **Analysis Core**: Google Gemini 2.0 (Logic Layer) + Deterministic Mathematical Engine.

## Setup & Execution

### 1. Requirements
Ensure you have Python 3.10+ and Node.js 18+ installed.

### 2. Backend Configuration
Create a `.env` file in the root directory:
```env
GOOGLE_GEMINI_API_KEY=your_gemini_api_key_here
```

Install dependencies and start the server:
```bash
pip install -r requirements.txt
uvicorn main:app --reload
```

### 3. Frontend Configuration
Create a `frontend/.env` file:
```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

Install dependencies and start the dev server:
```bash
cd frontend
npm install
npm run dev
```

## Project Structure

- `/tools`: Deterministic analytical engines and ML models.
- `/agent`: Logic for task parsing, planning, and tool execution.
- `/frontend`: Responsive React dashboard.
- `main.py`: FastAPI entry point and file upload management.

## Deployment

Designed for seamless deployment on platforms like Hugging Face Spaces or Vercel/Render. Ensure environment variables are correctly mapped in the production dashboard.

---
*Developed for high-stakes business analysis and strategic decision support.*

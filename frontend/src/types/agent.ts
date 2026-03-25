export interface StepExecuted {
  action: string;
  status: 'success' | 'failed' | 'pending';
  error?: string;
}

export interface AnomalyRecord {
  count: number;
  top_anomalies: Record<string, any>[];
  explanation: string;
}

export interface FeatureImportance {
  target_variable: string;
  top_drivers: Record<string, number>;
}

export interface AdvancedAnalytics {
  skewness: Record<string, { value: number; type: string }>;
  feature_importance: FeatureImportance;
  trends: string[];
}

export interface Visualizations {
  summary: Record<string, any>;
  advanced_analytics: AdvancedAnalytics;
}

// ── Decision-Grade Types ─────────────────────────────────────────────────────

export interface KeyInsight {
  insight: string;
  impact: string;
  cause?: string;        // WHY it happens (new field)
  evidence: string;
}

export interface DataQualityIssue {
  issue: string;
  severity: 'low' | 'medium' | 'high' | string;
  impact: string;
}

// Revenue decomposition (quantified)
export interface RevenueDecomposition {
  volume_contribution: string;
  price_contribution: string;
  interaction_effect?: string;
  volume_effect_eur?: string;
  price_effect_eur?: string;
  interaction_effect_eur?: string;
  total_yoy_delta?: string;
  growth_type: 'volume' | 'price' | 'mixed' | string;
  mathematical_consistency?: string;
  validation?: string;
}

// Segmentation
export interface Segmentation {
  top_regions: string;
  top_models: string;
  underperformers?: string;
  underperformer_rationale?: string;
  concentration_risk?: string;
}

// KPIs
export interface KPIs {
  revenue_per_unit_eur?: string;
  yoy_growth_rate?: string;
  cagr?: string;
  metric_contradiction?: string;
}

export interface Forecast {
  base: string;
  best_case: string;
  worst_case: string;
  confidence: number;
  methodology: string;
}

export interface ElasticityAnalysis {
  price_sensitivity: string;
  volume_scalability: string;
  scalability_verdict: string;
}

// Full Advanced Analysis
export interface AdvancedAnalysis {
  revenue_decomposition?: RevenueDecomposition;
  segmentation?: Segmentation;
  forecast?: Forecast;
  concentration_risk?: string;
  kpis?: KPIs;
  elasticity_analysis?: ElasticityAnalysis;
  // legacy flat fields
  revenue_drivers?: string;
  growth_type?: string;
  system_confidence?: number;
}

export interface Recommendation {
  action: string;
  segment?: string;
  numeric_target?: string;
  justification?: string;
  expected_impact: string;
  risk_level: 'high' | 'medium' | 'low' | string;
  confidence: number;
  timeline?: 'short' | 'medium' | 'long' | string;
  preconditions?: string;
  feasibility_constraint?: string;
  execution_method?: string;
}

// Legacy sections (still used by the backend if LLM goes deeper)
export interface DataQualityAssessment {
  critical_issues: string[];
  metrics?: Record<string, string>;
  revenue_validation?: string;
  safe_metrics: string[];
  unsafe_metrics: string[];
  overall_reliability: 'high' | 'medium' | 'low' | 'unknown';
  confidence_penalty: number;
}

export interface ConfirmedDriver {
  variable: string;
  classification?: string;
  mechanism: string;
  confounders_controlled?: string;
  confidence: number;
  evidence?: string;
}

export interface SpuriousDriver {
  variable: string;
  why_spurious: string;
  confidence: number;
}

export interface TrueRevenueDrivers {
  confirmed_drivers: ConfirmedDriver[];
  spurious_drivers: SpuriousDriver[];
  summary: string;
  self_critique?: string;
}

export interface SegmentInsight {
  finding: string;
  contribution_pct?: string;
  yoy_trend?: string;
  business_meaning: string;
  risk: string;
  scalable: boolean;
  confidence: number;
  evidence?: string;
}

export interface RevenueDecomposition {
  volume_effect: string;
  price_effect: string;
  mix_effect: string;
  structural_vs_concentrated: string;
  scalability_verdict: string;
  confidence?: number;
}

export interface RiskItem {
  risk: string;
  type: string;
  severity: 'high' | 'medium' | 'low';
  evidence: string;
  mitigation?: string;
  confidence: number;
}

export interface RealVsFakeGrowth {
  structural_growth: string;
  time_driven_growth: string;
  macro_dependency?: string;
  verdict: string;
  self_critique?: string;
  confidence?: number;
}

export interface AnomalyDeepDive {
  column: string;
  classification: string;
  root_cause: string;
  repeatable: boolean;
  business_implication?: string;
  confidence: number;
}

export interface FinalVerdict {
  is_growing: boolean;
  growth_summary: string;
  biggest_opportunity: string;
  biggest_risk: string;
}

export interface AgentResult {
  executive_summary?: string;
  // Core McKinsey output schema
  key_insights?: KeyInsight[] | string[];
  recommendations?: Recommendation[] | string[];
  data_quality_issues?: DataQualityIssue[] | string[];
  advanced_analysis?: AdvancedAnalysis;
  // Extended / legacy decision-grade sections
  data_quality_assessment?: DataQualityAssessment;
  true_revenue_drivers?: TrueRevenueDrivers;
  segment_insights?: SegmentInsight[] | string[];
  revenue_decomposition?: RevenueDecomposition;
  risk_analysis?: RiskItem[] | string[];
  real_vs_fake_growth?: RealVsFakeGrowth;
  anomaly_deep_dive?: AnomalyDeepDive[] | string[];
  final_verdict?: FinalVerdict;
  // Analytics payload
  anomalies?: Record<string, AnomalyRecord>;
  visualizations?: Visualizations;
  raw_data?: Record<string, any>;
  error?: string;
  message?: string;
}

export interface TaskResponse {
  task: string;
  intent?: string;
  plan?: string[];
  steps_executed: StepExecuted[];
  result: AgentResult;
  execution_time_seconds: number;
  status: 'success' | 'error';
}

export interface HealthResponse {
  status: string;
  api_key_loaded: boolean;
}

export interface HistoryItem extends TaskResponse {
  id: string;
  timestamp: number;
}

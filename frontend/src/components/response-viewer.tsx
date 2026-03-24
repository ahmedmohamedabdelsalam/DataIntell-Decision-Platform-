import { useState } from 'react';
import {
  FileJson, ClipboardCopy, BarChart2, AlertTriangle,
  Lightbulb, Target, TrendingUp, Activity, ChevronDown,
  ChevronUp, ShieldAlert, CheckCircle2, XCircle, Layers,
  Zap, TrendingDown, BookOpen, Crosshair, Clock
} from 'lucide-react';
import type {
  AgentResult, KeyInsight, DataQualityIssue, Recommendation,
  AdvancedAnalysis, SegmentInsight, AnomalyDeepDive, RiskItem,
  TrueRevenueDrivers
} from '../types/agent';
import toast from 'react-hot-toast';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function ConfidenceBadge({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color = pct >= 75 ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25'
    : pct >= 50 ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/25'
    : 'text-red-400 bg-red-500/10 border-red-500/25';
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${color}`}>
      {pct}% conf.
    </span>
  );
}

function SeverityBadge({ level }: { level: string }) {
  const map: Record<string, string> = {
    high: 'bg-red-500/15 text-red-400 border-red-500/30',
    medium: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    low: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
    High: 'bg-red-500/15 text-red-400 border-red-500/30',
    Medium: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    Low: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  };
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${map[level] ?? 'bg-muted text-muted-foreground border-border'}`}>{level}</span>;
}

function GrowthTypeBadge({ type }: { type: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    volume: { label: '📦 Volume-Driven', cls: 'bg-blue-500/15 text-blue-300 border-blue-500/30' },
    price:  { label: '💰 Price-Driven',  cls: 'bg-purple-500/15 text-purple-300 border-purple-500/30' },
    mixed:  { label: '⚖️ Mixed Growth',  cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
  };
  const entry = map[type?.toLowerCase()] ?? { label: type, cls: 'bg-muted text-muted-foreground border-border' };
  return <span className={`text-sm font-bold px-3 py-1 rounded-full border ${entry.cls}`}>{entry.label}</span>;
}

function SectionCard({ icon, title, children, accent = 'border-border' }: {
  icon: React.ReactNode; title: string; children: React.ReactNode; accent?: string;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className={`rounded-xl border ${accent} bg-card/50 backdrop-blur-sm`}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/20 rounded-t-xl transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-primary/80">{icon}</span>
          <h3 className="font-semibold text-sm tracking-wide text-foreground uppercase">{title}</h3>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      {open && <div className="px-5 pb-5 pt-1">{children}</div>}
    </div>
  );
}

// ─── Section Components ───────────────────────────────────────────────────────

function ExecutiveSummary({ text }: { text: string }) {
  const isFallback = text.toLowerCase().includes('llm unavailable') || text.toLowerCase().includes('fallback');
  return (
    <div className={`rounded-xl border p-5 ${isFallback ? 'border-yellow-500/40 bg-yellow-500/5' : 'border-primary/30 bg-gradient-to-br from-primary/5 to-blue-500/5'}`}>
      <div className="flex items-start gap-3">
        {isFallback
          ? <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
          : <BookOpen className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
        }
        <div>
          {isFallback && <p className="text-xs font-bold text-yellow-400 mb-1 uppercase tracking-wider">Deterministic Fallback Mode</p>}
          <p className="text-sm text-foreground/90 leading-relaxed">{text}</p>
        </div>
      </div>
    </div>
  );
}

function KeyInsightsSection({ insights }: { insights: (KeyInsight | string)[] }) {
  return (
    <div className="space-y-3">
      {insights.map((item, i) => {
        if (typeof item === 'string') {
          return (
            <div key={i} className="flex gap-3 p-3 rounded-lg bg-muted/30 border border-border">
              <Lightbulb className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-foreground/80">{item}</p>
            </div>
          );
        }
        return (
          <div key={i} className="p-4 rounded-lg bg-muted/20 border border-border hover:border-primary/30 transition-colors">
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{item.insight}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">📊 {item.impact}</span>
                  {item.cause && (
                    <span className="text-xs px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">🔍 Why: {item.cause}</span>
                  )}
                </div>
                {item.evidence && <p className="mt-1.5 text-xs text-muted-foreground border-l-2 border-muted pl-2">{item.evidence}</p>}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RecommendationsSection({ recs }: { recs: (Recommendation | string)[] }) {
  const timelineColor: Record<string, string> = {
    short:  'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
    medium: 'bg-blue-500/15 text-blue-300 border-blue-500/25',
    long:   'bg-purple-500/15 text-purple-300 border-purple-500/25',
  };
  return (
    <div className="space-y-3">
      {recs.map((item, i) => {
        if (typeof item === 'string') {
          return (
            <div key={i} className="flex gap-3 p-3 rounded-lg bg-muted/30 border border-border">
              <Target className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm">{item}</p>
            </div>
          );
        }
        return (
          <div key={i} className="p-4 rounded-xl border border-border bg-muted/10 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <Crosshair className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-sm font-semibold text-foreground">{item.action}</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {item.timeline && (
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${timelineColor[item.timeline] ?? 'bg-muted text-muted-foreground border-border'}`}>
                    <Clock className="w-3 h-3 inline mr-1" />{item.timeline}
                  </span>
                )}
                <SeverityBadge level={item.risk_level} />
                <ConfidenceBadge score={item.confidence} />
              </div>
            </div>
            {item.justification && <p className="text-xs text-muted-foreground pl-7">{item.justification}</p>}
            <div className="pl-7 flex flex-wrap gap-2">
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">↑ {item.expected_impact}</span>
              {item.segment && item.segment !== 'N/A' && (
                <span className="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">Target: {item.segment}</span>
              )}
              {item.numeric_target && item.numeric_target !== 'N/A' && (
                <span className="text-xs px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">{item.numeric_target}</span>
              )}
              {item.preconditions && item.preconditions !== 'NA' && (
                <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border">Requires: {item.preconditions}</span>
              )}
            </div>
            {item.execution_method && (
              <div className="pl-7 mt-2 text-sm text-foreground bg-muted/20 p-2 rounded border border-border/50">
                <span className="font-semibold text-xs uppercase tracking-wide text-muted-foreground mr-2">Execution:</span>
                {item.execution_method}
              </div>
            )}
            {item.feasibility_constraint && (
              <div className="pl-7 mt-2 text-sm text-amber-200/90 bg-amber-500/5 p-2 rounded border border-amber-500/20 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 mt-0.5 text-amber-400 flex-shrink-0" />
                <span><span className="font-semibold text-xs uppercase tracking-wide mr-1">Constraint:</span>{item.feasibility_constraint}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function DataQualityIssuesSection({ issues }: { issues: (DataQualityIssue | string)[] }) {
  if (!issues.length) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/25">
        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        <span className="text-sm text-emerald-300">No critical data quality issues detected.</span>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {issues.map((item, i) => {
        if (typeof item === 'string') {
          return (
            <div key={i} className="flex gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <XCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-200">{item}</p>
            </div>
          );
        }
        return (
          <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/20 border border-border">
            <AlertTriangle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${item.severity === 'high' ? 'text-red-400' : item.severity === 'medium' ? 'text-yellow-400' : 'text-muted-foreground'}`} />
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-medium text-foreground">{item.issue}</p>
                <SeverityBadge level={item.severity} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">{item.impact}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AdvancedAnalysisSection({ aa }: { aa: AdvancedAnalysis }) {
  const decomp = aa.revenue_decomposition;
  const seg    = aa.segmentation;
  const kpis   = aa.kpis;

  return (
    <div className="space-y-5">

      {/* System Confidence Banner */}
      {aa.system_confidence !== undefined && aa.system_confidence < 0.85 && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/25">
          <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
          <p className="text-xs text-yellow-300">
            <span className="font-bold">System Confidence: {Math.round(aa.system_confidence * 100)}%</span> — Reduced due to data quality issues (leakage, invalid values, or extreme metrics detected).
          </p>
        </div>
      )}

      {/* KPI Strip */}
      {kpis && Object.keys(kpis).length > 0 && (
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-3">
            {kpis.yoy_growth_rate && (
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/25 text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">YoY Growth</p>
                <p className="text-xl font-bold text-primary">{kpis.yoy_growth_rate}</p>
              </div>
            )}
            {kpis.cagr && (
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/25 text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">CAGR</p>
                <p className="text-xl font-bold text-blue-300">{kpis.cagr}</p>
              </div>
            )}
            {kpis.revenue_per_unit_eur && (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Rev / Unit</p>
                <p className="text-xl font-bold text-emerald-300">{kpis.revenue_per_unit_eur}</p>
              </div>
            )}
          </div>
          {/* Metric Contradiction Warning */}
          {kpis.metric_contradiction && (
            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-orange-500/10 border border-orange-500/25">
              <AlertTriangle className="w-3.5 h-3.5 text-orange-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-orange-300">{kpis.metric_contradiction}</p>
            </div>
          )}
        </div>
      )}

      {/* Revenue Decomposition */}
      {decomp && (
        <div className="rounded-lg border border-border bg-muted/10 p-4 space-y-3">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Revenue Decomposition (YoY)</span>
            {decomp.growth_type && <GrowthTypeBadge type={decomp.growth_type} />}
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            <div className={`p-3 rounded-lg border ${(decomp.volume_contribution ?? '').startsWith('+') ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
              <p className="text-xs text-muted-foreground mb-1">📦 Volume</p>
              <p className="text-lg font-bold text-foreground">{decomp.volume_contribution ?? 'N/A'}</p>
              {decomp.volume_effect_eur && <p className="text-xs text-muted-foreground">{decomp.volume_effect_eur} absolute</p>}
            </div>
            <div className={`p-3 rounded-lg border ${(decomp.price_contribution ?? '').startsWith('+') ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
              <p className="text-xs text-muted-foreground mb-1">💰 Price</p>
              <p className="text-lg font-bold text-foreground">{decomp.price_contribution ?? 'N/A'}</p>
              {decomp.price_effect_eur && <p className="text-xs text-muted-foreground">{decomp.price_effect_eur} absolute</p>}
            </div>
            {decomp.interaction_effect && (
              <div className={`p-3 rounded-lg border ${(decomp.interaction_effect ?? '').startsWith('+') ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-yellow-500/5 border-yellow-500/20'}`}>
                <p className="text-xs text-muted-foreground mb-1">🔄 Interaction</p>
                <p className="text-lg font-bold text-foreground">{decomp.interaction_effect}</p>
                {decomp.interaction_effect_eur && <p className="text-xs text-muted-foreground">{decomp.interaction_effect_eur} absolute</p>}
              </div>
            )}
          </div>
          {decomp.total_yoy_delta && (
            <div className="mt-2 text-center">
              <p className="text-sm font-semibold text-foreground">Total YoY Δ: {decomp.total_yoy_delta}</p>
              {decomp.mathematical_consistency && <p className="text-xs text-muted-foreground mt-1">{decomp.mathematical_consistency}</p>}
            </div>
          )}
        </div>
      )}

      {/* Segmentation */}
      {seg && (
        <div className="rounded-lg border border-border bg-muted/10 p-4 space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Segmentation</span>
          </div>
          {seg.top_regions && seg.top_regions !== 'INSUFFICIENT DATA' && (
            <div className="grid grid-cols-[120px_1fr] gap-2 items-center">
              <span className="text-muted-foreground text-xs">Top Regions</span>
              <span className="text-foreground/90 text-sm">{seg.top_regions}</span>
            </div>
          )}
          {seg.top_models && seg.top_models !== 'INSUFFICIENT DATA' && (
            <div className="grid grid-cols-[120px_1fr] gap-2 items-center">
              <span className="text-muted-foreground text-xs">Top Models</span>
              <span className="text-foreground/90 text-sm">{seg.top_models}</span>
            </div>
          )}
          {seg.underperformers && seg.underperformers !== 'INSUFFICIENT DATA' && (
            <div className="grid grid-cols-[120px_1fr] gap-2 items-start mt-2">
              <span className="text-muted-foreground text-xs pt-0.5">Underperformers</span>
              <div>
                <span className="text-red-400 text-sm font-semibold">{seg.underperformers}</span>
                {seg.underperformer_rationale && <p className="text-xs text-muted-foreground mt-1">{seg.underperformer_rationale}</p>}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Concentration Risk */}
      {(aa.concentration_risk || seg?.concentration_risk) && (
        <div className="p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
          <div className="flex items-center gap-2 mb-1">
            <ShieldAlert className="w-4 h-4 text-yellow-400" />
            <span className="text-xs font-semibold text-yellow-400 uppercase tracking-wider">Concentration Risk</span>
          </div>
          <p className="text-sm text-foreground/85">{aa.concentration_risk ?? seg?.concentration_risk}</p>
        </div>
      )}

      {/* Forecast */}
      {aa.forecast && typeof aa.forecast === 'object' && aa.forecast.base !== 'INSUFFICIENT DATA' && (
        <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Short-Term Forecast (Next 2 Years)</span>
            </div>
            <ConfidenceBadge score={aa.forecast.confidence} />
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-muted/20 border border-blue-500/30">
              <p className="text-xs text-blue-300/80 mb-1">Base Case</p>
              <p className="text-sm text-foreground">{aa.forecast.base}</p>
            </div>
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
              <p className="text-xs text-emerald-300/80 mb-1">Best Case</p>
              <p className="text-sm text-foreground">{aa.forecast.best_case}</p>
            </div>
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
              <p className="text-xs text-red-300/80 mb-1">Worst Case</p>
              <p className="text-sm text-foreground">{aa.forecast.worst_case}</p>
            </div>
          </div>
          {aa.forecast.methodology && <p className="text-xs text-muted-foreground italic border-l-2 border-blue-500/30 pl-2">{aa.forecast.methodology}</p>}
        </div>
      )}

      {/* Elasticity Analysis */}
      {aa.elasticity_analysis && aa.elasticity_analysis.scalability_verdict !== 'INSUFFICIENT DATA' && (
        <div className="p-4 rounded-lg bg-purple-500/5 border border-purple-500/20 space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">Elasticity & Scalability</span>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-muted/20 border border-purple-500/30">
              <p className="text-xs text-purple-300/80 mb-1">Price Sensitivity</p>
              <p className="text-sm text-foreground">{aa.elasticity_analysis.price_sensitivity}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/20 border border-blue-500/30">
              <p className="text-xs text-blue-300/80 mb-1">Volume Scalability</p>
              <p className="text-sm text-foreground">{aa.elasticity_analysis.volume_scalability}</p>
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-muted/30 border border-border">
            <p className="text-xs text-muted-foreground mb-0.5">Scalability Verdict</p>
            <p className="text-sm font-semibold">{aa.elasticity_analysis.scalability_verdict}</p>
          </div>
        </div>
      )}

      {/* Legacy flat revenue_drivers */}
      {!decomp && aa.revenue_drivers && (
        <div className="p-4 rounded-lg bg-muted/20 border border-border">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Revenue Drivers</p>
          <p className="text-sm text-foreground/85">{aa.revenue_drivers}</p>
        </div>
      )}
    </div>
  );
}

function TrueDriversSection({ data }: { data: TrueRevenueDrivers }) {
  return (
    <div className="space-y-4">
      {data.confirmed_drivers?.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">✓ Confirmed Drivers</p>
          <div className="space-y-2">
            {data.confirmed_drivers.map((d, i) => (
              <div key={i} className="p-3 rounded-lg bg-muted/20 border border-emerald-500/20">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-sm font-semibold text-foreground">{d.variable}</span>
                  <div className="flex gap-2">
                    {d.classification && <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">{d.classification}</span>}
                    <ConfidenceBadge score={d.confidence} />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{d.mechanism}</p>
                {d.evidence && <p className="text-xs text-muted-foreground/70 mt-1 border-l-2 border-muted pl-2">{d.evidence}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
      {data.spurious_drivers?.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-yellow-400 uppercase tracking-wider mb-2">⚠ Spurious / Time-Driven</p>
          <div className="space-y-2">
            {data.spurious_drivers.map((d, i) => (
              <div key={i} className="p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-sm text-foreground/80">{d.variable}</span>
                  <ConfidenceBadge score={d.confidence} />
                </div>
                <p className="text-xs text-muted-foreground mt-1">{d.why_spurious}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      {data.summary && <p className="text-sm text-muted-foreground leading-relaxed border-l-2 border-primary/30 pl-3">{data.summary}</p>}
      {data.self_critique && <p className="text-xs italic text-muted-foreground/70 leading-relaxed">🔍 Self-critique: {data.self_critique}</p>}
    </div>
  );
}

function SegmentsSection({ segments }: { segments: (SegmentInsight | string)[] }) {
  return (
    <div className="space-y-3">
      {segments.map((item, i) => {
        if (typeof item === 'string') {
          return <div key={i} className="p-3 rounded-lg bg-muted/20 border border-border text-sm text-foreground/80">{item}</div>;
        }
        return (
          <div key={i} className="p-4 rounded-xl border border-border bg-muted/10">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <p className="text-sm font-semibold text-foreground">{item.finding}</p>
              <div className="flex gap-2 flex-shrink-0">
                {item.contribution_pct && item.contribution_pct !== 'INSUFFICIENT DATA' && (
                  <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">{item.contribution_pct}</span>
                )}
                <ConfidenceBadge score={item.confidence} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">{item.business_meaning}</p>
            {item.yoy_trend && item.yoy_trend !== 'INSUFFICIENT DATA' && (
              <p className="text-xs text-blue-300/80 mt-1">Trend: {item.yoy_trend}</p>
            )}
            <div className="flex items-center gap-3 mt-2">
              <span className="text-xs text-red-300/70">Risk: {item.risk}</span>
              <span className={`text-xs ${item.scalable ? 'text-emerald-400' : 'text-red-400'}`}>
                {item.scalable ? '✓ Scalable' : '✗ Not Scalable'}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RiskSection({ risks }: { risks: (RiskItem | string)[] }) {
  return (
    <div className="space-y-2">
      {risks.map((item, i) => {
        if (typeof item === 'string') {
          return <div key={i} className="flex gap-2 p-3 rounded-lg bg-red-500/5 border border-red-500/20 text-sm text-foreground/80">{item}</div>;
        }
        return (
          <div key={i} className="p-3 rounded-lg bg-muted/20 border border-border flex items-start gap-3">
            <ShieldAlert className={`w-4 h-4 mt-0.5 flex-shrink-0 ${item.severity === 'high' ? 'text-red-400' : item.severity === 'medium' ? 'text-yellow-400' : 'text-muted-foreground'}`} />
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium">{item.risk}</span>
                <SeverityBadge level={item.severity} />
                <ConfidenceBadge score={item.confidence} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">{item.evidence}</p>
              {item.mitigation && <p className="text-xs text-emerald-300/70 mt-1">Mitigation: {item.mitigation}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AnomalySection({ items }: { items: (AnomalyDeepDive | string)[] }) {
  return (
    <div className="space-y-2">
      {items.map((item, i) => {
        if (typeof item === 'string') {
          return <div key={i} className="p-3 rounded-lg bg-muted/20 border border-border text-sm">{item}</div>;
        }
        const cls = item.classification?.toUpperCase();
        const clsColor = cls === 'DATA_ERROR' ? 'text-red-400' : cls === 'STRUCTURAL_PERFORMER' ? 'text-emerald-400' : 'text-yellow-400';
        return (
          <div key={i} className="p-3 rounded-lg bg-muted/20 border border-border">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-sm font-semibold text-foreground">{item.column}</span>
              <div className="flex gap-2">
                <span className={`text-xs font-bold ${clsColor}`}>{item.classification}</span>
                <ConfidenceBadge score={item.confidence} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{item.root_cause}</p>
            {item.business_implication && <p className="text-xs text-primary/70 mt-1">→ {item.business_implication}</p>}
          </div>
        );
      })}
    </div>
  );
}

function FeatureImportanceChart({ drivers }: { drivers: Record<string, number> }) {
  const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#84cc16'];
  const data = Object.entries(drivers)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([name, value]) => ({ name, value: parseFloat((value * 100).toFixed(1)) }));

  if (!data.length) return null;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
        <XAxis type="number" tick={{ fill: '#888', fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
        <YAxis dataKey="name" type="category" tick={{ fill: '#aaa', fontSize: 11 }} width={110} />
        <Tooltip
          contentStyle={{ background: '#1a1a2e', border: '1px solid #ffffff18', borderRadius: '8px' }}
          formatter={(v) => [`${Number(v).toFixed(1)}%`, 'Importance']}
        />
        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
          {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props {
  result: AgentResult;
  rawJson?: unknown;
}

export function ResponseViewer({ result, rawJson }: Props) {
  const [showRaw, setShowRaw] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(rawJson ?? result, null, 2));
    toast.success('Copied to clipboard');
  };

  const drivers = result.visualizations?.advanced_analytics?.feature_importance?.top_drivers ?? {};
  const hasChart = Object.keys(drivers).length > 0;

  return (
    <div className="space-y-5">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-sm font-semibold text-foreground">Decision Intelligence Report</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowRaw(s => !s)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-md border border-border hover:border-primary/40 transition-all"
          >
            <FileJson className="w-3.5 h-3.5" />
            {showRaw ? 'Hide' : 'Raw JSON'}
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-md border border-border hover:border-primary/40 transition-all"
          >
            <ClipboardCopy className="w-3.5 h-3.5" />
            Copy
          </button>
        </div>
      </div>

      {/* Error */}
      {result.error && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-red-500/35 bg-red-500/10">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-300">Analysis Error</p>
            <p className="text-xs text-red-300/70 mt-0.5">{result.error}</p>
          </div>
        </div>
      )}

      {/* Executive Summary */}
      {result.executive_summary && (
        <SectionCard icon={<BookOpen className="w-4 h-4" />} title="Executive Summary" accent="border-primary/30">
          <ExecutiveSummary text={result.executive_summary} />
        </SectionCard>
      )}

      {/* Key Insights */}
      {result.key_insights && result.key_insights.length > 0 && (
        <SectionCard icon={<Lightbulb className="w-4 h-4" />} title="Key Business Insights" accent="border-yellow-500/25">
          <KeyInsightsSection insights={result.key_insights as (KeyInsight | string)[]} />
        </SectionCard>
      )}

      {/* Advanced Analysis (KPIs + Decomposition + Segmentation + Forecast) */}
      {result.advanced_analysis && (
        <SectionCard icon={<TrendingUp className="w-4 h-4" />} title="Advanced Analysis" accent="border-blue-500/25">
          <AdvancedAnalysisSection aa={result.advanced_analysis} />
        </SectionCard>
      )}

      {/* Data Quality Issues */}
      {result.data_quality_issues !== undefined && (
        <SectionCard icon={<ShieldAlert className="w-4 h-4" />} title="Data Quality Issues" accent="border-red-500/25">
          <DataQualityIssuesSection issues={(result.data_quality_issues as (DataQualityIssue | string)[]) ?? []} />
        </SectionCard>
      )}

      {/* Recommendations */}
      {result.recommendations && result.recommendations.length > 0 && (
        <SectionCard icon={<Target className="w-4 h-4" />} title="Decision-Grade Recommendations" accent="border-emerald-500/25">
          <RecommendationsSection recs={result.recommendations as (Recommendation | string)[]} />
        </SectionCard>
      )}

      {/* Feature Importance Chart */}
      {hasChart && (
        <SectionCard icon={<BarChart2 className="w-4 h-4" />} title="Feature Importance (ML)" accent="border-purple-500/25">
          <FeatureImportanceChart drivers={drivers} />
        </SectionCard>
      )}

      {/* True Revenue Drivers (Extended) */}
      {result.true_revenue_drivers && (
        <SectionCard icon={<Zap className="w-4 h-4" />} title="True Revenue Drivers" accent="border-emerald-500/25">
          <TrueDriversSection data={result.true_revenue_drivers} />
        </SectionCard>
      )}

      {/* Segment Insights */}
      {result.segment_insights && result.segment_insights.length > 0 && (
        <SectionCard icon={<Layers className="w-4 h-4" />} title="Segment Intelligence" accent="border-cyan-500/25">
          <SegmentsSection segments={result.segment_insights as (SegmentInsight | string)[]} />
        </SectionCard>
      )}

      {/* Risk Analysis */}
      {result.risk_analysis && result.risk_analysis.length > 0 && (
        <SectionCard icon={<AlertTriangle className="w-4 h-4" />} title="Risk Analysis" accent="border-red-500/25">
          <RiskSection risks={result.risk_analysis as (RiskItem | string)[]} />
        </SectionCard>
      )}

      {/* Anomaly Deep Dive */}
      {result.anomaly_deep_dive && result.anomaly_deep_dive.length > 0 && (
        <SectionCard icon={<TrendingDown className="w-4 h-4" />} title="Anomaly Deep Dive" accent="border-yellow-500/25">
          <AnomalySection items={result.anomaly_deep_dive as (AnomalyDeepDive | string)[]} />
        </SectionCard>
      )}

      {/* Final Verdict */}
      {result.final_verdict && (
        <div className={`rounded-xl border p-5 ${result.final_verdict.is_growing ? 'border-emerald-500/35 bg-emerald-500/5' : 'border-red-500/35 bg-red-500/5'}`}>
          <div className="flex items-center gap-3 mb-3">
            {result.final_verdict.is_growing
              ? <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              : <XCircle className="w-5 h-5 text-red-400" />
            }
            <span className="font-semibold text-sm uppercase tracking-wider">Final Verdict</span>
          </div>
          <p className="text-sm text-foreground/90 mb-3">{result.final_verdict.growth_summary}</p>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <p className="text-xs font-semibold text-emerald-400 mb-0.5">Top Opportunity</p>
              <p className="text-xs text-foreground/80">{result.final_verdict.biggest_opportunity}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="text-xs font-semibold text-red-400 mb-0.5">Biggest Risk</p>
              <p className="text-xs text-foreground/80">{result.final_verdict.biggest_risk}</p>
            </div>
          </div>
        </div>
      )}

      {/* Raw JSON Toggle */}
      {showRaw && (
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="px-4 py-2 bg-muted/30 border-b border-border flex items-center gap-2">
            <FileJson className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground font-mono">raw output</span>
          </div>
          <pre className="text-xs p-4 overflow-auto max-h-[500px] font-mono text-foreground/70 leading-relaxed">
            {JSON.stringify(rawJson ?? result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

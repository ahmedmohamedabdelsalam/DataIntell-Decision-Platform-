import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import type { StepExecuted } from '../types/agent';
import { cn } from '../utils/cn';

// Human-readable labels for tool names
const TOOL_LABELS: Record<string, string> = {
  load_data_tool: 'Loading & profiling dataset',
  summary_tool: 'Computing statistical summary',
  correlation_tool: 'Calculating feature correlations',
  anomaly_tool: 'Detecting anomalies (Z-score)',
  advanced_analytics_tool: 'Running ML analysis (Random Forest + Skewness)',
  generate_insights_tool: 'Generating LLM business insights',
  report_tool: 'Compiling final report',
};

export function AgentLogs({ steps, plan }: { steps: StepExecuted[], plan?: string[] }) {
  if (!steps || steps.length === 0) return null;

  const successCount = steps.filter(s => s.status === 'success').length;
  const hasError = steps.some(s => s.status === 'failed');

  return (
    <div className="w-full bg-card border border-border rounded-2xl overflow-hidden shadow-sm mb-5">
      {/* Header */}
      <div className="bg-muted/50 px-5 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Terminal size={15} className="text-muted-foreground" />
          <span className="text-xs font-semibold tracking-widest uppercase text-foreground/70">Execution Log</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className={cn(
            "text-xs font-medium px-2.5 py-0.5 rounded-full border",
            hasError
              ? "bg-red-500/10 text-red-400 border-red-500/25"
              : "bg-emerald-500/10 text-emerald-400 border-emerald-500/25"
          )}>
            {successCount}/{steps.length} steps
          </span>
        </div>
      </div>

      {/* Plan sequence */}
      {plan && plan.length > 0 && (
        <div className="px-5 py-3 bg-background/40 border-b border-border/50 flex flex-wrap gap-1.5 items-center">
          <span className="text-xs text-muted-foreground font-medium mr-1">Plan:</span>
          {plan.map((p, i) => (
            <div key={i} className="flex items-center">
              <span className="bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-md text-xs font-mono">
                {p}
              </span>
              {i < plan.length - 1 && <span className="text-muted-foreground mx-1.5 text-xs">→</span>}
            </div>
          ))}
        </div>
      )}

      {/* Steps */}
      <div className="p-4 space-y-1.5">
        <AnimatePresence>
          {steps.map((step, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08, duration: 0.25 }}
              className={cn(
                "flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm transition-colors",
                step.status === 'success' && "bg-emerald-500/5",
                step.status === 'failed' && "bg-red-500/8",
                step.status === 'pending' && "bg-blue-500/5",
              )}
            >
              {/* Status icon */}
              <div className="shrink-0">
                {step.status === 'success' && <CheckCircle2 size={15} className="text-emerald-500" />}
                {step.status === 'failed' && <XCircle size={15} className="text-red-500" />}
                {step.status === 'pending' && <Loader2 size={15} className="text-blue-400 animate-spin" />}
              </div>

              {/* Label */}
              <div className="flex-1 min-w-0">
                <span className={cn(
                  "font-medium",
                  step.status === 'failed' ? "text-red-400" : "text-foreground/85"
                )}>
                  {TOOL_LABELS[step.action] ?? step.action}
                </span>
                <span className="text-muted-foreground text-xs ml-2 font-mono opacity-50">
                  [{step.action}]
                </span>
                {step.error && (
                  <div className="text-red-400 text-xs mt-1.5 bg-red-950/30 px-2.5 py-2 rounded-lg border border-red-900/40">
                    {step.error}
                  </div>
                )}
              </div>

              {/* Step index */}
              <span className="text-xs text-muted-foreground/40 shrink-0 font-mono">{String(idx + 1).padStart(2, '0')}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

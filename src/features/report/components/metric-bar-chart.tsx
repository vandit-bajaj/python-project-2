'use client';

import type { MetricId } from '@/shared/types';
import type { MetricScoreSummary } from '@/features/analysis/types';

interface MetricBarChartProps {
  metrics: Record<MetricId, MetricScoreSummary>;
  selectedMetric?: MetricId;
  onSelectMetric?: (id: MetricId) => void;
  className?: string;
}

export function MetricBarChart({
  metrics,
  selectedMetric,
  onSelectMetric,
  className = '',
}: MetricBarChartProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Object.values(metrics).map((m) => {
        const isSelected = selectedMetric === m.metricId;

        // Color-blind safe score bar colors
        let barColor = 'bg-teal-600';
        let badgeColor = 'text-teal-700 bg-teal-50 dark:bg-teal-950/50 dark:text-teal-300';
        if (m.score < 65) {
          barColor = 'bg-rose-500';
          badgeColor = 'text-rose-700 bg-rose-50 dark:bg-rose-950/50 dark:text-rose-300';
        } else if (m.score < 80) {
          barColor = 'bg-amber-500';
          badgeColor = 'text-amber-700 bg-amber-50 dark:bg-amber-950/50 dark:text-amber-300';
        }

        return (
          <div
            key={m.metricId}
            onClick={() => onSelectMetric?.(m.metricId)}
            className={`cursor-pointer rounded-xl p-2.5 transition-all ${
              isSelected
                ? 'bg-teal-50/70 ring-1 ring-teal-500/30 dark:bg-teal-950/30'
                : 'hover:bg-[var(--muted)]/50'
            }`}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelectMetric?.(m.metricId);
              }
            }}
          >
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="font-semibold text-[var(--foreground)]">{m.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-[var(--muted-foreground)]">
                  {Math.round(m.confidence * 100)}% conf
                </span>
                <span className={`rounded-md px-1.5 py-0.5 text-xs font-bold ${badgeColor}`}>
                  {m.score}/100
                </span>
              </div>
            </div>

            {/* Accessible Progress Bar */}
            <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--muted)]">
              <div
                className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                style={{ width: `${m.score}%` }}
                role="progressbar"
                aria-valuenow={m.score}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={m.name}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

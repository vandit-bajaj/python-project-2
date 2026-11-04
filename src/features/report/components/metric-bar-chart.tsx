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

        // Themed score bar colors
        let barColor = 'bg-[var(--primary)]';
        let badgeColor = 'text-[var(--primary)] bg-[var(--primary)]/10';
        if (m.score < 65) {
          barColor = 'bg-[var(--danger)]';
          badgeColor = 'text-[var(--danger)] bg-[var(--danger)]/10';
        } else if (m.score < 80) {
          barColor = 'bg-[var(--warning)]';
          badgeColor = 'text-[var(--warning)] bg-[var(--warning)]/10';
        }

        return (
          <div
            key={m.metricId}
            onClick={() => onSelectMetric?.(m.metricId)}
            className={`cursor-pointer rounded-xl p-2.5 transition-all ${
              isSelected
                ? 'bg-[var(--primary)]/10 ring-1 ring-[var(--primary)]/30'
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


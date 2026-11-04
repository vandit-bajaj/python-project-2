'use client';

import { useState, useRef, useEffect } from 'react';
import type { MetricId } from '@/shared/types';
import type { ComprehensiveSkinReport } from '@/features/analysis/types';
import { createHeatmapImageData } from '../lib/heatmap-colorizer';
import { METRICS_METADATA } from '@/features/analysis';

interface HeatmapViewProps {
  report: ComprehensiveSkinReport;
  faceBitmap?: ImageBitmap | null;
  className?: string;
}

export function HeatmapView({ report, faceBitmap, className = '' }: HeatmapViewProps) {
  const [selectedMetric, setSelectedMetric] = useState<MetricId>('redness');
  const [opacity, setOpacity] = useState<number>(0.7);

  const baseCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const heatmapCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const activeMetricData = report.metrics[selectedMetric];

  // Canonical dimensions from report prevent buffer stride mismatch
  const canonicalWidth = report.imageWidth || (faceBitmap && faceBitmap.width > 0 ? faceBitmap.width : 400);
  const canonicalHeight = report.imageHeight || (faceBitmap && faceBitmap.height > 0 ? faceBitmap.height : 500);

  // Draw face photo to base canvas
  useEffect(() => {
    const canvas = baseCanvasRef.current;
    if (!canvas) return;

    canvas.width = canonicalWidth;
    canvas.height = canonicalHeight;

    if (faceBitmap) {
      try {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(faceBitmap, 0, 0, canonicalWidth, canonicalHeight);
        }
      } catch {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(0, 0, canonicalWidth, canonicalHeight);
        }
      }
    } else {
      // If bitmap was detached or released, render placeholder canvas
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, canonicalWidth, canonicalHeight);
      }
    }
  }, [faceBitmap, canonicalWidth, canonicalHeight]);

  // Render heatmap overlay when selected metric changes
  useEffect(() => {
    const canvas = heatmapCanvasRef.current;
    if (!canvas || !activeMetricData) return;

    canvas.width = canonicalWidth;
    canvas.height = canonicalHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canonicalWidth, canonicalHeight);

    if (activeMetricData.heatmap) {
      const imgData = createHeatmapImageData(activeMetricData.heatmap, canonicalWidth, canonicalHeight);
      ctx.putImageData(imgData, 0, 0);
    }
  }, [activeMetricData, canonicalWidth, canonicalHeight]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Horizontal Swipeable Metric Pill Bar (>=44px touch target) */}
      <div className="flex gap-2 overflow-x-auto pb-2 pt-1 scroll-smooth touch-pan-x">
        {(Object.keys(report.metrics) as MetricId[]).map((metricId) => {
          const isSelected = selectedMetric === metricId;
          const meta = METRICS_METADATA[metricId];
          const m = report.metrics[metricId];

          return (
            <button
              key={metricId}
              type="button"
              onClick={() => setSelectedMetric(metricId)}
              className={`shrink-0 flex items-center gap-2 rounded-xl px-4 py-2.5 min-h-[44px] text-xs font-semibold transition-all cursor-pointer ${
                isSelected
                  ? 'bg-teal-700 dark:bg-teal-600 text-white shadow-xs'
                  : 'bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]/80 hover:text-[var(--foreground)]'
              }`}
            >
              <span>{meta?.name ?? metricId}</span>
              <span
                className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                  isSelected ? 'bg-black/25 text-white' : 'bg-black/5 dark:bg-white/10'
                }`}
              >
                {m?.score}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Canvas Container */}
      <div className="relative aspect-3/4 w-full overflow-hidden rounded-2xl bg-black/95 shadow-inner">
        {/* Base Photo Canvas */}
        <canvas ref={baseCanvasRef} className="h-full w-full object-contain" />

        {/* Heatmap Layer Canvas */}
        <canvas
          ref={heatmapCanvasRef}
          style={{ opacity }}
          className="pointer-events-none absolute inset-0 h-full w-full object-contain mix-blend-screen transition-opacity duration-150"
        />

        {/* Heatmap Legend */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between rounded-xl bg-black/75 px-3 py-2 text-xs text-white backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-white/70">Low / Calm</span>
            <div className="h-2.5 w-24 rounded-full bg-gradient-to-r from-cyan-500 via-amber-400 to-rose-600 shadow-sm" />
            <span className="text-[10px] text-white/70">High Concern</span>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="heatmap-opacity" className="text-[10px] text-white/70">
              Opacity:
            </label>
            <input
              id="heatmap-opacity"
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={opacity}
              onChange={(e) => setOpacity(parseFloat(e.target.value))}
              className="h-1.5 w-16 cursor-pointer accent-teal-400"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

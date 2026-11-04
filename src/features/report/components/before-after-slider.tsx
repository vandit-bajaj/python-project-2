'use client';

import { useState, useRef, useEffect } from 'react';
import type { ComprehensiveSkinReport } from '@/features/analysis/types';
import { createHeatmapImageData } from '../lib/heatmap-colorizer';

interface BeforeAfterSliderProps {
  report: ComprehensiveSkinReport;
  faceBitmap?: ImageBitmap | null;
  className?: string;
}

export function BeforeAfterSlider({
  report,
  faceBitmap,
  className = '',
}: BeforeAfterSliderProps) {
  const [sliderPos, setSliderPos] = useState<number>(50); // percentage 0-100
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rawCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const heatmapCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const rawCanvas = rawCanvasRef.current;
    const hmCanvas = heatmapCanvasRef.current;
    if (!rawCanvas || !hmCanvas) return;

    const width = faceBitmap?.width ?? 400;
    const height = faceBitmap?.height ?? 500;

    rawCanvas.width = width;
    rawCanvas.height = height;
    hmCanvas.width = width;
    hmCanvas.height = height;

    const rawCtx = rawCanvas.getContext('2d');
    const hmCtx = hmCanvas.getContext('2d');
    if (!rawCtx || !hmCtx) return;

    if (faceBitmap) {
      try {
        rawCtx.drawImage(faceBitmap, 0, 0);
        hmCtx.drawImage(faceBitmap, 0, 0);
      } catch {
        rawCtx.fillStyle = '#1e293b';
        rawCtx.fillRect(0, 0, width, height);
        hmCtx.fillStyle = '#1e293b';
        hmCtx.fillRect(0, 0, width, height);
      }
    } else {
      rawCtx.fillStyle = '#1e293b';
      rawCtx.fillRect(0, 0, width, height);
      hmCtx.fillStyle = '#1e293b';
      hmCtx.fillRect(0, 0, width, height);
    }

    // Blend primary metric heatmap on right side
    const primaryMetric = report.metrics.redness;
    if (primaryMetric?.heatmap) {
      const hmImg = createHeatmapImageData(primaryMetric.heatmap, width, height);
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = width;
      tempCanvas.height = height;
      tempCanvas.getContext('2d')?.putImageData(hmImg, 0, 0);

      hmCtx.globalAlpha = 0.75;
      hmCtx.drawImage(tempCanvas, 0, 0);
    }
  }, [faceBitmap, report]);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    setSliderPos((x / rect.width) * 100);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div
        ref={containerRef}
        onPointerMove={(e) => {
          if (e.buttons === 1) handlePointerMove(e);
        }}
        onClick={handlePointerMove}
        className="relative aspect-3/4 w-full cursor-ew-resize select-none overflow-hidden rounded-2xl bg-black shadow-lg"
      >
        {/* Heatmap Layer (Full Width background) */}
        <canvas ref={heatmapCanvasRef} className="h-full w-full object-contain" />

        {/* Raw Photo Layer (Clipped to slider position via modern CSS clip-path) */}
        <canvas
          ref={rawCanvasRef}
          style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
          className="absolute inset-0 h-full w-full object-contain"
        />

        {/* Split Divider Line */}
        <div
          className="pointer-events-none absolute bottom-0 top-0 w-0.5 bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)]"
          style={{ left: `${sliderPos}%` }}
        >
          <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/60 bg-black/80 px-2 py-1 text-[10px] font-bold text-white shadow-md backdrop-blur-sm">
            &larr; &rarr;
          </div>
        </div>

        {/* Labels */}
        <div className="pointer-events-none absolute bottom-3 left-3 rounded-lg bg-black/60 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur-md">
          Raw Photo
        </div>
        <div className="pointer-events-none absolute bottom-3 right-3 rounded-lg bg-black/60 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur-md">
          Erythema & Texture
        </div>
      </div>
      <p className="text-center text-[11px] text-[var(--muted-foreground)]">
        Drag slider horizontally to compare raw capture vs. reactive skin heatmaps.
      </p>
    </div>
  );
}

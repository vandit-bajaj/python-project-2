'use client';

import { useEffect, useRef } from 'react';
import { Button } from '@/shared/ui/button';
import { QualityGuidance } from './quality-guidance';
import { RefreshCcw, Check, ShieldCheck, Sun, Eye } from 'lucide-react';
import type { ProcessedCapture } from '../types';

export interface ImagePreviewProps {
  capture: ProcessedCapture;
  onRetake: () => void;
  onConfirm: (capture: ProcessedCapture) => void;
  className?: string;
}

export function ImagePreview({ capture, onRetake, onConfirm, className }: ImagePreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !capture.bitmap) return;

    canvas.width = capture.bitmap.width;
    canvas.height = capture.bitmap.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(capture.bitmap, 0, 0);
  }, [capture]);

  const { quality } = capture;

  return (
    <div className={className}>
      <div className="relative mx-auto flex aspect-[3/4] w-full max-w-sm flex-col items-center justify-center overflow-hidden rounded-3xl bg-slate-950 shadow-2xl">
        <canvas
          ref={canvasRef}
          className="h-full w-full object-cover"
          aria-label="Captured face preview"
        />

        {/* Top Quality Guidance Pill */}
        <div className="absolute top-4 right-0 left-0 z-10 flex justify-center px-4">
          <QualityGuidance quality={quality} />
        </div>

        {/* Transient Memory indicator */}
        <div className="absolute bottom-4 left-4 z-10 flex items-center gap-1.5 rounded-full bg-slate-900/80 px-2.5 py-1 text-[11px] font-medium text-teal-300 backdrop-blur-md">
          <ShieldCheck className="h-3 w-3" />
          <span>In-Memory Bitmap</span>
        </div>
      </div>

      {/* Quality Breakdown Card */}
      <div className="mx-auto mt-6 max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 text-xs">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
          <span className="text-sm font-semibold">Quality Assessment</span>
          <span className="font-bold text-teal-600 dark:text-teal-400">{quality.score} / 100</span>
        </div>

        <div className="mt-3 space-y-2 text-[var(--muted-foreground)]">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Sun className="h-3.5 w-3.5 text-amber-500" />
              Lighting
            </span>
            <span className="font-medium text-[var(--foreground)]">{quality.lighting.message}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5 text-blue-500" />
              Focus & Sharpness
            </span>
            <span className="font-medium text-[var(--foreground)]">
              {quality.sharpness.message}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex items-center gap-3">
          <Button type="button" variant="outline" className="flex-1 gap-1.5" onClick={onRetake}>
            <RefreshCcw className="h-4 w-4" />
            Retake
          </Button>

          <Button type="button" className="flex-1 gap-1.5" onClick={() => onConfirm(capture)}>
            <Check className="h-4 w-4" />
            Analyze
          </Button>
        </div>
      </div>
    </div>
  );
}

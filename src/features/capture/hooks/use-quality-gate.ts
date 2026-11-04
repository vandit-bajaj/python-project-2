'use client';

import { useState, useEffect, useRef } from 'react';
import type { QualityAssessment } from '../types';
import { assessQuality } from '../lib/quality-analyzer';

export interface UseQualityGateOptions {
  enabled?: boolean;
  intervalMs?: number;
}

export function useQualityGate(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  options: UseQualityGateOptions = {},
): {
  quality: QualityAssessment | null;
  isAssessing: boolean;
} {
  const { enabled = true, intervalMs = 250 } = options;
  const [quality, setQuality] = useState<QualityAssessment | null>(null);
  const [isAssessing, setIsAssessing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
      canvasRef.current.width = 160;
      canvasRef.current.height = 120;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    let timerId: NodeJS.Timeout;

    const runAssessment = () => {
      const video = videoRef.current;
      if (!video || video.readyState < 2 || video.paused || video.ended || video.videoWidth === 0) {
        return;
      }

      setIsAssessing(true);
      try {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const assessment = assessQuality(imageData);
        setQuality(assessment);
      } catch {
        // Frame capture failed (e.g. video context invalidated)
      } finally {
        setIsAssessing(false);
      }
    };

    timerId = setInterval(runAssessment, intervalMs);

    return () => {
      clearInterval(timerId);
    };
  }, [enabled, intervalMs, videoRef]);

  return { quality: enabled ? quality : null, isAssessing: enabled ? isAssessing : false };
}

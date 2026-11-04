'use client';

import { useState } from 'react';
import { CaptureContainer } from '@/features/capture';
import type { ProcessedCapture } from '@/features/capture';
import {
  runFaceUnderstanding,
  FaceUnderstandingView,
} from '@/features/analysis';
import type { FaceUnderstandingResult } from '@/features/analysis';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function ScanPage() {
  const [confirmedCapture, setConfirmedCapture] = useState<ProcessedCapture | null>(null);
  const [understandingResult, setUnderstandingResult] = useState<FaceUnderstandingResult | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const handleCaptureComplete = async (capture: ProcessedCapture) => {
    setConfirmedCapture(capture);
    setIsProcessing(true);
    try {
      const result = await runFaceUnderstanding(capture.bitmap);
      setUnderstandingResult(result);
    } catch {
      // If error occurs, reset
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetake = () => {
    if (confirmedCapture) {
      confirmedCapture.bitmap.close();
    }
    setConfirmedCapture(null);
    setUnderstandingResult(null);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--muted-foreground)] transition-colors hover:text-teal-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
      </div>

      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Facial Wellness Scan</h1>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          Follow the oval guide. Image quality is evaluated dynamically in real time.
        </p>
      </div>

      {isProcessing && (
        <div className="mx-auto flex max-w-md flex-col items-center justify-center rounded-3xl border border-[var(--border)] bg-[var(--card)] p-12 text-center shadow-lg">
          <Loader2 className="h-10 w-10 animate-spin text-teal-600" />
          <h2 className="mt-4 text-lg font-bold">Understanding Facial Geometry</h2>
          <p className="mt-2 text-xs text-[var(--muted-foreground)]">
            Locating 478 landmarks, segmenting facial zones, and calibrating skin-tone baseline...
          </p>
        </div>
      )}

      {!isProcessing && confirmedCapture && understandingResult && (
        <FaceUnderstandingView
          bitmap={confirmedCapture.bitmap}
          result={understandingResult}
          onRetake={handleRetake}
          onProceed={() => {
            // Ready for Phase 3 analyzers
          }}
        />
      )}

      {!isProcessing && !confirmedCapture && (
        <CaptureContainer onCaptureComplete={handleCaptureComplete} />
      )}
    </div>
  );
}

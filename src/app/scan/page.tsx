'use client';

import { useState } from 'react';
import { CaptureContainer } from '@/features/capture';
import type { ProcessedCapture } from '@/features/capture';
import { Button } from '@/shared/ui/button';
import Link from 'next/link';
import { ArrowLeft, Sparkles } from 'lucide-react';

export default function ScanPage() {
  const [confirmedCapture, setConfirmedCapture] = useState<ProcessedCapture | null>(null);

  const handleCaptureComplete = (capture: ProcessedCapture) => {
    setConfirmedCapture(capture);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
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

      {confirmedCapture ? (
        <div className="mx-auto max-w-md rounded-3xl border border-[var(--border)] bg-[var(--card)] p-8 text-center shadow-lg">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-600/10 text-teal-600">
            <Sparkles className="h-7 w-7" />
          </div>

          <h2 className="text-xl font-bold">Image Acquired</h2>
          <p className="mt-2 text-xs text-[var(--muted-foreground)]">
            Resolution: {confirmedCapture.width} &times; {confirmedCapture.height}px &bull; Quality
            Score: {confirmedCapture.quality.score}/100
          </p>

          <div className="mt-4 rounded-xl bg-teal-500/10 p-3 text-xs text-teal-800 dark:text-teal-200">
            Image held in transient device memory (`ImageBitmap`). Ready for Face Landmarking in
            Phase 2.
          </div>

          <div className="mt-6 flex flex-col gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                confirmedCapture.bitmap.close();
                setConfirmedCapture(null);
              }}
            >
              Scan Another Photo
            </Button>
          </div>
        </div>
      ) : (
        <CaptureContainer onCaptureComplete={handleCaptureComplete} />
      )}
    </div>
  );
}

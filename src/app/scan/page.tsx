'use client';

import { useState } from 'react';
import { CaptureContainer } from '@/features/capture';
import type { ProcessedCapture } from '@/features/capture';
import {
  runFaceUnderstanding,
  FaceUnderstandingView,
  runComprehensiveSkinAnalysis,
} from '@/features/analysis';
import type {
  FaceUnderstandingResult,
  ComprehensiveSkinReport,
} from '@/features/analysis';
import { ReportDashboard, saveReportLocally } from '@/features/report';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function ScanPage() {
  const [confirmedCapture, setConfirmedCapture] = useState<ProcessedCapture | null>(null);
  const [understandingResult, setUnderstandingResult] = useState<FaceUnderstandingResult | null>(null);
  const [report, setReport] = useState<ComprehensiveSkinReport | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');

  const handleCaptureComplete = async (capture: ProcessedCapture) => {
    setConfirmedCapture(capture);
    setIsProcessing(true);
    setProcessingStatus('Locating 478 landmarks and segmenting zones...');
    try {
      const result = await runFaceUnderstanding(capture.bitmap);
      setUnderstandingResult(result);
    } catch {
      // Graceful fallback
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProceedToAnalysis = async () => {
    if (!understandingResult || !confirmedCapture) return;

    setIsProcessing(true);
    setProcessingStatus('Running 8 skin-wellness computer vision analyzers...');
    try {
      const skinReport = runComprehensiveSkinAnalysis(understandingResult);
      await saveReportLocally(skinReport);
      setReport(skinReport);
    } catch {
      // Error handling
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
    setReport(null);
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

      {isProcessing && (
        <div className="mx-auto flex max-w-md flex-col items-center justify-center rounded-3xl border border-[var(--border)] bg-[var(--card)] p-12 text-center shadow-lg">
          <Loader2 className="h-10 w-10 animate-spin text-teal-600" />
          <h2 className="mt-4 text-lg font-bold">Analyzing Skin Attributes</h2>
          <p className="mt-2 text-xs text-[var(--muted-foreground)]">{processingStatus}</p>
        </div>
      )}

      {/* 1. Report View */}
      {!isProcessing && report && confirmedCapture && understandingResult && (
        <ReportDashboard
          report={report}
          landmarks={understandingResult.landmarks}
          faceBitmap={confirmedCapture.bitmap}
          onNewScan={handleRetake}
        />
      )}

      {/* 2. Face Understanding & Zone Inspection View */}
      {!isProcessing && !report && confirmedCapture && understandingResult && (
        <div>
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Facial Geometry & Calibration</h1>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              Verify detected facial boundaries and skin-tone baseline before running skin analyzers.
            </p>
          </div>

          <FaceUnderstandingView
            bitmap={confirmedCapture.bitmap}
            result={understandingResult}
            onRetake={handleRetake}
            onProceed={handleProceedToAnalysis}
          />
        </div>
      )}

      {/* 3. Camera / Upload Capture View */}
      {!isProcessing && !confirmedCapture && (
        <div>
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Facial Wellness Scan</h1>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              Follow the oval guide. Image quality is evaluated dynamically in real time.
            </p>
          </div>

          <CaptureContainer onCaptureComplete={handleCaptureComplete} />
        </div>
      )}
    </div>
  );
}

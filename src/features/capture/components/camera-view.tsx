'use client';

import { useEffect } from 'react';
import { useCamera } from '../hooks/use-camera';
import { useQualityGate } from '../hooks/use-quality-gate';
import { FaceGuideOverlay } from './face-guide-overlay';
import { QualityGuidance } from './quality-guidance';
import { Button } from '@/shared/ui/button';
import { RefreshCw, AlertTriangle, Play, ShieldAlert } from 'lucide-react';
import type { ProcessedCapture } from '../types';
import { extractImageDataFromBitmap } from '../lib/image-processor';
import { assessQuality } from '../lib/quality-analyzer';

export interface CameraViewProps {
  onCapture: (processed: ProcessedCapture) => void;
  className?: string;
}

export function CameraView({ onCapture, className }: CameraViewProps) {
  const {
    videoRef,
    isStreaming,
    isLoading,
    facingMode,
    hasMultipleCameras,
    error,
    startCamera,
    stopCamera,
    toggleFacingMode,
    captureFrame,
  } = useCamera('user');

  const { quality } = useQualityGate(videoRef, { enabled: isStreaming });

  // Auto-start camera when view mounts
  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  const handleTakeSnapshot = async () => {
    const bitmap = await captureFrame();
    if (!bitmap) return;

    try {
      const imageData = extractImageDataFromBitmap(bitmap);
      const finalQuality = assessQuality(imageData);

      onCapture({
        bitmap,
        width: bitmap.width,
        height: bitmap.height,
        quality: finalQuality,
        timestamp: Date.now(),
      });
    } catch {
      // In case of extraction issue, still pass bitmap with existing quality assessment
      if (quality) {
        onCapture({
          bitmap,
          width: bitmap.width,
          height: bitmap.height,
          quality,
          timestamp: Date.now(),
        });
      }
    }
  };

  return (
    <div className={className}>
      <div className="relative mx-auto flex aspect-[3/4] w-full max-w-sm flex-col items-center justify-center overflow-hidden rounded-3xl bg-slate-950 shadow-2xl">
        {/* Live Video Feed */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`h-full w-full object-cover transition-opacity duration-300 ${
            isStreaming ? 'opacity-100' : 'opacity-0'
          } ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
        />

        {/* Face Guide Overlay */}
        {isStreaming && <FaceGuideOverlay quality={quality} />}

        {/* Top Quality Guidance Pill */}
        {isStreaming && (
          <div className="absolute top-4 right-0 left-0 z-10 flex justify-center px-4">
            <QualityGuidance quality={quality} />
          </div>
        )}

        {/* Loading Spinner */}
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950/80 text-white">
            <RefreshCw className="h-8 w-8 animate-spin text-teal-400" />
            <p className="text-sm font-medium">Initializing camera...</p>
          </div>
        )}

        {/* Error Fallback State */}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 p-6 text-center text-white">
            {error.code === 'PERMISSION_DENIED' ? (
              <ShieldAlert className="mb-3 h-12 w-12 text-amber-500" />
            ) : (
              <AlertTriangle className="mb-3 h-12 w-12 text-rose-500" />
            )}
            <h3 className="text-base font-semibold">Camera Access Required</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-300">{error.message}</p>
            <div className="mt-6 flex w-full max-w-xs flex-col gap-2">
              <Button variant="secondary" size="sm" onClick={() => startCamera()} className="gap-2">
                <Play className="h-4 w-4" />
                Retry Camera
              </Button>
            </div>
          </div>
        )}

        {/* Bottom Floating Controls */}
        {isStreaming && (
          <div className="absolute right-0 bottom-5 left-0 z-10 flex items-center justify-around px-8">
            {/* Camera flip toggle */}
            {hasMultipleCameras ? (
              <button
                type="button"
                onClick={toggleFacingMode}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-900/70 text-white shadow-lg backdrop-blur-md transition-all hover:bg-slate-900"
                aria-label="Switch camera"
              >
                <RefreshCw className="h-5 w-5" />
              </button>
            ) : (
              <div className="h-11 w-11" />
            )}

            {/* Shutter Button */}
            <button
              type="button"
              onClick={handleTakeSnapshot}
              className="group flex h-18 w-18 items-center justify-center rounded-full border-4 border-white/90 bg-teal-600 shadow-xl transition-all hover:scale-105 active:scale-95"
              aria-label="Take face photo"
            >
              <div className="h-12 w-12 rounded-full bg-white transition-all group-hover:scale-90" />
            </button>

            <div className="h-11 w-11" />
          </div>
        )}
      </div>

      {/* Helper caption */}
      <p className="mt-4 text-center text-xs text-[var(--muted-foreground)]">
        Position your face in the oval. Ensure even lighting and steady focus.
      </p>
    </div>
  );
}

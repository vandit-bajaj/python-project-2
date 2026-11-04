'use client';

import { useState, useEffect, useCallback, useSyncExternalStore } from 'react';
import { CameraView } from './camera-view';
import { UploadView } from './upload-view';
import { ImagePreview } from './image-preview';
import { PrivacyBadge } from './privacy-badge';
import { Camera, Upload } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import type { ProcessedCapture } from '../types';
import { releaseBitmap } from '../lib/image-processor';

export type CaptureMode = 'camera' | 'upload';

export interface CaptureContainerProps {
  onCaptureComplete?: (capture: ProcessedCapture) => void;
  className?: string;
}

const emptySubscribe = () => () => {};

export function CaptureContainer({ onCaptureComplete, className }: CaptureContainerProps) {
  const isHydrated = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
  const [mode, setMode] = useState<CaptureMode>('camera');
  const [activeCapture, setActiveCapture] = useState<ProcessedCapture | null>(null);

  const handleCapture = useCallback((capture: ProcessedCapture) => {
    setActiveCapture((prev) => {
      if (prev?.bitmap && prev.bitmap !== capture.bitmap) {
        releaseBitmap(prev.bitmap);
      }
      return capture;
    });
  }, []);

  const handleRetake = useCallback(() => {
    if (activeCapture?.bitmap) {
      releaseBitmap(activeCapture.bitmap);
    }
    setActiveCapture(null);
  }, [activeCapture]);

  const handleConfirm = useCallback(
    (capture: ProcessedCapture) => {
      // Clear internal reference to transfer ownership of ImageBitmap to parent caller
      setActiveCapture(null);
      if (onCaptureComplete) {
        onCaptureComplete(capture);
      }
    },
    [onCaptureComplete],
  );

  // Clean up any held in-memory ImageBitmap on component unmount
  useEffect(() => {
    return () => {
      if (activeCapture?.bitmap) {
        releaseBitmap(activeCapture.bitmap);
      }
    };
  }, [activeCapture]);

  return (
    <div
      data-testid="capture-container"
      data-hydrated={isHydrated ? 'true' : 'false'}
      className={cn('mx-auto flex w-full max-w-lg flex-col items-center', className)}
    >
      {/* Top Privacy Badge */}
      <PrivacyBadge className="mb-6" />

      {activeCapture ? (
        <ImagePreview
          capture={activeCapture}
          onRetake={handleRetake}
          onConfirm={handleConfirm}
          className="w-full"
        />
      ) : (
        <div className="w-full">
          {/* Mode Switcher Tabs */}
          <div className="mx-auto mb-6 flex w-full max-w-xs rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => setMode('camera')}
              className={cn(
                'flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition-all',
                mode === 'camera'
                  ? 'bg-white text-slate-900 shadow dark:bg-slate-900 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white',
              )}
            >
              <Camera className="h-4 w-4" />
              Camera
            </button>

            <button
              type="button"
              onClick={() => setMode('upload')}
              className={cn(
                'flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition-all',
                mode === 'upload'
                  ? 'bg-white text-slate-900 shadow dark:bg-slate-900 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white',
              )}
            >
              <Upload className="h-4 w-4" />
              Upload
            </button>
          </div>

          {/* Active Mode View */}
          {mode === 'camera' ? (
            <CameraView onCapture={handleCapture} />
          ) : (
            <UploadView onUpload={handleCapture} />
          )}
        </div>
      )}
    </div>
  );
}

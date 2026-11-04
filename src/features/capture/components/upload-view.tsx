'use client';

import React, { useState, useRef, useCallback } from 'react';
import { UploadCloud, Image as ImageIcon, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { cn } from '@/shared/lib/utils';
import type { ProcessedCapture } from '../types';
import { processFileToBitmap, extractImageDataFromBitmap } from '../lib/image-processor';
import { assessQuality } from '../lib/quality-analyzer';

export interface UploadViewProps {
  onUpload: (processed: ProcessedCapture) => void;
  className?: string;
}

export function UploadView({ onUpload, className }: UploadViewProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const processFile = useCallback(
    async (file: File) => {
      setErrorMessage(null);

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrorMessage('Please upload a valid image file (JPEG, PNG, or WebP).');
        return;
      }

      // Check max size (e.g. 25MB)
      if (file.size > 25 * 1024 * 1024) {
        setErrorMessage('File size exceeds 25MB limit.');
        return;
      }

      setIsProcessing(true);
      try {
        // Strip EXIF, normalize orientation, downscale if needed
        const bitmap = await processFileToBitmap(file);
        const imageData = extractImageDataFromBitmap(bitmap);
        const quality = assessQuality(imageData);

        onUpload({
          bitmap,
          width: bitmap.width,
          height: bitmap.height,
          quality,
          timestamp: Date.now(),
        });
      } catch {
        setErrorMessage('Failed to decode image. Please try a different photo.');
      } finally {
        setIsProcessing(false);
      }
    },
    [onUpload],
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0]) {
      await processFile(files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0 && files[0]) {
      await processFile(files[0]);
    }
  };

  return (
    <div className={className}>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'relative mx-auto flex aspect-[3/4] w-full max-w-sm flex-col items-center justify-center rounded-3xl border-2 border-dashed p-8 text-center transition-all duration-200',
          isDragging
            ? 'scale-[1.01] border-teal-500 bg-teal-500/10'
            : 'border-[var(--border)] bg-[var(--card)] hover:border-teal-500/40',
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />

        {isProcessing ? (
          <div className="flex flex-col items-center gap-3">
            <RefreshCw className="h-10 w-10 animate-spin text-teal-600" />
            <p className="text-sm font-medium">Stripping metadata and normalizing...</p>
          </div>
        ) : (
          <>
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-600/10 text-teal-600">
              <UploadCloud className="h-8 w-8" />
            </div>

            <h3 className="text-base font-semibold">Drag and drop your photo</h3>
            <p className="mt-2 text-xs text-[var(--muted-foreground)]">
              Supports JPEG, PNG, or WebP. EXIF metadata is stripped automatically on-device.
            </p>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="mt-6 gap-2"
            >
              <ImageIcon className="h-4 w-4" />
              Select File
            </Button>
          </>
        )}

        {errorMessage && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-rose-500/10 p-3 text-xs text-rose-700 dark:text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      <p className="mt-4 text-center text-xs text-[var(--muted-foreground)]">
        For best results, use a well-lit, direct selfie with a neutral expression.
      </p>
    </div>
  );
}

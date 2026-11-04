import * as Comlink from 'comlink';
import type { NormalizedLandmark } from '@/shared/types';
import type { FaceMeshResult, FaceUnderstandingResult } from '../types';
import { segmentZones } from '../lib/zone-segmenter';
import { buildSkinRoiMasks } from '../lib/skin-mask-builder';
import { normalizeLightingAndBaseline } from '../lib/lighting-normalizer';
import { extractImageDataFromBitmap } from '@/features/capture/lib/image-processor';

import canonicalLandmarksRaw from '../lib/fixtures/canonical-landmarks.json';

interface FaceMeshWorkerInterface {
  init(): Promise<boolean>;
  detect(bitmap: ImageBitmap): Promise<FaceMeshResult | null>;
}

let workerInstance: Worker | null = null;
let remoteService: Comlink.Remote<FaceMeshWorkerInterface> | null = null;

function getFaceMeshWorker(): Comlink.Remote<FaceMeshWorkerInterface> | null {
  if (typeof window === 'undefined' || typeof Worker === 'undefined') {
    return null;
  }

  if (!remoteService) {
    try {
      workerInstance = new Worker(
        new URL('../workers/face-mesh.worker.ts', import.meta.url),
        { type: 'module' },
      );
      remoteService = Comlink.wrap<FaceMeshWorkerInterface>(workerInstance);
    } catch {
      return null;
    }
  }

  return remoteService;
}

export class FaceDetectionError extends Error {
  constructor(
    public readonly code: 'NO_FACE_DETECTED' | 'WORKER_UNAVAILABLE',
    message: string,
  ) {
    super(message);
    this.name = 'FaceDetectionError';
  }
}

export interface FaceUnderstandingOptions {
  /** Optional mock landmarks for offline unit testing */
  mockLandmarks?: NormalizedLandmark[];
}

/**
 * Returns canonical anatomical face landmarks (478 points) for testing fixtures.
 */
export function generateSyntheticLandmarks(): NormalizedLandmark[] {
  return (canonicalLandmarksRaw as NormalizedLandmark[]).map((lm) => ({ ...lm }));
}

/**
 * Orchestrates Phase 2 Face Understanding:
 * Landmarks detection -> Zone segmentation -> Skin ROI extraction -> Lighting normalization.
 * Throws FaceDetectionError if no valid human face is detected.
 */
export async function runFaceUnderstanding(
  bitmap: ImageBitmap,
  options?: FaceUnderstandingOptions,
): Promise<FaceUnderstandingResult> {
  const width = bitmap.width;
  const height = bitmap.height;

  if (width <= 0 || height <= 0) {
    throw new FaceDetectionError(
      'WORKER_UNAVAILABLE',
      'The provided image buffer has invalid dimensions.',
    );
  }

  // 1. Extract ImageData from ImageBitmap first while bitmap is in-memory and valid
  let rawImageData: ImageData;
  try {
    rawImageData = extractImageDataFromBitmap(bitmap);
  } catch {
    throw new FaceDetectionError(
      'WORKER_UNAVAILABLE',
      'Failed to read pixel data from image buffer.',
    );
  }

  // 2. Run MediaPipe Face Landmarker in Web Worker (or use mock if explicitly provided)
  let landmarks: NormalizedLandmark[] | null = options?.mockLandmarks ?? null;
  let confidence = options?.mockLandmarks ? 0.95 : 0.0;

  if (!landmarks) {
    const worker = getFaceMeshWorker();
    if (worker) {
      try {
        // Create an independent ImageBitmap copy for the worker so Comlink structured
        // cloning never detaches or invalidates the caller's ImageBitmap on the main thread
        let workerBitmap: ImageBitmap | null = null;
        if (typeof createImageBitmap !== 'undefined') {
          try {
            workerBitmap = await createImageBitmap(bitmap);
          } catch {
            // Fallback to canvas clone
          }
        }

        if (!workerBitmap && typeof document !== 'undefined') {
          try {
            const offscreen = document.createElement('canvas');
            offscreen.width = width;
            offscreen.height = height;
            const ctx = offscreen.getContext('2d');
            if (ctx) {
              ctx.drawImage(bitmap, 0, 0);
              workerBitmap = await createImageBitmap(offscreen);
            }
          } catch {
            // Canvas clone failed
          }
        }

        if (workerBitmap) {
          const detectResult = await worker.detect(workerBitmap);
          if (detectResult) {
            landmarks = detectResult.landmarks;
            confidence = detectResult.confidence;
          }

          try {
            workerBitmap.close();
          } catch {
            // Handled
          }
        }
      } catch {
        // Worker execution error handled below
      }
    }
  }

  // Enforce face detection gate: Never fake landmarks on invalid or non-face images
  if (!landmarks || landmarks.length < 468) {
    throw new FaceDetectionError(
      'NO_FACE_DETECTED',
      'No clear human face was detected in the photo. Please ensure your face is well-lit, centered in the frame, and unobstructed.',
    );
  }

  // 3. Segment zones into binary masks
  const zoneMasks = segmentZones(landmarks, width, height);

  // 4. Build skin ROI masks excluding eyes, lips, and brows
  const skinRoi = buildSkinRoiMasks(landmarks, width, height);

  // 5. White-balance normalization and baseline calibration using central facial zones
  const { normalizedImageData, baseline } = normalizeLightingAndBaseline(
    rawImageData,
    skinRoi,
    zoneMasks,
  );

  return {
    landmarks,
    zoneMasks,
    skinRoi,
    normalizedImageData,
    baseline,
    confidence,
  };
}

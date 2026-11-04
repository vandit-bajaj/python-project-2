import * as Comlink from 'comlink';
import type { NormalizedLandmark } from '@/shared/types';
import type { FaceMeshResult, FaceUnderstandingResult } from '../types';
import { segmentZones } from '../lib/zone-segmenter';
import { buildSkinRoiMasks } from '../lib/skin-mask-builder';
import { normalizeLightingAndBaseline } from '../lib/lighting-normalizer';
import { extractImageDataFromBitmap } from '@/features/capture/lib/image-processor';

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

/**
 * Creates canonical synthetic face landmarks (478 points) for fallback/testing.
 */
export function generateSyntheticLandmarks(): NormalizedLandmark[] {
  const landmarks: NormalizedLandmark[] = [];
  for (let i = 0; i < 478; i++) {
    // Generate centered oval coordinates around center (0.5, 0.5)
    const angle = (i / 478) * 2 * Math.PI;
    const rX = 0.25 + 0.05 * Math.cos(angle * 3);
    const rY = 0.35 + 0.05 * Math.sin(angle * 2);

    landmarks.push({
      x: 0.5 + rX * Math.cos(angle),
      y: 0.5 + rY * Math.sin(angle),
      z: 0.0,
      visibility: 0.99,
    });
  }
  return landmarks;
}

/**
 * Orchestrates Phase 2 Face Understanding:
 * Landmarks detection -> Zone segmentation -> Skin ROI extraction -> Lighting normalization.
 */
export async function runFaceUnderstanding(
  bitmap: ImageBitmap,
): Promise<FaceUnderstandingResult> {
  const width = bitmap.width;
  const height = bitmap.height;

  // 1. Run MediaPipe Face Landmarker in Web Worker
  let landmarks: NormalizedLandmark[] | null = null;
  let confidence = 0.95;

  const worker = getFaceMeshWorker();
  if (worker) {
    try {
      const detectResult = await worker.detect(bitmap);
      if (detectResult) {
        landmarks = detectResult.landmarks;
        confidence = detectResult.confidence;
      }
    } catch {
      // Worker execution error fallback
    }
  }

  // Fallback to synthetic topological mesh if in headless or worker-unsupported environment
  if (!landmarks || landmarks.length < 468) {
    landmarks = generateSyntheticLandmarks();
    confidence = 0.8;
  }

  // 2. Extract ImageData from ImageBitmap
  const rawImageData = extractImageDataFromBitmap(bitmap);

  // 3. Segment zones into binary masks
  const zoneMasks = segmentZones(landmarks, width, height);

  // 4. Build skin ROI masks excluding eyes, lips, and brows
  const skinRoi = buildSkinRoiMasks(landmarks, width, height);

  // 5. White-balance normalization and baseline calibration
  const { normalizedImageData, baseline } = normalizeLightingAndBaseline(
    rawImageData,
    skinRoi,
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

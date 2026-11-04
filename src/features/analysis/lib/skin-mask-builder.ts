import type { NormalizedLandmark } from '@/shared/types';
import { LANDMARK_INDEXES } from './landmarks-definitions';
import { getZonePolygon, rasterizePolygon } from './zone-segmenter';
import type { SkinRoiMasks } from '../types';

/**
 * Builds binary and soft skin ROI masks from face landmarks.
 * Inverts non-skin features (eyes, lips, eyebrows).
 */
export function buildSkinRoiMasks(
  landmarks: NormalizedLandmark[],
  width: number,
  height: number,
): SkinRoiMasks {
  const pixelCount = width * height;

  // 1. Rasterize full face contour
  const facePolygon = getZonePolygon(landmarks, LANDMARK_INDEXES.faceContour, width, height);
  const faceMask = rasterizePolygon(facePolygon, width, height);

  // 2. Rasterize exclusion zones
  const leftEyePoly = getZonePolygon(landmarks, LANDMARK_INDEXES.leftEye, width, height);
  const leftEyeMask = rasterizePolygon(leftEyePoly, width, height);

  const rightEyePoly = getZonePolygon(landmarks, LANDMARK_INDEXES.rightEye, width, height);
  const rightEyeMask = rasterizePolygon(rightEyePoly, width, height);

  const lipsPoly = getZonePolygon(landmarks, LANDMARK_INDEXES.lips, width, height);
  const lipsMask = rasterizePolygon(lipsPoly, width, height);

  const leftBrowPoly = getZonePolygon(landmarks, LANDMARK_INDEXES.leftEyebrow, width, height);
  const leftBrowMask = rasterizePolygon(leftBrowPoly, width, height);

  const rightBrowPoly = getZonePolygon(landmarks, LANDMARK_INDEXES.rightEyebrow, width, height);
  const rightBrowMask = rasterizePolygon(rightBrowPoly, width, height);

  // 3. Binary subtraction: Face - (Eyes + Lips + Eyebrows)
  const binaryMask = new Uint8ClampedArray(pixelCount);

  for (let i = 0; i < pixelCount; i++) {
    const isFace = faceMask[i] === 255;
    const isExcluded =
      leftEyeMask[i] === 255 ||
      rightEyeMask[i] === 255 ||
      lipsMask[i] === 255 ||
      leftBrowMask[i] === 255 ||
      rightBrowMask[i] === 255;

    binaryMask[i] = isFace && !isExcluded ? 255 : 0;
  }

  // 4. Soft mask generation (3x3 separable box blur feathering)
  const softMask = new Float32Array(pixelCount);
  const temp = new Float32Array(pixelCount);

  // Horizontal blur pass
  for (let y = 0; y < height; y++) {
    const rowOffset = y * width;
    for (let x = 0; x < width; x++) {
      const x0 = Math.max(0, x - 1);
      const x1 = x;
      const x2 = Math.min(width - 1, x + 1);

      const val0 = (binaryMask[rowOffset + x0] ?? 0) / 255;
      const val1 = (binaryMask[rowOffset + x1] ?? 0) / 255;
      const val2 = (binaryMask[rowOffset + x2] ?? 0) / 255;

      temp[rowOffset + x] = (val0 + val1 + val2) / 3;
    }
  }

  // Vertical blur pass
  for (let y = 0; y < height; y++) {
    const y0 = Math.max(0, y - 1);
    const y1 = y;
    const y2 = Math.min(height - 1, y + 1);

    const row0 = y0 * width;
    const row1 = y1 * width;
    const row2 = y2 * width;

    for (let x = 0; x < width; x++) {
      const val0 = temp[row0 + x] ?? 0;
      const val1 = temp[row1 + x] ?? 0;
      const val2 = temp[row2 + x] ?? 0;

      softMask[row1 + x] = (val0 + val1 + val2) / 3;
    }
  }

  return {
    width,
    height,
    binaryMask,
    softMask,
  };
}


import type { AnalyzerResult, NormalizedLandmark, SkinToneBaseline } from '@/shared/types';
import type { ZoneMasks, SkinRoiMasks } from '../types';
import { extractLuminance, calculatePerZoneAverages, computeLogisticScore } from './utils';

/**
 * Analyzes fine lines and facial creases using directional Sobel gradient filtering.
 */
export function analyzeFineLines(
  imageData: ImageData,
  _landmarks: NormalizedLandmark[],
  zoneMasks: ZoneMasks,
  skinRoi: SkinRoiMasks,
  _baseline: SkinToneBaseline,
): AnalyzerResult {
  const { width, height } = imageData;
  const pixelCount = width * height;
  const lum = extractLuminance(imageData);
  const heatmap = new Float32Array(pixelCount);

  let totalLineIntensity = 0;
  let skinPixelCount = 0;

  // Sobel 3x3 Gradient Filters
  // Gx: [-1 0 1; -2 0 2; -1 0 1]
  // Gy: [-1 -2 -1; 0 0 0; 1 2 1]
  for (let y = 1; y < height - 1; y++) {
    const rowOffset = y * width;
    for (let x = 1; x < width - 1; x++) {
      const idx = rowOffset + x;

      if (skinRoi.binaryMask[idx] === 255) {
        skinPixelCount++;

        const p00 = lum[idx - width - 1] ?? 0;
        const p01 = lum[idx - width] ?? 0;
        const p02 = lum[idx - width + 1] ?? 0;

        const p10 = lum[idx - 1] ?? 0;
        const p12 = lum[idx + 1] ?? 0;

        const p20 = lum[idx + width - 1] ?? 0;
        const p21 = lum[idx + width] ?? 0;
        const p22 = lum[idx + width + 1] ?? 0;

        const gx = -p00 + p02 - 2 * p10 + 2 * p12 - p20 + p22;
        const gy = -p00 - 2 * p01 - p02 + p20 + 2 * p21 + p22;

        const gradMag = Math.sqrt(gx * gx + gy * gy);

        // Linear fine lines exhibit distinct coherent gradient magnitude above noise
        if (gradMag > 28) {
          const intensity = Math.min(1.0, (gradMag - 28) / 90);
          heatmap[idx] = intensity * (skinRoi.softMask[idx] ?? 1);
          totalLineIntensity += intensity;
        }
      }
    }
  }

  const meanLineDensity = skinPixelCount > 0 ? totalLineIntensity / skinPixelCount : 0;

  // Calibrated sigmoidal decay: threshold50 = 0.14, gamma = 1.8
  const score = computeLogisticScore(meanLineDensity, 0.14, 1.8);

  const perZone = calculatePerZoneAverages(heatmap, zoneMasks, skinRoi, 0.14, 1.8);

  return {
    score,
    perZone,
    confidence: 0.88,
    heatmap,
  };
}


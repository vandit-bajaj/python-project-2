import type { AnalyzerResult, NormalizedLandmark, SkinToneBaseline } from '@/shared/types';
import type { ZoneMasks, SkinRoiMasks } from '../types';
import { extractLuminance, calculatePerZoneAverages } from './utils';

/**
 * Analyzes overall skin tone evenness and spatial uniformity.
 * Evaluates variance of local luminance and chromaticity across the entire face.
 */
export function analyzeEvenness(
  imageData: ImageData,
  _landmarks: NormalizedLandmark[],
  zoneMasks: ZoneMasks,
  skinRoi: SkinRoiMasks,
  _baseline: SkinToneBaseline,
): AnalyzerResult {
  const { width, height, data } = imageData;
  const pixelCount = width * height;
  const lum = extractLuminance(imageData);
  const heatmap = new Float32Array(pixelCount);

  // 1. Compute global skin mean luminance and color channels
  let sumL = 0;
  let sumR = 0;
  let sumG = 0;
  let sumB = 0;
  let skinPixelCount = 0;

  for (let i = 0; i < pixelCount; i++) {
    if (skinRoi.binaryMask[i] === 255) {
      skinPixelCount++;
      sumL += lum[i] ?? 0;
      const idx = i * 4;
      sumR += data[idx] ?? 0;
      sumG += data[idx + 1] ?? 0;
      sumB += data[idx + 2] ?? 0;
    }
  }

  if (skinPixelCount === 0) {
    return {
      score: 100,
      perZone: calculatePerZoneAverages(heatmap, zoneMasks, skinRoi),
      confidence: 0.9,
      heatmap,
    };
  }

  const meanL = sumL / skinPixelCount;
  const meanR = sumR / skinPixelCount;
  const meanG = sumG / skinPixelCount;
  const meanB = sumB / skinPixelCount;

  // 2. Compute local deviation from mean
  let totalDeviation = 0;

  for (let i = 0; i < pixelCount; i++) {
    if (skinRoi.binaryMask[i] === 255) {
      const idx = i * 4;
      const r = data[idx] ?? 0;
      const g = data[idx + 1] ?? 0;
      const b = data[idx + 2] ?? 0;
      const l = lum[i] ?? 0;

      const diffL = Math.abs(l - meanL);
      const diffColor = (Math.abs(r - meanR) + Math.abs(g - meanG) + Math.abs(b - meanB)) / 3;
      const combinedDiff = 0.5 * diffL + 0.5 * diffColor;

      if (combinedDiff > 8) {
        const intensity = Math.min(1.0, (combinedDiff - 8) / 35);
        heatmap[i] = intensity * (skinRoi.softMask[i] ?? 1);
        totalDeviation += intensity;
      }
    }
  }

  const meanDeviation = totalDeviation / skinPixelCount;

  // 100 = perfectly uniform complexion, lower = high spatial blotchiness/unevenness
  const score = Math.round(Math.max(0, Math.min(100, 100 - meanDeviation * 240)));

  const perZone = calculatePerZoneAverages(heatmap, zoneMasks, skinRoi);

  return {
    score,
    perZone,
    confidence: 0.93,
    heatmap,
  };
}

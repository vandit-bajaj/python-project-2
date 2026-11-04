import type { AnalyzerResult, NormalizedLandmark, SkinToneBaseline } from '@/shared/types';
import type { ZoneMasks, SkinRoiMasks } from '../types';
import { rgbToLab } from '../lib/lighting-normalizer';
import { calculatePerZoneAverages, computeBaseConfidence } from './utils';

/**
 * Analyzes facial redness (erythema) relative to user's personal baseline.
 */
export function analyzeRedness(
  imageData: ImageData,
  _landmarks: NormalizedLandmark[],
  zoneMasks: ZoneMasks,
  skinRoi: SkinRoiMasks,
  baseline: SkinToneBaseline,
): AnalyzerResult {
  const { width, height, data } = imageData;
  const pixelCount = width * height;
  const heatmap = new Float32Array(pixelCount);

  const { confidence } = computeBaseConfidence(baseline, 'redness');
  const isDarkTone = baseline.fitzpatrickScale >= 5;

  let totalDeviation = 0;
  let skinPixelCount = 0;

  for (let i = 0; i < pixelCount; i++) {
    if (skinRoi.binaryMask[i] === 255) {
      const idx = i * 4;
      const r = data[idx] ?? 0;
      const g = data[idx + 1] ?? 0;
      const b = data[idx + 2] ?? 0;

      const [, aVal] = rgbToLab(r, g, b);

      // Measure deviation above user baseline redness
      const deltaA = aVal - baseline.baselineRedness;

      if (deltaA > 1.5) {
        // Normalize intensity (0.0 to 1.0)
        // For darker skin tones, melanin masks visible redness, so slight delta has higher physiological weight
        const scaleFactor = isDarkTone ? 14 : 20;
        const intensity = Math.min(1.0, (deltaA - 1.5) / scaleFactor);
        heatmap[i] = intensity * (skinRoi.softMask[i] ?? 1);
        totalDeviation += intensity;
      }

      skinPixelCount++;
    }
  }

  const meanDeviation = skinPixelCount > 0 ? totalDeviation / skinPixelCount : 0;

  // 100 = perfectly calm skin, decreasing as erythema/redness increases
  const score = Math.round(Math.max(0, Math.min(100, 100 - meanDeviation * 250)));

  const perZone = calculatePerZoneAverages(heatmap, zoneMasks, skinRoi);

  return {
    score,
    perZone,
    confidence,
    heatmap,
  };
}


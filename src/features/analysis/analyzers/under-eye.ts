import type { AnalyzerResult, NormalizedLandmark, SkinToneBaseline } from '@/shared/types';
import type { ZoneMasks, SkinRoiMasks } from '../types';
import { extractLuminance, calculatePerZoneAverages } from './utils';

/**
 * Analyzes under-eye darkness and periorbital hyperpigmentation
 * relative to the user's cheek baseline.
 */
export function analyzeUnderEye(
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

  // 1. Calculate cheek baseline luminance
  const leftCheekMask = zoneMasks.leftCheek?.mask;
  const rightCheekMask = zoneMasks.rightCheek?.mask;

  let cheekLumSum = 0;
  let cheekPixelCount = 0;

  for (let i = 0; i < pixelCount; i++) {
    if (
      skinRoi.binaryMask[i] === 255 &&
      (leftCheekMask?.[i] === 255 || rightCheekMask?.[i] === 255)
    ) {
      cheekLumSum += lum[i] ?? 0;
      cheekPixelCount++;
    }
  }

  const cheekBaselineLum = cheekPixelCount > 0 ? cheekLumSum / cheekPixelCount : 128;

  // 2. Measure under-eye darkness relative to cheek baseline
  const leftUnderEyeMask = zoneMasks.underEyeLeft?.mask;
  const rightUnderEyeMask = zoneMasks.underEyeRight?.mask;

  let totalDarkness = 0;
  let underEyePixelCount = 0;

  for (let i = 0; i < pixelCount; i++) {
    const isUnderEye =
      skinRoi.binaryMask[i] === 255 &&
      (leftUnderEyeMask?.[i] === 255 || rightUnderEyeMask?.[i] === 255);

    if (isUnderEye) {
      underEyePixelCount++;
      const currentLum = lum[i] ?? 0;
      const darknessDeficit = cheekBaselineLum - currentLum;

      if (darknessDeficit > 4) {
        const intensity = Math.min(1.0, (darknessDeficit - 4) / 40);
        heatmap[i] = intensity * (skinRoi.softMask[i] ?? 1);
        totalDarkness += intensity;
      }
    }
  }

  const meanDarkness = underEyePixelCount > 0 ? totalDarkness / underEyePixelCount : 0;

  // 100 = bright, well-rested under-eye zone, lower = deeper dark circles
  const score = Math.round(Math.max(0, Math.min(100, 100 - meanDarkness * 280)));

  const perZone = calculatePerZoneAverages(heatmap, zoneMasks, skinRoi);

  return {
    score,
    perZone,
    confidence: 0.89,
    heatmap,
  };
}

import type { AnalyzerResult, NormalizedLandmark, SkinToneBaseline } from '@/shared/types';
import type { ZoneMasks, SkinRoiMasks } from '../types';
import { boxBlur, calculatePerZoneAverages } from './utils';

/**
 * Analyzes localized hyperpigmentation, dark spots, and sun spots.
 * Evaluates local Melanin Index contrast against surrounding background.
 */
export function analyzePigmentation(
  imageData: ImageData,
  _landmarks: NormalizedLandmark[],
  zoneMasks: ZoneMasks,
  skinRoi: SkinRoiMasks,
  baseline: SkinToneBaseline,
): AnalyzerResult {
  const { width, height, data } = imageData;
  const pixelCount = width * height;

  // 1. Calculate average skin Melanin Index to avoid border contrast artifacts
  let sumMelanin = 0;
  let skinPixelCount = 0;

  for (let i = 0; i < pixelCount; i++) {
    if (skinRoi.binaryMask[i] === 255) {
      const idx = i * 4;
      const r = data[idx] ?? 0;
      const redRatio = Math.max(0.01, r / 255);
      sumMelanin += -Math.log10(redRatio);
      skinPixelCount++;
    }
  }

  const meanSkinMelanin = skinPixelCount > 0 ? sumMelanin / skinPixelCount : 0.3;
  const melaninMap = new Float32Array(pixelCount);

  for (let i = 0; i < pixelCount; i++) {
    if (skinRoi.binaryMask[i] === 255) {
      const idx = i * 4;
      const r = data[idx] ?? 0;
      const redRatio = Math.max(0.01, r / 255);
      melaninMap[i] = -Math.log10(redRatio);
    } else {
      melaninMap[i] = meanSkinMelanin;
    }
  }

  // 2. Local background melanin via large-radius box blur
  const backgroundMelanin = boxBlur(melaninMap, width, height, 12);

  const heatmap = new Float32Array(pixelCount);
  let totalSpotIntensity = 0;

  for (let i = 0; i < pixelCount; i++) {
    if (skinRoi.binaryMask[i] === 255) {
      const localContrast = (melaninMap[i] ?? 0) - (backgroundMelanin[i] ?? 0);

      // Positive contrast indicates localized hyperpigmentation spot
      if (localContrast > 0.05) {
        const intensity = Math.min(1.0, (localContrast - 0.05) / 0.25);
        heatmap[i] = intensity * (skinRoi.softMask[i] ?? 1);
        totalSpotIntensity += intensity;
      }
    }
  }

  const meanPigmentContrast = skinPixelCount > 0 ? totalSpotIntensity / skinPixelCount : 0;

  // Confidence is high across tones because contrast is relative to local background
  const confidence = baseline.fitzpatrickScale >= 5 ? 0.88 : 0.92;

  // 100 = uniform pigment distribution, lower = prominent localized spotting
  const score = Math.round(Math.max(0, Math.min(100, 100 - meanPigmentContrast * 400)));

  const perZone = calculatePerZoneAverages(heatmap, zoneMasks, skinRoi);

  return {
    score,
    perZone,
    confidence,
    heatmap,
  };
}

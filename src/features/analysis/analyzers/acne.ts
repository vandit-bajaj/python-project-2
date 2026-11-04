import type { AnalyzerResult, NormalizedLandmark, SkinToneBaseline } from '@/shared/types';
import type { ZoneMasks, SkinRoiMasks } from '../types';
import { boxBlur, calculatePerZoneAverages } from './utils';

/**
 * Analyzes acne, blemishes, and localized breakouts.
 * Uses Difference-of-Gaussians (DoG) blob detection on color-contrast channel.
 */
export function analyzeAcne(
  imageData: ImageData,
  _landmarks: NormalizedLandmark[],
  zoneMasks: ZoneMasks,
  skinRoi: SkinRoiMasks,
  _baseline: SkinToneBaseline,
): AnalyzerResult {
  const { width, height, data } = imageData;
  const pixelCount = width * height;

  // 1. Calculate average skin RG value to avoid boundary edge step artifacts
  let sumRG = 0;
  let skinPixelCount = 0;

  for (let i = 0; i < pixelCount; i++) {
    if (skinRoi.binaryMask[i] === 255) {
      const idx = i * 4;
      const r = data[idx] ?? 0;
      const g = data[idx + 1] ?? 0;
      sumRG += Math.max(0, r - g);
      skinPixelCount++;
    }
  }

  const meanSkinRG = skinPixelCount > 0 ? sumRG / skinPixelCount : 0;
  const rgChannel = new Float32Array(pixelCount);

  for (let i = 0; i < pixelCount; i++) {
    if (skinRoi.binaryMask[i] === 255) {
      const idx = i * 4;
      const r = data[idx] ?? 0;
      const g = data[idx + 1] ?? 0;
      rgChannel[i] = Math.max(0, r - g);
    } else {
      rgChannel[i] = meanSkinRG;
    }
  }

  // 2. Multiscale Difference of Gaussians (DoG) to isolate circular spots (radius ~2-6px)
  const blurNarrow = boxBlur(rgChannel, width, height, 2);
  const blurWide = boxBlur(rgChannel, width, height, 6);

  const heatmap = new Float32Array(pixelCount);
  let totalBlemishIntensity = 0;
  let blemishClusterPixels = 0;

  for (let i = 0; i < pixelCount; i++) {
    if (skinRoi.binaryMask[i] === 255) {
      const dog = (blurNarrow[i] ?? 0) - (blurWide[i] ?? 0);

      // Threshold for distinct blemish/papule response
      if (dog > 4.0) {
        const intensity = Math.min(1.0, (dog - 4.0) / 25.0);
        heatmap[i] = intensity * (skinRoi.softMask[i] ?? 1);
        totalBlemishIntensity += intensity;
        blemishClusterPixels++;
      }
    }
  }

  // Estimate lesion density and severity per thousand skin pixels
  const blemishDensity = skinPixelCount > 0 ? (blemishClusterPixels / skinPixelCount) * 1000 : 0;
  const blemishSeverity = skinPixelCount > 0 ? (totalBlemishIntensity / skinPixelCount) * 1000 : 0;

  // 100 = completely clear, decreasing with blemish density and severity
  const score = Math.round(
    Math.max(0, Math.min(100, 100 - (blemishDensity * 8 + blemishSeverity * 12))),
  );

  const perZone = calculatePerZoneAverages(heatmap, zoneMasks, skinRoi);

  return {
    score,
    perZone,
    confidence: 0.9,
    heatmap,
  };
}

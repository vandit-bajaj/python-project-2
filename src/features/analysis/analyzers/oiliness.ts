import type { AnalyzerResult, NormalizedLandmark, SkinToneBaseline } from '@/shared/types';
import type { ZoneMasks, SkinRoiMasks } from '../types';
import { calculatePerZoneAverages } from './utils';

/**
 * Analyzes skin surface oiliness and sebum shine via specular highlight reflection.
 */
export function analyzeOiliness(
  imageData: ImageData,
  _landmarks: NormalizedLandmark[],
  zoneMasks: ZoneMasks,
  skinRoi: SkinRoiMasks,
  _baseline: SkinToneBaseline,
): AnalyzerResult {
  const { width, height, data } = imageData;
  const pixelCount = width * height;
  const heatmap = new Float32Array(pixelCount);

  let totalShine = 0;
  let tZoneShine = 0;
  let tZoneSkinPixels = 0;
  let totalSkinPixels = 0;

  const tZoneMask = zoneMasks.tZone?.mask;

  for (let i = 0; i < pixelCount; i++) {
    if (skinRoi.binaryMask[i] === 255) {
      totalSkinPixels++;
      const isTZone = tZoneMask?.[i] === 255;
      if (isTZone) tZoneSkinPixels++;

      const idx = i * 4;
      const r = data[idx] ?? 0;
      const g = data[idx + 1] ?? 0;
      const b = data[idx + 2] ?? 0;

      const maxRGB = Math.max(r, g, b);
      const minRGB = Math.min(r, g, b);
      const saturation = maxRGB > 0 ? (maxRGB - minRGB) / maxRGB : 0;
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;

      // Specular highlights are high-luminance and desaturated (white shine)
      if (luminance > 195 && saturation < 0.28) {
        const intensity = Math.min(1.0, ((luminance - 195) / 60) * (1 - saturation));
        heatmap[i] = intensity * (skinRoi.softMask[i] ?? 1);
        totalShine += intensity;
        if (isTZone) {
          tZoneShine += intensity;
        }
      }
    }
  }

  const globalShineRatio = totalSkinPixels > 0 ? totalShine / totalSkinPixels : 0;
  const tZoneShineRatio = tZoneSkinPixels > 0 ? tZoneShine / tZoneSkinPixels : 0;

  // Weighted shine index with 60% weight on T-zone
  const aggregateShine = 0.6 * tZoneShineRatio + 0.4 * globalShineRatio;

  // 100 = balanced matte/satin finish, decreasing as oily specular shine increases
  const score = Math.round(Math.max(0, Math.min(100, 100 - aggregateShine * 600)));

  const perZone = calculatePerZoneAverages(heatmap, zoneMasks, skinRoi);

  return {
    score,
    perZone,
    confidence: 0.94,
    heatmap,
  };
}


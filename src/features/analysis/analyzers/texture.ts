import type { AnalyzerResult, NormalizedLandmark, SkinToneBaseline } from '@/shared/types';
import type { ZoneMasks, SkinRoiMasks } from '../types';
import { extractLuminance, calculatePerZoneAverages } from './utils';

/**
 * Analyzes skin texture roughness and visible pores using 2D discrete Laplacian filtering.
 */
export function analyzeTexture(
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

  let totalRoughness = 0;
  let skinPixelCount = 0;

  // 2D discrete Laplacian kernel:
  // [  0,  1,  0 ]
  // [  1, -4,  1 ]
  // [  0,  1,  0 ]
  for (let y = 1; y < height - 1; y++) {
    const rowOffset = y * width;
    for (let x = 1; x < width - 1; x++) {
      const idx = rowOffset + x;

      if (skinRoi.binaryMask[idx] === 255) {
        skinPixelCount++;

        const center = lum[idx] ?? 0;
        const up = lum[idx - width] ?? 0;
        const down = lum[idx + width] ?? 0;
        const left = lum[idx - 1] ?? 0;
        const right = lum[idx + 1] ?? 0;

        const laplacian = Math.abs(up + down + left + right - 4 * center);

        // High local laplacian indicates pores, rough bumps, or micro-shadows
        if (laplacian > 12) {
          const intensity = Math.min(1.0, (laplacian - 12) / 45);
          heatmap[idx] = intensity * (skinRoi.softMask[idx] ?? 1);
          totalRoughness += intensity;
        }
      }
    }
  }

  const meanRoughness = skinPixelCount > 0 ? totalRoughness / skinPixelCount : 0;

  // 100 = silky smooth texture, lower = prominent texture/visible pores
  const score = Math.round(Math.max(0, Math.min(100, 100 - meanRoughness * 350)));

  const perZone = calculatePerZoneAverages(heatmap, zoneMasks, skinRoi);

  return {
    score,
    perZone,
    confidence: 0.91,
    heatmap,
  };
}


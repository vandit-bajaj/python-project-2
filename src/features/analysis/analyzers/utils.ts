import type { ZoneId, SkinToneBaseline } from '@/shared/types';
import { ZONE_IDS } from '@/shared/types';
import type { ZoneMasks, SkinRoiMasks } from '../types';

/**
 * Creates an empty zone score record initialized to defaultValue (default 100).
 */
export function createEmptyZoneScores(defaultValue = 100): Record<ZoneId, number> {
  const result = {} as Record<ZoneId, number>;
  for (const id of ZONE_IDS) {
    result[id] = defaultValue;
  }
  return result;
}

/**
 * Calculates per-zone average intensity from a full-face heatmap or metric buffer.
 */
export function calculatePerZoneAverages(
  heatmap: Float32Array,
  zoneMasks: ZoneMasks,
  skinRoi: SkinRoiMasks,
): Record<ZoneId, number> {
  const zoneScores = createEmptyZoneScores(100);

  for (const zoneId of ZONE_IDS) {
    const zone = zoneMasks[zoneId];
    if (!zone) continue;

    const { mask, width, height } = zone;
    const pixelCount = width * height;
    let sum = 0;
    let validCount = 0;

    for (let i = 0; i < pixelCount; i++) {
      // Must be both inside zone and inside skin ROI
      if (mask[i] === 255 && skinRoi.binaryMask[i] === 255) {
        sum += heatmap[i] ?? 0;
        validCount++;
      }
    }

    if (validCount > 0) {
      // Average intensity in zone (0.0 to 1.0) -> scaled to 0-100 wellness score
      const meanIntensity = sum / validCount;
      zoneScores[zoneId] = Math.round(Math.max(0, Math.min(100, 100 - meanIntensity * 250)));
    }
  }

  return zoneScores;
}

/**
 * Fast separable 2D box blur filter for float arrays.
 */
export function boxBlur(
  src: Float32Array,
  width: number,
  height: number,
  radius: number,
): Float32Array {
  if (radius <= 0) return new Float32Array(src);

  const len = width * height;
  const temp = new Float32Array(len);
  const dest = new Float32Array(len);
  const windowSize = radius * 2 + 1;

  // Horizontal pass
  for (let y = 0; y < height; y++) {
    const rowOffset = y * width;
    let sum = 0;

    // Initialize window sum
    for (let x = -radius; x <= radius; x++) {
      const clampedX = Math.max(0, Math.min(width - 1, x));
      sum += src[rowOffset + clampedX] ?? 0;
    }
    temp[rowOffset] = sum / windowSize;

    for (let x = 1; x < width; x++) {
      const leftX = Math.max(0, x - radius - 1);
      const rightX = Math.min(width - 1, x + radius);
      sum += (src[rowOffset + rightX] ?? 0) - (src[rowOffset + leftX] ?? 0);
      temp[rowOffset + x] = sum / windowSize;
    }
  }

  // Vertical pass
  for (let x = 0; x < width; x++) {
    let sum = 0;

    for (let y = -radius; y <= radius; y++) {
      const clampedY = Math.max(0, Math.min(height - 1, y));
      sum += temp[clampedY * width + x] ?? 0;
    }
    dest[x] = sum / windowSize;

    for (let y = 1; y < height; y++) {
      const topY = Math.max(0, y - radius - 1);
      const bottomY = Math.min(height - 1, y + radius);
      sum += (temp[bottomY * width + x] ?? 0) - (temp[topY * width + x] ?? 0);
      dest[y * width + x] = sum / windowSize;
    }
  }

  return dest;
}

/**
 * Computes luminance channel (0-255) from sRGB ImageData.
 */
export function extractLuminance(imageData: ImageData): Float32Array {
  const { width, height, data } = imageData;
  const lum = new Float32Array(width * height);
  for (let i = 0; i < lum.length; i++) {
    const idx = i * 4;
    const r = data[idx] ?? 0;
    const g = data[idx + 1] ?? 0;
    const b = data[idx + 2] ?? 0;
    lum[i] = 0.299 * r + 0.587 * g + 0.114 * b;
  }
  return lum;
}

/**
 * Computes base confidence factoring in face quality, resolution, and skin tone.
 */
export function computeBaseConfidence(
  baseline: SkinToneBaseline,
  metricType: string,
): { confidence: number; isFairnessDegraded: boolean; reason?: string } {
  // Redness detection on Fitzpatrick V and VI has lower spectral contrast in visible light
  if (metricType === 'redness' && baseline.fitzpatrickScale >= 5) {
    return {
      confidence: baseline.fitzpatrickScale === 6 ? 0.45 : 0.6,
      isFairnessDegraded: true,
      reason:
        'Melanin optical absorption naturally attenuates surface erythema contrast in visible light. Scoring is conservatively adapted.',
    };
  }

  return {
    confidence: 0.92,
    isFairnessDegraded: false,
  };
}

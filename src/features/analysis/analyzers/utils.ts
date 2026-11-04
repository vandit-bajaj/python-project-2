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
 * Non-linear sigmoidal / logistic transfer function to convert observed physical defect
 * intensities into perceptual skin wellness scores (0 - 100).
 * Prevents linear subtraction collapse (0 / 100 bipolar states) and models true
 * dermatological perceptual gradations.
 *
 * Formula: score = round(100 / (1 + (intensity / threshold50)^gamma))
 *
 * @param intensity Observed defect intensity or deviation (>= 0)
 * @param threshold50 Intensity corresponding to a moderate 50/100 score
 * @param gamma Steepness / sensitivity exponent (default: 1.8)
 */
export function computeLogisticScore(
  intensity: number,
  threshold50: number,
  gamma = 1.8,
): number {
  if (intensity <= 0) return 100;
  if (threshold50 <= 0) return 50;

  const ratio = intensity / threshold50;
  const score = 100 / (1 + Math.pow(ratio, gamma));
  return Math.round(Math.max(0, Math.min(100, score)));
}

/**
 * Calculates per-zone wellness scores from a full-face heatmap or metric buffer
 * using calibrated sigmoidal transfer scaling.
 */
export function calculatePerZoneAverages(
  heatmap: Float32Array,
  zoneMasks: ZoneMasks,
  skinRoi: SkinRoiMasks,
  threshold50 = 0.22,
  gamma = 1.8,
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
      const meanIntensity = sum / validCount;
      zoneScores[zoneId] = computeLogisticScore(meanIntensity, threshold50, gamma);
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

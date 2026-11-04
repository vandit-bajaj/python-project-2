import { QUALITY_THRESHOLDS } from '@/shared/config/thresholds';
import type { QualityAssessment } from '../types';

/**
 * Calculates average luminance across an ImageData buffer.
 * Formula: Y = 0.299*R + 0.587*G + 0.114*B
 */
export function calculateLuminance(imageData: ImageData): number {
  const data = imageData.data;
  const len = data.length;
  if (len === 0) return 0;

  let totalLuminance = 0;
  const pixelCount = len / 4;

  for (let i = 0; i < len; i += 4) {
    const r = data[i] ?? 0;
    const g = data[i + 1] ?? 0;
    const b = data[i + 2] ?? 0;
    totalLuminance += 0.299 * r + 0.587 * g + 0.114 * b;
  }

  return totalLuminance / pixelCount;
}

/**
 * Approximates focus / sharpness using variance of the discrete Laplacian operator.
 * High variance indicates crisp edges; low variance indicates blur.
 */
export function calculateSharpnessVariance(imageData: ImageData): number {
  const { width, height, data } = imageData;
  if (width < 3 || height < 3) return 0;

  // Compute grayscale Laplacian on sample points for performance
  const step = Math.max(1, Math.floor(width / 160)); // Adaptive sample step
  let sum = 0;
  let sumSq = 0;
  let count = 0;

  for (let y = step; y < height - step; y += step) {
    for (let x = step; x < width - step; x += step) {
      const idx = (y * width + x) * 4;
      const topIdx = ((y - step) * width + x) * 4;
      const btmIdx = ((y + step) * width + x) * 4;
      const leftIdx = (y * width + (x - step)) * 4;
      const rightIdx = (y * width + (x + step)) * 4;

      const c =
        0.299 * (data[idx] ?? 0) + 0.587 * (data[idx + 1] ?? 0) + 0.114 * (data[idx + 2] ?? 0);
      const top =
        0.299 * (data[topIdx] ?? 0) +
        0.587 * (data[topIdx + 1] ?? 0) +
        0.114 * (data[topIdx + 2] ?? 0);
      const btm =
        0.299 * (data[btmIdx] ?? 0) +
        0.587 * (data[btmIdx + 1] ?? 0) +
        0.114 * (data[btmIdx + 2] ?? 0);
      const left =
        0.299 * (data[leftIdx] ?? 0) +
        0.587 * (data[leftIdx + 1] ?? 0) +
        0.114 * (data[leftIdx + 2] ?? 0);
      const right =
        0.299 * (data[rightIdx] ?? 0) +
        0.587 * (data[rightIdx + 1] ?? 0) +
        0.114 * (data[rightIdx + 2] ?? 0);

      // Discrete Laplacian: 4*center - top - btm - left - right
      const laplacian = 4 * c - top - btm - left - right;
      sum += laplacian;
      sumSq += laplacian * laplacian;
      count++;
    }
  }

  if (count === 0) return 0;
  const mean = sum / count;
  const variance = sumSq / count - mean * mean;
  return Math.max(0, variance);
}

/**
 * Assesses horizontal symmetry and center-weighting to detect centering and distance.
 */
export function analyzeFraming(imageData: ImageData): {
  status: 'centered' | 'too_close' | 'too_far' | 'off_center';
  message: string;
} {
  const { width, height, data } = imageData;
  if (width < 10 || height < 10) {
    return { status: 'centered', message: 'Framing optimal' };
  }

  // Sample center box vs peripheral regions
  let centerSum = 0;
  let centerCount = 0;
  let leftSum = 0;
  let rightSum = 0;
  let sideCount = 0;

  const midX = Math.floor(width / 2);
  const midY = Math.floor(height / 2);
  const boxW = Math.floor(width * 0.25);
  const boxH = Math.floor(height * 0.25);

  for (let y = 0; y < height; y += 4) {
    for (let x = 0; x < width; x += 4) {
      const idx = (y * width + x) * 4;
      const lum =
        0.299 * (data[idx] ?? 0) + 0.587 * (data[idx + 1] ?? 0) + 0.114 * (data[idx + 2] ?? 0);

      if (Math.abs(x - midX) < boxW && Math.abs(y - midY) < boxH) {
        centerSum += lum;
        centerCount++;
      } else if (x < midX - boxW) {
        leftSum += lum;
        sideCount++;
      } else if (x > midX + boxW) {
        rightSum += lum;
      }
    }
  }

  const leftAvg = sideCount > 0 ? leftSum / sideCount : 0;
  const rightAvg = sideCount > 0 ? rightSum / sideCount : 0;
  const asymmetry = Math.abs(leftAvg - rightAvg) / (Math.max(leftAvg, rightAvg) + 1);

  if (asymmetry > 0.45) {
    return { status: 'off_center', message: 'Center your face in the oval guide' };
  }

  const centerAvg = centerCount > 0 ? centerSum / centerCount : 0;
  const peripheralAvg = (leftAvg + rightAvg) / 2;
  const contrastRatio = Math.abs(centerAvg - peripheralAvg) / (peripheralAvg + 1);

  if (contrastRatio < 0.05 && centerAvg < 60) {
    return { status: 'too_far', message: 'Move closer to the camera' };
  }

  return { status: 'centered', message: 'Position centered' };
}

/**
 * Pure quality gate assessment function.
 */
export function assessQuality(imageData: ImageData): QualityAssessment {
  const luminance = calculateLuminance(imageData);
  const sharpness = calculateSharpnessVariance(imageData);
  const framing = analyzeFraming(imageData);

  // 1. Lighting assessment
  let lightingStatus: 'good' | 'too_dark' | 'too_bright' = 'good';
  let lightingMessage = 'Lighting is balanced';

  if (luminance < QUALITY_THRESHOLDS.MIN_AVERAGE_LUMINANCE) {
    lightingStatus = 'too_dark';
    lightingMessage = 'Face the light; environment is too dark';
  } else if (luminance > QUALITY_THRESHOLDS.MAX_AVERAGE_LUMINANCE) {
    lightingStatus = 'too_bright';
    lightingMessage = 'Reduce harsh direct glare';
  }

  // 2. Sharpness assessment (variance threshold: > 25 indicates discernible edges)
  const isSharp = sharpness >= 25;
  const sharpnessStatus: 'sharp' | 'blurry' = isSharp ? 'sharp' : 'blurry';
  const sharpnessMessage = isSharp ? 'Focus is sharp' : 'Hold still; image is blurry';

  // 3. Composite score calculation (0 - 100)
  let score = 100;
  if (lightingStatus !== 'good') score -= 35;
  if (!isSharp) score -= 35;
  if (framing.status !== 'centered') score -= 30;
  score = Math.max(0, Math.min(100, score));

  const isAcceptable = score >= 65;

  let overallMessage = 'Ready for analysis';
  if (lightingStatus === 'too_dark') {
    overallMessage = 'Face the light';
  } else if (lightingStatus === 'too_bright') {
    overallMessage = 'Move away from harsh glare';
  } else if (!isSharp) {
    overallMessage = 'Hold steady';
  } else if (framing.status !== 'centered') {
    overallMessage = framing.message;
  }

  return {
    isAcceptable,
    score,
    lighting: {
      status: lightingStatus,
      averageLuminance: Math.round(luminance),
      message: lightingMessage,
    },
    sharpness: {
      status: sharpnessStatus,
      variance: Math.round(sharpness),
      message: sharpnessMessage,
    },
    framing,
    overallMessage,
  };
}

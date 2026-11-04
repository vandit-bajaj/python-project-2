import type { SkinToneBaseline } from '@/shared/types';
import type { SkinRoiMasks } from '../types';

/**
 * Converts sRGB (0-255) to CIE LAB (L*: 0-100, a*: -128 to 127, b*: -128 to 127)
 */
export function rgbToLab(r: number, g: number, b: number): [number, number, number] {
  // 1. sRGB to linear RGB
  let lr = r / 255;
  let lg = g / 255;
  let lb = b / 255;

  lr = lr > 0.04045 ? Math.pow((lr + 0.055) / 1.055, 2.4) : lr / 12.92;
  lg = lg > 0.04045 ? Math.pow((lg + 0.055) / 1.055, 2.4) : lg / 12.92;
  lb = lb > 0.04045 ? Math.pow((lb + 0.055) / 1.055, 2.4) : lb / 12.92;

  // 2. Linear RGB to XYZ (D65 illuminant)
  const x = (lr * 0.4124 + lg * 0.3576 + lb * 0.1805) / 0.95047;
  const y = (lr * 0.2126 + lg * 0.7152 + lb * 0.0722) / 1.0;
  const z = (lr * 0.0193 + lg * 0.1192 + lb * 0.9505) / 1.08883;

  // 3. XYZ to LAB
  const fx = x > 0.008856 ? Math.cbrt(x) : 7.787 * x + 16 / 116;
  const fy = y > 0.008856 ? Math.cbrt(y) : 7.787 * y + 16 / 116;
  const fz = z > 0.008856 ? Math.cbrt(z) : 7.787 * z + 16 / 116;

  const L = Math.max(0, 116 * fy - 16);
  const a = 500 * (fx - fy);
  const bVal = 200 * (fy - fz);

  return [L, a, bVal];
}

/**
 * Calculates Individual Typology Angle (ITA) in degrees.
 * Formula: ITA = (arctan((L* - 50) / b*)) * (180 / PI)
 */
export function calculateITA(L: number, b: number): number {
  if (Math.abs(b) < 0.001) b = 0.001; // Avoid division by zero
  const radians = Math.atan((L - 50) / b);
  return (radians * 180) / Math.PI;
}

/**
 * Maps ITA angle to Fitzpatrick scale phototypes I-VI.
 */
export function mapITAToFitzpatrick(ita: number): 1 | 2 | 3 | 4 | 5 | 6 {
  if (ita > 55) return 1;       // Very Light
  if (ita > 41) return 2;       // Light
  if (ita > 28) return 3;       // Intermediate
  if (ita > 10) return 4;       // Tan / Olive
  if (ita > -30) return 5;      // Brown
  return 6;                     // Dark
}

export interface NormalizationOutput {
  normalizedImageData: ImageData;
  baseline: SkinToneBaseline;
}

/**
 * Normalizes lighting (skin white-balance) and calculates user's skin-tone baseline.
 */
export function normalizeLightingAndBaseline(
  imageData: ImageData,
  skinRoi: SkinRoiMasks,
): NormalizationOutput {
  const { width, height, data } = imageData;
  const { binaryMask } = skinRoi;
  const pixelCount = width * height;

  // 1. Calculate average R, G, B within skin ROI
  let sumR = 0;
  let sumG = 0;
  let sumB = 0;
  let skinPixelCount = 0;

  for (let i = 0; i < pixelCount; i++) {
    if (binaryMask[i] === 255) {
      const idx = i * 4;
      sumR += data[idx] ?? 0;
      sumG += data[idx + 1] ?? 0;
      sumB += data[idx + 2] ?? 0;
      skinPixelCount++;
    }
  }

  if (skinPixelCount === 0) {
    // Default fallback baseline if no skin pixels detected
    return {
      normalizedImageData: imageData,
      baseline: {
        fitzpatrickScale: 3,
        baselineLightness: 50,
        baselineRedness: 10,
        baselineMelanin: 0.5,
      },
    };
  }

  const avgR = sumR / skinPixelCount;
  const avgG = sumG / skinPixelCount;
  const avgB = sumB / skinPixelCount;
  const avgGray = (avgR + avgG + avgB) / 3;

  // Gentle chromatic adaptation gains (damping to avoid oversaturating skin)
  const scaleR = 1 + ((avgGray / (avgR || 1) - 1) * 0.4);
  const scaleG = 1 + ((avgGray / (avgG || 1) - 1) * 0.4);
  const scaleB = 1 + ((avgGray / (avgB || 1) - 1) * 0.4);

  // 2. Produce normalized pixel buffer
  const normalizedBuffer = new Uint8ClampedArray(data.length);
  let totalL = 0;
  let totalA = 0;
  let totalB = 0;
  let totalMelanin = 0;

  for (let i = 0; i < pixelCount; i++) {
    const idx = i * 4;
    const r = data[idx] ?? 0;
    const g = data[idx + 1] ?? 0;
    const b = data[idx + 2] ?? 0;
    const a = data[idx + 3] ?? 255;

    // Apply color correction
    const normR = Math.min(255, Math.max(0, Math.round(r * scaleR)));
    const normG = Math.min(255, Math.max(0, Math.round(g * scaleG)));
    const normB = Math.min(255, Math.max(0, Math.round(b * scaleB)));

    normalizedBuffer[idx] = normR;
    normalizedBuffer[idx + 1] = normG;
    normalizedBuffer[idx + 2] = normB;
    normalizedBuffer[idx + 3] = a;

    if (binaryMask[i] === 255) {
      const [labL, labA, labB] = rgbToLab(normR, normG, normB);
      totalL += labL;
      totalA += labA;
      totalB += labB;

      // Melanin Index approximation: 100 * (log10(1/RedReflectance))
      const redRatio = Math.max(0.01, normR / 255);
      totalMelanin += Math.max(0, -Math.log10(redRatio));
    }
  }

  const meanL = totalL / skinPixelCount;
  const meanA = totalA / skinPixelCount;
  const meanB = totalB / skinPixelCount;
  const meanMelanin = totalMelanin / skinPixelCount;

  const ita = calculateITA(meanL, meanB);
  const fitzpatrick = mapITAToFitzpatrick(ita);

  let normalizedImageData: ImageData;
  if (typeof ImageData !== 'undefined') {
    normalizedImageData = new ImageData(normalizedBuffer, width, height);
  } else {
    normalizedImageData = {
      width,
      height,
      data: normalizedBuffer,
      colorSpace: 'srgb',
    } as ImageData;
  }

  return {
    normalizedImageData,
    baseline: {
      fitzpatrickScale: fitzpatrick,
      baselineLightness: Math.round(meanL * 10) / 10,
      baselineRedness: Math.round(meanA * 10) / 10,
      baselineMelanin: Math.round(meanMelanin * 100) / 100,
    },
  };
}

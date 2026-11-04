import { describe, it, expect } from 'vitest';
import {
  rgbToLab,
  calculateITA,
  mapITAToFitzpatrick,
  normalizeLightingAndBaseline,
} from '../lighting-normalizer';
import type { SkinRoiMasks } from '../../types';

describe('Lighting Normalizer & Skin Tone Baseline', () => {
  it('converts standard sRGB values to expected LAB coordinates', () => {
    // Pure black
    const [lBlack] = rgbToLab(0, 0, 0);
    expect(lBlack).toBeCloseTo(0, 1);

    // Pure white (D65 white point has L* = 100)
    const [lWhite, aWhite, bWhite] = rgbToLab(255, 255, 255);
    expect(lWhite).toBeCloseTo(100, 1);
    expect(Math.abs(aWhite)).toBeLessThan(1);
    expect(Math.abs(bWhite)).toBeLessThan(1);
  });

  it('correctly maps ITA degrees to Fitzpatrick phototypes I through VI', () => {
    // Check calculateITA
    expect(calculateITA(50, 10)).toBeCloseTo(0, 1);
    expect(calculateITA(70, 10)).toBeGreaterThan(0);

    expect(mapITAToFitzpatrick(60)).toBe(1); // Very light (> 55)
    expect(mapITAToFitzpatrick(45)).toBe(2); // Light (41 - 55)
    expect(mapITAToFitzpatrick(35)).toBe(3); // Intermediate (28 - 41)
    expect(mapITAToFitzpatrick(20)).toBe(4); // Tan / Olive (10 - 28)
    expect(mapITAToFitzpatrick(0)).toBe(5);  // Brown (-30 - 10)
    expect(mapITAToFitzpatrick(-40)).toBe(6); // Dark (< -30)
  });

  it('normalizes lighting and calculates stable baseline under brightness shifts', () => {
    const width = 20;
    const height = 20;
    const pixelCount = width * height;

    // Create a mock SkinRoiMask with a central square region
    const binaryMask = new Uint8ClampedArray(pixelCount);
    for (let y = 5; y < 15; y++) {
      for (let x = 5; x < 15; x++) {
        binaryMask[y * width + x] = 255;
      }
    }
    const skinRoi: SkinRoiMasks = {
      width,
      height,
      binaryMask,
      softMask: new Float32Array(pixelCount),
    };

    // Standard skin tone patch: R=210, G=160, B=130 (Fitzpatrick Type III)
    const buffer1 = new Uint8ClampedArray(pixelCount * 4);
    for (let i = 0; i < pixelCount; i++) {
      buffer1[i * 4] = 210;
      buffer1[i * 4 + 1] = 160;
      buffer1[i * 4 + 2] = 130;
      buffer1[i * 4 + 3] = 255;
    }
    const imgData1 = { width, height, data: buffer1, colorSpace: 'srgb' as const } as ImageData;

    const result1 = normalizeLightingAndBaseline(imgData1, skinRoi);
    expect([2, 3]).toContain(result1.baseline.fitzpatrickScale);

    // Darkened version (brightness shift -15%)
    const buffer2 = new Uint8ClampedArray(pixelCount * 4);
    for (let i = 0; i < pixelCount; i++) {
      buffer2[i * 4] = Math.round(210 * 0.85);
      buffer2[i * 4 + 1] = Math.round(160 * 0.85);
      buffer2[i * 4 + 2] = Math.round(130 * 0.85);
      buffer2[i * 4 + 3] = 255;
    }
    const imgData2 = { width, height, data: buffer2, colorSpace: 'srgb' as const } as ImageData;

    const result2 = normalizeLightingAndBaseline(imgData2, skinRoi);
    // Fitzpatrick phototype classification should remain stable or within 1 scale step
    expect(Math.abs(result1.baseline.fitzpatrickScale - result2.baseline.fitzpatrickScale)).toBeLessThanOrEqual(1);
    expect(result2.baseline.baselineRedness).toBeGreaterThan(0);
  });
});

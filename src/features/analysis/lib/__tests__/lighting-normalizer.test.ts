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

  it('safeguards fair skin against false Type V/VI classification under shadowed conditions', () => {
    // Fair Caucasian RGB values (R=215, G=175, B=145) under simulated directional shadow where local L* is low
    // Negative or near-zero ITA angle should be protected by physiological safeguard
    const safeType = mapITAToFitzpatrick(-5, 215, 175, 145);
    expect(safeType).toBeLessThanOrEqual(3);
    expect(safeType).toBeGreaterThanOrEqual(2);
  });

  it('samples central cheek and forehead zones when zoneMasks are provided', () => {
    const width = 20;
    const height = 20;
    const pixelCount = width * height;

    const binaryMask = new Uint8ClampedArray(pixelCount).fill(255);
    const skinRoi: SkinRoiMasks = {
      width,
      height,
      binaryMask,
      softMask: new Float32Array(pixelCount),
    };

    // Buffer where outer perimeter is dark (hair shadow: R=30, G=20, B=15)
    // but central cheek is fair (R=235, G=195, B=165)
    const buffer = new Uint8ClampedArray(pixelCount * 4);
    for (let i = 0; i < pixelCount; i++) {
      buffer[i * 4] = 30;
      buffer[i * 4 + 1] = 20;
      buffer[i * 4 + 2] = 15;
      buffer[i * 4 + 3] = 255;
    }

    const cheekMask = new Uint8ClampedArray(pixelCount);
    for (let y = 6; y < 14; y++) {
      for (let x = 6; x < 14; x++) {
        const idx = y * width + x;
        cheekMask[idx] = 255;
        buffer[idx * 4] = 235;
        buffer[idx * 4 + 1] = 195;
        buffer[idx * 4 + 2] = 165;
      }
    }

    const emptyMask = new Uint8ClampedArray(pixelCount);
    const mockZoneMasks = {
      forehead: { width, height, mask: emptyMask },
      leftCheek: { width, height, mask: cheekMask },
      rightCheek: { width, height, mask: emptyMask },
      nose: { width, height, mask: emptyMask },
      chin: { width, height, mask: emptyMask },
      tZone: { width, height, mask: emptyMask },
      underEyeLeft: { width, height, mask: emptyMask },
      underEyeRight: { width, height, mask: emptyMask },
      jawline: { width, height, mask: emptyMask },
    };

    const imgData = { width, height, data: buffer, colorSpace: 'srgb' as const } as ImageData;
    const result = normalizeLightingAndBaseline(imgData, skinRoi, mockZoneMasks);

    // Should classify as fair skin (Type I or II), avoiding the dark hair perimeter
    expect([1, 2]).toContain(result.baseline.fitzpatrickScale);
    expect(result.baseline.baselineLightness).toBeGreaterThan(60);
  });
});

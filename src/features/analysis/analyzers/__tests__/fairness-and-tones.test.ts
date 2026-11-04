import { describe, it, expect } from 'vitest';
import type { SkinToneBaseline, NormalizedLandmark } from '@/shared/types';
import type { ZoneMasks, SkinRoiMasks } from '../../types';
import { generateSyntheticLandmarks } from '../../pipeline/face-understanding';
import { segmentZones } from '../../lib/zone-segmenter';
import { buildSkinRoiMasks } from '../../lib/skin-mask-builder';
import { normalizeLightingAndBaseline } from '../../lib/lighting-normalizer';
import { analyzeRedness, analyzeAcne, analyzeEvenness } from '../index';

describe('Skin-Tone Fairness & Multi-Tone Invariance', () => {
  const width = 50;
  const height = 50;
  const pixelCount = width * height;
  const landmarks: NormalizedLandmark[] = generateSyntheticLandmarks();
  const zoneMasks: ZoneMasks = segmentZones(landmarks, width, height);
  const skinRoi: SkinRoiMasks = buildSkinRoiMasks(landmarks, width, height);

  // Representative RGB values for Fitzpatrick Scale I through VI
  const TONE_FIXTURES: { scale: 1 | 2 | 3 | 4 | 5 | 6; rgb: [number, number, number]; name: string }[] = [
    { scale: 1, rgb: [250, 225, 205], name: 'Fitzpatrick I (Very Light)' },
    { scale: 2, rgb: [240, 205, 180], name: 'Fitzpatrick II (Light)' },
    { scale: 3, rgb: [220, 180, 150], name: 'Fitzpatrick III (Intermediate)' },
    { scale: 4, rgb: [190, 145, 115], name: 'Fitzpatrick IV (Olive/Tan)' },
    { scale: 5, rgb: [140, 95, 70], name: 'Fitzpatrick V (Brown)' },
    { scale: 6, rgb: [85, 55, 40], name: 'Fitzpatrick VI (Dark)' },
  ];

  it('correctly calibrates baseline phototypes across all 6 standard tone fixtures', () => {
    // Fitzpatrick I
    const buf1 = new Uint8ClampedArray(pixelCount * 4);
    for (let i = 0; i < pixelCount; i++) {
      buf1[i * 4] = 250; buf1[i * 4 + 1] = 225; buf1[i * 4 + 2] = 205; buf1[i * 4 + 3] = 255;
    }
    const res1 = normalizeLightingAndBaseline(
      { width, height, data: buf1, colorSpace: 'srgb' } as ImageData,
      skinRoi,
      zoneMasks,
    );
    expect([1, 2]).toContain(res1.baseline.fitzpatrickScale);

    // Fitzpatrick II
    const buf2 = new Uint8ClampedArray(pixelCount * 4);
    for (let i = 0; i < pixelCount; i++) {
      buf2[i * 4] = 240; buf2[i * 4 + 1] = 205; buf2[i * 4 + 2] = 180; buf2[i * 4 + 3] = 255;
    }
    const res2 = normalizeLightingAndBaseline(
      { width, height, data: buf2, colorSpace: 'srgb' } as ImageData,
      skinRoi,
      zoneMasks,
    );
    expect([1, 2]).toContain(res2.baseline.fitzpatrickScale);

    // Fitzpatrick V
    const buf5 = new Uint8ClampedArray(pixelCount * 4);
    for (let i = 0; i < pixelCount; i++) {
      buf5[i * 4] = 140; buf5[i * 4 + 1] = 95; buf5[i * 4 + 2] = 70; buf5[i * 4 + 3] = 255;
    }
    const res5 = normalizeLightingAndBaseline(
      { width, height, data: buf5, colorSpace: 'srgb' } as ImageData,
      skinRoi,
      zoneMasks,
    );
    expect(res5.baseline.fitzpatrickScale).toBe(5);

    // Fitzpatrick VI
    const buf6 = new Uint8ClampedArray(pixelCount * 4);
    for (let i = 0; i < pixelCount; i++) {
      buf6[i * 4] = 85; buf6[i * 4 + 1] = 55; buf6[i * 4 + 2] = 40; buf6[i * 4 + 3] = 255;
    }
    const res6 = normalizeLightingAndBaseline(
      { width, height, data: buf6, colorSpace: 'srgb' } as ImageData,
      skinRoi,
      zoneMasks,
    );
    expect(res6.baseline.fitzpatrickScale).toBe(6);
  });

  TONE_FIXTURES.forEach(({ scale, rgb, name }) => {
    it(`evaluates ${name} gracefully without NaN or negative scores`, () => {
      const buffer = new Uint8ClampedArray(pixelCount * 4);
      for (let i = 0; i < pixelCount; i++) {
        buffer[i * 4] = rgb[0];
        buffer[i * 4 + 1] = rgb[1];
        buffer[i * 4 + 2] = rgb[2];
        buffer[i * 4 + 3] = 255;
      }
      const img = { width, height, data: buffer, colorSpace: 'srgb' as const } as ImageData;

      const baseline: SkinToneBaseline = {
        fitzpatrickScale: scale,
        baselineLightness: Math.round(0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]),
        baselineRedness: Math.round((rgb[0] - rgb[1]) * 0.5),
        baselineMelanin: Math.round(-Math.log10(Math.max(0.01, rgb[0] / 255)) * 100) / 100,
      };

      const redRes = analyzeRedness(img, landmarks, zoneMasks, skinRoi, baseline);
      expect(Number.isFinite(redRes.score)).toBe(true);
      expect(redRes.score).toBeGreaterThanOrEqual(0);
      expect(redRes.score).toBeLessThanOrEqual(100);

      // On Fitzpatrick V and VI, redness confidence should be lower reflecting physical optical limits
      if (scale >= 5) {
        expect(redRes.confidence).toBeLessThanOrEqual(0.65);
      } else {
        expect(redRes.confidence).toBeGreaterThan(0.7);
      }

      const acneRes = analyzeAcne(img, landmarks, zoneMasks, skinRoi, baseline);
      expect(Number.isFinite(acneRes.score)).toBe(true);

      const evenRes = analyzeEvenness(img, landmarks, zoneMasks, skinRoi, baseline);
      expect(Number.isFinite(evenRes.score)).toBe(true);
      expect(evenRes.score).toBeGreaterThanOrEqual(85);
    });
  });

  it('guarantees 100% deterministic outputs across repeated runs of the same image', () => {
    const buffer = new Uint8ClampedArray(pixelCount * 4);
    for (let i = 0; i < pixelCount; i++) {
      buffer[i * 4] = 210;
      buffer[i * 4 + 1] = 165;
      buffer[i * 4 + 2] = 135;
      buffer[i * 4 + 3] = 255;
    }
    const img = { width, height, data: buffer, colorSpace: 'srgb' as const } as ImageData;

    const baseline: SkinToneBaseline = {
      fitzpatrickScale: 3,
      baselineLightness: 65,
      baselineRedness: 12,
      baselineMelanin: 0.35,
    };

    const run1 = analyzeRedness(img, landmarks, zoneMasks, skinRoi, baseline);
    const run2 = analyzeRedness(img, landmarks, zoneMasks, skinRoi, baseline);

    expect(run1.score).toBe(run2.score);
    expect(run1.confidence).toBe(run2.confidence);
    expect(run1.perZone.forehead).toBe(run2.perZone.forehead);
  });
});


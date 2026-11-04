import { describe, it, expect } from 'vitest';
import type { SkinToneBaseline, NormalizedLandmark } from '@/shared/types';
import type { ZoneMasks, SkinRoiMasks } from '../../types';
import { generateSyntheticLandmarks } from '../../pipeline/face-understanding';
import { segmentZones } from '../../lib/zone-segmenter';
import { buildSkinRoiMasks } from '../../lib/skin-mask-builder';
import {
  analyzeRedness,
  analyzeAcne,
  analyzePigmentation,
  analyzeOiliness,
  analyzeTexture,
  analyzeUnderEye,
  analyzeFineLines,
  analyzeEvenness,
} from '../index';

describe('Classical CV Skin Analyzers', () => {
  const width = 60;
  const height = 60;
  const pixelCount = width * height;
  const landmarks: NormalizedLandmark[] = generateSyntheticLandmarks();
  const zoneMasks: ZoneMasks = segmentZones(landmarks, width, height);
  const skinRoi: SkinRoiMasks = buildSkinRoiMasks(landmarks, width, height);

  const baselineType3: SkinToneBaseline = {
    fitzpatrickScale: 3,
    baselineLightness: 65,
    baselineRedness: 12,
    baselineMelanin: 0.35,
  };

  function createUniformSkinImageData(r = 215, g = 175, b = 150): ImageData {
    const buffer = new Uint8ClampedArray(pixelCount * 4);
    for (let i = 0; i < pixelCount; i++) {
      buffer[i * 4] = r;
      buffer[i * 4 + 1] = g;
      buffer[i * 4 + 2] = b;
      buffer[i * 4 + 3] = 255;
    }
    return { width, height, data: buffer, colorSpace: 'srgb' as const } as ImageData;
  }

  describe('Redness Analyzer', () => {
    it('returns near-perfect calm score on uniform baseline skin', () => {
      const img = createUniformSkinImageData();
      const res = analyzeRedness(img, landmarks, zoneMasks, skinRoi, baselineType3);

      expect(res.score).toBeGreaterThanOrEqual(90);
      expect(res.confidence).toBeGreaterThan(0.7);
      expect((res.heatmap as Float32Array).length).toBe(pixelCount);
    });

    it('detects high erythema patches and reduces wellness score', () => {
      const img = createUniformSkinImageData();
      // Inject strong redness patch (R=255, G=70, B=70) into forehead and cheeks
      const forehead = zoneMasks.forehead.mask;
      const leftCheek = zoneMasks.leftCheek.mask;
      for (let i = 0; i < pixelCount; i++) {
        if ((forehead[i] === 255 || leftCheek[i] === 255) && skinRoi.binaryMask[i] === 255) {
          img.data[i * 4] = 255;
          img.data[i * 4 + 1] = 70;
          img.data[i * 4 + 2] = 70;
        }
      }

      const res = analyzeRedness(img, landmarks, zoneMasks, skinRoi, baselineType3);
      expect(res.score).toBeLessThan(80);
      expect(res.perZone.forehead).toBeLessThan(75);
    });
  });

  describe('Acne & Blemish Analyzer', () => {
    it('returns high score on clean skin without spots', () => {
      const img = createUniformSkinImageData();
      const res = analyzeAcne(img, landmarks, zoneMasks, skinRoi, baselineType3);
      expect(res.score).toBeGreaterThanOrEqual(90);
    });

    it('identifies localized inflammatory spot blobs', () => {
      const img = createUniformSkinImageData();
      // Place a cluster of high-contrast red papules inside the cheek zone
      const cheekMask = zoneMasks.leftCheek.mask;
      let placedCount = 0;
      for (let i = 0; i < pixelCount; i++) {
        if (cheekMask[i] === 255 && skinRoi.binaryMask[i] === 255) {
          const idx = i * 4;
          img.data[idx] = 255;
          img.data[idx + 1] = 40;
          img.data[idx + 2] = 40;
          placedCount++;
          if (placedCount >= 16) break; // 4x4 spot
        }
      }

      const res = analyzeAcne(img, landmarks, zoneMasks, skinRoi, baselineType3);
      expect(res.score).toBeLessThan(95);
    });
  });

  describe('Pigmentation Analyzer', () => {
    it('evaluates hyperpigmentation contrast against local background', () => {
      const img = createUniformSkinImageData();
      const res = analyzePigmentation(img, landmarks, zoneMasks, skinRoi, baselineType3);
      expect(res.score).toBeGreaterThanOrEqual(90);
    });
  });

  describe('Oiliness Analyzer', () => {
    it('detects specular glare shine in T-Zone', () => {
      const img = createUniformSkinImageData();
      // Add specular shine highlight (L > 220, saturation < 0.1)
      const tzone = zoneMasks.tZone.mask;
      for (let i = 0; i < pixelCount; i++) {
        if (tzone[i] === 255) {
          img.data[i * 4] = 245;
          img.data[i * 4 + 1] = 245;
          img.data[i * 4 + 2] = 245;
        }
      }

      const res = analyzeOiliness(img, landmarks, zoneMasks, skinRoi, baselineType3);
      expect(res.score).toBeLessThan(75);
    });
  });

  describe('Texture & Pores Analyzer', () => {
    it('evaluates smooth surfaces favorably', () => {
      const img = createUniformSkinImageData();
      const res = analyzeTexture(img, landmarks, zoneMasks, skinRoi, baselineType3);
      expect(res.score).toBeGreaterThanOrEqual(85);
    });
  });

  describe('Under-Eye Vitality Analyzer', () => {
    it('detects darkness deficit between cheek and under-eye', () => {
      const img = createUniformSkinImageData(200, 160, 140);
      // Darken under-eye zones
      const underEye = zoneMasks.underEyeLeft.mask;
      for (let i = 0; i < pixelCount; i++) {
        if (underEye[i] === 255) {
          img.data[i * 4] = 120;
          img.data[i * 4 + 1] = 90;
          img.data[i * 4 + 2] = 80;
        }
      }

      const res = analyzeUnderEye(img, landmarks, zoneMasks, skinRoi, baselineType3);
      expect(res.score).toBeLessThan(80);
    });
  });

  describe('Fine Lines Analyzer', () => {
    it('detects directional creases', () => {
      const img = createUniformSkinImageData();
      // Draw horizontal crease line in forehead
      for (let x = 15; x < 45; x++) {
        const idx = (15 * width + x) * 4;
        img.data[idx] = 60;
        img.data[idx + 1] = 40;
        img.data[idx + 2] = 40;
      }

      const res = analyzeFineLines(img, landmarks, zoneMasks, skinRoi, baselineType3);
      expect(res.perZone.forehead).toBeLessThan(95);
    });
  });

  describe('Overall Evenness Analyzer', () => {
    it('awards high uniformity score to homogeneous skin', () => {
      const img = createUniformSkinImageData();
      const res = analyzeEvenness(img, landmarks, zoneMasks, skinRoi, baselineType3);
      expect(res.score).toBeGreaterThanOrEqual(90);
    });
  });
});

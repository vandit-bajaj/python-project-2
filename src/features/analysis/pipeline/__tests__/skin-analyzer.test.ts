import { describe, it, expect } from 'vitest';
import { runComprehensiveSkinAnalysis } from '../skin-analyzer';
import { generateSyntheticLandmarks } from '../face-understanding';
import { segmentZones } from '../../lib/zone-segmenter';
import { buildSkinRoiMasks } from '../../lib/skin-mask-builder';
import type { FaceUnderstandingResult } from '../../types';

describe('Comprehensive Skin Analysis Pipeline', () => {
  it('orchestrates all 8 analyzers and returns valid structured report', () => {
    const width = 50;
    const height = 50;
    const pixelCount = width * height;
    const landmarks = generateSyntheticLandmarks();
    const zoneMasks = segmentZones(landmarks, width, height);
    const skinRoi = buildSkinRoiMasks(landmarks, width, height);

    const buffer = new Uint8ClampedArray(pixelCount * 4);
    for (let i = 0; i < pixelCount; i++) {
      buffer[i * 4] = 220;
      buffer[i * 4 + 1] = 180;
      buffer[i * 4 + 2] = 150;
      buffer[i * 4 + 3] = 255;
    }
    const normalizedImageData = {
      width,
      height,
      data: buffer,
      colorSpace: 'srgb' as const,
    } as ImageData;

    const faceData: FaceUnderstandingResult = {
      landmarks,
      zoneMasks,
      skinRoi,
      normalizedImageData,
      baseline: {
        fitzpatrickScale: 2,
        baselineLightness: 72,
        baselineRedness: 14,
        baselineMelanin: 0.28,
      },
      confidence: 0.95,
    };

    const report = runComprehensiveSkinAnalysis(faceData);

    expect(report.id).toMatch(/^scan_/);
    expect(report.overallScore).toBeGreaterThanOrEqual(0);
    expect(report.overallScore).toBeLessThanOrEqual(100);
    expect(report.confidence).toBeGreaterThan(0.5);
    expect(report.disclaimer).toContain('non-diagnostic skin-wellness insights');

    // Assert all 8 metrics exist
    const metricKeys = [
      'redness',
      'acne',
      'pigmentation',
      'oiliness',
      'texture',
      'underEyeDarkness',
      'fineLines',
      'evenness',
    ] as const;

    for (const key of metricKeys) {
      const metric = report.metrics[key];
      expect(metric).toBeDefined();
      expect(metric.score).toBeGreaterThanOrEqual(0);
      expect(metric.score).toBeLessThanOrEqual(100);
      expect(metric.confidence).toBeGreaterThan(0);
      expect(metric.perZone.forehead).toBeDefined();
      expect(metric.heatmap.length).toBe(pixelCount);
    }
  });
});

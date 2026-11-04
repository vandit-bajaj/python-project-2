import { describe, it, expect } from 'vitest';
import {
  calculateLuminance,
  calculateSharpnessVariance,
  analyzeFraming,
  assessQuality,
} from './quality-analyzer';

// Helper to create synthetic ImageData without browser mocks
function createMockImageData(
  width: number,
  height: number,
  fillFn: (x: number, y: number) => [number, number, number, number],
): ImageData {
  const buffer = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const [r, g, b, a] = fillFn(x, y);
      buffer[idx] = r;
      buffer[idx + 1] = g;
      buffer[idx + 2] = b;
      buffer[idx + 3] = a;
    }
  }

  return {
    width,
    height,
    data: buffer,
    colorSpace: 'srgb',
  } as ImageData;
}

describe('Quality Gate Analyzer', () => {
  describe('calculateLuminance', () => {
    it('accurately computes pure black (0 luminance)', () => {
      const img = createMockImageData(10, 10, () => [0, 0, 0, 255]);
      expect(calculateLuminance(img)).toBe(0);
    });

    it('accurately computes pure white (255 luminance)', () => {
      const img = createMockImageData(10, 10, () => [255, 255, 255, 255]);
      expect(Math.round(calculateLuminance(img))).toBe(255);
    });

    it('correctly weighs green channel higher in perceptual luminance', () => {
      const pureGreen = createMockImageData(10, 10, () => [0, 255, 0, 255]);
      const pureBlue = createMockImageData(10, 10, () => [0, 0, 255, 255]);

      const lumGreen = calculateLuminance(pureGreen);
      const lumBlue = calculateLuminance(pureBlue);

      expect(lumGreen).toBeGreaterThan(lumBlue);
    });
  });

  describe('calculateSharpnessVariance', () => {
    it('reports low variance for flat, uniform images (blurry)', () => {
      const flat = createMockImageData(50, 50, () => [128, 128, 128, 255]);
      expect(calculateSharpnessVariance(flat)).toBe(0);
    });

    it('reports high variance for high-contrast textured patterns (sharp)', () => {
      const textured = createMockImageData(50, 50, (x, y) => {
        const val = (x + y) % 2 === 0 ? 255 : 0;
        return [val, val, val, 255];
      });

      expect(calculateSharpnessVariance(textured)).toBeGreaterThan(100);
    });
  });

  describe('analyzeFraming', () => {
    it('detects centered positioning when luminance is balanced across sides', () => {
      const balanced = createMockImageData(60, 60, () => [128, 128, 128, 255]);
      const result = analyzeFraming(balanced);
      expect(result.status).toBe('centered');
    });

    it('detects off-center positioning when significant left/right asymmetry exists', () => {
      const asymmetric = createMockImageData(60, 60, (x) => {
        // Left side dark, right side extremely bright
        return x < 30 ? [10, 10, 10, 255] : [240, 240, 240, 255];
      });
      const result = analyzeFraming(asymmetric);
      expect(result.status).toBe('off_center');
    });
  });

  describe('assessQuality composite evaluation', () => {
    it('flags underexposed frames with guidance to face the light', () => {
      const darkImage = createMockImageData(50, 50, () => [20, 20, 20, 255]);
      const result = assessQuality(darkImage);

      expect(result.isAcceptable).toBe(false);
      expect(result.lighting.status).toBe('too_dark');
      expect(result.overallMessage).toMatch(/face the light/i);
    });

    it('flags overexposed glare frames', () => {
      const glareImage = createMockImageData(50, 50, () => [245, 245, 245, 255]);
      const result = assessQuality(glareImage);

      expect(result.lighting.status).toBe('too_bright');
    });

    it('accepts balanced, sharp images', () => {
      const balancedSharp = createMockImageData(100, 100, (x, y) => {
        // High frequency gradient in center
        const lum = 120 + ((x * y) % 60);
        return [lum, lum, lum, 255];
      });

      const result = assessQuality(balancedSharp);
      expect(result.lighting.status).toBe('good');
      expect(result.sharpness.status).toBe('sharp');
      expect(result.isAcceptable).toBe(true);
    });
  });
});

import { describe, it, expect } from 'vitest';
import { calculateFitDimensions, releaseBitmap } from './image-processor';

describe('Image Processor Utilities', () => {
  describe('calculateFitDimensions', () => {
    it('returns exact dimensions when image is within bounds', () => {
      const { width, height } = calculateFitDimensions(800, 600, 1920);
      expect(width).toBe(800);
      expect(height).toBe(600);
    });

    it('scales down landscape dimensions preserving aspect ratio', () => {
      const { width, height } = calculateFitDimensions(3840, 2160, 1920);
      expect(width).toBe(1920);
      expect(height).toBe(1080);
    });

    it('scales down portrait dimensions preserving aspect ratio', () => {
      const { width, height } = calculateFitDimensions(2000, 4000, 1000);
      expect(width).toBe(500);
      expect(height).toBe(1000);
    });
  });

  describe('releaseBitmap memory cleanup', () => {
    it('gracefully handles null and undefined without throwing', () => {
      expect(() => releaseBitmap(null)).not.toThrow();
      expect(() => releaseBitmap(undefined)).not.toThrow();
    });

    it('invokes close on ImageBitmap instances', () => {
      let closed = false;
      const mockBitmap = {
        close: () => {
          closed = true;
        },
      } as unknown as ImageBitmap;

      releaseBitmap(mockBitmap);
      expect(closed).toBe(true);
    });
  });
});

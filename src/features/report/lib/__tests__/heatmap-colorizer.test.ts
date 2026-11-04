import { describe, it, expect } from 'vitest';
import { getHeatmapColor, createHeatmapImageData } from '../heatmap-colorizer';

describe('Heatmap Colorizer', () => {
  it('returns transparent alpha for near-zero values', () => {
    const [, , , a] = getHeatmapColor(0.01);
    expect(a).toBe(0);
  });

  it('generates valid RGBA values across intensity spectrum [0, 1]', () => {
    const steps = [0.1, 0.3, 0.5, 0.7, 0.9, 1.0];
    for (const t of steps) {
      const [r, g, b, a] = getHeatmapColor(t);
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThanOrEqual(255);
      expect(g).toBeGreaterThanOrEqual(0);
      expect(g).toBeLessThanOrEqual(255);
      expect(b).toBeGreaterThanOrEqual(0);
      expect(b).toBeLessThanOrEqual(255);
      expect(a).toBeGreaterThan(0);
      expect(a).toBeLessThanOrEqual(255);
    }
  });

  it('creates valid ImageData buffer from float heatmap', () => {
    const width = 10;
    const height = 10;
    const heatmap = new Float32Array(width * height);
    heatmap[0] = 0.8;
    heatmap[50] = 0.2;

    const imgData = createHeatmapImageData(heatmap, width, height);
    expect(imgData.width).toBe(width);
    expect(imgData.height).toBe(height);
    expect(imgData.data.length).toBe(width * height * 4);
  });
});

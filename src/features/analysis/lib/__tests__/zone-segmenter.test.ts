import { describe, it, expect } from 'vitest';
import { getZonePolygon, rasterizePolygon, segmentZones } from '../zone-segmenter';
import { generateSyntheticLandmarks } from '../../pipeline/face-understanding';

describe('Zone Segmenter', () => {
  it('correctly maps normalized landmarks to pixel coordinates', () => {
    const landmarks = [
      { x: 0.1, y: 0.2, z: 0 },
      { x: 0.5, y: 0.8, z: 0 },
    ];
    const polygon = getZonePolygon(landmarks, [0, 1], 100, 200);

    expect(polygon).toEqual([
      { x: 10, y: 40 },
      { x: 50, y: 160 },
    ]);
  });

  it('rasterizes a simple triangle polygon inside pixel bounds', () => {
    const width = 20;
    const height = 20;
    // Triangle: (5,5), (15,5), (10,15)
    const points = [
      { x: 5, y: 5 },
      { x: 15, y: 5 },
      { x: 10, y: 15 },
    ];

    const mask = rasterizePolygon(points, width, height);
    expect(mask.length).toBe(width * height);

    // Centroid of triangle should be marked (10, 8)
    const centerIdx = 8 * width + 10;
    expect(mask[centerIdx]).toBe(255);

    // Outside triangle should be 0 (0, 0)
    expect(mask[0]).toBe(0);
    // (19, 19) should be 0
    expect(mask[19 * width + 19]).toBe(0);
  });

  it('segments all 7 facial zones without errors on synthetic face landmarks', () => {
    const landmarks = generateSyntheticLandmarks();
    const width = 120;
    const height = 120;

    const zones = segmentZones(landmarks, width, height);

    expect(zones.forehead).toBeDefined();
    expect(zones.leftCheek).toBeDefined();
    expect(zones.rightCheek).toBeDefined();
    expect(zones.nose).toBeDefined();
    expect(zones.chin).toBeDefined();
    expect(zones.tZone).toBeDefined();
    expect(zones.underEyeLeft).toBeDefined();
    expect(zones.underEyeRight).toBeDefined();
    expect(zones.jawline).toBeDefined();

    // Verify all zone masks have correct dimensions
    for (const [zoneId, zoneData] of Object.entries(zones)) {
      expect(zoneData.width).toBe(width);
      expect(zoneData.height).toBe(height);
      expect(zoneData.mask.length).toBe(width * height);

      // Verify that at least some pixels are segmented
      const filledCount = zoneData.mask.filter((val) => val === 255).length;
      expect(filledCount, `Zone ${zoneId} should have filled pixels`).toBeGreaterThan(0);
    }
  });
});

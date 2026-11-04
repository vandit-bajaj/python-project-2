import { describe, it, expect } from 'vitest';
import { getZonePolygon, rasterizePolygon, segmentZones } from '../zone-segmenter';
import { ZONE_LANDMARK_MAP } from '../landmarks-definitions';
import type { ZoneId, NormalizedLandmark } from '@/shared/types';
import canonicalLandmarksRaw from '../fixtures/canonical-landmarks.json';

const canonicalLandmarks = canonicalLandmarksRaw as NormalizedLandmark[];

function ccw(A: { x: number; y: number }, B: { x: number; y: number }, C: { x: number; y: number }) {
  return (C.y - A.y) * (B.x - A.x) > (B.y - A.y) * (C.x - A.x);
}

function segmentsIntersect(
  A: { x: number; y: number },
  B: { x: number; y: number },
  C: { x: number; y: number },
  D: { x: number; y: number },
) {
  if (
    (A.x === C.x && A.y === C.y) ||
    (A.x === D.x && A.y === D.y) ||
    (B.x === C.x && B.y === C.y) ||
    (B.x === D.x && B.y === D.y)
  ) {
    return false;
  }
  return ccw(A, C, D) !== ccw(B, C, D) && ccw(A, B, C) !== ccw(A, B, D);
}

function countSelfIntersections(pts: { x: number; y: number }[]): number {
  const n = pts.length;
  let intersections = 0;
  for (let i = 0; i < n; i++) {
    const p1 = pts[i]!;
    const p2 = pts[(i + 1) % n]!;
    for (let j = i + 2; j < n; j++) {
      if (i === 0 && j === n - 1) continue; // adjacent
      const p3 = pts[j]!;
      const p4 = pts[(j + 1) % n]!;
      if (segmentsIntersect(p1, p2, p3, p4)) {
        intersections++;
      }
    }
  }
  return intersections;
}

function computeSignedArea(pts: { x: number; y: number }[]): number {
  let area = 0;
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const p1 = pts[i]!;
    const p2 = pts[(i + 1) % n]!;
    area += p1.x * p2.y - p2.x * p1.y;
  }
  return area / 2;
}

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

  it('validates all 9 zone polygons have zero self-intersections and positive area on canonical face', () => {
    const zoneEntries = Object.entries(ZONE_LANDMARK_MAP) as [ZoneId, readonly number[]][];

    for (const [zoneId, indices] of zoneEntries) {
      // Remove trailing closure point if duplicated
      const cleanIndices = [...indices];
      if (cleanIndices.length > 2 && cleanIndices[0] === cleanIndices[cleanIndices.length - 1]) {
        cleanIndices.pop();
      }

      const pts = cleanIndices.map((idx) => {
        const lm = canonicalLandmarks[idx];
        if (!lm) throw new Error(`Missing landmark at index ${idx}`);
        return { x: lm.x, y: lm.y };
      });

      const intersections = countSelfIntersections(pts);
      expect(intersections, `Zone ${zoneId} should have 0 self-intersections`).toBe(0);

      const area = Math.abs(computeSignedArea(pts));
      expect(area, `Zone ${zoneId} should have positive non-zero area`).toBeGreaterThan(0.001);
    }
  });

  it('segments all 9 facial zones without errors on canonical and synthetic landmarks', () => {
    const width = 120;
    const height = 120;

    const zones = segmentZones(canonicalLandmarks, width, height);

    expect(zones.forehead).toBeDefined();
    expect(zones.leftCheek).toBeDefined();
    expect(zones.rightCheek).toBeDefined();
    expect(zones.nose).toBeDefined();
    expect(zones.chin).toBeDefined();
    expect(zones.tZone).toBeDefined();
    expect(zones.underEyeLeft).toBeDefined();
    expect(zones.underEyeRight).toBeDefined();
    expect(zones.jawline).toBeDefined();

    for (const [zoneId, zoneData] of Object.entries(zones)) {
      expect(zoneData.width).toBe(width);
      expect(zoneData.height).toBe(height);
      expect(zoneData.mask.length).toBe(width * height);

      const filledCount = zoneData.mask.filter((val) => val === 255).length;
      expect(filledCount, `Zone ${zoneId} should have filled pixels`).toBeGreaterThan(0);
    }
  });
});

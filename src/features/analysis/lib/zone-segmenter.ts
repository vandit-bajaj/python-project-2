import type { NormalizedLandmark, ZoneId } from '@/shared/types';
import { ZONE_LANDMARK_MAP } from './landmarks-definitions';
import type { ZoneMasks } from '../types';

export interface Point2D {
  x: number;
  y: number;
}

/**
 * Maps normalized landmarks to pixel coordinates.
 */
export function getZonePolygon(
  landmarks: NormalizedLandmark[],
  indices: readonly number[],
  width: number,
  height: number,
): Point2D[] {
  const points: Point2D[] = [];
  for (const idx of indices) {
    const lm = landmarks[idx];
    if (lm) {
      points.push({
        x: Math.round(lm.x * width),
        y: Math.round(lm.y * height),
      });
    }
  }
  return points;
}

/**
 * Standard scanline polygon rasterizer (Point-In-Polygon via Ray Casting).
 * Completely deterministic and pure, runs in any environment without DOM or Canvas.
 */
export function rasterizePolygon(
  points: Point2D[],
  width: number,
  height: number,
): Uint8ClampedArray {
  const mask = new Uint8ClampedArray(width * height);
  if (points.length < 3) return mask;

  // Find bounding box to minimize scan iterations
  let minX = width;
  let maxX = 0;
  let minY = height;
  let maxY = 0;

  for (const p of points) {
    if (p.x < minX) minX = Math.max(0, p.x);
    if (p.x > maxX) maxX = Math.min(width - 1, p.x);
    if (p.y < minY) minY = Math.max(0, p.y);
    if (p.y > maxY) maxY = Math.min(height - 1, p.y);
  }

  const numPoints = points.length;

  for (let y = minY; y <= maxY; y++) {
    // Scanline intersection with polygon edges
    const nodeX: number[] = [];
    let j = numPoints - 1;

    for (let i = 0; i < numPoints; i++) {
      const pi = points[i];
      const pj = points[j];
      if (!pi || !pj) continue;

      if ((pi.y < y && pj.y >= y) || (pj.y < y && pi.y >= y)) {
        const x = pi.x + ((y - pi.y) / (pj.y - pi.y)) * (pj.x - pi.x);
        nodeX.push(x);
      }
      j = i;
    }

    nodeX.sort((a, b) => a - b);

    // Fill pixels between alternating pairs of intersections
    for (let i = 0; i < nodeX.length; i += 2) {
      const xStartVal = nodeX[i];
      const xEndVal = nodeX[i + 1];
      if (xStartVal === undefined || xEndVal === undefined) continue;

      let startX = Math.max(minX, Math.ceil(xStartVal));
      const endX = Math.min(maxX, Math.floor(xEndVal));

      while (startX <= endX) {
        mask[y * width + startX] = 255;
        startX++;
      }
    }
  }

  return mask;
}

/**
 * Segments all facial zones from 478 landmarks into binary masks.
 */
export function segmentZones(
  landmarks: NormalizedLandmark[],
  width: number,
  height: number,
): ZoneMasks {
  const result: Partial<ZoneMasks> = {};

  const zoneEntries = Object.entries(ZONE_LANDMARK_MAP) as [ZoneId, readonly number[]][];

  for (const [zoneId, indices] of zoneEntries) {
    const polygon = getZonePolygon(landmarks, indices, width, height);
    const mask = rasterizePolygon(polygon, width, height);
    result[zoneId] = {
      width,
      height,
      mask,
    };
  }

  return result as ZoneMasks;
}

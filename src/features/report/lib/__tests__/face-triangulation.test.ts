import { describe, it, expect } from 'vitest';
import {
  computeFaceTriangulation,
  computeFaceUVs,
  CANONICAL_FACEMESH_INDICES,
} from '../face-triangulation';
import { generateSyntheticLandmarks } from '@/features/analysis';

describe('Canonical MediaPipe Face Triangulation Engine', () => {
  it('handles empty or small landmark sets gracefully', () => {
    expect(computeFaceTriangulation([]).length).toBe(0);
    expect(computeFaceTriangulation([{ x: 0.5, y: 0.5, z: 0 }]).length).toBe(0);
  });

  it('uses canonical MediaPipe topology with exactly 852 triangles (2556 indices)', () => {
    expect(CANONICAL_FACEMESH_INDICES.length).toBe(2556);
    expect(CANONICAL_FACEMESH_INDICES.length % 3).toBe(0);

    const landmarks = generateSyntheticLandmarks();
    const indices = computeFaceTriangulation(landmarks);

    expect(indices.length).toBe(2556);

    // Every index must be a valid vertex index within landmark bounds (0..467)
    for (let i = 0; i < indices.length; i++) {
      const idx = indices[i]!;
      expect(idx).toBeGreaterThanOrEqual(0);
      expect(idx).toBeLessThan(468);
    }
  });

  it('computes valid normalized UV coordinates', () => {
    const landmarks = generateSyntheticLandmarks();
    const uvs = computeFaceUVs(landmarks);

    expect(uvs.length).toBe(landmarks.length * 2);
    for (let i = 0; i < landmarks.length; i++) {
      const u = uvs[i * 2]!;
      const v = uvs[i * 2 + 1]!;
      expect(u).toBeGreaterThanOrEqual(0);
      expect(u).toBeLessThanOrEqual(1);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });
});



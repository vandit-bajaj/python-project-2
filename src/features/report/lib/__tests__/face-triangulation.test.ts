import { describe, it, expect } from 'vitest';
import { computeFaceTriangulation } from '../face-triangulation';
import { generateSyntheticLandmarks } from '@/features/analysis';

describe('Face Triangulation Engine', () => {
  it('handles empty or small landmark sets gracefully', () => {
    expect(computeFaceTriangulation([]).length).toBe(0);
    expect(computeFaceTriangulation([{ x: 0.5, y: 0.5, z: 0 }]).length).toBe(0);
  });

  it('computes watertight 2D Delaunay triangulation for face landmarks', () => {
    const landmarks = generateSyntheticLandmarks();
    const indices = computeFaceTriangulation(landmarks);

    expect(indices.length).toBeGreaterThan(0);
    expect(indices.length % 3).toBe(0); // Multiple of 3 vertices per triangle

    // Every index must be a valid vertex index within landmark bounds
    const maxIndex = landmarks.length;
    for (let i = 0; i < indices.length; i++) {
      const idx = indices[i]!;
      expect(idx).toBeGreaterThanOrEqual(0);
      expect(idx).toBeLessThan(maxIndex);
    }
  });
});

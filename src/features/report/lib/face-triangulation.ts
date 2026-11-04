import { FaceLandmarker } from '@mediapipe/tasks-vision';
import type { NormalizedLandmark } from '@/shared/types';

/**
 * Static canonical MediaPipe FaceMesh triangulation indices.
 * Comprises 852 triangles (2,556 indices) matching the canonical 468-point face mesh.
 * Crucially preserves open eye sockets and an open oral cavity without artificial bridging.
 */
export const CANONICAL_FACEMESH_INDICES: Uint16Array = (() => {
  const tess = FaceLandmarker.FACE_LANDMARKS_TESSELATION;
  if (!tess || tess.length === 0) return new Uint16Array();
  const indices = new Uint16Array(tess.length);
  for (let i = 0; i < tess.length; i += 3) {
    indices[i] = tess[i]!.start;
    indices[i + 1] = tess[i + 1]!.start;
    indices[i + 2] = tess[i + 2]!.start;
  }
  return indices;
})();

/**
 * Returns canonical MediaPipe face mesh triangulation indices.
 * If landmark set is truncated or smaller than 468 vertices, filters triangles
 * to keep only valid vertex bounds.
 */
export function computeFaceTriangulation(landmarks: NormalizedLandmark[]): Uint16Array {
  const n = landmarks.length;
  if (n < 3) return new Uint16Array();

  if (n >= 468) {
    return CANONICAL_FACEMESH_INDICES;
  }

  // Filter triangles for partial or small landmark arrays
  const validIndices: number[] = [];
  for (let i = 0; i < CANONICAL_FACEMESH_INDICES.length; i += 3) {
    const a = CANONICAL_FACEMESH_INDICES[i]!;
    const b = CANONICAL_FACEMESH_INDICES[i + 1]!;
    const c = CANONICAL_FACEMESH_INDICES[i + 2]!;
    if (a < n && b < n && c < n) {
      validIndices.push(a, b, c);
    }
  }

  return new Uint16Array(validIndices);
}

/**
 * Computes normalized UV coordinates matching the front-facing portrait.
 * For each vertex, UV is derived from normalized image plane coordinates (x, 1 - y).
 */
export function computeFaceUVs(landmarks: NormalizedLandmark[]): Float32Array {
  const uvs = new Float32Array(landmarks.length * 2);
  for (let i = 0; i < landmarks.length; i++) {
    const lm = landmarks[i]!;
    uvs[i * 2] = lm.x;
    uvs[i * 2 + 1] = 1.0 - lm.y;
  }
  return uvs;
}



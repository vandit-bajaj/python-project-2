import type { NormalizedLandmark } from '@/shared/types';

/**
 * Computes 2D Delaunay triangulation for facial landmark vertices (x, y)
 * using the Bowyer-Watson incremental algorithm.
 * Guarantees a watertight triangle mesh for Three.js geometry.
 */
export function computeFaceTriangulation(landmarks: NormalizedLandmark[]): Uint16Array {
  const n = landmarks.length;
  if (n < 3) return new Uint16Array();

  // Super-triangle bounding all points in [0, 1] space
  const vertices: { x: number; y: number }[] = landmarks.map((lm) => ({ x: lm.x, y: lm.y }));

  const minX = -10;
  const maxX = 10;
  const minY = -10;
  const maxY = 10;

  const stA = vertices.length;
  const stB = vertices.length + 1;
  const stC = vertices.length + 2;

  vertices.push(
    { x: minX - 100, y: minY - 100 },
    { x: maxX + 100, y: minY - 100 },
    { x: (minX + maxX) / 2, y: maxY + 200 },
  );

  interface Triangle {
    a: number;
    b: number;
    c: number;
    circle: { x: number; y: number; rSq: number };
  }

  function getCircumcircle(p1: { x: number; y: number }, p2: { x: number; y: number }, p3: { x: number; y: number }) {
    const dA = p1.x * p1.x + p1.y * p1.y;
    const dB = p2.x * p2.x + p2.y * p2.y;
    const dC = p3.x * p3.x + p3.y * p3.y;

    const aux1 = dA * (p3.y - p2.y) + dB * (p1.y - p3.y) + dC * (p2.y - p1.y);
    const aux2 = -(dA * (p3.x - p2.x) + dB * (p1.x - p3.x) + dC * (p2.x - p1.x));
    const div = 2 * (p1.x * (p3.y - p2.y) + p2.x * (p1.y - p3.y) + p3.x * (p2.y - p1.y));

    if (Math.abs(div) < 1e-9) {
      return { x: 0, y: 0, rSq: Infinity };
    }

    const cX = aux1 / div;
    const cY = aux2 / div;
    const dx = p1.x - cX;
    const dy = p1.y - cY;

    return { x: cX, y: cY, rSq: dx * dx + dy * dy };
  }

  let triangles: Triangle[] = [
    {
      a: stA,
      b: stB,
      c: stC,
      circle: getCircumcircle(vertices[stA]!, vertices[stB]!, vertices[stC]!),
    },
  ];

  for (let i = 0; i < n; i++) {
    const p = vertices[i]!;
    const polygon: { a: number; b: number }[] = [];
    const badTriangles: Triangle[] = [];

    for (const t of triangles) {
      const dx = p.x - t.circle.x;
      const dy = p.y - t.circle.y;
      if (dx * dx + dy * dy <= t.circle.rSq) {
        badTriangles.push(t);
      }
    }

    // Find edges of bad triangles that are not shared with any other bad triangle
    for (let j = 0; j < badTriangles.length; j++) {
      const t = badTriangles[j]!;
      const edges = [
        { a: t.a, b: t.b },
        { a: t.b, b: t.c },
        { a: t.c, b: t.a },
      ];

      for (const edge of edges) {
        let isShared = false;
        for (let k = 0; k < badTriangles.length; k++) {
          if (j === k) continue;
          const other = badTriangles[k]!;
          if (
            (other.a === edge.a && other.b === edge.b) ||
            (other.b === edge.a && other.c === edge.b) ||
            (other.c === edge.a && other.a === edge.b) ||
            (other.a === edge.b && other.b === edge.a) ||
            (other.b === edge.b && other.c === edge.a) ||
            (other.c === edge.b && other.a === edge.a)
          ) {
            isShared = true;
            break;
          }
        }
        if (!isShared) {
          polygon.push(edge);
        }
      }
    }

    // Remove bad triangles
    triangles = triangles.filter((t) => !badTriangles.includes(t));

    // Form new triangles from polygon edges to point p
    for (const edge of polygon) {
      const circ = getCircumcircle(vertices[edge.a]!, vertices[edge.b]!, p);
      triangles.push({
        a: edge.a,
        b: edge.b,
        c: i,
        circle: circ,
      });
    }
  }

  // Remove triangles that share vertices with the super-triangle
  const validTriangles = triangles.filter(
    (t) => t.a < n && t.b < n && t.c < n,
  );

  const indices = new Uint16Array(validTriangles.length * 3);
  let ptr = 0;
  for (const t of validTriangles) {
    indices[ptr++] = t.a;
    indices[ptr++] = t.b;
    indices[ptr++] = t.c;
  }

  return indices;
}

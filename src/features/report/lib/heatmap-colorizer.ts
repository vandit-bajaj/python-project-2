/**
 * Color-blind safe smooth colormap (Magma/Plasma variant)
 * t in [0, 1] -> [R, G, B, A]
 */
export function getHeatmapColor(t: number): [number, number, number, number] {
  const clamped = Math.max(0, Math.min(1, t));

  if (clamped < 0.05) {
    // Transparent for near-zero areas
    return [0, 0, 0, 0];
  }

  // Multi-stop color gradient:
  // 0.05: Cool Cyan [6, 182, 212]
  // 0.35: Vibrant Amber [245, 158, 11]
  // 0.70: Bright Orange [249, 115, 22]
  // 1.00: Vivid Crimson [225, 29, 72]
  let r = 0;
  let g = 0;
  let b = 0;
  const a = Math.round(Math.min(210, clamped * 230 + 40)); // Semi-transparent overlay

  if (clamped < 0.35) {
    const p = (clamped - 0.05) / 0.3;
    r = Math.round(6 + p * (245 - 6));
    g = Math.round(182 + p * (158 - 182));
    b = Math.round(212 + p * (11 - 212));
  } else if (clamped < 0.7) {
    const p = (clamped - 0.35) / 0.35;
    r = Math.round(245 + p * (249 - 245));
    g = Math.round(158 + p * (115 - 158));
    b = Math.round(11 + p * (22 - 11));
  } else {
    const p = (clamped - 0.7) / 0.3;
    r = Math.round(249 + p * (225 - 249));
    g = Math.round(115 + p * (29 - 115));
    b = Math.round(22 + p * (72 - 22));
  }

  return [r, g, b, a];
}

/**
 * Converts a Float32Array intensity buffer into an RGBA ImageData buffer.
 */
export function createHeatmapImageData(
  heatmap: Float32Array,
  width: number,
  height: number,
): ImageData {
  const pixelCount = width * height;
  const rgba = new Uint8ClampedArray(pixelCount * 4);

  for (let i = 0; i < pixelCount; i++) {
    const intensity = heatmap[i] ?? 0;
    const [r, g, b, a] = getHeatmapColor(intensity);
    const idx = i * 4;
    rgba[idx] = r;
    rgba[idx + 1] = g;
    rgba[idx + 2] = b;
    rgba[idx + 3] = a;
  }

  if (typeof ImageData !== 'undefined') {
    return new ImageData(rgba, width, height);
  }
  return {
    width,
    height,
    data: rgba,
    colorSpace: 'srgb',
  } as ImageData;
}

const MAX_CAPTURE_DIMENSION = 1920;

/**
 * Calculates new dimensions scaled to fit within MAX_CAPTURE_DIMENSION preserving aspect ratio.
 */
export function calculateFitDimensions(
  width: number,
  height: number,
  maxDim = MAX_CAPTURE_DIMENSION,
): { width: number; height: number } {
  if (width <= maxDim && height <= maxDim) {
    return { width, height };
  }

  const ratio = Math.min(maxDim / width, maxDim / height);
  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio),
  };
}

/**
 * Strips EXIF metadata, normalizes rotation, downscales if necessary,
 * and creates a pure transient ImageBitmap.
 */
export async function processFileToBitmap(file: File | Blob): Promise<ImageBitmap> {
  // Use browser native createImageBitmap with orientation normalization
  // This automatically ignores and strips any EXIF orientation tags
  let initialBitmap: ImageBitmap | null = null;
  try {
    initialBitmap = await createImageBitmap(file, {
      imageOrientation: 'from-image',
      premultiplyAlpha: 'default',
    });

    const { width: targetWidth, height: targetHeight } = calculateFitDimensions(
      initialBitmap.width,
      initialBitmap.height,
    );

    // If downscaling is required, draw through canvas to produce clean downscaled bitmap
    if (targetWidth !== initialBitmap.width || targetHeight !== initialBitmap.height) {
      if (typeof OffscreenCanvas !== 'undefined') {
        const offscreen = new OffscreenCanvas(targetWidth, targetHeight);
        const ctx = offscreen.getContext('2d');
        if (!ctx) throw new Error('Failed to acquire OffscreenCanvas 2D context');

        ctx.drawImage(initialBitmap, 0, 0, targetWidth, targetHeight);
        const processed = await createImageBitmap(offscreen);
        initialBitmap.close();
        return processed;
      }

      // Fallback for environments without OffscreenCanvas
      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Failed to acquire Canvas 2D context');

      ctx.drawImage(initialBitmap, 0, 0, targetWidth, targetHeight);
      const processed = await createImageBitmap(canvas);
      initialBitmap.close();
      return processed;
    }

    return initialBitmap;
  } catch (err) {
    if (initialBitmap) {
      initialBitmap.close();
    }
    throw err;
  }
}

/**
 * Extracts ImageData from an ImageBitmap for computer vision analysis.
 */
export function extractImageDataFromBitmap(bitmap: ImageBitmap): ImageData {
  if (typeof OffscreenCanvas !== 'undefined') {
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('Could not get OffscreenCanvas context');
    ctx.drawImage(bitmap, 0, 0);
    return ctx.getImageData(0, 0, bitmap.width, bitmap.height);
  }

  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Could not get Canvas context');
  ctx.drawImage(bitmap, 0, 0);
  return ctx.getImageData(0, 0, bitmap.width, bitmap.height);
}

/**
 * Safely releases an ImageBitmap to prevent client memory leaks.
 */
export function releaseBitmap(bitmap: ImageBitmap | null | undefined): void {
  if (bitmap && typeof bitmap.close === 'function') {
    try {
      bitmap.close();
    } catch {
      // Bitmap might already be closed or detached
    }
  }
}

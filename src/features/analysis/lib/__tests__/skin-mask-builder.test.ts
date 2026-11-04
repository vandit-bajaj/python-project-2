import { describe, it, expect } from 'vitest';
import { buildSkinRoiMasks } from '../skin-mask-builder';
import { generateSyntheticLandmarks } from '../../pipeline/face-understanding';

describe('Skin Mask Builder', () => {
  it('builds binary and soft masks for synthetic landmarks', () => {
    const landmarks = generateSyntheticLandmarks();
    const width = 100;
    const height = 100;

    const skinRoi = buildSkinRoiMasks(landmarks, width, height);

    expect(skinRoi.width).toBe(width);
    expect(skinRoi.height).toBe(height);
    expect(skinRoi.binaryMask.length).toBe(width * height);
    expect(skinRoi.softMask.length).toBe(width * height);

    // Verify some pixels are flagged as skin
    let skinPixelCount = 0;
    for (let i = 0; i < skinRoi.binaryMask.length; i++) {
      if (skinRoi.binaryMask[i] === 255) {
        skinPixelCount++;
      }
    }
    expect(skinPixelCount).toBeGreaterThan(100);

    // Verify soft mask values are bounded between 0 and 1
    for (let i = 0; i < skinRoi.softMask.length; i++) {
      const val = skinRoi.softMask[i] ?? 0;
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThanOrEqual(1);
    }
  });

  it('excludes outside face border pixels', () => {
    const landmarks = generateSyntheticLandmarks();
    const width = 100;
    const height = 100;

    const skinRoi = buildSkinRoiMasks(landmarks, width, height);

    // Top-left and bottom-right corners must be outside the face (0)
    expect(skinRoi.binaryMask[0]).toBe(0);
    expect(skinRoi.binaryMask[width * height - 1]).toBe(0);
  });
});

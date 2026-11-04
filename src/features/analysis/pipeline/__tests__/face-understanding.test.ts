import { describe, it, expect, vi } from 'vitest';
import {
  runFaceUnderstanding,
  generateSyntheticLandmarks,
  FaceDetectionError,
} from '../face-understanding';
import * as imageProcessor from '@/features/capture/lib/image-processor';

describe('Face Understanding Pipeline', () => {
  it('generates 478 valid normalized landmarks for synthetic fixtures', () => {
    const landmarks = generateSyntheticLandmarks();
    expect(landmarks.length).toBe(478);
    for (const lm of landmarks) {
      expect(lm.x).toBeGreaterThanOrEqual(0);
      expect(lm.x).toBeLessThanOrEqual(1);
      expect(lm.y).toBeGreaterThanOrEqual(0);
      expect(lm.y).toBeLessThanOrEqual(1);
    }
  });

  it('throws FaceDetectionError when no face landmarks can be detected', async () => {
    const mockBitmap = {
      width: 100,
      height: 100,
      close: vi.fn(),
    } as unknown as ImageBitmap;

    const buffer = new Uint8ClampedArray(100 * 100 * 4);
    const mockImageData = {
      width: 100,
      height: 100,
      data: buffer,
      colorSpace: 'srgb' as const,
    } as ImageData;

    vi.spyOn(imageProcessor, 'extractImageDataFromBitmap').mockReturnValue(mockImageData);

    await expect(runFaceUnderstanding(mockBitmap)).rejects.toThrow(FaceDetectionError);
  });

  it('runs complete face understanding pipeline with supplied landmarks generating masks and baseline', async () => {
    const width = 100;
    const height = 100;
    const mockBitmap = {
      width,
      height,
      close: vi.fn(),
    } as unknown as ImageBitmap;

    // Mock extractImageDataFromBitmap to return a valid 100x100 skin tone ImageData
    const buffer = new Uint8ClampedArray(width * height * 4);
    for (let i = 0; i < width * height; i++) {
      buffer[i * 4] = 215;     // R
      buffer[i * 4 + 1] = 170; // G
      buffer[i * 4 + 2] = 140; // B
      buffer[i * 4 + 3] = 255; // A
    }

    const mockImageData = {
      width,
      height,
      data: buffer,
      colorSpace: 'srgb' as const,
    } as ImageData;

    vi.spyOn(imageProcessor, 'extractImageDataFromBitmap').mockReturnValue(mockImageData);

    const mockLandmarks = generateSyntheticLandmarks();
    const result = await runFaceUnderstanding(mockBitmap, { mockLandmarks });

    expect(result.landmarks.length).toBe(478);
    expect(result.confidence).toBeGreaterThan(0.5);
    expect(result.zoneMasks.forehead).toBeDefined();
    expect(result.zoneMasks.leftCheek).toBeDefined();
    expect(result.zoneMasks.rightCheek).toBeDefined();
    expect(result.zoneMasks.chin).toBeDefined();
    expect(result.zoneMasks.nose).toBeDefined();
    expect(result.zoneMasks.tZone).toBeDefined();

    expect(result.skinRoi.binaryMask.length).toBe(width * height);
    expect(result.baseline.fitzpatrickScale).toBeGreaterThanOrEqual(1);
    expect(result.baseline.fitzpatrickScale).toBeLessThanOrEqual(6);
    expect(result.normalizedImageData).toBeDefined();
  });
});


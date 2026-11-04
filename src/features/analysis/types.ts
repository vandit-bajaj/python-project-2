import type { NormalizedLandmark, ZoneId, SkinToneBaseline } from '@/shared/types';

export interface FaceMeshResult {
  landmarks: NormalizedLandmark[];
  confidence: number;
  faceRect: { x: number; y: number; width: number; height: number };
}

export interface ZoneMaskData {
  width: number;
  height: number;
  /** Binary mask where 255 = inside zone, 0 = outside */
  mask: Uint8ClampedArray;
}

export type ZoneMasks = Record<ZoneId, ZoneMaskData>;

export interface SkinRoiMasks {
  width: number;
  height: number;
  /** 255 = skin, 0 = non-skin (eyes, lips, background) */
  binaryMask: Uint8ClampedArray;
  /** Soft feathered mask (0 - 255) to prevent hard boundary artifacts */
  softMask: Float32Array;
}

export interface FaceUnderstandingResult {
  landmarks: NormalizedLandmark[];
  zoneMasks: ZoneMasks;
  skinRoi: SkinRoiMasks;
  normalizedImageData: ImageData;
  baseline: SkinToneBaseline;
  confidence: number;
}

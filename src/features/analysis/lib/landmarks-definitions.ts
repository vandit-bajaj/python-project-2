import type { ZoneId } from '@/shared/types';

/**
 * MediaPipe 468/478 Landmark Indices Definitions
 * 
 * Standard anatomical topology for facial zones and non-skin exclusion regions.
 */

export const LANDMARK_INDEXES = {
  // Region of Interest (ROI) Boundaries
  forehead: [10, 338, 297, 332, 284, 251, 389, 70, 63, 105, 66, 107, 9, 336, 296, 334, 293, 300, 10],
  leftCheek: [116, 123, 147, 213, 138, 135, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109],
  rightCheek: [345, 352, 376, 433, 367, 364, 365, 397, 288, 361, 323, 454, 356, 389, 251, 284, 332, 297, 338],
  nose: [1, 2, 98, 327, 195, 5, 4, 197, 196, 419, 420, 274, 275, 45, 51, 1],
  chin: [152, 377, 400, 378, 379, 365, 176, 148, 149, 150, 136, 172, 18, 175, 199, 200, 208, 152],
  tZone: [10, 67, 109, 10, 338, 297, 9, 197, 195, 5, 4, 1, 2, 98, 327],
  underEyeLeft: [33, 7, 163, 144, 145, 153, 154, 155, 133, 111, 117, 118, 119, 120, 33],
  underEyeRight: [263, 249, 390, 373, 374, 380, 381, 382, 362, 340, 346, 347, 348, 349, 263],
  jawline: [172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109, 10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 152],

  // Non-Skin Exclusion Regions
  leftEye: [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246, 33],
  rightEye: [263, 249, 390, 373, 374, 380, 381, 382, 362, 398, 384, 385, 386, 387, 388, 466, 263],
  lips: [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 409, 270, 269, 267, 0, 37, 39, 40, 185, 61],
  leftEyebrow: [70, 63, 105, 66, 107, 55, 65, 52, 53, 46, 70],
  rightEyebrow: [300, 293, 334, 296, 336, 285, 295, 282, 283, 276, 300],

  // Full Face Contour Boundary (for overall face crop)
  faceContour: [
    10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377,
    152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109, 10,
  ],
} as const;

export const ZONE_LANDMARK_MAP: Record<ZoneId, readonly number[]> = {
  forehead: LANDMARK_INDEXES.forehead,
  leftCheek: LANDMARK_INDEXES.leftCheek,
  rightCheek: LANDMARK_INDEXES.rightCheek,
  nose: LANDMARK_INDEXES.nose,
  chin: LANDMARK_INDEXES.chin,
  tZone: LANDMARK_INDEXES.tZone,
  underEyeLeft: LANDMARK_INDEXES.underEyeLeft,
  underEyeRight: LANDMARK_INDEXES.underEyeRight,
  jawline: LANDMARK_INDEXES.jawline,
};


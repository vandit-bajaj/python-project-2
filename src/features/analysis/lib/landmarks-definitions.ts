import type { ZoneId } from '@/shared/types';

/**
 * MediaPipe 468/478 Landmark Indices Definitions
 * 
 * Standard anatomical topology for facial zones and non-skin exclusion regions.
 */

export const LANDMARK_INDEXES = {
  // Region of Interest (ROI) Boundaries
  // Strictly validated clockwise perimeter winding order to guarantee non-self-intersecting polygons
  forehead: [10, 338, 297, 299, 337, 151, 108, 67, 109, 10],
  leftCheek: [50, 101, 36, 206, 216, 202, 210, 214, 192, 147, 123, 116, 50],
  rightCheek: [345, 352, 376, 416, 434, 430, 422, 436, 426, 266, 330, 280, 345],
  nose: [168, 417, 351, 419, 281, 275, 327, 2, 98, 45, 51, 3, 196, 122, 193, 168],
  chin: [18, 379, 378, 400, 377, 152, 148, 176, 149, 18],
  tZone: [10, 338, 297, 337, 417, 275, 327, 2, 98, 45, 193, 108, 67, 109, 10],
  underEyeLeft: [33, 7, 163, 144, 145, 153, 154, 155, 133, 120, 119, 118, 117, 111, 33],
  underEyeRight: [340, 346, 347, 348, 349, 362, 382, 381, 380, 374, 373, 390, 249, 263, 340],
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


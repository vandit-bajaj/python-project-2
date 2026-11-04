/**
 * Skin-Wellness Quality & Confidence Thresholds
 */

export const QUALITY_THRESHOLDS = {
  /** Minimum face landmarker confidence to proceed to analysis */
  MIN_LANDMARK_CONFIDENCE: 0.75,
  /** Maximum face roll/pitch/yaw in degrees before triggering alignment alert */
  MAX_ALLOWED_HEAD_ROTATION_DEG: 15,
  /** Minimum luminance required in ROI to avoid underexposure warning */
  MIN_AVERAGE_LUMINANCE: 45,
  /** Maximum luminance before specular clipping warning */
  MAX_AVERAGE_LUMINANCE: 220,
  /** Minimum resolution of face crop in pixels */
  MIN_FACE_RESOLUTION_PX: 256,
} as const;

export const CONFIDENCE_LEVELS = {
  HIGH: 0.85,
  MEDIUM: 0.65,
  LOW: 0.45,
} as const;

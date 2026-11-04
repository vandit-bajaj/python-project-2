export type CameraFacingMode = 'user' | 'environment';

export type CameraErrorCode =
  'PERMISSION_DENIED' | 'NOT_FOUND' | 'IN_USE' | 'OVERCONSTRAINED' | 'UNSUPPORTED' | 'UNKNOWN';

export interface CameraError {
  code: CameraErrorCode;
  message: string;
  technicalDetails?: string;
}

export interface QualityAssessment {
  isAcceptable: boolean;
  score: number; // 0-100
  lighting: {
    status: 'good' | 'too_dark' | 'too_bright';
    averageLuminance: number; // 0-255
    message: string;
  };
  sharpness: {
    status: 'sharp' | 'blurry';
    variance: number;
    message: string;
  };
  framing: {
    status: 'centered' | 'too_close' | 'too_far' | 'off_center';
    message: string;
  };
  overallMessage: string;
}

export interface ProcessedCapture {
  bitmap: ImageBitmap;
  width: number;
  height: number;
  quality: QualityAssessment;
  timestamp: number;
}

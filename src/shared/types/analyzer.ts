import { z } from 'zod';

export type ZoneId =
  | 'forehead'
  | 'leftCheek'
  | 'rightCheek'
  | 'nose'
  | 'chin'
  | 'tZone'
  | 'underEyeLeft'
  | 'underEyeRight'
  | 'jawline';

export const ZONE_IDS: readonly ZoneId[] = [
  'forehead',
  'leftCheek',
  'rightCheek',
  'nose',
  'chin',
  'tZone',
  'underEyeLeft',
  'underEyeRight',
  'jawline',
] as const;

export type MetricId =
  | 'redness'
  | 'acne'
  | 'pigmentation'
  | 'oiliness'
  | 'texture'
  | 'underEyeDarkness'
  | 'fineLines'
  | 'evenness';

export const METRIC_IDS: readonly MetricId[] = [
  'redness',
  'acne',
  'pigmentation',
  'oiliness',
  'texture',
  'underEyeDarkness',
  'fineLines',
  'evenness',
] as const;

export interface NormalizedLandmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export interface AnalyzerResult {
  /** 0-100 wellness score (higher = healthier attribute state) */
  score: number;
  /** Zone-level breakdown (0-100) */
  perZone: Record<ZoneId, number>;
  /** Confidence score between 0.0 and 1.0 surfaced in the UI */
  confidence: number;
  /** Heatmap buffer aligned to face UV texture space */
  heatmap: ImageData | Float32Array;
}

export interface SkinToneBaseline {
  /** Estimated individual Fitzpatrick phototype (I-VI) */
  fitzpatrickScale: 1 | 2 | 3 | 4 | 5 | 6;
  /** Normalized baseline CIE LAB L* (lightness) value */
  baselineLightness: number;
  /** Normalized baseline erythema reference */
  baselineRedness: number;
  /** Baseline melanin index */
  baselineMelanin: number;
}

// Zod Schema for persisted or exported report validation
export const AnalyzerResultSchema = z.object({
  score: z.number().min(0).max(100),
  perZone: z.record(z.string(), z.number().min(0).max(100)),
  confidence: z.number().min(0).max(1),
});

import type { MetricId } from '@/shared/types';
import type { FaceUnderstandingResult, ComprehensiveSkinReport, MetricScoreSummary } from '../types';
import {
  analyzeRedness,
  analyzeAcne,
  analyzePigmentation,
  analyzeOiliness,
  analyzeTexture,
  analyzeUnderEye,
  analyzeFineLines,
  analyzeEvenness,
  METRICS_METADATA,
} from '../analyzers';

export const MEDICAL_DISCLAIMER_TEXT =
  'DermaLens provides non-diagnostic skin-wellness insights and educational observations only. It does not provide medical diagnoses, treatment plans, or clinical evaluations. Consult a certified board dermatologist for clinical skin conditions.';

/**
 * Runs the full suite of 8 classical computer vision skin-wellness analyzers.
 */
export function runComprehensiveSkinAnalysis(
  faceData: FaceUnderstandingResult,
): ComprehensiveSkinReport {
  const { normalizedImageData, landmarks, zoneMasks, skinRoi, baseline } = faceData;

  const rednessRes = analyzeRedness(normalizedImageData, landmarks, zoneMasks, skinRoi, baseline);
  const acneRes = analyzeAcne(normalizedImageData, landmarks, zoneMasks, skinRoi, baseline);
  const pigmRes = analyzePigmentation(normalizedImageData, landmarks, zoneMasks, skinRoi, baseline);
  const oilinessRes = analyzeOiliness(normalizedImageData, landmarks, zoneMasks, skinRoi, baseline);
  const textureRes = analyzeTexture(normalizedImageData, landmarks, zoneMasks, skinRoi, baseline);
  const underEyeRes = analyzeUnderEye(normalizedImageData, landmarks, zoneMasks, skinRoi, baseline);
  const fineLinesRes = analyzeFineLines(normalizedImageData, landmarks, zoneMasks, skinRoi, baseline);
  const evennessRes = analyzeEvenness(normalizedImageData, landmarks, zoneMasks, skinRoi, baseline);

  const rawResults: Record<MetricId, typeof rednessRes> = {
    redness: rednessRes,
    acne: acneRes,
    pigmentation: pigmRes,
    oiliness: oilinessRes,
    texture: textureRes,
    underEyeDarkness: underEyeRes,
    fineLines: fineLinesRes,
    evenness: evennessRes,
  };

  const metrics: Partial<Record<MetricId, MetricScoreSummary>> = {};

  let weightedScoreSum = 0;
  let totalConfidenceSum = 0;
  let totalWeights = 0;

  // Analysis metric weights for composite facial wellness score
  const METRIC_WEIGHTS: Record<MetricId, number> = {
    evenness: 1.2,
    texture: 1.1,
    redness: 1.0,
    acne: 1.0,
    pigmentation: 0.9,
    oiliness: 0.8,
    underEyeDarkness: 0.8,
    fineLines: 0.7,
  };

  for (const [idKey, res] of Object.entries(rawResults) as [MetricId, typeof rednessRes][]) {
    const meta = METRICS_METADATA[idKey];
    const weight = METRIC_WEIGHTS[idKey] ?? 1.0;

    weightedScoreSum += res.score * weight;
    totalWeights += weight;
    totalConfidenceSum += res.confidence;

    let summaryText = `Evaluated at ${res.score}/100.`;
    if (res.score >= 85) {
      summaryText = 'Optimal balance and calm appearance.';
    } else if (res.score >= 65) {
      summaryText = 'Mild variation observed across facial zones.';
    } else {
      summaryText = 'Noticeable activity observed; benefits from targeted soothing care.';
    }

    metrics[idKey] = {
      metricId: idKey,
      name: meta.name,
      category: meta.category,
      score: res.score,
      confidence: res.confidence,
      perZone: res.perZone,
      heatmap: res.heatmap as Float32Array,
      summary: summaryText,
    };
  }

  const overallScore = Math.round(weightedScoreSum / totalWeights);
  const avgConfidence = Math.round((totalConfidenceSum / 8) * 100) / 100;

  const id = `scan_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  return {
    id,
    timestamp: new Date().toISOString(),
    overallScore,
    baseline,
    metrics: metrics as Record<MetricId, MetricScoreSummary>,
    confidence: avgConfidence,
    disclaimer: MEDICAL_DISCLAIMER_TEXT,
  };
}

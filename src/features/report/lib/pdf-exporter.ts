import { jsPDF } from 'jspdf';
import type { ComprehensiveSkinReport } from '@/features/analysis/types';

/**
 * Generates and triggers client-side download of a confidential PDF wellness report.
 * Guaranteed zero network interaction: renders 100% locally in browser memory.
 */
export function exportReportToPDF(report: ComprehensiveSkinReport): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Header Background & Title
  doc.setFillColor(13, 148, 136); // Teal 600
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('DermaLens', 14, 15);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Client-Side Confidential Skin Wellness Report', 14, 22);

  // Report Metadata Header
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(9);
  const formattedDate = new Date(report.timestamp).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  doc.text(`Scan ID: ${report.id}`, 14, 36);
  doc.text(`Generated: ${formattedDate}`, 14, 41);

  // Disclaimer Callout Box
  doc.setFillColor(254, 242, 242); // Rose-50
  doc.setDrawColor(254, 202, 202); // Rose-200
  doc.roundedRect(14, 46, pageWidth - 28, 18, 2, 2, 'FD');

  doc.setTextColor(185, 28, 28); // Rose-700
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('NON-MEDICAL WELLNESS NOTICE', 18, 52);
  doc.setFont('helvetica', 'normal');
  const disclaimerLines = doc.splitTextToSize(
    'This report contains wellness observations and educational insights. It does not constitute medical diagnosis, clinical evaluation, or treatment prescription. Always consult a certified dermatologist for clinical conditions.',
    pageWidth - 36,
  );
  doc.text(disclaimerLines, 18, 57);

  // Summary Score Hero Card
  doc.setFillColor(248, 250, 252); // Slate-50
  doc.setDrawColor(226, 232, 240); // Slate-200
  doc.roundedRect(14, 68, pageWidth - 28, 26, 3, 3, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Overall Skin-Wellness Index', 20, 77);

  doc.setFontSize(24);
  doc.setTextColor(13, 148, 136);
  doc.text(`${report.overallScore}/100`, 20, 88);

  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Phototype Baseline: Fitzpatrick Scale Type ${report.baseline.fitzpatrickScale}`, 80, 77);
  doc.text(`Lightness (L*): ${report.baseline.baselineLightness} | Redness (a*): ${report.baseline.baselineRedness}`, 80, 83);
  doc.text(`Overall Analysis Confidence: ${Math.round(report.confidence * 100)}%`, 80, 89);

  // Metrics Breakdown Table
  let currentY = 104;
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Detailed Attribute Evaluation', 14, currentY);
  currentY += 6;

  // Table header
  doc.setFillColor(241, 245, 249);
  doc.rect(14, currentY, pageWidth - 28, 8, 'F');
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Attribute', 18, currentY + 5.5);
  doc.text('Score', 65, currentY + 5.5);
  doc.text('Confidence', 85, currentY + 5.5);
  doc.text('Observation Summary', 115, currentY + 5.5);
  currentY += 8;

  // Table rows
  doc.setFont('helvetica', 'normal');
  for (const metric of Object.values(report.metrics)) {
    if (currentY > 265) {
      doc.addPage();
      currentY = 20;
    }

    doc.setDrawColor(241, 245, 249);
    doc.line(14, currentY + 8, pageWidth - 14, currentY + 8);

    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(metric.name, 18, currentY + 5.5);

    // Score badge
    doc.setFont('helvetica', 'bold');
    if (metric.score >= 80) doc.setTextColor(13, 148, 136);
    else if (metric.score >= 60) doc.setTextColor(217, 119, 6);
    else doc.setTextColor(225, 29, 72);
    doc.text(`${metric.score}/100`, 65, currentY + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`${Math.round(metric.confidence * 100)}%`, 85, currentY + 5.5);

    doc.setTextColor(51, 65, 85);
    const summaryTrimmed = doc.splitTextToSize(metric.summary, 75);
    doc.text(summaryTrimmed, 115, currentY + 5.5);

    currentY += 9;
  }

  // Footer Privacy Guarantee
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('DermaLens Zero-Egress Architecture — Generated strictly in local client memory.', 14, 285);

  doc.save(`dermalens-report-${report.id}.pdf`);
}


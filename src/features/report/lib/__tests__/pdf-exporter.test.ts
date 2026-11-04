import { describe, it, expect, vi } from 'vitest';
import { exportReportToPDF } from '../pdf-exporter';
import type { ComprehensiveSkinReport } from '@/features/analysis/types';

const mockSave = vi.fn();

vi.mock('jspdf', () => {
  return {
    jsPDF: vi.fn().mockImplementation(() => {
      return {
        internal: {
          pageSize: {
            getWidth: () => 210,
          },
        },
        setFillColor: vi.fn(),
        rect: vi.fn(),
        setTextColor: vi.fn(),
        setFontSize: vi.fn(),
        setFont: vi.fn(),
        text: vi.fn(),
        setDrawColor: vi.fn(),
        roundedRect: vi.fn(),
        splitTextToSize: vi.fn().mockReturnValue(['Mock line']),
        line: vi.fn(),
        addPage: vi.fn(),
        save: mockSave,
      };
    }),
  };
});

describe('PDF Report Exporter', () => {
  it('generates a PDF and invokes save with appropriate filename', () => {
    const mockReport: ComprehensiveSkinReport = {
      id: 'scan_pdf_test_999',
      timestamp: new Date().toISOString(),
      overallScore: 82,
      imageWidth: 400,
      imageHeight: 500,
      baseline: {
        fitzpatrickScale: 3,
        baselineLightness: 65,
        baselineRedness: 11,
        baselineMelanin: 0.35,
      },
      metrics: {
        redness: {
          metricId: 'redness',
          name: 'Redness',
          category: 'balance',
          score: 80,
          confidence: 0.9,
          perZone: {} as Record<string, number>,
          heatmap: new Float32Array(10),
          summary: 'Normal state.',
        },
      } as ComprehensiveSkinReport['metrics'],
      confidence: 0.9,
      disclaimer: 'Non-diagnostic wellness report.',
    };

    exportReportToPDF(mockReport);

    expect(mockSave).toHaveBeenCalledWith('dermalens-report-scan_pdf_test_999.pdf');
  });
});

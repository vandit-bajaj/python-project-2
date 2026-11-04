import { describe, it, expect, beforeEach } from 'vitest';
import { saveReportLocally, getReportById, deleteAllUserData } from '../storage';
import type { ComprehensiveSkinReport } from '@/features/analysis/types';

describe('Local Report Storage & Memory Purge', () => {
  beforeEach(async () => {
    await deleteAllUserData();
  });

  const mockReport: ComprehensiveSkinReport = {
    id: 'scan_test_123',
    timestamp: new Date().toISOString(),
    overallScore: 88,
    baseline: {
      fitzpatrickScale: 2,
      baselineLightness: 70,
      baselineRedness: 12,
      baselineMelanin: 0.3,
    },
    metrics: {} as ComprehensiveSkinReport['metrics'],
    confidence: 0.94,
    disclaimer: 'Educational report only.',
  };

  it('saves and retrieves reports locally from memory fallback store', async () => {
    await saveReportLocally(mockReport);
    const retrieved = await getReportById('scan_test_123');
    expect(retrieved).not.toBeNull();
    expect(retrieved?.id).toBe('scan_test_123');
    expect(retrieved?.overallScore).toBe(88);
  });

  it('returns null for non-existent report ids', async () => {
    const res = await getReportById('non_existent');
    expect(res).toBeNull();
  });

  it('completely purges all stored reports on deleteAllUserData', async () => {
    await saveReportLocally(mockReport);
    await deleteAllUserData();
    const res = await getReportById('scan_test_123');
    expect(res).toBeNull();
  });
});

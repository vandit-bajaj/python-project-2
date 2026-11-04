import { test, expect } from '@playwright/test';

test.describe('End-to-End Analysis & Report Flow', () => {
  test('completes capture, face geometry inspection, analysis, and report generation with zero egress', async ({
    page,
  }) => {
    const networkEgressLog: string[] = [];

    page.on('request', (request) => {
      const url = request.url();
      if (!url.startsWith('http://localhost:3000') && !url.startsWith('https://localhost:3000')) {
        networkEgressLog.push(`Unauthorized external egress: ${url}`);
      }
    });

    // 1. Visit scan page
    await page.goto('/scan');
    await expect(page.getByRole('heading', { name: /Facial Wellness Scan/i })).toBeVisible();

    // 2. Switch to upload tab
    const uploadBtn = page.getByRole('button', { name: 'Upload' });
    await uploadBtn.click();

    // 3. Synthesize a 120x120 skin-tone test image in browser memory
    const mockDataUrl = await page.evaluate(() => {
      const canvas = document.createElement('canvas');
      canvas.width = 120;
      canvas.height = 120;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#f5c6a5';
        ctx.fillRect(0, 0, 120, 120);
      }
      return canvas.toDataURL('image/png');
    });
    const base64Data = mockDataUrl.split(',')[1]!;
    const mockPngBuffer = Buffer.from(base64Data, 'base64');

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test-scan.png',
      mimeType: 'image/png',
      buffer: mockPngBuffer,
    });

    // 4. Confirm photo
    const confirmBtn = page.getByRole('button', { name: /^Analyze$/i });
    await expect(confirmBtn).toBeVisible();
    await confirmBtn.click();

    // 5. Wait for Face Understanding & Calibration view (allow time for first-time WASM initialization)
    await expect(page.getByRole('heading', { name: 'Skin-Tone Baseline' })).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByRole('button', { name: /Analyze Skin Metrics/i })).toBeVisible();

    // 6. Proceed to comprehensive skin analysis
    const analyzeBtn = page.getByRole('button', { name: /Analyze Skin Metrics/i });
    await analyzeBtn.click();

    // 7. Verify Report Dashboard renders
    await expect(page.getByText(/Facial Wellness Insights/i)).toBeVisible();
    await expect(page.getByText(/Skin-Wellness Score/i)).toBeVisible();
    await expect(page.getByText(/Non-Medical Educational Wellness Report/i)).toBeVisible();
    await expect(page.getByText(/Per-Attribute Breakdown/i)).toBeVisible();

    // 8. Confirm Zero External Egress
    expect(networkEgressLog).toEqual([]);
  });
});

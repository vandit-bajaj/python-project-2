import { test, expect } from '@playwright/test';
import fs from 'node:fs';

test.describe('End-to-End Analysis & Report Flow', () => {
  test('rejects non-face images with honest error message and recovery options', async ({
    page,
  }) => {
    await page.goto('/scan');
    await page.getByRole('button', { name: 'Upload' }).click();

    // Synthesize a high-contrast non-face checkerboard image
    const checkerboardDataUrl = await page.evaluate(() => {
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 400;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, 0, 400, 400);
        ctx.fillStyle = '#0f172a';
        for (let x = 0; x < 400; x += 40) {
          for (let y = 0; y < 400; y += 40) {
            if ((x / 40 + y / 40) % 2 === 0) {
              ctx.fillRect(x, y, 40, 40);
            }
          }
        }
      }
      return canvas.toDataURL('image/png');
    });

    const base64Data = checkerboardDataUrl.split(',')[1]!;
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'non-face-pattern.png',
      mimeType: 'image/png',
      buffer: Buffer.from(base64Data, 'base64'),
    });

    const confirmBtn = page.getByRole('button', { name: /^Analyze$/i });
    await expect(confirmBtn).toBeVisible();
    await confirmBtn.click();

    // Verify system displays honest "No Face Detected" card rather than faking landmarks
    await expect(page.getByRole('heading', { name: /No Face Detected/i })).toBeVisible({
      timeout: 25000,
    });
    await expect(
      page.getByText(/No clear human face was detected in the photo/i),
    ).toBeVisible();

    const tryAnotherBtn = page.getByRole('button', { name: /Try Another Photo/i });
    await expect(tryAnotherBtn).toBeVisible();
    await tryAnotherBtn.click();

    // Verify recovery back to scanner
    await expect(page.getByRole('heading', { name: /Facial Wellness Scan/i })).toBeVisible();
  });

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

    // 3. Load valid face photo from local scratch fixture if present, or browser face illustration
    const localScratchFixture =
      '/Users/1dit/.gemini/antigravity/brain/c1e1f20c-2fb0-4ba8-b20f-a4995d070448/scratch/portrait_real.jpg';

    let fileBuffer: Buffer;
    if (fs.existsSync(localScratchFixture)) {
      fileBuffer = fs.readFileSync(localScratchFixture);
    } else {
      const mockDataUrl = await page.evaluate(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 500;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#f5c6a5';
          ctx.fillRect(0, 0, 400, 500);
        }
        return canvas.toDataURL('image/png');
      });
      fileBuffer = Buffer.from(mockDataUrl.split(',')[1]!, 'base64');
    }

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'face-scan.jpg',
      mimeType: 'image/jpeg',
      buffer: fileBuffer,
    });

    // 4. Confirm photo
    const confirmBtn = page.getByRole('button', { name: /^Analyze$/i });
    await expect(confirmBtn).toBeVisible();
    await confirmBtn.click();

    // 5. Wait for Face Understanding & Calibration view (allow time for first-time WASM initialization)
    await expect(page.getByRole('heading', { name: 'Skin-Tone Baseline' })).toBeVisible({
      timeout: 20000,
    });
    await expect(page.getByRole('button', { name: /Analyze Skin Metrics/i })).toBeVisible();

    // Verify canvas renders user photo and has non-zero positive dimensions
    const canvasDimensions = await page.evaluate(() => {
      const canvas = document.querySelector('canvas[aria-label="Captured facial portrait"]') as HTMLCanvasElement | null;
      return canvas ? { width: canvas.width, height: canvas.height } : null;
    });
    expect(canvasDimensions).not.toBeNull();
    expect(canvasDimensions!.width).toBeGreaterThan(0);
    expect(canvasDimensions!.height).toBeGreaterThan(0);

    // 6. Proceed to comprehensive skin analysis
    const analyzeBtn = page.getByRole('button', { name: /Analyze Skin Metrics/i });
    await analyzeBtn.click();

    // 7. Verify Report Dashboard renders
    await expect(page.getByText(/Facial Wellness Insights/i)).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/Skin-Wellness Score/i)).toBeVisible();
    await expect(page.getByText(/Non-Medical Educational Wellness Report/i)).toBeVisible();
    await expect(page.getByText(/Per-Attribute Breakdown/i)).toBeVisible();

    // 8. Confirm Zero External Egress
    expect(networkEgressLog).toEqual([]);
  });
});

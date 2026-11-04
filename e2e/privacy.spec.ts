import { test, expect } from '@playwright/test';

test.describe('Privacy Enforcement & Zero Data Egress', () => {
  test('asserts zero external network traffic and zero image payload egress on /scan', async ({
    page,
  }) => {
    const networkEgressLog: { url: string; method: string; postData?: string }[] = [];

    // Intercept and log all outbound HTTP/WebSocket requests
    page.on('request', (request) => {
      const url = request.url();
      const method = request.method();
      const postData = request.postData() || '';

      // Ignore localhost asset requests
      const isLocalHost =
        url.startsWith('http://localhost:3000') || url.startsWith('https://localhost:3000');
      if (!isLocalHost) {
        networkEgressLog.push({ url, method, postData });
      }

      // Assert payload never contains image data or base64 blobs
      if (
        postData.includes('data:image/') ||
        postData.includes('base64,') ||
        postData.includes('image/png') ||
        postData.includes('image/jpeg')
      ) {
        networkEgressLog.push({ url, method, postData: 'DETECTED_IMAGE_PAYLOAD' });
      }
    });

    await page.goto('/scan');

    // 1. Verify visible on-device privacy guarantee indicator
    await expect(page.getByText(/Processed 100% on your device/i)).toBeVisible();

    // 2. Switch to Upload tab
    const uploadTabButton = page.getByRole('button', { name: 'Upload' });
    await expect(uploadTabButton).toBeVisible();
    await uploadTabButton.click();
    await expect(page.getByText(/Drag and drop your photo/i)).toBeVisible();

    // 3. Synthesize a 100x100 PNG buffer directly in memory (zero real face imagery)
    const mockPngBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64',
    );

    // 4. Set files directly on file input
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'synthetic-test-frame.png',
      mimeType: 'image/png',
      buffer: mockPngBuffer,
    });

    // 5. Wait for preview screen to mount
    await expect(page.getByText(/Quality Assessment/i)).toBeVisible();
    await expect(page.getByText(/In-Memory Bitmap/i)).toBeVisible();

    // 6. Non-negotiable assertion: ZERO network egress
    expect(networkEgressLog).toEqual([]);
  });

  test('verifies strict security headers via HTTP response', async ({ request }) => {
    const response = await request.get('/');
    const headers = response.headers();

    // Check Content-Security-Policy
    const csp = headers['content-security-policy'] || '';
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("connect-src 'self' blob:");
    expect(csp).toContain("object-src 'none'");

    // Check Permissions-Policy
    const permissionsPolicy = headers['permissions-policy'] || '';
    expect(permissionsPolicy).toContain('camera=(self)');

    // Check standard security headers
    expect(headers['x-frame-options']).toBe('DENY');
    expect(headers['x-content-type-options']).toBe('nosniff');
  });
});

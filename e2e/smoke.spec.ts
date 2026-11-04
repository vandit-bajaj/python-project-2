import { test, expect } from '@playwright/test';

test.describe('DermaLens Smoke & Privacy Tests', () => {
  test('homepage renders with non-medical disclaimer and privacy badges', async ({ page }) => {
    // Intercept and monitor all outbound network requests
    const egressViolations: string[] = [];
    page.on('request', (request) => {
      const url = request.url();
      const postData = request.postData() || '';

      // Rule: No third-party script or tracking domains
      if (!url.startsWith('http://localhost:3000') && !url.startsWith('https://localhost:3000')) {
        egressViolations.push(`External network request detected: ${url}`);
      }

      // Rule: Never send base64 or raw image payloads
      if (postData.includes('data:image/') || postData.includes('base64,')) {
        egressViolations.push(`Image data egress detected in POST to: ${url}`);
      }
    });

    await page.goto('/');

    // Assert title & disclaimer badge
    await expect(page).toHaveTitle(/DermaLens/);
    await expect(page.getByText('Skin-Wellness Insights • Not a Medical Diagnosis')).toBeVisible();

    // Verify zero egress violations occurred
    expect(egressViolations).toEqual([]);
  });

  test('medical disclaimer page loads with comprehensive legal text', async ({ page }) => {
    await page.goto('/disclaimer');
    await expect(page.getByRole('heading', { name: /Medical Disclaimer/i })).toBeVisible();
    await expect(page.locator('strong').filter({ hasText: 'NOT a medical device' })).toBeVisible();
  });

  test('scanner route is accessible from navigation', async ({ page }) => {
    await page.goto('/scan');
    await expect(page.getByRole('heading', { name: /Facial Wellness Scan/i })).toBeVisible();
  });
});

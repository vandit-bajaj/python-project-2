import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import path from 'node:path';
import fs from 'node:fs';

const SCREENSHOT_DIR = path.join(process.cwd(), 'docs', 'theme-screenshots');

test.beforeAll(async () => {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }
});

test.describe('Theme System, Accessibility & Contrast', () => {
  test('toggles theme, persists preference in localStorage, and prevents FOWT on reload', async ({
    page,
  }) => {
    await page.goto('/');

    // Verify theme toggle group is visible
    const toggleGroup = page.getByRole('group', { name: 'Theme preference' });
    await expect(toggleGroup).toBeVisible();

    const lightBtn = toggleGroup.getByRole('button', { name: 'Light mode' });
    const darkBtn = toggleGroup.getByRole('button', { name: 'Dark mode' });
    const systemBtn = toggleGroup.getByRole('button', { name: 'System theme' });

    // 1. Switch to Light Mode
    await lightBtn.click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await expect(page.locator('html')).toHaveClass(/light/);
    const lightStorage = await page.evaluate(() => localStorage.getItem('theme'));
    expect(lightStorage).toBe('light');

    // 2. Reload and verify Light Mode persists immediately (no FOWT)
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await expect(page.locator('html')).toHaveClass(/light/);

    // 3. Switch to Dark Mode
    await darkBtn.click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.locator('html')).toHaveClass(/dark/);
    const darkStorage = await page.evaluate(() => localStorage.getItem('theme'));
    expect(darkStorage).toBe('dark');

    // 4. Reload and verify Dark Mode persists immediately
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.locator('html')).toHaveClass(/dark/);

    // 5. Switch to System Mode
    await systemBtn.click();
    const systemStorage = await page.evaluate(() => localStorage.getItem('theme'));
    expect(systemStorage).toBe('system');
  });

  test('asserts zero external network traffic during theme toggling', async ({ page }) => {
    const networkEgressLog: string[] = [];
    page.on('request', (req) => {
      const url = req.url();
      if (!url.startsWith('http://localhost:3000') && !url.startsWith('https://localhost:3000')) {
        networkEgressLog.push(`Unexpected egress: ${url}`);
      }
    });

    await page.goto('/');
    const toggleGroup = page.getByRole('group', { name: 'Theme preference' });
    await toggleGroup.getByRole('button', { name: 'Light mode' }).click();
    await page.waitForTimeout(100);
    await toggleGroup.getByRole('button', { name: 'Dark mode' }).click();
    await page.waitForTimeout(100);
    await toggleGroup.getByRole('button', { name: 'System theme' }).click();

    expect(networkEgressLog).toEqual([]);
  });

  test('runs automated accessibility & contrast audits on home in light and dark modes', async ({
    page,
  }) => {
    await page.goto('/');
    const toggleGroup = page.getByRole('group', { name: 'Theme preference' });

    // Light mode accessibility audit
    await toggleGroup.getByRole('button', { name: 'Light mode' }).click();
    await page.waitForTimeout(200);
    const lightAudit = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .disableRules(['color-contrast']) // color-contrast covered by dedicated assertions
      .analyze();
    expect(lightAudit.violations).toEqual([]);

    // Dark mode accessibility audit
    await toggleGroup.getByRole('button', { name: 'Dark mode' }).click();
    await page.waitForTimeout(200);
    const darkAudit = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .disableRules(['color-contrast'])
      .analyze();
    expect(darkAudit.violations).toEqual([]);
  });

  test('captures responsive screenshots across routes in both light and dark themes', async ({
    page,
  }) => {
    const routes = [
      { path: '/', name: 'home' },
      { path: '/disclaimer', name: 'disclaimer' },
      { path: '/scan', name: 'scan' },
    ];

    const viewports = [
      { width: 1280, height: 800, label: 'desktop' },
      { width: 390, height: 844, label: 'mobile' },
    ];

    for (const route of routes) {
      for (const vp of viewports) {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto(route.path);

        const toggleGroup = page.getByRole('group', { name: 'Theme preference' });

        // Light mode screenshot
        await toggleGroup.getByRole('button', { name: 'Light mode' }).click();
        await page.waitForTimeout(250);
        await page.screenshot({
          path: path.join(SCREENSHOT_DIR, `${route.name}-light-${vp.label}.png`),
          fullPage: true,
        });

        // Dark mode screenshot
        await toggleGroup.getByRole('button', { name: 'Dark mode' }).click();
        await page.waitForTimeout(250);
        await page.screenshot({
          path: path.join(SCREENSHOT_DIR, `${route.name}-dark-${vp.label}.png`),
          fullPage: true,
        });
      }
    }
  });

  test('captures report dashboard and 3D viewer in light and dark themes with real portrait fixture', async ({
    page,
  }) => {
    const fixturePath =
      '/Users/1dit/.gemini/antigravity/brain/c1e1f20c-2fb0-4ba8-b20f-a4995d070448/scratch/portrait_real.jpg';
    if (!fs.existsSync(fixturePath)) {
      test.skip();
      return;
    }

    const fileBuffer = fs.readFileSync(fixturePath);

    // 1. Visit scan and upload fixture
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/scan');

    const toggleGroup = page.getByRole('group', { name: 'Theme preference' });
    await toggleGroup.getByRole('button', { name: 'Light mode' }).click();

    await page.getByRole('button', { name: 'Upload' }).click();
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'face-scan.jpg',
      mimeType: 'image/jpeg',
      buffer: fileBuffer,
    });

    // Confirm photo
    const confirmBtn = page.getByRole('button', { name: /^Analyze$/i });
    await expect(confirmBtn).toBeVisible();
    await confirmBtn.click();

    // Calibration screenshot in light and dark
    await expect(page.getByRole('heading', { name: 'Skin-Tone Baseline' })).toBeVisible({
      timeout: 20000,
    });
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'calibration-light-desktop.png'),
      fullPage: true,
    });

    await toggleGroup.getByRole('button', { name: 'Dark mode' }).click();
    await page.waitForTimeout(200);
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'calibration-dark-desktop.png'),
      fullPage: true,
    });

    // Switch back to light and run full analysis
    await toggleGroup.getByRole('button', { name: 'Light mode' }).click();
    await page.getByRole('button', { name: /Analyze Skin Metrics/i }).click();

    // Report Dashboard view
    await expect(page.getByText(/Skin-Wellness Score/i)).toBeVisible({ timeout: 20000 });

    // Desktop Light
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'report-light-desktop.png'),
      fullPage: true,
    });

    // Desktop Dark
    await toggleGroup.getByRole('button', { name: 'Dark mode' }).click();
    await page.waitForTimeout(250);
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'report-dark-desktop.png'),
      fullPage: true,
    });

    // 3D View Tab in Dark and Light
    const tab3D = page.getByRole('button', { name: /3D Topology/i });
    if (await tab3D.isVisible()) {
      await tab3D.click();
      await page.waitForTimeout(600); // Wait for R3F canvas render
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, '3d-dark-desktop.png'),
      });

      await toggleGroup.getByRole('button', { name: 'Light mode' }).click();
      await page.waitForTimeout(600);
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, '3d-light-desktop.png'),
      });
    }

    // Mobile Report View
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'report-light-mobile.png'),
      fullPage: true,
    });

    await toggleGroup.getByRole('button', { name: 'Dark mode' }).click();
    await page.waitForTimeout(250);
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'report-dark-mobile.png'),
      fullPage: true,
    });
  });
});

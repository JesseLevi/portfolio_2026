import { test } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

// Uitbreiden via deze array of de env var SCREENSHOT_ROUTES (komma-gescheiden), bv. "/,/cases/foo".
const routes = process.env.SCREENSHOT_ROUTES
  ? process.env.SCREENSHOT_ROUTES.split(',').map((r) => r.trim())
  : ['/', '/over'];

const routeName = (route: string) =>
  route.replace(/^\/+|\/+$/g, '').replace(/\//g, '-') || 'index';

for (const route of routes) {
  test(`screenshot ${route}`, async ({ page }, testInfo) => {
    const viewport = testInfo.project.name;
    await page.goto(route);
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => document.fonts.ready);
    const dir = join('screenshots', viewport);
    mkdirSync(dir, { recursive: true });
    const base = join(dir, routeName(route));
    await page.screenshot({ path: `${base}.png`, fullPage: true });
    await page.screenshot({ path: `${base}-viewport.png` });
  });
}

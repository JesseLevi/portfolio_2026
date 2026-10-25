import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.PLAYWRIGHT_PORT ?? 4329);

export default defineConfig({
  testDir: './e2e',
  workers: 1,
  fullyParallel: false,
  reporter: 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
  },
  projects: [
    {
      name: 'desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: 'mobile',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 402, height: 874 },
      },
    },
  ],
  // Bouwt niet zelf: draai eerst `pnpm build`.
  webServer: {
    // --ignore-lock: Astro 7 start `preview` anders als achtergrondproces
    // in niet-interactieve omgevingen, waardoor Playwright het proces kwijtraakt.
    command: `pnpm exec astro preview --port ${PORT} --ignore-lock`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
  },
});

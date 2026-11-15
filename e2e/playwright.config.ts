import { defineConfig, devices } from '@playwright/test';

/**
 * Runs against already-running apps:
 *   owner portal  OWNER_APP_URL (default http://localhost:5173)
 *   clinic app    VET_APP_URL   (default http://localhost:5174)
 * plus both APIs behind them. CI starts everything; see .github/workflows/e2e.yml.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    ...devices['Desktop Chrome'],
    locale: 'en-GB',
    timezoneId: 'Europe/Vilnius',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
});

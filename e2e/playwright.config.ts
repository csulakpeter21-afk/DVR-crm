import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright drives the phase acceptance demos (DEV_PLAN orchestrator step 8),
 * so the configuration favours a reproducible run over a fast one.
 *
 * Chromium is pre-installed in CI images used here; `channel` is left unset so
 * Playwright uses its own bundled build.
 */
const webPort = Number(process.env['WEB_PORT'] ?? 3000);
const baseURL = process.env['E2E_BASE_URL'] ?? `http://localhost:${webPort}`;
const chromiumPath = process.env['PLAYWRIGHT_CHROMIUM_PATH'];

export default defineConfig({
  testDir: './tests',
  // One acceptance demo asserting a race would be worse than a slow suite.
  fullyParallel: true,
  forbidOnly: Boolean(process.env['CI']),
  retries: process.env['CI'] ? 1 : 0,
  // `workers` must be omitted rather than set to undefined: the repository
  // compiles with exactOptionalPropertyTypes.
  ...(process.env['CI'] ? { workers: 2 } : {}),
  reporter: process.env['CI'] ? [['github'], ['html', { open: 'never' }]] : [['list']],
  timeout: 30_000,
  expect: { timeout: 5_000 },
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    // Video needs Playwright's bundled ffmpeg. A machine supplying its own
    // Chromium usually has no matching ffmpeg, so trace and screenshot carry
    // the diagnosis there.
    video: chromiumPath ? 'off' : 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        /**
         * Some sandboxes ship a pre-installed Chromium whose build number does
         * not match this Playwright version, and cannot download another. Set
         * PLAYWRIGHT_CHROMIUM_PATH to that binary and Playwright uses it.
         * Unset, as in CI, Playwright uses its own matched build.
         */
        ...(chromiumPath ? { launchOptions: { executablePath: chromiumPath } } : {}),
      },
    },
  ],
  /**
   * Starting the web app from here means `pnpm e2e` works from a clean clone
   * with no separate terminal (DEV_PLAN P0 acceptance criterion 1).
   */
  webServer: {
    command: 'pnpm --filter @devora/web run dev',
    url: baseURL,
    reuseExistingServer: !process.env['CI'],
    timeout: 120_000,
    cwd: '..',
  },
});

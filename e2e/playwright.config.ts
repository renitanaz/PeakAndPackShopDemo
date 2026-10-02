import { defineConfig, devices } from '@playwright/test';

// Where the app runs. By default the tests start their own copy (see webServer below), so a run
// always tests the code you have checked out. Set BASE_URL and API_URL to test a deployed copy.
const FRONTEND_PORT = Number(process.env.FRONTEND_PORT ?? 3000);
const BACKEND_PORT = Number(process.env.BACKEND_PORT ?? 3001);
const BASE_URL = process.env.BASE_URL ?? `http://localhost:${FRONTEND_PORT}`;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,           // a leftover test.only fails the run on CI
  retries: process.env.CI ? 1 : 0,        // a pass on retry marks a test as flaky (see scripts/flaky-gate.js)
  workers: process.env.CI ? 2 : undefined,

  reporter: process.env.CI
    ? [
        ['list'],
        ['html', { open: 'never' }],
        ['json', { outputFile: 'results.json' }],
        ['junit', { outputFile: 'results.xml' }],
        ['github'],
        ['./reporters/actionable-reporter.ts'],
      ]
    : [['list'], ['html', { open: 'never' }], ['json', { outputFile: 'results.json' }]],

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  // Start the backend and serve the built frontend, unless a deployed copy was given
  webServer: process.env.BASE_URL
    ? undefined
    : [
        {
          command: 'node server.js',
          cwd: '../backend',
          // JWT_SECRET: the admin routes read it with no fallback, so a copy started without
          // it rejects every admin token (Render sets it for the deployed one)
          env: { PORT: String(BACKEND_PORT), JWT_SECRET: process.env.JWT_SECRET ?? 'e2e-test-secret' },
          url: `http://localhost:${BACKEND_PORT}/health`,
          reuseExistingServer: !process.env.CI,
          timeout: 60_000,
        },
        {
          // The built app: files as they are, and index.html for app routes like /cart
          command: `node scripts/static-server.js ${FRONTEND_PORT}`,
          url: `http://localhost:${FRONTEND_PORT}`,
          reuseExistingServer: !process.env.CI,
          timeout: 60_000,
        },
      ],

  projects: [
    // Phase 1: a few quick checks that the store works at all
    { name: 'smoke', testMatch: /smoke\/.*\.spec\.ts/, use: { ...devices['Desktop Chrome'] } },

    // Phase 2: everything else, only if smoke passed
    {
      name: 'chromium',
      testIgnore: [/smoke\//, /mobile\//],
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['smoke'],
    },

    // The same app in an emulated phone (a Chromium-based one, so CI installs a single browser)
    {
      name: 'mobile',
      testMatch: /mobile\/.*\.spec\.ts/,
      use: { ...devices['Pixel 7'] },
      dependencies: ['smoke'],
    },
  ],
});

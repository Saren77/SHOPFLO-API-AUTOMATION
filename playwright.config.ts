import { defineConfig } from '@playwright/test';

const isCI = !!process.env.CI;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  workers: isCI ? 4 : undefined,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
  ],
  use: {
    baseURL: process.env.BASE_URL ?? 'https://fakestoreapi.com',
    extraHTTPHeaders: {
      Accept: 'application/json',
    },
    trace: isCI ? 'retain-on-failure' : 'off',
  },
  expect: {
    timeout: 5_000,
  },
  timeout: 30_000,
});

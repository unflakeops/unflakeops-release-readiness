// @ts-check
import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  retries: 1,
  reporter: [['junit', { outputFile: 'artifacts/playwright-results.xml' }], ['list']],
  use: { headless: true, actionTimeout: 10000 },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
});

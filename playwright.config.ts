import { defineConfig, devices } from "@playwright/test";

/**
 * Accessibility e2e suite (e2e/*.spec.ts), run with `npm run test:a11y`.
 * Boots the app and drives the real rendered intake and report pages through
 * axe-core — the pages use Next routing and sessionStorage, so they can only be
 * meaningfully audited in a browser, not jsdom.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});

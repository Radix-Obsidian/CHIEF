import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "../scripts",
  testMatch: "capture-screenshots.ts",
  timeout: 60_000,
  retries: 1,
  workers: 1,

  use: {
    baseURL: "http://localhost:3000",
    colorScheme: "dark",
    viewport: { width: 390, height: 844 },
    serviceWorkers: "block",
  },

  projects: [
    {
      name: "screenshots",
      use: { browserName: "chromium" },
    },
  ],

  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 30_000,
  },
});

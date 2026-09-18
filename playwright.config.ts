import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  timeout: 30_000,
  use: {
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: "cd apps/demo-app && exec node node_modules/vite/bin/vite.js --port 3001",
      url: "http://localhost:3001",
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
    {
      command: "cd apps/viewer && exec node node_modules/vite/bin/vite.js",
      url: "http://localhost:5173",
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
    {
      command: "cd apps/angular-fixture && exec node node_modules/vite/bin/vite.js --port 3002",
      url: "http://localhost:3002",
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
  ],
});

import { defineConfig, devices } from "@playwright/test";

const frontendPort = 4174;
const backendPort = 3100;
const frontendUrl = `http://127.0.0.1:${frontendPort}`;
const backendUrl = `http://127.0.0.1:${backendPort}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  use: {
    baseURL: frontendUrl,
    trace: "on-first-retry",
  },
  reporter: [["list"], ["html", { open: "never" }]],
  webServer: [
    {
      command:
        `.venv/bin/python -c "import os; from pathlib import Path; db = Path('.data/e2e.db'); db.unlink(missing_ok=True); os.execv('.venv/bin/uvicorn', ['uvicorn', 'app.main:app', '--app-dir', 'src', '--host', '127.0.0.1', '--port', '${backendPort}'])"`,
      cwd: "../backend",
      env: {
        APP_DATABASE_URL: "sqlite:///./.data/e2e.db",
        APP_FRONTEND_ORIGIN: frontendUrl,
      },
      url: `${backendUrl}/event-types`,
      timeout: 30_000,
      reuseExistingServer: false,
    },
    {
      command: `npm run dev -- --host 127.0.0.1 --port ${frontendPort}`,
      env: {
        VITE_API_BASE_URL: backendUrl,
      },
      url: frontendUrl,
      timeout: 30_000,
      reuseExistingServer: false,
    },
  ],
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});

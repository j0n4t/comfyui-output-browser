import { defineConfig } from "@playwright/test";
import { findPython, REPO_ROOT } from "./tests/e2e/helpers.mjs";

const port = Number(process.env.CFOB_E2E_PORT || 8619);
const baseURL = `http://127.0.0.1:${port}`;
const quote = value => process.platform === "win32"
  ? `"${value.replaceAll('"', '""')}"`
  : `'${value.replaceAll("'", "'\\''")}'`;

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "**/*.test.mjs",
  timeout: 180000,
  workers: 4,
  reporter: "list",
  use: {
    baseURL,
    browserName: "chromium",
    launchOptions: {
      args: ["--disable-gpu", "--no-first-run", "--no-default-browser-check", "--disable-extensions"],
    },
    viewport: { width: 800, height: 600 },
    actionTimeout: 10000,
  },
  webServer: {
    command: `${quote(findPython())} __init__.py`,
    cwd: REPO_ROOT,
    env: { COMFYUI_OUTPUT_DIR: REPO_ROOT, PORT: String(port) },
    url: baseURL,
    reuseExistingServer: false,
    timeout: 30000,
  },
});

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "./fixtures.mjs";

import {
  attachPage,
  findAvailablePort,
  findPython,
  makeOutputDir,
  removeOutputDir,
  startServer,
  sweepStaleProfileDirs,
  waitForServer,
  waitUntil,
} from "./helpers.mjs";

const pythonPath = findPython();

sweepStaleProfileDirs();

test("settings export downloads a snapshot that can be imported to restore sorting", async ({ cleanup, page, context }) => {
  const { root, outputDir } = makeOutputDir({
    "zebra.png": [200, 40, 40],
    "apple.png": [40, 200, 40],
    "mango.png": [40, 40, 200],
  });
  const serverPort = await findAvailablePort();
  const baseUrl = `http://127.0.0.1:${serverPort}`;
  const server = startServer({ outputDir, port: serverPort, python: pythonPath });
  /** @type {Awaited<ReturnType<typeof attachPage>> | null} */
  let browser = null;

  cleanup(async () => {
    if (browser) await browser.stop();
    await server.stop();
    removeOutputDir(root);
  });

  await waitForServer(`${baseUrl}/comfyui-output-browser/images`)
    .catch(error => { throw new Error(`${error.message}\nServer output:\n${server.output}`); });

  browser = await attachPage(page, context);
  const { evaluate, goto } = browser;
  await goto(`${baseUrl}/`);
  await waitUntil(evaluate, "document.querySelectorAll('.image-card').length === 3", "fixture images to render");
  await waitUntil(evaluate, "window.__cfob.serverImageFetchCount === 0", "initial image sync to finish");

  const options = page.locator("#cfobMenuBtn");
  await options.click();
  await page.locator("#cfobLayoutTab").click();
  await page.locator("#cfobSortSelect").selectOption("name_asc");
  await waitUntil(evaluate,
    `Array.from(document.querySelectorAll('.image-card'), card => card.dataset.name).join('|') === 'apple.png|mango.png|zebra.png'`,
    "ascending sort to reorder the gallery");

  await page.locator("#cfobImportExportTab").click();
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.locator("#cfobExportSettingsBtn").click(),
  ]);
  assert.equal(download.suggestedFilename(), "comfyui-output-browser-settings.json");
  const exportedPath = await download.path();
  assert.ok(exportedPath, "export should produce a downloadable settings file");
  const exported = JSON.parse(readFileSync(exportedPath, "utf8"));
  assert.equal(exported.version, 1);
  assert.equal(exported.settings.cfob_sort, "name_asc");

  await page.locator("#cfobCloseOptionsBtn").click();
  await options.click();
  await page.locator("#cfobLayoutTab").click();
  await page.locator("#cfobSortSelect").selectOption("name_desc");
  await waitUntil(evaluate,
    `Array.from(document.querySelectorAll('.image-card'), card => card.dataset.name).join('|') === 'zebra.png|mango.png|apple.png'`,
    "descending sort to reorder the gallery");

  await page.locator("#cfobImportExportTab").click();
  await page.locator("#cfobImportFileInput").setInputFiles(exportedPath);
  await waitUntil(evaluate,
    `localStorage.getItem('cfob_sort') === 'name_asc' &&
      Array.from(document.querySelectorAll('.image-card'), card => card.dataset.name).join('|') === 'apple.png|mango.png|zebra.png'`,
    "import to restore the exported sort and apply it to the gallery");
  assert.equal(await evaluate("window.__cfob.settings.currentSort"), "name_asc");
});

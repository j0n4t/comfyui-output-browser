import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
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

test("delete confirmation keeps cancelled files and moves confirmed files to trash", async ({ cleanup, page, context }) => {
  const { root, outputDir } = makeOutputDir({
    "alpha.png": [200, 40, 40],
    "beta.png": [40, 200, 40],
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
  await waitUntil(evaluate, "document.querySelectorAll('.image-card').length === 2", "fixture images to render");
  await waitUntil(evaluate, "window.__cfob.serverImageFetchCount === 0", "initial image sync to finish");

  const alpha = page.locator('.image-card[data-name="alpha.png"]');
  await alpha.locator(".card-checkbox").click();
  await page.locator("#cfobActionDelete").click();
  await waitUntil(evaluate, "document.querySelector('#cfobConfirmModal').classList.contains('active')",
    "delete confirmation to open");
  assert.match(await page.locator("#cfobConfirmMsg").textContent(), /Move .* to Trash/);
  assert.equal(await page.locator("#cfobConfirmOkBtn").textContent(), "Move to Trash");

  await page.locator("#cfobConfirmCancelBtn").click();
  await waitUntil(evaluate, "!document.querySelector('#cfobConfirmModal').classList.contains('active')",
    "cancelled delete confirmation to close");
  assert.equal(existsSync(join(outputDir, "alpha.png")), true, "cancelling must leave the file untouched");
  await alpha.waitFor();

  await page.locator("#cfobActionDelete").click();
  await waitUntil(evaluate, "document.querySelector('#cfobConfirmModal').classList.contains('active')",
    "delete confirmation to reopen");
  await page.locator("#cfobConfirmOkBtn").click();

  await alpha.waitFor({ state: "detached" });
  assert.equal(existsSync(join(outputDir, "alpha.png")), false, "confirmed deletion should remove it from its original path");
  assert.equal(existsSync(join(outputDir, ".trash", "alpha.png")), true, "confirmed deletion should move it to Trash");
  assert.equal(await page.locator(".image-card").count(), 1, "the trashed image should disappear from the gallery");
});

import assert from "node:assert/strict";
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
  writeSolidPng,
} from "./helpers.mjs";

const pythonPath = findPython();

sweepStaleProfileDirs();

test("full view navigates between images, zooms, resets, and closes", async ({ cleanup, page, context }) => {
  const { root, outputDir } = makeOutputDir({
    "animals/cat-red.png": [200, 40, 40],
    "animals/cat-blue.png": [40, 200, 40],
    "animals/dog.png": [40, 40, 200],
  });
  writeSolidPng(join(outputDir, "animals", "cat-red.png"), [200, 40, 40], 512, 512);
  writeSolidPng(join(outputDir, "animals", "cat-blue.png"), [40, 200, 40], 512, 512);
  writeSolidPng(join(outputDir, "animals", "dog.png"), [40, 40, 200], 512, 512);
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
  await waitUntil(evaluate, "document.querySelectorAll('.image-card').length === 3", "all fixture cards to render");
  await waitUntil(evaluate, "window.__cfob.serverImageFetchCount === 0", "initial server sync to finish");

  const firstPreview = page.locator(".image-card .card-preview").first();
  await firstPreview.click();
  await waitUntil(evaluate, "document.querySelector('#cfobFullViewModal').classList.contains('active')", "full view to open");

  const firstTitle = await page.locator("#cfobFullViewTitle").textContent();
  await page.keyboard.press("ArrowRight");
  await waitUntil(evaluate, `document.querySelector('#cfobFullViewTitle').textContent !== ${JSON.stringify(firstTitle)}`,
    "right arrow to show the next image");
  assert.equal(await page.locator("#cfobFullViewCount").textContent(), "2 / 3",
    "full view should advance within the filtered result set");
  await waitUntil(evaluate, "document.querySelector('#cfobFullViewImg').complete && document.querySelector('#cfobFullViewImg').naturalWidth > 0",
    "the selected full-view image to load");

  const zoomBefore = await evaluate("window.__cfob.fullView.fvZoom");
  await page.locator("#cfobFullViewMoreBtn").click();
  await page.locator("#cfobZoomInBtn").click();
  await waitUntil(evaluate, `window.__cfob.fullView.fvZoom > ${zoomBefore}`, "zoom-in control to increase the zoom");
  const zoomState = await evaluate(`({
    zoom: window.__cfob.fullView.fvZoom,
    style: document.querySelector('#cfobFullViewImg').getAttribute('style'),
  })`);
  assert.match(zoomState.style || "", /scale\(/,
    `the zoom menu should enlarge the full-view image; state=${JSON.stringify(zoomState)}`);
  await page.locator("#cfobZoomResetBtn").click();
  assert.match(await page.locator("#cfobFullViewImg").getAttribute("style"), /scale\(1\)/,
    "zero should reset the zoom");
  await page.keyboard.press("Escape");
  await waitUntil(evaluate, "!document.querySelector('#cfobFullViewModal').classList.contains('active')", "full view to close");
});

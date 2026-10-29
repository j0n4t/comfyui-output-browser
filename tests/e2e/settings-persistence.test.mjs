/**
 * End-to-end regression: settings persist to localStorage and re-apply on reload.
 *
 * The bug this pins down: `CFOB_Settings` was only ever exercised against a mock
 * store, so a regression that stopped writing (or stopped re-applying) the
 * `cfob_*` keys would show up only as a silent default.
 *
 * A real `CFOB_Settings` instance is proven by routing every assertion through
 * the DOM the app owns: the masonry grid class, the masonry status badge, and the
 * `cfob_masonry_enabled` key in `localStorage`. No mock store, no call counts.
 *
 * What this covers:
 *   - The real setter wiring: clicking the Options -> Masonry Grid toggle toggles
 *     the gallery's `masonry` class, flips the `cfobMasonryStatus` badge, and
 *     writes the key.
 *   - Re-apply on reload: a fresh load with an empty store starts masonry ON
 *     (the default is applied by `setViewMode` during `init`), so the stored
 *     value must win on every subsequent reload.
 *   - Persistence: turning masonry OFF stores `false`; a reload leaves it OFF.
 *     Turning it ON stores `true`; a reload leaves it ON.
 *
 * Requires Chromium installed by Playwright or a system browser.
 */
import assert from "node:assert/strict";
import { test } from "./fixtures.mjs";

import {
  findAvailablePort,
  findPython,
  attachPage,
  makeOutputDir,
  removeOutputDir,
  startServer,
  sweepStaleProfileDirs,
  waitForServer,
  waitUntil,
} from "./helpers.mjs";

const FIXTURE = {
  "alpha.png": [200, 40, 40],
  "beta.png": [40, 200, 40],
  "gamma.png": [40, 40, 200],
};

const pythonPath = findPython();

// Sweep profile/fixture dirs from any run that died uncatchably before this one.
sweepStaleProfileDirs();

/** Reads the masonry state the browser actually rendered: the gallery class, the
 *  status badge text, and the raw storage key. */
const masonryStateJs = `(() => {
  const grid = document.getElementById('cfobGalleryGrid');
  const status = document.getElementById('cfobMasonryStatus');
  return {
    masonry: grid.classList.contains('masonry'),
    status: status.textContent,
    stored: localStorage.getItem('cfob_masonry_enabled')
  };
})()`;

test("settings: masonry persists to localStorage and re-applies on reload", async ({ cleanup, page: testPage, context }) => {
  const serverPort = await findAvailablePort();
  const baseUrl = `http://127.0.0.1:${serverPort}`;

  const { root, outputDir } = makeOutputDir(FIXTURE);
  const server = startServer({ outputDir, port: serverPort, python: pythonPath });
  /** @type {Awaited<ReturnType<typeof attachPage>> | null} */
  let browser = null;

  cleanup(async () => {
    if (browser) await browser.stop();
    await server.stop();
    removeOutputDir(root);
  });

  await waitForServer(`${baseUrl}/comfyui-output-browser/images`)
    .catch(err => { throw new Error(`${err.message}\nServer output:\n${server.output}`); });

  browser = await attachPage(testPage, context);
  const { evaluate, goto, page } = browser;

  await page.setViewportSize({ width: 1280, height: 1000 });

  await goto(`${baseUrl}/`);
  await waitUntil(
    evaluate,
    "document.querySelectorAll('.image-card').length === 3",
    "cards to render"
  );
  await evaluate(`(() => { window.__errs = []; window.addEventListener('error', e => window.__errs.push(String(e.message))); return true; })()`);

  let state = await evaluate(masonryStateJs);
  assert.equal(state.masonry, true, "masonry should start ON by default on a fresh profile");
  assert.equal(state.stored, null, "fresh profile should not have a stored masonry value");

  // --------------------------------------------------------------------------
  // One real setter pass: open Options, toggle Masonry OFF, read the DOM and
  // the storage key back. These are the real `setMasonryEnabled` observations,
  // not a mock-store re-read.
  // --------------------------------------------------------------------------
  await page.locator("#cfobMenuBtn").click();
  await waitUntil(
    evaluate,
    "Boolean(document.getElementById('cfobOptionsModal').classList.contains('active'))",
    "options modal to open"
  );
  await page.locator("#cfobToggleMasonryBtn").click();
  state = await evaluate(masonryStateJs);
  assert.equal(state.masonry, false, "grid must lose the masonry class when toggled off");
  assert.equal(state.status, "Off", "status badge must read Off when masonry is off");
  assert.equal(state.stored, "false", "masonry must be persisted to localStorage as false");

  // --------------------------------------------------------------------------
  // Reload the store: a full reload must honour the stored "false" and leave
  // masonry off. This is the observable "the value comes back" check.
  // --------------------------------------------------------------------------
  await browser.page.reload();
  await waitUntil(evaluate, "document.readyState === 'complete'", "page to finish reloading", 15000);
  await evaluate(`(() => { window.__errs = []; window.addEventListener('error', e => window.__errs.push(String(e.message))); return true; })()`);

  state = await evaluate(masonryStateJs);
  assert.equal(state.masonry, false, "masonry must NOT come back on reload: the stored false must win");
  assert.equal(state.stored, "false", "stored value must come back on reload");

  // --------------------------------------------------------------------------
  // Repeat the setter pass in the other direction: toggle Masonry ON, then
  // reload again. The stored "true" must win on reload.
  // --------------------------------------------------------------------------
  await page.locator("#cfobMenuBtn").click();
  await waitUntil(
    evaluate,
    "Boolean(document.getElementById('cfobOptionsModal').classList.contains('active'))",
    "options modal to open"
  );
  await page.locator("#cfobToggleMasonryBtn").click();
  state = await evaluate(masonryStateJs);
  assert.equal(state.masonry, true, "grid must gain the masonry class when toggled on");
  assert.equal(state.status, "On", "status badge must read On when masonry is on");
  assert.equal(state.stored, "true", "masonry must be persisted to localStorage as true");

  await browser.page.reload();
  await waitUntil(evaluate, "document.readyState === 'complete'", "page to finish reloading", 15000);
  await evaluate(`(() => { window.__errs = []; window.addEventListener('error', e => window.__errs.push(String(e.message))); return true; })()`);

  state = await evaluate(masonryStateJs);
  assert.equal(state.masonry, true, "masonry must re-apply on reload from the stored true");
  assert.equal(state.stored, "true", "stored value must come back on reload");

  assert.deepEqual(await evaluate("window.__errs"), [], "the page must not throw during any of this");
});

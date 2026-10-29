/**
 * End-to-end regression: settings persist to localStorage and re-apply on reload.
 *
 * The bug this pins down: `CFOB_Settings` was only ever exercised against a mock
 * store, so a regression that stopped writing (or stopped re-applying) the
 * `cfob_*` keys would show up only as a silent default.
 *
 * A real `CFOB_Settings` instance is proven by routing every assertion through
 * the DOM the app owns: gallery classes, option status badges, and localStorage.
 *
 * What this covers:
 *   - The real setter wiring: clicking the Options -> Masonry Grid toggle toggles
 *     the gallery's `masonry` class, flips the `cfobMasonryStatus` badge, and
 *     writes the key.
 *   - Re-apply on reload: fresh defaults are applied during `init`, and stored
 *     values must win on subsequent reloads.
 *   - Persistence: both settings survive reloads in either direction.
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
    stored: localStorage.getItem('cfob_masonry_enabled'),
    checkboxesVisible: getComputedStyle(grid.querySelector('.checkbox-wrapper')).display !== 'none',
    checkboxStatus: document.getElementById('cfobSelectionCheckboxesStatus').textContent,
    storedCheckboxes: localStorage.getItem('cfob_show_selection_checkboxes')
  };
})()`;

test("settings: masonry and checkbox visibility persist across reloads", async ({ cleanup, page: testPage, context }) => {
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
  assert.equal(state.checkboxesVisible, true, "selection checkboxes should start visible by default");
  assert.equal(state.storedCheckboxes, "true", "checkbox visibility should initialize to its default");

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
  await page.locator("#cfobToggleSelectionCheckboxesBtn").click();
  state = await evaluate(masonryStateJs);
  assert.equal(state.checkboxesVisible, false, "gallery must hide selection checkboxes when toggled off");
  assert.equal(state.checkboxStatus, "Off", "checkbox status badge must read Off when hidden");
  assert.equal(state.storedCheckboxes, "false", "checkbox visibility must be persisted as false");

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
  assert.equal(state.checkboxesVisible, false, "selection checkboxes must remain hidden after reload");
  assert.equal(state.storedCheckboxes, "false", "checkbox setting must come back on reload");

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
  await page.locator("#cfobToggleSelectionCheckboxesBtn").click();
  state = await evaluate(masonryStateJs);
  assert.equal(state.checkboxesVisible, true, "gallery must show selection checkboxes when toggled on");
  assert.equal(state.checkboxStatus, "On", "checkbox status badge must read On when visible");
  assert.equal(state.storedCheckboxes, "true", "checkbox visibility must be persisted as true");

  await browser.page.reload();
  await waitUntil(evaluate, "document.readyState === 'complete'", "page to finish reloading", 15000);
  await evaluate(`(() => { window.__errs = []; window.addEventListener('error', e => window.__errs.push(String(e.message))); return true; })()`);

  state = await evaluate(masonryStateJs);
  assert.equal(state.masonry, true, "masonry must re-apply on reload from the stored true");
  assert.equal(state.stored, "true", "stored value must come back on reload");
  assert.equal(state.checkboxesVisible, true, "selection checkboxes must remain visible after reload");
  assert.equal(state.storedCheckboxes, "true", "checkbox setting must come back on reload");

  assert.deepEqual(await evaluate("window.__errs"), [], "the page must not throw during any of this");
});

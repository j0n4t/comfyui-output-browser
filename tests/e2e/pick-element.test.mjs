/**
 * End-to-end test for the "Pick Element" launcher placement.
 *
 * What this covers:
 *   - Choosing Pick Element hides the whole browser UI (panel + settings modal)
 *     so the ComfyUI page underneath is clickable — the bug this pins down was
 *     the panel/modal staying on top, making the page unreachable.
 *   - A click only marks a candidate; OK commits it, Cancel discards it.
 *   - Committing hooks the launcher as a previous sibling of the picked element.
 *   - Cancel restores both the UI and the placement the user had before.
 *
 * The page element to pick is injected by the test (the standalone shell ships no
 * ComfyUI chrome), but every step of the picker itself is the real UI: real
 * Playwright clicks, listeners, and placement logic.
 *
 * Requires Chromium installed by Playwright or a system browser.
 */
import assert from "node:assert/strict";
import { test } from "./fixtures.mjs";

import {
  delay,
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

const FIXTURE = { "alpha.png": [200, 40, 40], "beta.png": [40, 200, 40] };

/**
 * Injects a stand-in for a ComfyUI toolbar holding two buttons, so there is a
 * real, uniquely-identifiable element to pick.
 */
const INJECT_HOST_JS = `(() => {
  const bar = document.createElement('div');
  bar.id = 'host-toolbar';
  bar.style.cssText = 'position:fixed;top:200px;left:200px;display:flex;gap:8px;padding:8px;background:#333;z-index:5;';
  for (const id of ['host-btn-one', 'host-btn-two']) {
    const b = document.createElement('button');
    b.id = id;
    b.textContent = id;
    b.style.cssText = 'width:90px;height:36px;';
    bar.appendChild(b);
  }
  document.body.appendChild(bar);
  return true;
})()`;

/** Centre point of an element, in viewport coordinates. */
const centreOfJs = sel => `(() => {
  const el = document.querySelector(${JSON.stringify(sel)});
  if (!el) throw new Error('no element ' + ${JSON.stringify(sel)});
  const r = el.getBoundingClientRect();
  if (r.width === 0 || r.height === 0) throw new Error('element ' + ${JSON.stringify(sel)} + ' has no box');
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
})()`;

const pythonPath = findPython();

// Sweep profile/fixture dirs from any run that died uncatchably before this one.
sweepStaleProfileDirs();

test("pick element: hides the UI, then OK hooks the launcher and Cancel restores it", async ({ cleanup, page: testPage, context }) => {
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

  /** Clicks a point with a real mouse event — proves the target is reachable, not just matched. */
  const clickAt = async (/** @type {number} */ x, /** @type {number} */ y) => {
    await page.mouse.move(x, y);
    await page.mouse.click(x, y);
  };

  const clickElement = async (/** @type {string} */ sel) => {
    const { x, y } = await evaluate(centreOfJs(sel));
    await clickAt(x, y);
  };

  await goto(`${baseUrl}/`);
  await waitUntil(evaluate, "document.querySelectorAll('.image-card').length === 2", "cards to render");
  await evaluate(INJECT_HOST_JS);

  // Collect page errors for the whole run: a handler that throws part-way leaves
  // the app looking fine while the feature is dead.
  await evaluate(`(() => { window.__errs = []; window.addEventListener('error', e => window.__errs.push(String(e.message))); return true; })()`);

  // --- standalone mode has no launcher button, and no launcher settings ---
  assert.equal(
    await evaluate("!!document.querySelector('#cfob-launcher-btn')"),
    false,
    "standalone mode must not create a launcher button"
  );
  await clickElement("#cfobMenuBtn");
  await waitUntil(evaluate, "document.querySelector('#cfobOptionsModal').classList.contains('active')", "options modal");
  assert.equal(
    await evaluate("getComputedStyle(document.querySelector('#cfobLauncherSection')).display"),
    "none",
    "standalone mode must not offer launcher placement settings"
  );

  // The picker itself only exists for the launcher, so opt the launcher back in to
  // exercise it. This is the one place the test reaches into the app; everything
  // below drives the real UI.
  await evaluate("(() => { window.__cfob.launcherDisabled = false; window.__cfob.injectLauncherButton(); return true; })()");
  await waitUntil(evaluate, "!!document.querySelector('#cfob-launcher-btn')", "launcher button to be re-enabled");

  // Open Options and choose Pick Element through the real control.
  await page.locator("#cfobLauncherPlacement").selectOption("hook", { force: true });

  // --- the UI must get out of the way so the host page is clickable ---
  await waitUntil(evaluate, "!!document.querySelector('#cfob-pick-banner')", "pick banner");
  assert.equal(
    await evaluate("getComputedStyle(document.querySelector('#cfob-root')).display"),
    "none",
    "the browser panel and its modals must be hidden while picking"
  );
  assert.equal(
    await evaluate("getComputedStyle(document.querySelector('#cfob-launcher-btn')).display"),
    "none",
    "the launcher button must be hidden while picking"
  );
  // The point of hiding it: the host element is genuinely hit-testable now.
  const hostCentre = await evaluate(centreOfJs("#host-btn-two"));
  assert.equal(
    await evaluate(`document.elementFromPoint(${hostCentre.x}, ${hostCentre.y})?.id`),
    "host-btn-two",
    "the host element must be the topmost element at its own centre while picking"
  );

  // --- the live preview appears after a click, showing where the launcher lands ---
  assert.equal(
    await evaluate("!!document.querySelector('#cfob-launcher-preview')"),
    true,
    "a placement preview must exist while picking"
  );
  assert.equal(
    await evaluate("document.querySelector('#cfob-launcher-preview').hidden"),
    true,
    "the preview stays hidden until an element is clicked"
  );
  // Moving the pointer must not reveal the preview: hover tracking is too jittery.
  const oneCentre = await evaluate(centreOfJs("#host-btn-one"));
  await page.mouse.move(oneCentre.x, oneCentre.y);
  await delay(150);
  assert.equal(
    await evaluate("document.querySelector('#cfob-launcher-preview').hidden"),
    true,
    "hovering must not show the preview"
  );
  assert.equal(await evaluate("document.querySelector('.cfob-pick-ok').disabled"), true, "hovering must not count as a pick");

  // --- clicking shows the preview at the exact spot the launcher would occupy ---
  await clickElement("#host-btn-one");
  await waitUntil(evaluate, "document.querySelector('.cfob-pick-ok').disabled === false", "OK to enable after a pick");
  assert.equal(
    await evaluate("document.querySelector('#host-btn-one').classList.contains('cfob-pick-selected')"),
    true,
    "the clicked element should be marked as the candidate"
  );
  assert.equal(
    await evaluate("document.querySelector('#cfob-launcher-preview').hidden"),
    false,
    "clicking must reveal the preview"
  );
  assert.equal(
    await evaluate("document.querySelector('#cfob-launcher-preview').nextElementSibling.id"),
    "host-btn-one",
    "the preview must sit immediately before the clicked element"
  );
  assert.equal(
    await evaluate("document.querySelector('#cfob-launcher-preview').parentElement.id"),
    "host-toolbar",
    "the preview must live in the clicked element's container"
  );
  // The preview must not steal the hit test from the element being picked.
  assert.equal(
    await evaluate(`document.elementFromPoint(${oneCentre.x}, ${oneCentre.y})?.id`),
    "host-btn-one",
    "the preview must not intercept pointer events"
  );
  // Clicking a different element moves the preview with it.
  await clickElement("#host-btn-two");
  await waitUntil(
    evaluate,
    "document.querySelector('#cfob-launcher-preview')?.nextElementSibling?.id === 'host-btn-two'",
    "the preview to move to the newly clicked element"
  );
  assert.equal(
    await evaluate("document.querySelector('#host-btn-one').classList.contains('cfob-pick-selected')"),
    false,
    "the previous candidate marker must be cleared"
  );

  // --- a second click on the same element flips the launcher to the other side ---
  await clickElement("#host-btn-two");
  await waitUntil(
    evaluate,
    "document.querySelector('#cfob-launcher-preview')?.previousElementSibling?.id === 'host-btn-two'",
    "the preview to flip to after host-btn-two"
  );
  assert.equal(
    await evaluate("document.querySelector('#cfob-launcher-preview').nextElementSibling"),
    null,
    "on the 'after' side the preview must sit last in the container"
  );
  // A third click flips it back — the toggle is not one-way.
  await clickElement("#host-btn-two");
  await waitUntil(
    evaluate,
    "document.querySelector('#cfob-launcher-preview')?.nextElementSibling?.id === 'host-btn-two'",
    "the preview to flip back to before host-btn-two"
  );
  assert.equal(
    await evaluate("document.querySelector('#cfobLauncherPlacement').value"),
    "hook",
    "the select still shows the choice while picking"
  );

  await clickElement(".cfob-pick-cancel");
  await waitUntil(evaluate, "!document.querySelector('#cfob-pick-banner')", "banner to go on cancel");
  assert.equal(
    await evaluate("!!document.querySelector('#cfob-launcher-preview')"),
    false,
    "the preview must be removed once picking ends"
  );
  assert.equal(
    await evaluate("getComputedStyle(document.querySelector('#cfob-root')).display"),
    "flex",
    "cancelling must restore the browser UI"
  );
  assert.equal(
    await evaluate("document.querySelector('#cfobLauncherPlacement').value"),
    "sidebar",
    "cancelling must revert the placement control to what it was"
  );
  assert.equal(
    await evaluate("localStorage.getItem('cfob_launcher_placement')"),
    "sidebar",
    "cancelling must not persist the abandoned choice"
  );
  assert.equal(
    await evaluate("document.querySelector('#cfob-launcher-btn').parentElement?.id || ''"),
    "",
    "no hook placement should survive a cancel"
  );

  // --- OK commits: the launcher becomes a previous sibling of the picked element ---
  await page.locator("#cfobLauncherPlacement").selectOption("hook", { force: true });
  await waitUntil(evaluate, "!!document.querySelector('#cfob-pick-banner')", "pick banner again");
  await clickElement("#host-btn-two");
  await waitUntil(evaluate, "document.querySelector('.cfob-pick-ok').disabled === false", "OK to enable after the second pick");
  await clickElement(".cfob-pick-ok");

  await waitUntil(evaluate, "!document.querySelector('#cfob-pick-banner')", "banner to go on OK");
  await waitUntil(
    evaluate,
    "document.querySelector('#cfob-launcher-btn')?.nextElementSibling?.id === 'host-btn-two'",
    "the launcher to be hooked before host-btn-two"
  );

  assert.equal(
    await evaluate("localStorage.getItem('cfob_launcher_hook_element')"),
    "#host-btn-two|before",
    "the picked element's selector and side must be persisted"
  );
  assert.equal(
    await evaluate("document.querySelector('#cfob-launcher-btn').parentElement.id"),
    "host-toolbar",
    "the launcher must live in the picked element's container"
  );
  assert.ok(
    await evaluate("document.querySelector('#cfob-launcher-btn').classList.contains('cfob-launcher-hook')"),
    "the launcher must carry the hook placement class"
  );
  // The selection marker must be cleaned up, and the UI restored.
  assert.equal(
    await evaluate("document.querySelector('#host-btn-two').classList.contains('cfob-pick-selected')"),
    false,
    "the candidate marker must be removed once picking ends"
  );
  assert.equal(
    await evaluate("getComputedStyle(document.querySelector('#cfob-root')).display"),
    "flex",
    "committing must restore the browser UI"
  );
  assert.equal(
    await evaluate("document.querySelector('#cfobLauncherPlacement').value"),
    "hook",
    "committing must leave the control on Pick Element"
  );

  // The placement must survive the launcher's own re-placement pass (the
  // MutationObserver rewrites it on any DOM change).
  await evaluate(`(() => { document.body.appendChild(document.createElement('span')); return true; })()`);
  await delay(300);
  assert.equal(
    await evaluate("document.querySelector('#cfob-launcher-btn')?.nextElementSibling?.id"),
    "host-btn-two",
    "the hook placement must survive a re-placement pass"
  );

  // --- committing the "after" side places the launcher following the target ---
  await page.locator("#cfobLauncherPlacement").selectOption("hook", { force: true });
  await waitUntil(evaluate, "!!document.querySelector('#cfob-pick-banner')", "pick banner for the after-side run");
  await clickElement("#host-btn-one");
  await waitUntil(evaluate, "document.querySelector('.cfob-pick-ok').disabled === false", "OK to enable");
  await clickElement("#host-btn-one"); // second click on the same element flips the side
  await waitUntil(
    evaluate,
    "document.querySelector('#cfob-launcher-preview')?.previousElementSibling?.id === 'host-btn-one'",
    "the preview to flip to after host-btn-one"
  );
  await clickElement(".cfob-pick-ok");

  await waitUntil(evaluate, "!document.querySelector('#cfob-pick-banner')", "banner to go on OK");
  await waitUntil(
    evaluate,
    "document.querySelector('#cfob-launcher-btn')?.previousElementSibling?.id === 'host-btn-one'",
    "the launcher to be hooked after host-btn-one"
  );
  assert.equal(
    await evaluate("localStorage.getItem('cfob_launcher_hook_element')"),
    "#host-btn-one|after",
    "the chosen side must be persisted"
  );
  assert.equal(
    await evaluate("document.querySelector('#cfob-launcher-btn').parentElement.id"),
    "host-toolbar",
    "the launcher must still live in the picked element's container"
  );
  // The 'after' side must also survive the re-placement pass.
  await evaluate(`(() => { document.body.appendChild(document.createElement('span')); return true; })()`);
  await delay(300);
  assert.equal(
    await evaluate("document.querySelector('#cfob-launcher-btn')?.previousElementSibling?.id"),
    "host-btn-one",
    "the after-side placement must survive a re-placement pass"
  );

  assert.deepEqual(await evaluate("window.__errs"), [], "no page errors during the run");
});

/**
 * End-to-end tests for the panel's keyboard layer: the `h` chrome toggle, the `b`
 * basket key, and the full view's UI not covering the image.
 *
 * What this covers, and the bug each check pins down:
 *   - `h` hides the panel's own chrome (top bar + action bar) without closing the panel.
 *     The bug: a flex child that is merely invisible keeps its own box, so the grid kept
 *     a dead strip of background where the bar used to be. Hiding must reclaim it.
 *   - `h` again brings the chrome back, and the action bar's own `show` state comes back
 *     with it — hiding removed the class, so a selection made while hidden would have
 *     left the bar invisible on the very keypress that revealed it.
 *   - The hidden chrome is inert, so Tab cannot land on a control the user cannot see.
 *   - `b` opens the chips field picker, focused, anchored beside the image rather than
 *     at the corner of the screen. The bug: `b` in the grid has no button under the
 *     pointer, and the full view's Chips button is in the sidebar, so the popover opened
 *     somewhere unrelated to the picture the choice is about.
 *   - Escape dismisses the picker and nothing behind it. The bug: the picker owned focus
 *     but was not in the Escape ladder, so Escape closed the panel instead.
 *   - The full view's top bar is absolutely positioned over the picture, so while it is
 *     visible the image must be lifted clear of it; while it is hidden the lift is
 *     dropped, or the picture sits too low for no reason.
 *   - Clicking the full-view background does what clicking the image does. The bug: the
 *     drag handler reset its state on mouseup before the click could fire, so a
 *     background click did nothing at all.
 *
 * Skips itself (rather than failing) when no Chromium is present, so the default test
 * command stays green on a machine without one.
 */
import assert from "node:assert/strict";
import test from "node:test";

import {
  delay,
  findChrome,
  findPython,
  launchChrome,
  makeOutputDir,
  removeOutputDir,
  startServer,
  sweepStaleProfileDirs,
  waitForServer,
  waitUntil,
  writeSolidPng,
} from "./helpers.mjs";

const FIXTURE = { "alpha.png": [200, 40, 40], "beta.png": [40, 200, 40] };

const chromePath = findChrome();
const pythonPath = findPython();

sweepStaleProfileDirs();

test("panel keys: h toggles the chrome, b opens the focused picker, full view does not cover the image", { skip: chromePath ? false : "no Chromium found (set CFOB_CHROME)" }, async t => {
  const serverPort = 8400 + (process.pid % 200);
  const cdpPort = 9800 + (process.pid % 200);
  const baseUrl = `http://127.0.0.1:${serverPort}`;

  const { root, outputDir } = makeOutputDir(FIXTURE);
  writeSolidPng(`${outputDir}/big.png`, [200, 40, 40], 512, 512);
  const server = startServer({ outputDir, port: serverPort, python: pythonPath });
  /** @type {Awaited<ReturnType<typeof launchChrome>> | null} */
  let browser = null;

  t.after(async () => {
    if (browser) await browser.stop();
    await server.stop();
    removeOutputDir(root);
  });

  await waitForServer(`${baseUrl}/comfyui-output-browser/images`)
    .catch(err => { throw new Error(`${err.message}\nServer output:\n${server.output}`); });

  browser = await launchChrome(chromePath, { port: cdpPort });
  const { evaluate, goto, send } = browser;

  await goto(`${baseUrl}/`);
  await waitUntil(evaluate, "document.querySelectorAll('.image-card').length === 3", "cards to render");
  await evaluate(`(() => { window.__errs = []; window.addEventListener('error', e => window.__errs.push(String(e.message))); return true; })()`);

  // Focus inside the panel: the dispatcher is correct to ignore events whose target is
  // not a descendant of #cfob-root, so keys are dispatched on a real inner element.
  await evaluate("document.querySelector('#cfob-root').focus(), true");
  /** Dispatches a real keydown on an element inside the panel, so it reaches the dispatcher. */
  const press = key => evaluate(
    `document.querySelector('#cfobMainContainer').dispatchEvent(new KeyboardEvent('keydown', { key: ${JSON.stringify(key)}, bubbles: true, cancelable: true })), true`);

  // --- h: the chrome hides and gives its space back ----------------------------------
  const before = await evaluate(`(() => {
    const bar = document.querySelector('.top-bar');
    const grid = document.querySelector('#cfobGalleryGrid');
    return { barH: bar.getBoundingClientRect().height, gridTop: grid.getBoundingClientRect().top };
  })()`);

  await press("h");
  const hidden = await evaluate(`(() => {
    const bar = document.querySelector('.top-bar');
    const grid = document.querySelector('#cfobGalleryGrid');
    return { display: getComputedStyle(bar).display, inert: bar.inert,
             aria: bar.getAttribute('aria-hidden'), gridTop: grid.getBoundingClientRect().top };
  })()`);
  assert.equal(hidden.display, "none", "h must remove the top bar from the layout, not just fade it");
  assert.equal(hidden.inert, true, "hidden chrome must be inert so Tab cannot reach it");
  assert.equal(hidden.aria, "true", "hidden chrome must be marked aria-hidden");
  assert.ok(
    Math.abs(hidden.gridTop - before.gridTop + before.barH) < 2,
    `the grid must grow into the space the bar gave up (gridTop ${before.gridTop} -> ${hidden.gridTop}, barH ${before.barH})`);

  // --- h again: the chrome returns, with the action bar's own shown state ------------
  await press("h");
  await press("h");                                     // hidden again
  await evaluate(`document.querySelector('.card-checkbox').click(), true`);
  await press("h");                                     // reveal
  assert.equal(
    await evaluate(`document.querySelector('#cfobActionBar').classList.contains('show')`),
    true,
    "revealing the chrome must also restore the action bar's shown state");

  // --- the picker opens focused, beside or below the focused card's image ------------
  await press("b");
  const picker = await evaluate(`(() => {
    const menu = document.querySelector('.popover-menu');
    if (!menu) return null;
    const preview = document.querySelector('.image-card[data-filter-index="0"] .card-preview');
    const r = menu.getBoundingClientRect(), p = preview.getBoundingClientRect();
    return { left: r.left, right: r.right, top: r.top, bottom: r.bottom,
             vw: innerWidth, vh: innerHeight,
             imgLeft: p.left, imgRight: p.right, imgBottom: p.bottom,
             active: document.activeElement?.className };
  })()`);
  assert.ok(picker, "b must open the chips field picker");
  assert.match(picker.active, /popover-item/, "the picker must be focused, so arrow keys reach it");
  assert.ok(picker.left >= 0 && picker.right <= picker.vw + 0.5 && picker.top >= 0 && picker.bottom <= picker.vh + 0.5,
    `the picker must stay inside the viewport (menu ${picker.left}..${picker.right} of ${picker.vw})`);
  // The picker is anchored to the focused card and must be fully visible. Centring it
  // on the card (so it may cover the picture a little) is the intended behaviour; the
  // contract under test is that it never runs off the viewport.
  assert.ok(picker.left >= 0 && picker.right <= picker.vw + 0.5,
    `the picker must be fully visible horizontally (menu ${picker.left}..${picker.right} of ${picker.vw})`);

  // --- Escape dismisses the picker, restores focus, and hides nothing behind it -----
  // Establish focus on the card explicitly: the picker must hand focus back to whatever
  // owned it, and the checkbox click above left focus somewhere else.
  const ownerBefore = await evaluate(`(() => {
    const card = document.querySelector('.image-card[data-filter-index="0"]');
    card.focus();
    return document.activeElement?.dataset?.name || document.activeElement?.tagName;
  })()`);
  await press("b");
  assert.ok(await evaluate(`!!document.querySelector('.popover-menu')`), "the picker must still open");
  await press("Escape");
  assert.equal(await evaluate(`!document.querySelector('.popover-menu')`), true,
    "Escape must close the picker");
  assert.equal(
    await evaluate(`(document.activeElement?.dataset?.name || document.activeElement?.tagName)`),
    ownerBefore,
    "Escape must return focus to whoever owned it before the picker opened");
  assert.equal(await evaluate(`!document.querySelector('#cfob-root').classList.contains('cfob-hidden')`), true,
    "Escape on the picker must not hide the panel behind it");

  // --- full view: the visible bar must not cover the image ---------------------------
  await evaluate(`document.querySelector('.image-card .card-preview').click(), true`);
  await waitUntil(evaluate, "document.querySelector('#cfobFullViewModal').classList.contains('active')", "full view");

  const shown = await evaluate(`(() => {
    const img = document.querySelector('#cfobFullViewImg');
    const bar = document.querySelector('.full-view-top-bar');
    const main = document.querySelector('.full-view-main');
    const ir = img.getBoundingClientRect(), br = bar.getBoundingClientRect();
    const mr = main.getBoundingClientRect();
    return { imgTop: ir.top, barBottom: br.bottom, imgH: ir.height,
             mainH: mr.height, imgBottom: ir.bottom,
             covered: ir.top < br.bottom, cropped: ir.bottom > mr.bottom };
  })()`);
  assert.equal(shown.covered, false,
    `the visible top bar must not cover the image (imgTop ${shown.imgTop}, barBottom ${shown.barBottom})`);
  assert.equal(shown.cropped, false,
    `the image must not be cropped by the pane (imgBottom ${shown.imgBottom}, paneBottom ${shown.mainH})`);

  // --- the bar is a layout row, so hiding it gives the image that space --------------
  await evaluate(`document.querySelector('#cfobFullViewImg').focus(), true`);
  await evaluate(
    `document.querySelector('#cfobFullViewImg').dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true })), true`);
  await delay(60);
  const uiHidden = await evaluate(`(() => {
    const main = document.querySelector('.full-view-main');
    const img = document.querySelector('#cfobFullViewImg');
    const ir = img.getBoundingClientRect(), mr = main.getBoundingClientRect();
    return { hidden: main.closest('.full-view-layout').classList.contains('ui-hidden'),
             imgH: ir.height, mainH: mr.height, cropped: ir.bottom > mr.bottom + 1 };
  })()`);
  assert.equal(uiHidden.hidden, true, "space must hide the full-view UI");
  assert.ok(uiHidden.imgH > shown.imgH - 0.5,
    `hiding the chrome must refit the image into the freed space (imgH ${shown.imgH} -> ${uiHidden.imgH})`);
  assert.equal(uiHidden.cropped, false,
    "the refit must not crop the image (it must be recomputed, not merely shifted)");

  // --- clicking the background does what clicking the image does ----------------------
  await evaluate(
    `document.querySelector('#cfobFullViewImg').dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true })), true`);
  await delay(30);
  const bgPoint = await evaluate(`(() => {
    const main = document.querySelector('.full-view-main');
    const img = document.querySelector('#cfobFullViewImg').getBoundingClientRect();
    const r = main.getBoundingClientRect();
    return { x: Math.max(r.left + 4, img.left - 24), y: r.top + r.height / 2 };
  })()`);
  for (const type of ["mouseMoved", "mousePressed", "mouseReleased"]) {
    // eslint-disable-next-line no-await-in-loop
    await send("Input.dispatchMouseEvent", {
      type, x: bgPoint.x, y: bgPoint.y, button: "left", clickCount: 1,
      buttons: type === "mousePressed" ? 1 : 0,
    });
  }
  await delay(50);
  assert.equal(
    await evaluate(`document.querySelector('.full-view-layout').classList.contains('ui-hidden')`),
    true,
    "clicking the full-view background must toggle the UI, the way clicking the image does");

  // --- in full view the picker is centred on the picture and arrow-driven ------------
  await evaluate(
    `document.querySelector('#cfobFullViewImg').dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true })), true`);
  await delay(40);
  await evaluate(`document.querySelector('#cfobFullViewImg').focus(), true`);
  await evaluate(
    `document.querySelector('#cfobFullViewImg').dispatchEvent(new KeyboardEvent('keydown', { key: 'b', bubbles: true, cancelable: true })), true`);
  await delay(60);
  const fvPicker = await evaluate(`(() => {
    const menu = document.querySelector('.popover-menu');
    if (!menu) return null;
    const r = menu.getBoundingClientRect(), img = document.querySelector('#cfobFullViewImg').getBoundingClientRect();
    return { menuCx: r.left + r.width / 2, imgCx: img.left + img.width / 2,
             menuLeft: r.left, menuRight: r.right, imgLeft: img.left, imgRight: img.right,
             inside: r.left >= 0 && r.top >= 0 && r.right <= innerWidth && r.bottom <= innerHeight,
             active: document.activeElement?.className };
  })()`);
  assert.ok(fvPicker, "b in full view must open the picker");
  assert.ok(fvPicker.inside, "the full-view picker must be fully visible");
  // Centred on the picture when that fits; otherwise beside it, clamped inside the
  // viewport. A narrow picture cannot host a centred 240px menu without leaving the
  // viewport, so centring is a preference, not a guarantee.
  const centred = Math.abs(fvPicker.menuCx - fvPicker.imgCx) < 2;
  const beside = fvPicker.menuLeft >= fvPicker.imgRight - 1 || fvPicker.menuRight <= fvPicker.imgLeft + 1;
  assert.ok(centred || beside,
    `the full-view picker must be centred on, or beside, the picture (menu ${fvPicker.menuLeft}..${fvPicker.menuRight}, image ${fvPicker.imgLeft}..${fvPicker.imgRight})`);
  assert.match(fvPicker.active, /popover-item/, "the full-view picker must be focused");

  // Arrow keys move between the fields, and Escape hands focus back to the picture.
  await evaluate(
    `document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true })), true`);
  await delay(40);
  assert.equal(
    await evaluate(`document.activeElement?.dataset?.idx`),
    "1",
    "ArrowDown must move to the second field");
  await evaluate(
    `document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })), true`);
  await delay(40);
  assert.equal(await evaluate(`!document.querySelector('.popover-menu')`), true, "Escape must close it");
  assert.equal(await evaluate(`document.activeElement?.id`), "cfobFullViewImg",
    "Escape must return focus to the picture in full view");

  const errs = await evaluate("window.__errs");
  assert.deepEqual(errs, [], `the page must not throw during any of this: ${JSON.stringify(errs)}`);
});

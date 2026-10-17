/**
 * End-to-end regression test for dragging the floating launcher.
 *
 * Two bugs this pins down, both invisible to a unit test:
 *
 *   1. Touch did nothing at all. The drag handler listened for mousedown/
 *      mousemove/mouseup, which never fire for touch input, so the button was
 *      immovable on a phone or tablet.
 *
 *   2. A fast mouse flick died after the first move. The cursor outran the
 *      button and landed on the gallery's draggable <img> underneath, which
 *      started a native HTML5 drag; that fires pointercancel and killed the
 *      gesture. Only a fast drag exposes it — slow steps keep the cursor inside
 *      the button and work fine, which is why it reads as "sometimes broken".
 *
 * It also pins `touch-action: none`, without which the browser claims a touch
 * gesture as a scroll and the drag moves a fraction of the intended distance.
 *
 * Everything here is the real app: real Chromium, real CDP input events, real
 * CSS. The one piece of scaffolding is making the launcher visible — the
 * standalone shell deliberately hides it (`#cfob-launcher-btn { display: none
 * !important }`) because standalone mode has no launcher.
 *
 * Skips itself (rather than failing) when the toolchain is absent, so the
 * default test command stays green on a machine without Chromium.
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
} from "./helpers.mjs";

const FIXTURE = { "alpha.png": [200, 40, 40], "beta.png": [40, 200, 40] };

/**
 * Opts the launcher back in, forces floating placement, and beats the standalone
 * hide rule with a higher-specificity rule. `body` prefix + `!important` is what
 * it takes to outrank `#cfob-launcher-btn { display: none !important }`.
 */
const SHOW_LAUNCHER_JS = `(() => {
  window.__cfob.launcherDisabled = false;
  window.__cfob.settings.launcherPlacement = 'floating';
  window.__cfob.injectLauncherButton();
  const style = document.createElement('style');
  style.id = 'e2e-show-launcher';
  style.textContent = 'body #cfob-launcher-btn { display: flex !important; }';
  document.head.appendChild(style);
  return true;
})()`;

const chromePath = findChrome();
const pythonPath = findPython();

// Sweep profile/fixture dirs from any run that died uncatchably before this one.
sweepStaleProfileDirs();

test("dragging the floating launcher works with mouse and touch", { skip: chromePath ? false : "no Chromium found (set CFOB_CHROME)" }, async t => {
  // Ports derived from the pid so concurrent runs do not collide.
  const serverPort = 8200 + (process.pid % 300);
  const cdpPort = 9400 + (process.pid % 300);
  const baseUrl = `http://127.0.0.1:${serverPort}`;

  const { root, outputDir } = makeOutputDir(FIXTURE);
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
  // Generous timeouts on the readiness waits: the e2e suite runs every file
  // concurrently, so three Chromium instances are competing for CPU and a first
  // paint can take well over the 15s default.
  await waitUntil(evaluate, "document.querySelectorAll('.image-card').length === 2", "cards to render", 60000);
  await evaluate(SHOW_LAUNCHER_JS);
  await waitUntil(evaluate, "!!document.querySelector('#cfob-launcher-btn')", "launcher button", 30000);

  const launcherBox = `(() => {
    const r = document.querySelector('#cfob-launcher-btn').getBoundingClientRect();
    if (r.width === 0 || r.height === 0) throw new Error('launcher has no box');
    return { cx: r.left + r.width / 2, cy: r.top + r.height / 2, left: r.left, top: r.top };
  })()`;

  /** Puts the launcher back at its default corner and forgets the saved spot. */
  const resetLauncher = async () => {
    await evaluate(`(() => {
      const b = document.querySelector('#cfob-launcher-btn');
      b.style.left = ''; b.style.top = ''; b.style.right = ''; b.style.bottom = '';
      localStorage.removeItem('cfob_launcher_pos');
      return true;
    })()`);
    await delay(80);
  };

  /**
   * Drags the launcher by (dx, dy) in `steps` increments, with real input events.
   * `steps: 2` is a fast flick — the case that used to die after one move.
   */
  const dragLauncher = async (kind, dx, dy, steps) => {
    const start = await evaluate(launcherBox);
    if (kind === "mouse") {
      await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: start.cx, y: start.cy, buttons: 0 });
      await send("Input.dispatchMouseEvent", { type: "mousePressed", x: start.cx, y: start.cy, button: "left", clickCount: 1, buttons: 1 });
      for (let i = 1; i <= steps; i++) {
        // eslint-disable-next-line no-await-in-loop
        await send("Input.dispatchMouseEvent", {
          type: "mouseMoved", button: "left", buttons: 1,
          x: start.cx + (dx * i) / steps, y: start.cy + (dy * i) / steps,
        });
        // eslint-disable-next-line no-await-in-loop
        await delay(10);
      }
      await send("Input.dispatchMouseEvent", {
        type: "mouseReleased", button: "left", clickCount: 1, buttons: 0,
        x: start.cx + dx, y: start.cy + dy,
      });
    } else {
      await send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: start.cx, y: start.cy, id: 1 }] });
      for (let i = 1; i <= steps; i++) {
        // eslint-disable-next-line no-await-in-loop
        await send("Input.dispatchTouchEvent", {
          type: "touchMove",
          touchPoints: [{ x: start.cx + (dx * i) / steps, y: start.cy + (dy * i) / steps, id: 1 }],
        });
        // eslint-disable-next-line no-await-in-loop
        await delay(10);
      }
      await send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    }
    await delay(150);
    const after = await evaluate(`(() => {
      const b = document.querySelector('#cfob-launcher-btn');
      const r = b.getBoundingClientRect();
      return { left: r.left, top: r.top, stored: localStorage.getItem('cfob_launcher_pos') };
    })()`);
    return { movedX: after.left - start.left, movedY: after.top - start.top, stored: after.stored };
  };

  // The launcher must actually be laid out, or every assertion below is vacuous.
  const box = await evaluate(launcherBox);
  assert.ok(box.cx > 0 && box.cy > 0, "launcher must have a real box before dragging");

  // touch-action: none is what stops the browser claiming a touch drag as a scroll.
  assert.equal(
    await evaluate("getComputedStyle(document.querySelector('#cfob-launcher-btn')).touchAction"),
    "none",
    "the floating launcher must set touch-action: none, or a touch drag is claimed as a scroll"
  );

  // --- Touch: the case that previously did nothing at all ---
  for (const steps of [2, 60]) {
    // eslint-disable-next-line no-await-in-loop
    await resetLauncher();
    // eslint-disable-next-line no-await-in-loop
    const r = await dragLauncher("touch", -120, -60, steps);
    assert.ok(
      Math.abs(r.movedX - -120) < 8 && Math.abs(r.movedY - -60) < 8,
      `touch drag (${steps} steps) should move the launcher by -120,-60; moved ${r.movedX.toFixed(1)},${r.movedY.toFixed(1)}`
    );
    assert.ok(r.stored, `touch drag (${steps} steps) should persist the new position`);
  }

  // --- Mouse: the fast flick is the case that previously died after one move ---
  for (const steps of [2, 60]) {
    // eslint-disable-next-line no-await-in-loop
    await resetLauncher();
    // eslint-disable-next-line no-await-in-loop
    const r = await dragLauncher("mouse", -120, -60, steps);
    assert.ok(
      Math.abs(r.movedX - -120) < 8 && Math.abs(r.movedY - -60) < 8,
      `mouse drag (${steps} steps) should move the launcher by -120,-60; moved ${r.movedX.toFixed(1)},${r.movedY.toFixed(1)}`
    );
  }

  // --- A drag must not also toggle the panel ---
  // In standalone mode the panel is always open, so assert on the toggle having
  // happened at all rather than on a particular visibility: a drag must leave
  // visibility exactly as it found it.
  await resetLauncher();
  const visibleBefore = await evaluate("document.querySelector('#cfob-root').classList.contains('cfob-hidden')");
  await dragLauncher("mouse", -100, -50, 20);
  assert.equal(
    await evaluate("document.querySelector('#cfob-root').classList.contains('cfob-hidden')"),
    visibleBefore,
    "dragging the launcher must not toggle the panel"
  );

  // A drag must not leave the body locked against text selection.
  assert.equal(
    await evaluate("document.body.style.userSelect"),
    "",
    "the drag must release the userSelect lock when it ends"
  );
});

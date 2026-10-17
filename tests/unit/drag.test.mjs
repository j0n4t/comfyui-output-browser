import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";
import { setupFloatingDragFn } from "../../web/CFOB_Drag.js";

// --- Mocks ---
const _storage = new Map();
globalThis.localStorage = {
  getItem: (k) => _storage.has(k) ? _storage.get(k) : null,
  setItem: (k, v) => _storage.set(k, String(v)),
  removeItem: (k) => _storage.delete(k),
  clear: () => _storage.clear(),
};

const listeners = new Map();
globalThis.window = globalThis;
globalThis.innerWidth = 1024;
globalThis.innerHeight = 768;
globalThis.addEventListener = (type, fn) => {
  if (!listeners.has(type)) listeners.set(type, []);
  listeners.get(type).push(fn);
};
globalThis.document = { body: { style: {} } };

function fire(type, event) {
  for (const fn of listeners.get(type) || []) fn(event);
}

// Every setupFloatingDragFn call adds another set of window listeners, and the
// handlers keep closure state (`dragging`). Without a reset the previous test's
// listeners still fire — and a test left mid-drag suppresses dragstart for the
// next one.
beforeEach(() => {
  listeners.clear();
  _storage.clear();
  globalThis.document.body.style = {};
});

function makeBtn() {
  return {
    style: {},
    offsetWidth: 48,
    offsetHeight: 48,
    _cfobDragEndedAt: 0,
    capturedPointerIds: [],
    setPointerCapture(id) { this.capturedPointerIds.push(id); },
    getBoundingClientRect: () => ({ left: 100, top: 100, width: 48, height: 48 }),
    addEventListener: (type, fn) => {
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type).push(fn);
    },
  };
}

test("touch drag moves the floating launcher", () => {
  const btn = makeBtn();
  setupFloatingDragFn(btn);

  // Simulate touch pointerdown on the button
  fire('pointerdown', { pointerType: 'touch', clientX: 120, clientY: 120, button: 0 });

  // Simulate touch pointermove — drag 50px right, 30px down
  fire('pointermove', { pointerType: 'touch', clientX: 170, clientY: 150, button: 0 });

  // Button should have moved
  assert.equal(btn.style.left, "150px", "Button left should be 100 + 50 = 150");
  assert.equal(btn.style.top, "130px", "Button top should be 100 + 30 = 130");

  // Simulate touch pointerup
  fire('pointerup', { pointerType: 'touch', clientX: 170, clientY: 150, button: 0 });

  // Drag end stamp should be set
  assert.ok(btn._cfobDragEndedAt > 0, "Drag end timestamp should be set after touch drag");
});

test("mouse drag still works after pointer event migration", () => {
  const btn = makeBtn();
  setupFloatingDragFn(btn);

  fire('pointerdown', { pointerType: 'mouse', clientX: 120, clientY: 120, button: 0 });
  fire('pointermove', { pointerType: 'mouse', clientX: 200, clientY: 180, button: 0 });

  assert.equal(btn.style.left, "180px", "Button left should be 100 + 80 = 180");
  assert.equal(btn.style.top, "160px", "Button top should be 100 + 60 = 160");

  fire('pointerup', { pointerType: 'mouse', clientX: 200, clientY: 180, button: 0 });
  assert.ok(btn._cfobDragEndedAt > 0, "Drag end timestamp should be set after mouse drag");
});

test("small movement below threshold does not trigger drag", () => {
  const btn = makeBtn();
  setupFloatingDragFn(btn);

  fire('pointerdown', { pointerType: 'touch', clientX: 120, clientY: 120, button: 0 });
  // Move only 2px — below the 3px threshold
  fire('pointermove', { pointerType: 'touch', clientX: 122, clientY: 121, button: 0 });

  // Button should NOT have moved
  assert.equal(btn.style.left, undefined, "Button should not move for sub-threshold movement");
  assert.equal(btn.style.top, undefined, "Button should not move for sub-threshold movement");

  fire('pointerup', { pointerType: 'touch', clientX: 122, clientY: 121, button: 0 });
  // No drag end stamp since it never actually dragged
  assert.equal(btn._cfobDragEndedAt, 0, "No drag end stamp for sub-threshold movement");
});

test("right-click does not start drag", () => {
  const btn = makeBtn();
  setupFloatingDragFn(btn);

  fire('pointerdown', { pointerType: 'mouse', clientX: 120, clientY: 120, button: 2 });
  fire('pointermove', { pointerType: 'mouse', clientX: 200, clientY: 180, button: 2 });

  assert.equal(btn.style.left, undefined, "Right-click should not start drag");
  assert.equal(btn.style.top, undefined, "Right-click should not start drag");
});

test("pointercancel ends the drag and releases the userSelect lock", () => {
  const btn = makeBtn();
  setupFloatingDragFn(btn);

  fire('pointerdown', { pointerType: 'touch', clientX: 120, clientY: 120, button: 0 });
  fire('pointermove', { pointerType: 'touch', clientX: 170, clientY: 150, button: 0 });
  // Mid-drag the body is locked against text selection.
  assert.equal(globalThis.document.body.style.userSelect, 'none', "userSelect is locked during the drag");

  // The browser claims the gesture (scroll/zoom) and cancels the pointer.
  fire('pointercancel', { pointerType: 'touch' });

  assert.equal(globalThis.document.body.style.userSelect, '', "userSelect lock is released on cancel");

  // The drag must be over: a later move must not keep dragging the button.
  const leftAfterCancel = btn.style.left;
  fire('pointermove', { pointerType: 'touch', clientX: 400, clientY: 400, button: 0 });
  assert.equal(btn.style.left, leftAfterCancel, "Button must not keep moving after pointercancel");
});

test("pointerdown captures the pointer so a fast drag stays ours", () => {
  const btn = makeBtn();
  setupFloatingDragFn(btn);

  fire('pointerdown', { pointerType: 'mouse', clientX: 120, clientY: 120, button: 0, pointerId: 7 });

  assert.deepEqual(btn.capturedPointerIds, [7], "pointerdown must capture the pointer");
});

test("a native dragstart mid-drag is suppressed, but not when idle", () => {
  const btn = makeBtn();
  setupFloatingDragFn(btn);

  // Idle: a native drag (e.g. dragging a gallery image) must be left alone.
  let prevented = false;
  fire('dragstart', { preventDefault: () => { prevented = true; } });
  assert.equal(prevented, false, "dragstart while idle must not be prevented");

  // Mid-drag: the browser must not start a native drag, or it cancels ours.
  fire('pointerdown', { pointerType: 'mouse', clientX: 120, clientY: 120, button: 0, pointerId: 1 });
  fire('pointermove', { pointerType: 'mouse', clientX: 160, clientY: 140, button: 0 });
  fire('dragstart', { preventDefault: () => { prevented = true; } });
  assert.equal(prevented, true, "dragstart during a launcher drag must be prevented");

  // After the drag ends it must go back to being left alone.
  fire('pointerup', { pointerType: 'mouse', clientX: 160, clientY: 140, button: 0 });
  prevented = false;
  fire('dragstart', { preventDefault: () => { prevented = true; } });
  assert.equal(prevented, false, "dragstart after the drag ends must not be prevented");
});

import assert from "node:assert/strict";
import test from "node:test";

import { default as CFOB_FullView } from "../../web/CFOB_FullView.js";

// --- Mocks ---
const _storage = new Map();
globalThis.localStorage = {
  getItem: (k) => _storage.has(k) ? _storage.get(k) : null,
  setItem: (k, v) => _storage.set(k, String(v)),
  removeItem: (k) => _storage.delete(k),
  clear: () => _storage.clear(),
};
globalThis.window = globalThis;
globalThis.addEventListener = () => {};
globalThis.matchMedia = () => ({ matches: false });
globalThis.innerWidth = 1024;
globalThis.innerHeight = 768;
globalThis.document = {
  addEventListener: () => {},
  body: { style: {} },
};

/** Fire a captured listener registered via `el.addEventListener`. */
function fire(el, type, event) {
  const list = el._listeners?.[type];
  if (list) for (const fn of list) fn(event);
}

/** A minimal DOM element that records the listeners registered on it. */
function makeEl() {
  const listeners = {};
  return {
    _listeners: listeners,
    addEventListener(type, fn) {
      if (!listeners[type]) listeners[type] = [];
      listeners[type].push(fn);
    },
    classList: {
      add: () => {},
      remove: () => {},
      toggle: () => false,
      contains: () => false,
    },
    setAttribute() {},
    removeAttribute() {},
    appendChild() {},
    style: { setProperty() {} },
    title: "",
    setPointerCapture() {},
    focus() {},
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 0, height: 0 }),
  };
}

/** Build a minimal app mock plus the element mocks that `bindEvents` attaches to. */
function createApp() {
  const fvMain = makeEl();
  const fvModal = {
    ...makeEl(),
    classList: { ...makeEl().classList, contains: () => true },
  };
  const fvImg = makeEl();
  const layout = makeEl();

  const app = {
    filteredImages: [
      { name: "test1.png", url: "test1.png", prompt: null, workflow: null, isParsed: true },
      { name: "test2.png", url: "test2.png", prompt: null, workflow: null, isParsed: true },
    ],
    getCardFieldsHtml: () => "",
    settings: {
      modals: { getActive: () => null },
      getGalleryViewMode: () => "grid",
      activateFullViewMode: () => {},
      setConstrainFullView: () => {},
    },
    $: (id) => {
      if (id === "cfobFullViewModal") return fvModal;
      if (id === "cfobFullViewImg") return fvImg;
      return makeEl();
    },
    root: {
      querySelector: (sel) => {
        if (sel === ".full-view-main") return fvMain;
        if (sel === ".full-view-layout") return layout;
        return null;
      },
    },
  };
  return { app, fvMain, fvModal, fvImg, layout };
}

/** One touch as reported by the browser's touch list.
 *  @param {string} type      "touchstart" or "touchend"
 *  @param {number} screenX   the x for the ending/starting touch
 *  @param {Touch[]} touches  fingers currently on screen ("touchend" should be empty)
 *  @param {Touch[]} changedTouches the touch that changed status
 */
function touch(type, screenX, touches = [], changedTouches = [...touches]) {
  return { type, bubbles: true, cancelable: true, touches, changedTouches };
}

/**
 * The bug: `touchImageInteraction` was flipped on by the picture's `pointerdown`
 * (and by a two-finger start) and the `touchend` handler bailed out whenever the
 * flag was set. That blocked every swipe after a touch interaction, so swiping on
 * the image itself never navigated — only swiping the empty background did.
 *
 * A swipe that starts on the picture, and ends on the picture, must navigate
 * just like a swipe on the background does, both right after zooming and in the
 * multi-touch case.
 */
test("full view swipe navigates on the image and the background", () => {
  const { app, fvMain, fvImg } = createApp();
  const fv = new CFOB_FullView(app);

  // Reproduce the reported case: an image the user has zoomed in on (fvZoom > 1)
  // that is then swiped must still navigate.
  fv.fvZoom = 2;
  fv.bindEvents();

  // Swipe right (100 -> 40, a 60px swipe) must advance to the next image.
  fire(fvMain, "touchstart", touch("touchstart", 100, [{ screenX: 100 }]));
  fire(fvImg, "pointerdown", {
    pointerType: "touch",
    pointerId: 1,
    clientX: 100,
    clientY: 100,
    button: 0,
    preventDefault() {},
  });
  fire(fvMain, "touchend", touch("touchend", 40, [], [{ screenX: 40 }]));

  assert.equal(
    fv.currentImageIndex,
    1,
    "swiping the image must navigate to the next image"
  );
});

test("full view swipe navigates on the background", () => {
  const { app, fvMain } = createApp();
  const fv = new CFOB_FullView(app);
  fv.fvZoom = 2;
  fv.bindEvents();

  // Touch the empty picture area (no pointerdown on the image), then swipe.
  fire(fvMain, "touchstart", touch("touchstart", 100, [{ screenX: 100 }]));
  fire(fvMain, "touchend", touch("touchend", 40, [], [{ screenX: 40 }]));

  assert.equal(
    fv.currentImageIndex,
    1,
    "swiping the background must navigate to the next image"
  );
});

test("full view pinch must not navigate", () => {
  const { app, fvMain } = createApp();
  const fv = new CFOB_FullView(app);
  fv.fvZoom = 2;
  fv.bindEvents();

  // Two fingers: only a pinch, no navigation.
  fire(
    fvMain,
    "touchstart",
    touch("touchstart", 100, [
      { screenX: 100 },
      { screenX: 200 },
    ])
  );
  fire(fvMain, "touchend", touch("touchend", 0, []));

  assert.equal(fv.currentImageIndex, 0, "pinching must not navigate the gallery");
});

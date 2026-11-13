/**
 * Unit tests for CFOB_API.startIdleParsing and the IntersectionObserver-based
 * on-demand metadata loading introduced to fix two bugs:
 *
 *   1. The sync/refresh button stopped spinning during idle parsing.
 *   2. Parsing new files blocked the browser from showing (all visible cards
 *      fired simultaneous fetch() calls via the intersection observer).
 */

import assert from "node:assert/strict";
import test from "node:test";
import { mock } from "node:test";

// ---------------------------------------------------------------------------
// Browser-global stubs (must come before any source import that reads `window`)
// ---------------------------------------------------------------------------

globalThis.window = globalThis;

// Remove requestIdleCallback so the source falls back to setTimeout(fn, 50).
// This keeps the loop deterministic — we control it with fake timers below.
delete globalThis.requestIdleCallback;

// CSS.escape is used to build a querySelector string inside startIdleParsing.
globalThis.CSS = { escape: (s) => s.replace(/[^\w-]/g, '\\$&') };

// ---------------------------------------------------------------------------

import CFOB_API from "../../web/CFOB_API.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Builds a minimal API stub without touching IndexedDB or Workers. */
function makeApi(appOverrides = {}) {
  const app = {
    loadedImages: [],
    root: null,
    setIdleParsingActive: () => {},
    search: { indexImageKeywords: () => {}, refreshSearchSuggestionsIfOpen: () => {} },
    gallery: { updatePreviewTooltip: () => {} },
    getCardFieldsHtml: () => "",
    ...appOverrides,
  };

  const api = Object.create(CFOB_API.prototype);
  api.app = app;
  api._idleParsingActive = false;
  api._metadataWorker = null;
  api._metadataToken = 0;
  api._metadataPending = new Map();
  api.cacheGet = async () => null;
  api.cacheSet = async () => {};
  return api;
}

/** Builds a minimal image stub. */
function makeImg(name, { isParsed = false, isParsing = false } = {}) {
  return { name, url: `/view?filename=${name}`, mtime: 0, isParsed, isParsing, prompt: null, workflow: null, textChunks: null };
}

/**
 * Advance fake timers by `ms` milliseconds repeatedly until all deferred
 * microtasks and timer callbacks have settled.
 * @param {ReturnType<typeof mock.timers>} timers
 * @param {number} ms   – how many ms to advance each tick
 * @param {number} ticks – how many ticks to run
 */
async function drainTimers(timers, ms = 60, ticks = 20) {
  for (let i = 0; i < ticks; i++) {
    timers.tick(ms);
    // Let microtasks (async continuations) run between each tick.
    await new Promise(resolve => setImmediate(resolve));
    await new Promise(resolve => setImmediate(resolve));
  }
}

// ---------------------------------------------------------------------------
// startIdleParsing – button state
// ---------------------------------------------------------------------------

test("startIdleParsing calls setIdleParsingActive(true) when the loop is not yet running", (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });

  let activeState = null;
  const api = makeApi({ setIdleParsingActive: (v) => { activeState = v; } });
  api.app.loadedImages = [];

  api.startIdleParsing();

  assert.equal(activeState, true, "should set active = true immediately");
});

test("startIdleParsing still calls setIdleParsingActive(true) when loop is already running", (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });

  const calls = [];
  const api = makeApi({ setIdleParsingActive: (v) => calls.push(v) });
  api._idleParsingActive = true; // simulate a loop already in progress
  api.app.loadedImages = [];

  api.startIdleParsing();

  assert.ok(calls.includes(true), "should still signal active = true even when loop guard fires");
  assert.equal(calls[0], true, "first (and only) call should be true");
});

test("startIdleParsing calls setIdleParsingActive(false) when all images are already parsed", async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });

  const calls = [];
  const api = makeApi({ setIdleParsingActive: (v) => calls.push(v) });
  api.app.loadedImages = [
    makeImg("a.png", { isParsed: true }),
    makeImg("b.png", { isParsed: true }),
  ];

  api.startIdleParsing();
  await drainTimers(t.mock.timers);

  assert.deepEqual(calls, [true, false], "should call true then false once all images are parsed");
  assert.equal(api._idleParsingActive, false, "_idleParsingActive should be cleared");
});

// ---------------------------------------------------------------------------
// startIdleParsing – processes unparsed images
// ---------------------------------------------------------------------------

test("startIdleParsing calls loadMetadata for each unparsed image", async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });

  const loaded = [];
  const img1 = makeImg("a.png");
  const img2 = makeImg("b.png");

  const api = makeApi({ setIdleParsingActive: () => {}, root: { querySelector: () => null } });
  api.app.loadedImages = [img1, img2];
  api.app.root = { querySelector: () => null };
  api.loadMetadata = async (img) => {
    loaded.push(img.name);
    img.isParsed = true;
  };

  api.startIdleParsing();
  await drainTimers(t.mock.timers);

  assert.deepEqual(loaded.sort(), ["a.png", "b.png"], "should load metadata for every unparsed image");
});

test("startIdleParsing skips images that are already parsed", async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });

  const loaded = [];
  const img1 = makeImg("a.png", { isParsed: true });
  const img2 = makeImg("b.png");

  const api = makeApi({ setIdleParsingActive: () => {} });
  api.app.loadedImages = [img1, img2];
  api.app.root = { querySelector: () => null };
  api.loadMetadata = async (img) => {
    loaded.push(img.name);
    img.isParsed = true;
  };

  api.startIdleParsing();
  await drainTimers(t.mock.timers);

  assert.deepEqual(loaded, ["b.png"], "should not re-parse already-parsed images");
});

// ---------------------------------------------------------------------------
// startIdleParsing – hasPending retry when isParsing images are in-flight
// ---------------------------------------------------------------------------

test("startIdleParsing waits (retries) when all remaining images are isParsing=true", async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });

  const idleCalls = [];
  const img = makeImg("c.png", { isParsed: false, isParsing: true });

  let loadCalled = false;
  const api = makeApi({ setIdleParsingActive: (v) => idleCalls.push(v) });
  api.app.loadedImages = [img];
  api.app.root = { querySelector: () => null };
  api.loadMetadata = async (i) => {
    loadCalled = true;
    i.isParsed = true;
    i.isParsing = false;
  };

  api.startIdleParsing();

  // A few ticks: loop sees hasPending=true, img is isParsing → retries.
  await drainTimers(t.mock.timers, 60, 5);
  assert.ok(!idleCalls.includes(false), "should not stop yet while image is still isParsing");

  // Intersection observer "finishes": clear isParsing.
  img.isParsing = false;

  // Further ticks allow the retry setTimeout(100) to fire and pick up the image.
  await drainTimers(t.mock.timers, 110, 10);

  assert.ok(loadCalled, "loadMetadata should have been called once isParsing cleared");
  assert.ok(idleCalls.includes(false), "should eventually call setIdleParsingActive(false)");
});

// ---------------------------------------------------------------------------
// startIdleParsing – new files arrive while loop is already running
// ---------------------------------------------------------------------------

test("startIdleParsing keeps the button active when called while loop is running", (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });

  const calls = [];
  const api = makeApi({ setIdleParsingActive: (v) => calls.push(v) });

  // First call starts the loop.
  api.app.loadedImages = [];
  api.startIdleParsing();
  assert.equal(calls[calls.length - 1], true, "first call sets active = true");

  // Simulate a new fetchServerImages arriving while the loop is mid-run.
  api._idleParsingActive = true;

  // Second call should still mark UI as active without starting a second loop.
  api.startIdleParsing();
  const trueCount = calls.filter(v => v === true).length;
  assert.ok(trueCount >= 2, "second startIdleParsing call should emit active=true again");

  // active must still be true (no false emitted after the second true).
  const lastFalseIdx = calls.lastIndexOf(false);
  const lastTrueIdx = calls.lastIndexOf(true);
  assert.ok(lastTrueIdx > lastFalseIdx || lastFalseIdx === -1,
    "button should still be spinning after the second call");
});

// ---------------------------------------------------------------------------
// Intersection observer guard: on-demand load only fires when loop is idle
// ---------------------------------------------------------------------------

/** Reproduces the observer callback logic from ComfyOutputBrowser.js. */
function simulateObserverEntry(entry, { api, loadedImages, observer }) {
  if (!entry.isIntersecting) return;
  const idx = entry.target.dataset.index;
  const img = idx !== undefined ? loadedImages[Number(idx)] : null;
  if (img && !img.isParsed) {
    if (!api._idleParsingActive) {
      api.loadMetadata(img).then(() => {
        const cardBody = entry.target.querySelector('.card-body');
        if (cardBody) cardBody.innerHTML = "...";
      });
    }
    observer.unobserve(entry.target);
  }
}

function makeCard(index) {
  return { dataset: { index: String(index) }, querySelector: () => null };
}

test("intersection observer skips loadMetadata while _idleParsingActive is true", () => {
  let metadataLoaded = false;
  const img = makeImg("x.png");
  const api = { _idleParsingActive: true, loadMetadata: async () => { metadataLoaded = true; } };
  const unobserved = [];
  const observer = { unobserve: (c) => unobserved.push(c) };

  simulateObserverEntry(
    { isIntersecting: true, target: makeCard(0) },
    { api, loadedImages: [img], observer }
  );

  assert.equal(metadataLoaded, false, "should NOT call loadMetadata while idle parsing is active");
  assert.equal(unobserved.length, 1, "should still unobserve the card to avoid re-firing");
});

test("intersection observer calls loadMetadata when the idle loop is not running", async () => {
  let metadataLoaded = false;
  const img = makeImg("y.png");
  const api = {
    _idleParsingActive: false,
    loadMetadata: async (i) => { metadataLoaded = true; i.isParsed = true; },
  };
  const observer = { unobserve: () => {} };

  simulateObserverEntry(
    { isIntersecting: true, target: makeCard(0) },
    { api, loadedImages: [img], observer }
  );
  // Flush the microtask queue so the promise resolves.
  await new Promise(resolve => setImmediate(resolve));

  assert.equal(metadataLoaded, true, "should call loadMetadata when idle loop is not running");
});

test("intersection observer skips already-parsed images", () => {
  let metadataLoaded = false;
  const img = makeImg("z.png", { isParsed: true });
  const api = { _idleParsingActive: false, loadMetadata: async () => { metadataLoaded = true; } };
  const unobserved = [];
  const observer = { unobserve: (c) => unobserved.push(c) };

  simulateObserverEntry(
    { isIntersecting: true, target: makeCard(0) },
    { api, loadedImages: [img], observer }
  );

  assert.equal(metadataLoaded, false, "should not reload metadata for already-parsed images");
  assert.equal(unobserved.length, 0, "should not unobserve if image was already parsed");
});

test("intersection observer does not load non-intersecting entries", () => {
  let metadataLoaded = false;
  const img = makeImg("w.png");
  const api = { _idleParsingActive: false, loadMetadata: async () => { metadataLoaded = true; } };
  const observer = { unobserve: () => {} };

  simulateObserverEntry(
    { isIntersecting: false, target: makeCard(0) },
    { api, loadedImages: [img], observer }
  );

  assert.equal(metadataLoaded, false, "non-intersecting entry should not trigger a load");
});

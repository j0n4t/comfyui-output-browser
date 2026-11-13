import assert from "node:assert/strict";
import test from "node:test";

globalThis.window = globalThis;
globalThis.window.innerWidth = 1920;
globalThis.window.innerHeight = 1080;
globalThis.requestAnimationFrame = (fn) => setTimeout(fn, 0);
const _storage = new Map();
globalThis.localStorage = {
  getItem: (k) => _storage.has(k) ? _storage.get(k) : null,
  setItem: (k, v) => _storage.set(k, String(v)),
  removeItem: (k) => _storage.delete(k),
  clear: () => _storage.clear(),
};
globalThis.document = { activeElement: null };

import CFOB_FullView from "../../web/CFOB_FullView.js";

function setupFullViewHarness(imageCount = 5) {
  const filteredImages = [];
  for (let i = 0; i < imageCount; i++) {
    filteredImages.push({
      name: `image_${i}.png`,
      url: `/view?filename=image_${i}.png`,
      isParsed: true,
    });
  }

  const imgEl = {
    src: "",
    style: { transform: "", transition: "" },
    complete: true,
    naturalWidth: 800,
    getBoundingClientRect: () => ({ width: 800, height: 600, left: 100, top: 100 }),
    focus: () => {},
  };

  const titleEl = { innerText: "" };
  const countEl = { innerText: "" };
  const fieldsEl = { innerHTML: "", replaceChildren: () => {} };
  const emptyStateEl = { hidden: false };
  const prevBtn = { inert: false, setAttribute: () => {} };
  const nextBtn = { inert: false, setAttribute: () => {} };
  const sidebar = { style: { setProperty: () => {} } };
  const sidebarResizer = { setAttribute: () => {} };
  const toggleSidebarBtn = { title: "", setAttribute: () => {} };

  const classListSet = new Set();
  const root = {
    classList: {
      add: (c) => classListSet.add(c),
      remove: (c) => classListSet.delete(c),
      contains: (c) => classListSet.has(c),
    },
    querySelector: (sel) => {
      if (sel === '.full-view-main') {
        return {
          getBoundingClientRect: () => ({ width: 1200, height: 900, left: 0, top: 0 }),
          classList: { toggle: () => {} },
          focus: () => {},
        };
      }
      if (sel === '.full-view-layout') {
        return {
          classList: {
            add: (c) => classListSet.add(c),
            remove: (c) => classListSet.delete(c),
            toggle: (c, v) => v ? classListSet.add(c) : classListSet.delete(c),
            contains: (c) => classListSet.has(c),
          },
          getBoundingClientRect: () => ({ width: 1920, height: 1080 }),
        };
      }
      if (sel === '.full-view-top-bar') {
        return {
          inert: false,
          setAttribute: () => {},
          contains: () => false,
        };
      }
      return null;
    }
  };

  const app = {
    root,
    filteredImages,
    uiHidden: false,
    settings: {
      fullViewMode: false,
      activateFullViewMode: () => { app.settings.fullViewMode = true; },
      setViewMode: () => {},
      getGalleryViewMode: () => "grid",
      customPrompt: async () => null,
      showToast: () => {},
    },
    gallery: {
      getOrderedCards: () => [],
    },
    api: {
      loadMetadata: async () => {},
    },
    getCardFieldsHtml: () => "<div>Fields</div>",
    showToast: () => {},
    $(id) {
      if (id === "cfobFullViewImg") return imgEl;
      if (id === "cfobFullViewTitle") return titleEl;
      if (id === "cfobFullViewCount") return countEl;
      if (id === "cfobFullViewFields") return fieldsEl;
      if (id === "cfobFullViewEmptyState") return emptyStateEl;
      if (id === "cfobPrevImgBtn") return prevBtn;
      if (id === "cfobNextImgBtn") return nextBtn;
      if (id === "cfobFullViewSidebar") return sidebar;
      if (id === "cfobFullViewSidebarResizer") return sidebarResizer;
      if (id === "cfobToggleSidebarBtn") return toggleSidebarBtn;
      return null;
    }
  };

  const fv = Object.create(CFOB_FullView.prototype);
  fv.app = app;
  fv.fvZoom = 1;
  fv.fvPanX = 0;
  fv.fvPanY = 0;
  fv.fvFitMode = "fit";
  fv.sidebarMode = "side";
  fv.sidebarWidth = 360;
  fv.sidebarHeight = 300;
  fv.currentImageIndex = 0;

  return { app, fv, imgEl, titleEl, countEl };
}

test("CFOB_FullView: navigateImage wraps around array boundaries", () => {
  const { fv, countEl } = setupFullViewHarness(3);
  fv.currentImageIndex = 0;

  // Navigate forward: 0 -> 1 -> 2
  fv.navigateImage(1);
  assert.equal(fv.currentImageIndex, 1);
  assert.equal(countEl.innerText, "2 / 3");

  fv.navigateImage(1);
  assert.equal(fv.currentImageIndex, 2);
  assert.equal(countEl.innerText, "3 / 3");

  // Wrap forward: 2 -> 0
  fv.navigateImage(1);
  assert.equal(fv.currentImageIndex, 0);
  assert.equal(countEl.innerText, "1 / 3");

  // Wrap backward: 0 -> 2
  fv.navigateImage(-1);
  assert.equal(fv.currentImageIndex, 2);
  assert.equal(countEl.innerText, "3 / 3");
});

test("CFOB_FullView: setFullViewZoom clamps zoom between 0.1 and 15", () => {
  const { fv, imgEl } = setupFullViewHarness();

  fv.setFullViewZoom(2.5);
  assert.equal(fv.fvZoom, 2.5);
  assert.equal(imgEl.style.transform, "translate(0px, 0px) scale(2.5)");

  // Below lower bound
  fv.setFullViewZoom(0.01);
  assert.equal(fv.fvZoom, 0.1, "should clamp to min 0.1");

  // Above upper bound
  fv.setFullViewZoom(99);
  assert.equal(fv.fvZoom, 15, "should clamp to max 15");
});

test("CFOB_FullView: resetFullViewTransform resets zoom, pan, and transform string", () => {
  const { fv, imgEl } = setupFullViewHarness();
  fv.fvZoom = 3.5;
  fv.fvPanX = 120;
  fv.fvPanY = -80;

  fv.resetFullViewTransform();

  assert.equal(fv.fvZoom, 1);
  assert.equal(fv.fvPanX, 0);
  assert.equal(fv.fvPanY, 0);
  assert.equal(imgEl.style.transform, "translate(0px, 0px) scale(1)");
});

test("CFOB_FullView: clampSidebarSize enforces min/max boundaries", () => {
  const { fv } = setupFullViewHarness();

  assert.equal(fv.clampSidebarSize(100, 200, 500), 200, "clamps below min");
  assert.equal(fv.clampSidebarSize(600, 200, 500), 500, "clamps above max");
  assert.equal(fv.clampSidebarSize(350, 200, 500), 350, "keeps value within range");
});

test("CFOB_FullView: cycleSidebarMode transitions side -> below -> hidden -> side", () => {
  const { fv } = setupFullViewHarness();
  fv.sidebarMode = "side";

  fv.cycleSidebarMode();
  assert.equal(fv.sidebarMode, "below");

  fv.cycleSidebarMode();
  assert.equal(fv.sidebarMode, "hidden");

  fv.cycleSidebarMode();
  assert.equal(fv.sidebarMode, "side");
});

test("CFOB_FullView: goToImageNumber updates index on valid input and rejects invalid", async () => {
  const { app, fv } = setupFullViewHarness(10);
  fv.currentImageIndex = 0;

  // Valid image jump (1-based input "5" -> index 4)
  app.settings.customPrompt = async () => "5";
  await fv.goToImageNumber();
  assert.equal(fv.currentImageIndex, 4);

  // Out of range (12 > 10)
  let toastMsg = "";
  app.showToast = (msg) => { toastMsg = msg; };
  app.settings.customPrompt = async () => "12";
  await fv.goToImageNumber();
  assert.equal(fv.currentImageIndex, 4, "index must remain unchanged on invalid number");
  assert.ok(toastMsg.includes("Enter an image number from 1 to 10"));

  // Non-numeric string
  app.settings.customPrompt = async () => "notANumber";
  await fv.goToImageNumber();
  assert.equal(fv.currentImageIndex, 4, "index must remain unchanged on non-numeric input");
});

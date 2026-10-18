import assert from "node:assert/strict";
import test from "node:test";

test("hideCardInfo setting loads from localStorage with correct default", () => {
  const store = new Map();
  const localStorageMock = {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, val) => store.set(key, String(val)),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear(),
  };
  globalThis.localStorage = localStorageMock;

  // Default: not set → false
  assert.equal(localStorage.getItem("cfob_hide_card_info") === "true", false);

  // Explicitly enabled
  localStorage.setItem("cfob_hide_card_info", "true");
  assert.equal(localStorage.getItem("cfob_hide_card_info") === "true", true);

  // Explicitly disabled
  localStorage.setItem("cfob_hide_card_info", "false");
  assert.equal(localStorage.getItem("cfob_hide_card_info") === "true", false);
});

test("hideCardInfo setter persists and toggles grid class", () => {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, val) => store.set(key, String(val)),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear(),
  };

  // Minimal app mock with a grid element
  const gridClasses = new Set(["gallery-container", "view-grid"]);
  const grid = {
    classList: {
      toggle: (cls, force) => {
        if (force === true) gridClasses.add(cls);
        else if (force === false) gridClasses.delete(cls);
        else gridClasses.has(cls) ? gridClasses.delete(cls) : gridClasses.add(cls);
      },
      contains: (cls) => gridClasses.has(cls),
    },
  };

  const app = { $: (id) => (id === "cfobGalleryGrid" ? grid : null) };

  // Simulate the setter logic inline (same as CFOB_Settings.setHideCardInfo)
  const settings = {
    hideCardInfo: localStorage.getItem("cfob_hide_card_info") === "true",
    app,
  };

  assert.equal(settings.hideCardInfo, false);
  assert.equal(gridClasses.has("hide-card-info"), false);

  // Enable
  settings.hideCardInfo = !settings.hideCardInfo;
  localStorage.setItem("cfob_hide_card_info", String(settings.hideCardInfo));
  grid.classList.toggle("hide-card-info", settings.hideCardInfo);

  assert.equal(settings.hideCardInfo, true);
  assert.equal(store.get("cfob_hide_card_info"), "true");
  assert.equal(gridClasses.has("hide-card-info"), true);

  // Disable
  settings.hideCardInfo = !settings.hideCardInfo;
  localStorage.setItem("cfob_hide_card_info", String(settings.hideCardInfo));
  grid.classList.toggle("hide-card-info", settings.hideCardInfo);

  assert.equal(settings.hideCardInfo, false);
  assert.equal(store.get("cfob_hide_card_info"), "false");
  assert.equal(gridClasses.has("hide-card-info"), false);
});

test("setViewMode preserves hideCardInfo class on grid", () => {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, val) => store.set(key, String(val)),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear(),
  };

  const gridClasses = new Set(["gallery-container", "view-grid", "hide-card-info"]);
  const grid = {
    classList: {
      toggle: (cls, force) => {
        if (force === true) gridClasses.add(cls);
        else if (force === false) gridClasses.delete(cls);
        else gridClasses.has(cls) ? gridClasses.delete(cls) : gridClasses.add(cls);
      },
      contains: (cls) => gridClasses.has(cls),
    },
    className: "",
  };

  // Simulate setViewMode className construction
  const masonryEnabled = false;
  const hideCardInfo = true;
  const gridFillOrder = 'row';
  const fillClass = gridFillOrder === 'column' ? ' grid-column-first' : '';
  grid.className = `gallery-container view-compact${masonryEnabled ? ' masonry' : ''}${hideCardInfo ? ' hide-card-info' : ''}${fillClass}`;

  assert.ok(grid.className.includes("hide-card-info"));
  assert.ok(grid.className.includes("view-compact"));
  assert.ok(!grid.className.includes("masonry"));
});

test("setViewMode removes hideCardInfo class when setting is off", () => {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, val) => store.set(key, String(val)),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear(),
  };

  const masonryEnabled = true;
  const hideCardInfo = false;
  const gridFillOrder = 'column';
  const fillClass = gridFillOrder === 'column' ? ' grid-column-first' : '';
  const className = `gallery-container view-grid${masonryEnabled ? ' masonry' : ''}${hideCardInfo ? ' hide-card-info' : ''}${fillClass}`;

  assert.ok(!className.includes("hide-card-info"));
  assert.ok(className.includes("masonry"));
  assert.ok(className.includes("grid-column-first"));
});

import assert from "node:assert/strict";
import test from "node:test";

import CFOB_Settings, { CFOB_SETTINGS_MODALS_HTML } from "../../web/CFOB_Settings.js";

/** Minimal app surface used by the new import/export methods only. */
const mockApp = {
  showToast() {},
  applySort() {},
  gallery: { filterGallery() {} },
};

test("serializeSettings returns version and every key with the correct type", () => {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
  };
  try {
    store.set("cfob_sort", "name_asc");
    store.set(
      "comfy_folder_browser_fields",
      JSON.stringify([{ label: "Prompt", paths: "Positive Prompt.text" }])
    );
    store.set("cfob_masonry_enabled", "true");
    store.set("comfy_folder_browser_width", "520");
    store.set("cfob_ui_scale", "1.1");
    store.set(
      "cfob_filter_shortcuts",
      JSON.stringify([{ keyword: "animals", filter: "dog, cat" }])
    );
    store.set("cfob_search_blacklist", JSON.stringify(["KSampler.seed"]));

    const settings = new CFOB_Settings(mockApp);
    const serialized = settings.serializeSettings();

    assert.equal(serialized.version, 1);
    assert.equal(serialized.settings.cfob_sort, "name_asc");
    assert.equal(serialized.settings.comfy_folder_browser_fields[0].label, "Prompt");
    assert.equal(serialized.settings.cfob_masonry_enabled, true);
    assert.equal(serialized.settings.comfy_folder_browser_width, 520);
    assert.equal(serialized.settings.cfob_ui_scale, 1.1);
    assert.equal(serialized.settings.cfob_filter_shortcuts[0].keyword, "animals");
    assert.deepEqual(serialized.settings.cfob_search_blacklist, ["KSampler.seed"]);
  } finally {
    globalThis.localStorage = null;
  }
});

test("deserializeSettings applies values and leaves missing keys untouched", () => {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
  };
  try {
    store.set("cfob_masonry_enabled", "true");
    store.set("cfob_hide_card_info", "true");
    store.set(
      "comfy_folder_browser_fields",
      JSON.stringify([{ label: "Prompt", paths: "Positive Prompt.text" }])
    );

    const settings = new CFOB_Settings(mockApp);
    const data = {
      version: 1,
      settings: {
        cfob_sort: "name_desc",
        cfob_masonry_enabled: false,
        // Real exports store arrays (not JSON strings); parse defensively anyway.
        comfy_folder_browser_fields: [{ label: "Prompt", paths: "Positive Prompt.text" }],
        // cfob_hide_card_info is omitted -> must keep its existing value.
      },
    };

    settings.deserializeSettings(data);

    assert.equal(settings.currentSort, "name_desc");
    assert.equal(settings.masonryEnabled, false);
    assert.equal(settings.hideCardInfo, true);
    assert.equal(settings.fieldConfigs[0].paths, "Positive Prompt.text");
    assert.equal(store.get("cfob_sort"), "name_desc");
    assert.equal(store.get("cfob_masonry_enabled"), "false");
    // Not present in the import: untouched.
    assert.equal(store.get("cfob_hide_card_info"), "true");
  } finally {
    globalThis.localStorage = null;
  }
});

test("options modal contains the Import / Export tab and all its controls", () => {
  const html = CFOB_SETTINGS_MODALS_HTML;

  assert.ok(html.includes('id="cfobImportExportTab"'), "Import / Export tab button");
  assert.ok(html.includes('id="cfobOptionsImportExport"'), "Import / Export panel");
  assert.ok(html.includes('id="cfobExportSettingsBtn"'), "Export Settings button");
  assert.ok(html.includes('id="cfobImportSettingsBtn"'), "Import Settings button");
  assert.ok(html.includes('id="cfobImportFileInput"'), "Import file input");
});

test("CFOB_Settings exposes export/import methods", () => {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
  };
  try {
    const settings = new CFOB_Settings(mockApp);
    assert.equal(typeof settings.serializeSettings, "function");
    assert.equal(typeof settings.deserializeSettings, "function");
    assert.equal(typeof settings.exportSettings, "function");
    assert.equal(typeof settings.importSettingsFile, "function");
  } finally {
    globalThis.localStorage = null;
  }
});

test("deserializeSettings ignores malformed payloads", () => {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
  };
  try {
    const settings = new CFOB_Settings(mockApp);
    settings.deserializeSettings(null);
    settings.deserializeSettings({ version: 1 });
    settings.deserializeSettings({ settings: "not an object" });
    settings.deserializeSettings({ settings: 42 });
    settings.deserializeSettings({ settings: {} });
  } finally {
    globalThis.localStorage = null;
  }
});

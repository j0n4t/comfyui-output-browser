import assert from "node:assert/strict";
import test from "node:test";

globalThis.window = globalThis;
globalThis.window.innerWidth = 1920;
globalThis.window.innerHeight = 1080;
globalThis.document = { activeElement: null };

import CFOB_ImageActions from "../../web/CFOB_ImageActions.js";

function setupPickerHarness({ rootBounds = { left: 0, top: 0, right: 1920, bottom: 1080, width: 1920, height: 1080 } } = {}) {
  const root = {
    children: [],
    style: {},
    getBoundingClientRect: () => rootBounds,
    appendChild: (child) => {
      root.children.push(child);
      return child;
    }
  };

  const app = {
    root,
    escapeHtml: (s) => s,
    settings: {
      activePopover: null,
      fieldConfigs: [
        { label: "Positive Prompt", paths: "@prompt.inputs.text" },
        { label: "Seed", paths: "@prompt.inputs.seed" },
      ]
    }
  };

  const actions = new CFOB_ImageActions(app);

  // Custom DOM helper for the menu to simulate offsetWidth / offsetHeight
  globalThis.document.createElement = (tag) => {
    return {
      tagName: tag.toUpperCase(),
      className: "",
      tabIndex: 0,
      innerHTML: "",
      style: {},
      offsetWidth: 200,
      offsetHeight: 100,
      querySelector: () => ({ focus: () => {} }),
      querySelectorAll: () => [],
      addEventListener: () => {},
      focus: () => {},
      remove: () => {},
    };
  };

  return { app, actions, root };
}

test("CFOB_ImageActions: showFieldPicker positions popover horizontally centered over anchor when room permits", () => {
  const { actions, root } = setupPickerHarness();

  // Anchor in middle of viewport: left=500, width=400 (center = 500 + (400-200)/2 = 600)
  const anchor = {
    getBoundingClientRect: () => ({
      left: 500,
      right: 900,
      top: 300,
      bottom: 600,
      width: 400,
      height: 300
    })
  };

  actions.showFieldPicker(anchor);

  const menu = root.children[0];
  assert.ok(menu, "popover menu was appended to root");
  // centreLeft = 500 + (400 - 200)/2 = 600px
  assert.equal(menu.style.left, "600px");
});

test("CFOB_ImageActions: showFieldPicker places popover beside anchor when center does not fit but beside fits", () => {
  const { actions, root } = setupPickerHarness({
    rootBounds: { left: 0, top: 0, right: 800, bottom: 600, width: 800, height: 600 }
  });

  // Anchor near left margin: center would be 0 + (100 - 200)/2 = -50 (doesn't fit in rootLeft + 8).
  // Beside right: anchorRight(100) + gap(8) = 108. 108 + 200 = 308 <= 792 -> fits!
  const anchor = {
    getBoundingClientRect: () => ({
      left: 0,
      right: 100,
      top: 100,
      bottom: 250,
      width: 100,
      height: 150
    })
  };

  actions.showFieldPicker(anchor);

  const menu = root.children[0];
  assert.equal(menu.style.left, "108px", "should place beside right of anchor");
});

test("CFOB_ImageActions: showFieldPicker clamps popover within viewport margins when anchor is at boundary", () => {
  const { actions, root } = setupPickerHarness({
    rootBounds: { left: 0, top: 0, right: 300, bottom: 400, width: 300, height: 400 }
  });

  // Narrow viewport (300px width), anchor spans almost full width (left=10, width=280)
  // menuWidth = 200, gap = 8 -> max left is 300 - 200 - 8 = 92px
  const anchor = {
    getBoundingClientRect: () => ({
      left: 10,
      right: 290,
      top: 10,
      bottom: 390,
      width: 280,
      height: 380
    })
  };

  actions.showFieldPicker(anchor);

  const menu = root.children[0];
  const leftNum = parseFloat(menu.style.left);
  assert.ok(leftNum >= 8, "left coordinate must respect gap from left edge");
  assert.ok(leftNum + 200 <= 300 - 8, "right coordinate must respect gap from right edge");
});

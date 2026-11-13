class FakeElement {
  constructor(tag, { className = "", id = "", dataset = {}, value = "" } = {}) {
    this.tagName = tag.toUpperCase();
    this.id = id;
    this.dataset = { ...dataset };
    this.value = value;
    this.checked = false;
    this.innerText = "";
    this.children = [];
    this.style = {};
    this.parentElement = null;
    this._classList = new Set(className ? className.split(/\s+/).filter(Boolean) : []);
  }

  get textContent() {
    return this.innerText;
  }
  set textContent(v) {
    this.innerText = v;
  }

  contains(child) {
    if (!child) return false;
    if (child === this) return true;
    let cur = child.parentElement;
    while (cur) {
      if (cur === this) return true;
      cur = cur.parentElement;
    }
    return false;
  }

  get classList() {
    const list = this._classList;
    return {
      add: (...tokens) => tokens.forEach(t => list.add(t)),
      remove: (...tokens) => tokens.forEach(t => list.delete(t)),
      toggle: (token, force) => {
        if (force === undefined) {
          if (list.has(token)) { list.delete(token); return false; }
          list.add(token); return true;
        }
        if (force) { list.add(token); return true; }
        list.delete(token); return false;
      },
      contains: (token) => list.has(token),
    };
  }

  focus() {
    globalThis.document.activeElement = this;
  }

  closest(selector) {
    let cur = this;
    while (cur) {
      if (selector === '.image-card' && cur.classList.contains('image-card')) return cur;
      cur = cur.parentElement;
    }
    return null;
  }

  querySelector(selector) {
    const all = this.querySelectorAll(selector);
    return all.length ? all[0] : null;
  }

  querySelectorAll(selector) {
    const results = [];
    function walk(node) {
      for (const child of node.children) {
        let match = false;
        if (selector === '.image-card' && child.classList.contains('image-card')) match = true;
        else if (selector === '.card-checkbox' && child.classList.contains('card-checkbox')) match = true;
        else if (selector.startsWith('.image-card[data-filter-index="')) {
          const m = selector.match(/data-filter-index="(\d+)"/);
          if (m && child.classList.contains('image-card') && child.dataset.filterIndex === m[1]) match = true;
        }
        if (match) results.push(child);
        walk(child);
      }
    }
    walk(this);
    return results;
  }

  appendChild(child) {
    child.parentElement = this;
    this.children.push(child);
    return child;
  }
}

globalThis.HTMLElement = FakeElement;
globalThis.HTMLInputElement = FakeElement;
globalThis.document = { activeElement: null };

import assert from "node:assert/strict";
import test from "node:test";

import CFOB_Selection from "../../web/CFOB_Selection.js";

function setupSelectionHarness(imageNames = ["img0.png", "img1.png", "img2.png", "img3.png", "img4.png"]) {
  const root = new FakeElement("div", { id: "cfob-root" });
  const grid = new FakeElement("div", { id: "cfobGalleryGrid" });
  const actionBar = new FakeElement("div", { id: "cfobActionBar" });
  const countSpan = new FakeElement("span", { id: "cfobSelectionCount" });
  const actionInspect = new FakeElement("button", { id: "cfobActionInspect" });
  const actionOpen = new FakeElement("button", { id: "cfobActionOpen" });
  const actionRename = new FakeElement("button", { id: "cfobActionRename" });
  const actionMove = new FakeElement("button", { id: "cfobActionMove" });
  const actionSendChips = new FakeElement("button", { id: "cfobActionSendChips" });
  const searchInput = new FakeElement("input", { id: "cfobSearchInput" });

  actionBar.appendChild(countSpan);
  actionBar.appendChild(actionInspect);
  actionBar.appendChild(actionOpen);
  actionBar.appendChild(actionRename);
  actionBar.appendChild(actionMove);
  actionBar.appendChild(actionSendChips);

  root.appendChild(grid);
  root.appendChild(actionBar);
  root.appendChild(searchInput);

  const cards = [];
  const checkboxes = [];

  imageNames.forEach((name, idx) => {
    const card = new FakeElement("div", {
      className: "image-card",
      dataset: { name, filterIndex: String(idx) }
    });
    const cb = new FakeElement("input", {
      className: "card-checkbox",
      value: name
    });
    card.appendChild(cb);
    grid.appendChild(card);
    cards.push(card);
    checkboxes.push(cb);
  });

  const filteredImages = imageNames.map(name => ({ name }));

  const app = {
    root,
    filteredImages,
    selectedImages: new Set(),
    lastSelectedIdx: -1,
    selectionAnchorIdx: -1,
    gallery: {
      getOrderedCards: () => cards,
    },
    $(id) {
      if (id === "cfobGalleryGrid") return grid;
      if (id === "cfobActionBar") return actionBar;
      if (id === "cfobSelectionCount") return countSpan;
      if (id === "cfobActionInspect") return actionInspect;
      if (id === "cfobActionOpen") return actionOpen;
      if (id === "cfobActionRename") return actionRename;
      if (id === "cfobActionMove") return actionMove;
      if (id === "cfobActionSendChips") return actionSendChips;
      if (id === "cfobSearchInput") return searchInput;
      return null;
    }
  };

  const selection = new CFOB_Selection(app);
  app.selection = selection;

  return { app, selection, cards, checkboxes, actionBar, countSpan, actionRename };
}

test("CFOB_Selection: handleCheckboxClick toggles single item and sets anchor", () => {
  const { app, selection, checkboxes } = setupSelectionHarness();

  // Click on image 1
  checkboxes[1].checked = true;
  const event = {
    target: checkboxes[1],
    shiftKey: false,
    stopPropagation: () => {}
  };

  selection.handleCheckboxClick(event, "img1.png");

  assert.ok(app.selectedImages.has("img1.png"));
  assert.equal(app.selectedImages.size, 1);
  assert.equal(app.selectionAnchorIdx, 1, "anchor should be set to index 1");
  assert.equal(app.lastSelectedIdx, 1);
  assert.ok(app.$("cfobActionBar").classList.contains("show"), "action bar should show");
  assert.equal(app.$("cfobSelectionCount").textContent, "1 selected");
  assert.equal(app.$("cfobActionRename").style.display, "inline-flex", "single action button enabled");
});

test("CFOB_Selection: handleCheckboxClick Shift+Click selects range between anchor and target", () => {
  const { app, selection, checkboxes } = setupSelectionHarness();

  // 1. Regular click on index 1
  checkboxes[1].checked = true;
  selection.handleCheckboxClick({ target: checkboxes[1], shiftKey: false, stopPropagation: () => {} }, "img1.png");
  assert.equal(app.selectionAnchorIdx, 1);

  // 2. Shift+Click on index 3
  checkboxes[3].checked = true;
  selection.handleCheckboxClick({ target: checkboxes[3], shiftKey: true, stopPropagation: () => {} }, "img3.png");

  // Should select index 1, 2, and 3
  assert.ok(app.selectedImages.has("img1.png"));
  assert.ok(app.selectedImages.has("img2.png"));
  assert.ok(app.selectedImages.has("img3.png"));
  assert.equal(app.selectedImages.size, 3);
  assert.equal(checkboxes[1].checked, true);
  assert.equal(checkboxes[2].checked, true);
  assert.equal(checkboxes[3].checked, true);
  assert.equal(app.selectionAnchorIdx, 1, "anchor remains at original click position during range extension");
});

test("CFOB_Selection: handleCheckboxClick Shift+Click unchecks range when target is unchecked", () => {
  const { app, selection, checkboxes } = setupSelectionHarness();

  // Pre-select all 0..4
  app.filteredImages.forEach(img => app.selectedImages.add(img.name));
  app.selectionAnchorIdx = 1;

  // Shift-click to uncheck range from 1 to 3
  checkboxes[3].checked = false;
  selection.handleCheckboxClick({ target: checkboxes[3], shiftKey: true, stopPropagation: () => {} }, "img3.png");

  assert.ok(app.selectedImages.has("img0.png"), "0 remains selected");
  assert.equal(app.selectedImages.has("img1.png"), false, "1 was unchecked");
  assert.equal(app.selectedImages.has("img2.png"), false, "2 was unchecked");
  assert.equal(app.selectedImages.has("img3.png"), false, "3 was unchecked");
  assert.ok(app.selectedImages.has("img4.png"), "4 remains selected");
});

test("CFOB_Selection: selectAllFiltered selects all currently filtered images", () => {
  const { app, selection, checkboxes } = setupSelectionHarness(["a.png", "b.png"]);

  selection.selectAllFiltered();

  assert.equal(app.selectedImages.size, 2);
  assert.ok(app.selectedImages.has("a.png"));
  assert.ok(app.selectedImages.has("b.png"));
  assert.equal(checkboxes[0].checked, true);
  assert.equal(checkboxes[1].checked, true);
  assert.equal(app.$("cfobSelectionCount").textContent, "2 selected");
});

test("CFOB_Selection: clearSelection clears set, checkboxes, and hides action bar", () => {
  const { app, selection, checkboxes, actionBar } = setupSelectionHarness();

  selection.selectAllFiltered();
  assert.equal(app.selectedImages.size, 5);

  selection.clearSelection(true);

  assert.equal(app.selectedImages.size, 0);
  assert.equal(app.selectionAnchorIdx, -1, "anchor should be reset");
  checkboxes.forEach(cb => assert.equal(cb.checked, false));
  assert.equal(actionBar.classList.contains("show"), false, "action bar hidden");
});

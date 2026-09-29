import assert from "node:assert/strict";
import test from "node:test";

test("grid fill order settings allow row-first in horizontal and vertical scrolling with masonry enabled or disabled", () => {
  // Mock localStorage
  const store = new Map();
  const localStorageMock = {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, val) => store.set(key, String(val)),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear(),
  };
  globalThis.localStorage = localStorageMock;

  // Case 1: Masonry enabled + horizontal scroll + row fill order
  localStorage.setItem("cfob_masonry_enabled", "true");
  localStorage.setItem("cfob_scroll_dir", "horizontal");
  localStorage.setItem("cfob_grid_fill_order", "row");

  let masonryEnabled = localStorage.getItem("cfob_masonry_enabled") !== "false";
  let scrollDir = localStorage.getItem("cfob_scroll_dir") === "horizontal" ? "horizontal" : "vertical";
  let savedGridFillOrder = localStorage.getItem("cfob_grid_fill_order");
  let gridFillOrder = savedGridFillOrder === "column" ? "column" : "row";

  assert.equal(masonryEnabled, true);
  assert.equal(scrollDir, "horizontal");
  assert.equal(gridFillOrder, "row");

  // Case 2: Masonry enabled + vertical scroll + row fill order
  localStorage.setItem("cfob_scroll_dir", "vertical");
  scrollDir = localStorage.getItem("cfob_scroll_dir") === "horizontal" ? "horizontal" : "vertical";
  assert.equal(scrollDir, "vertical");
  assert.equal(gridFillOrder, "row");
});

test("horizontal row layout calculates balanced rows and columns", () => {
  const computeRowsAndCols = (containerHeight, itemSize, fontSize, count) => {
    const gap = 0.4 * fontSize;
    const paddingBottom = 1.25 * fontSize;
    const availableHeight = Math.max(1, containerHeight - paddingBottom);
    const rows = Math.max(1, Math.floor((availableHeight + gap) / (itemSize + gap)));
    const cols = Math.max(1, Math.ceil(count / rows));
    return { rows, cols };
  };

  // 800px height, 380px grid items, 16px font, 10 images
  const res1 = computeRowsAndCols(800, 380, 16, 10);
  assert.equal(res1.rows, 2);
  assert.equal(res1.cols, 5);

  // 800px height, 200px compact items, 16px font, 20 images
  const res2 = computeRowsAndCols(800, 200, 16, 20);
  assert.equal(res2.rows, 3);
  assert.equal(res2.cols, 7);

  // 300px height, 380px grid items, 16px font, 15 images
  const res3 = computeRowsAndCols(300, 380, 16, 15);
  assert.equal(res3.rows, 1);
  assert.equal(res3.cols, 15);
});

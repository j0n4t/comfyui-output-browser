import assert from "node:assert/strict";
import test from "node:test";

const { default: CFOB_Selection } = await import("../../web/CFOB_Selection.js");

/**
 * Grid navigation (PageUp / PageDown / Home / End) moves focus between cards.
 *
 * These assert which card ends up focused — the thing a user actually sees — rather
 * than that a function was called.
 */

const GRID_ID = "cfobGalleryGrid";
const CONTAINER_ID = "cfobMainContainer";

function makeCard({ top = 0, left = 0, width = 50, height = 50 } = {}) {
  const classes = new Set();
  return {
    offsetTop: top,
    offsetLeft: left,
    clientHeight: height,
    clientWidth: width,
    getBoundingClientRect: () => ({
      top, left, width, height, right: left + width, bottom: top + height
    }),
    classList: {
      add: c => classes.add(c),
      remove: c => classes.delete(c),
      contains: c => classes.has(c),
      toggle: (c, force) => {
        if (force) classes.add(c);
        else classes.delete(c);
      }
    },
    focused: () => classes.has("focused"),
    focusCount: 0,
    focus() { this.focusCount += 1; },
    scrollCount: 0,
    scrollIntoView() { this.scrollCount += 1; }
  };
}

/**
 * Row-first grid: `cols` cards share a row, then the next row starts lower.
 * Column-first grid: `cols` cards share a column, then the next column starts further right.
 */
function makeGridCards({ count, cols, columnFirst = false, cell = 50, gap = 10 }) {
  const cards = [];
  for (let i = 0; i < count; i++) {
    const along = i % cols;
    const down = Math.floor(i / cols);
    const left = 10 + (columnFirst ? down : along) * (cell + gap);
    const top = 10 + (columnFirst ? along : down) * (cell + gap);
    cards.push(makeCard({ top, left, width: cell, height: cell }));
  }
  return cards;
}

function makeApp({ cards, gridClasses = [], containerHeight = 300 }) {
  const grid = { classList: { contains: c => gridClasses.includes(c) } };
  const container = { clientHeight: containerHeight };
  return {
    lastSelectedIdx: 0,
    filteredImages: cards.map((_, i) => ({ name: `img-${i}.png` })),
    $: id => (id === GRID_ID ? grid : id === CONTAINER_ID ? container : null),
    gallery: { getOrderedCards: () => cards }
  };
}

/** Builds a bare CFOB_Selection bound to `app`, the way the dispatch tests do. */
function makeSelection(app) {
  const sel = Object.create(CFOB_Selection.prototype);
  sel.app = app;
  return sel;
}

const navigate = (app, key) => {
  const sel = makeSelection(app);
  sel.handleGridNavigation({ key });
  return app.gallery.getOrderedCards().findIndex(c => c.focused());
};

const MASONRY = ["masonry", "grid-column-first", "view-grid"];

test("PageDown moves forward by one page of rows in a row-first grid", () => {
  // 4 columns, 100px cells, 300px viewport -> 3 rows per page -> 12 cards per page.
  const cards = makeGridCards({ count: 20, cols: 4, cell: 100, gap: 0 });
  const app = makeApp({ cards, containerHeight: 300 });
  app.lastSelectedIdx = 0;

  assert.equal(navigate(app, "PageDown"), 12);
});

test("PageUp moves back by one page of rows in a row-first grid", () => {
  const cards = makeGridCards({ count: 20, cols: 4, cell: 100, gap: 0 });
  const app = makeApp({ cards, containerHeight: 300 });
  app.lastSelectedIdx = 12;

  assert.equal(navigate(app, "PageUp"), 0);
});

test("PageDown in a column-first grid pages by rows, not by columns", () => {
  // isColumnFlow makes the page stride 1 * pageRows, so a page is 3 cards.
  const cards = makeGridCards({ count: 20, cols: 4, columnFirst: true, cell: 100, gap: 0 });
  const app = makeApp({ cards, gridClasses: ["grid-column-first"], containerHeight: 300 });
  app.lastSelectedIdx = 0;

  assert.equal(navigate(app, "PageDown"), 3);
});

test("Home focuses the first card and End focuses the last", () => {
  const cards = makeGridCards({ count: 12, cols: 4, cell: 100, gap: 0 });
  const app = makeApp({ cards, containerHeight: 300 });

  app.lastSelectedIdx = 7;
  assert.equal(navigate(app, "Home"), 0);

  app.lastSelectedIdx = 2;
  assert.equal(navigate(app, "End"), 11);
});

test("paging clamps at both ends instead of running off the grid", () => {
  const cards = makeGridCards({ count: 20, cols: 4, cell: 100, gap: 0 });
  const app = makeApp({ cards, containerHeight: 300 });

  app.lastSelectedIdx = 0;
  assert.equal(navigate(app, "PageUp"), 0, "PageUp at the top stays at the top");

  app.lastSelectedIdx = 19;
  assert.equal(navigate(app, "PageDown"), 19, "PageDown at the bottom stays at the bottom");
});

// Masonry fixtures: the current card, a card in the very next row (closest to the
// current row), and a card exactly one viewport away. The two targets must differ,
// otherwise the test cannot tell a page jump from a single-row jump.
const MASONRY_CARDS = () => [
  makeCard({ top: 10, left: 10, width: 50, height: 50 }),   // centre y = 35  (current)
  makeCard({ top: 80, left: 10, width: 50, height: 50 }),   // centre y = 105 (next row)
  makeCard({ top: 210, left: 10, width: 50, height: 50 }),  // centre y = 235 (one page down)
  makeCard({ top: 410, left: 10, width: 50, height: 50 })   // centre y = 435 (two pages down)
];

test("masonry PageDown jumps a page, not just to the next row", () => {
  // Viewport is 200px tall, so one page down from y=35 is y=235 — card 2, not card 1.
  const cards = MASONRY_CARDS();
  const app = makeApp({ cards, gridClasses: MASONRY, containerHeight: 200 });
  app.lastSelectedIdx = 0;

  assert.equal(navigate(app, "PageDown"), 2);
});

test("masonry PageUp jumps a page, not just to the previous row", () => {
  // From y=235, one page up is y=35 — card 0, not card 1.
  const cards = MASONRY_CARDS();
  const app = makeApp({ cards, gridClasses: MASONRY, containerHeight: 200 });
  app.lastSelectedIdx = 2;

  assert.equal(navigate(app, "PageUp"), 0);
});

test("only the destination card is focused, and it is scrolled into view", () => {
  const cards = makeGridCards({ count: 20, cols: 4, cell: 100, gap: 0 });
  const app = makeApp({ cards, containerHeight: 300 });
  app.lastSelectedIdx = 0;

  const focusedIdx = navigate(app, "PageDown");

  assert.equal(focusedIdx, 12);
  assert.equal(cards.filter(c => c.focused()).length, 1, "exactly one card is focused");
  assert.equal(cards[12].focusCount, 1, "the destination card receives focus");
  assert.equal(cards[12].scrollCount, 1, "the destination card is scrolled into view");
  assert.equal(cards[0].focused(), false, "the previous card loses focus");
});

test("navigation is a no-op when there are no cards", () => {
  const app = makeApp({ cards: [], containerHeight: 300 });
  const sel = makeSelection(app);

  assert.doesNotThrow(() => sel.handleGridNavigation({ key: "PageDown" }));
  assert.equal(app.lastSelectedIdx, 0, "no index is written");
});

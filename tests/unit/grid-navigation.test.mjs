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

/**
 * Masonry grid as the CSS-columns layout actually renders it: cards flow down a column,
 * then into the next column. `rows` cards per column, `cols` columns.
 */
function makeMasonryCards({ cols = 5, rows = 6, cell = 226, gap = 4 } = {}) {
  const cards = [];
  for (let i = 0; i < cols * rows; i++) {
    const col = Math.floor(i / rows);
    const row = i % rows;
    cards.push(makeCard({
      top: 10 + row * (cell + gap),
      left: 10 + col * (cell + gap),
      width: cell,
      height: cell
    }));
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

// --- Masonry paging must move vertically, never sideways ----------------------
//
// In masonry the page target is `currentY +/- containerHeight`. Near the top or bottom
// of the grid no card is anywhere near that target, so the old code fell back to
// "whichever card is closest" — which is a card in the SAME row. PageUp moved right,
// PageDown moved left. A page key that moves sideways is not "up or down by about a
// grid page".

const MASONRY_APP = () => {
  const cards = makeMasonryCards({ cols: 5, rows: 6 });
  return { app: makeApp({ cards, gridClasses: MASONRY, containerHeight: 900 }), cards };
};

test("masonry PageUp on the top row does not move sideways", () => {
  const { app } = MASONRY_APP();
  app.lastSelectedIdx = 0;
  assert.equal(navigate(app, "PageUp"), 0, "already at the top: stay put");
});

test("masonry PageUp on the top row of a later column does not move sideways", () => {
  const { app } = MASONRY_APP();
  app.lastSelectedIdx = 12; // row 0, column 2
  assert.equal(navigate(app, "PageUp"), 12, "already at the top: stay put");
});

test("masonry PageDown on the bottom row does not move sideways", () => {
  const { app } = MASONRY_APP();
  app.lastSelectedIdx = 29; // row 5, column 4
  assert.equal(navigate(app, "PageDown"), 29, "already at the bottom: stay put");
});

test("masonry PageDown on the bottom row of an earlier column does not move sideways", () => {
  const { app } = MASONRY_APP();
  app.lastSelectedIdx = 23; // row 5, column 3
  assert.equal(navigate(app, "PageDown"), 23, "already at the bottom: stay put");
});

test("masonry PageDown still jumps about a page when there is room", () => {
  const { app, cards } = MASONRY_APP();
  app.lastSelectedIdx = 0;
  const to = navigate(app, "PageDown");
  assert.equal(to, 4);
  assert.ok(cards[to].offsetTop > cards[0].offsetTop, "moved down");
});

test("masonry PageUp still jumps about a page when there is room", () => {
  const { app, cards } = MASONRY_APP();
  app.lastSelectedIdx = 17; // row 5, column 2
  const to = navigate(app, "PageUp");
  assert.equal(to, 13);
  assert.ok(cards[to].offsetTop < cards[17].offsetTop, "moved up");
});

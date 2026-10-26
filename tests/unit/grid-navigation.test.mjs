import assert from "node:assert/strict";
import test from "node:test";
import { USER_LAYOUT, USER_CORRECTIONS } from "./user-layout-fixture.mjs";

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

// --- Row-first masonry is staggered, so only spatial navigation is correct ---------
//
// Row-first masonry packs cards with inline grid-row-end spans. Cards are dealt
// row-major, but each lands at the first free slot scanning right then down, so uneven
// heights break the link between DOM order and visual column order. With these heights
// card 4 lands in column 2 while card 5 sits under card 0 in column 0.

/** Simulates CSS sparse row-flow auto-placement with grid-row-end spans. */
function simulateRowFirstMasonry(heights, cols) {
  const occupied = new Set();
  const pos = [];
  let row = 0, col = 0;
  for (let i = 0; i < heights.length; i++) {
    const span = Math.max(1, Math.ceil(heights[i]));
    for (;;) {
      let free = true;
      for (let r = row; r < row + span; r++) {
        if (occupied.has(`${r},${col}`)) { free = false; break; }
      }
      if (free) break;
      if (++col >= cols) { col = 0; row++; }
    }
    for (let r = row; r < row + span; r++) occupied.add(`${r},${col}`);
    pos.push({ row, col, h: heights[i] });
    if (++col >= cols) { col = 0; row++; }
  }
  return pos;
}

/** Row-first masonry: 1px grid rows, 200px cards, 6px column gap. */
function makeRowFirstMasonry() {
  const heights = [200, 320, 140, 420, 250, 170, 200, 300, 150, 400, 220, 180];
  const cols = 4;
  const pos = simulateRowFirstMasonry(heights, cols);
  const cards = pos.map(p => makeCard({ top: p.row, left: p.col * 206, width: 200, height: p.h }));
  // No grid-column-first: that class is what column-first masonry uses, and it is also
  // what the old isMasonry check keyed on.
  return { cards, pos, app: makeApp({ cards, gridClasses: ["masonry", "view-grid"], containerHeight: 900 }) };
}

test("row-first masonry arrows never jump to a card outside the current column band", () => {
  const { app, pos } = makeRowFirstMasonry();
  // The old index arithmetic moved card 0 to card 4, which sits in a different column.
  // The bottom card of a column has nothing beneath it, so the nearest card below in a
  // neighbouring column is the right answer; everywhere else the move must stay put.
  const continuesBelow = [0, 5, 2, 4, 8];
  for (const from of continuesBelow) {
    app.lastSelectedIdx = from;
    const to = navigate(app, "ArrowDown");
    assert.equal(pos[to].col, pos[from].col,
      `ArrowDown from card ${from} (column ${pos[from].col}) must stay in that column, not ${pos[to].col}`);
  }
});

test("row-first masonry fixture really is staggered (card 4 is not under card 0)", () => {
  const { pos } = makeRowFirstMasonry();
  assert.equal(pos[0].col, 0);
  assert.equal(pos[4].col, 2, "card 4 lands in column 2");
  assert.equal(pos[5].col, 0, "card 5 lands in column 0, under card 0");
});

test("row-first masonry ArrowDown follows the column, not the DOM index", () => {
  const { app } = makeRowFirstMasonry();
  for (const [from, to] of [[0, 5], [5, 7], [2, 4], [4, 8], [8, 11]]) {
    app.lastSelectedIdx = from;
    assert.equal(navigate(app, "ArrowDown"), to, `ArrowDown from ${from} goes to ${to}`);
  }
});

test("row-first masonry ArrowUp follows the column, like ArrowDown", () => {
  // A vertical move stays in the current column: from card 7 the card directly above is
  // card 5 (235px, same column) and card 6 is one column over. Nearest-centre preferred
  // card 6 by 11px, which is a sideways jump, and the recorded layout shows the same
  // shape 5 times over.
  const { app } = makeRowFirstMasonry();
  for (const [from, to] of [[5, 0], [7, 5], [4, 2], [8, 4], [11, 8]]) {
    app.lastSelectedIdx = from;
    assert.equal(navigate(app, "ArrowUp"), to, `ArrowUp from ${from} goes to ${to}`);
  }
});

test("row-first masonry ArrowRight/ArrowLeft move between adjacent columns", () => {
  const { app } = makeRowFirstMasonry();
  app.lastSelectedIdx = 0;
  assert.equal(navigate(app, "ArrowRight"), 1, "card 1 is the nearest card to the right");

  app.lastSelectedIdx = 1;
  assert.equal(navigate(app, "ArrowLeft"), 0, "card 0 is the nearest card to the left");
});

// --- Recorded corrections from the dev tool --------------------------------------
//
// Real geometry and corrections captured with web/dev-grid-nav.html
// (grid / masonry / row-first / 24 cards / seed 7). These are the user's judgements,
// not a reconstruction: each entry means "pressing this key from this card should land
// on that card". Raw export: docs/cfob-nav-examples-*.json.

/**
 * One recorded case is deliberately not asserted. From card 15, ArrowDown: recorded as
 * "should go to 22", then withdrawn by the user. Nearest-centre picks 20 there, so it is
 * a known remaining disagreement rather than a regression.
 */
const WITHDRAWN = new Set(["15|ArrowDown"]);

function makeUserLayoutApp() {
  const cards = USER_LAYOUT.map(g =>
    makeCard({ top: g.top, left: g.left, width: g.w, height: g.h }));
  return makeApp({ cards, gridClasses: ["masonry", "view-grid"], containerHeight: 900 });
}

test("recorded corrections: masonry arrows land on the nearest centre", () => {
  const app = makeUserLayoutApp();
  const checked = [];
  for (const [from, key, correct] of USER_CORRECTIONS) {
    if (WITHDRAWN.has(`${from}|${key}`)) continue;
    app.lastSelectedIdx = from;
    assert.equal(navigate(app, key), correct,
      `${key} from card ${from} should land on card ${correct}`);
    checked.push(`${from}|${key}`);
  }
  assert.equal(checked.length, USER_CORRECTIONS.length - WITHDRAWN.size,
    "every recorded correction except the withdrawn one is asserted");
});

test("masonry vertical arrows stay in the current column", () => {
  // Masonry columns sit one card plus a 6px gutter apart, so a neighbouring column is a
  // full card to the left or right. Left unconstrained, nearest-centre picks it whenever
  // it happens to be a few pixels closer: on the recorded layout ArrowUp crossed columns
  // on 5 of 23 cards (1->0, 2->3, 3->1, 4->3, 15->13) and ArrowDown on 1 (23->21).
  const app = makeUserLayoutApp();
  for (const key of ["ArrowUp", "ArrowDown"]) {
    for (let from = 0; from < USER_LAYOUT.length; from++) {
      app.lastSelectedIdx = from;
      const to = navigate(app, key);
      if (to === from) continue;
      assert.equal(USER_LAYOUT[to].left, USER_LAYOUT[from].left,
        `${key} from card ${from} must stay in its column, not cross to card ${to}`);
    }
  }
});

test("a masonry card with nothing above it in its column stays put", () => {
  // Confining a vertical move to its column can leave no candidate, and the documented
  // contract is a no-op there, not a jump sideways. Card 3 has only card 1 above it, and
  // card 1 is in the next column: ArrowUp from 3 must do nothing.
  const app = makeUserLayoutApp();
  app.lastSelectedIdx = 3;
  assert.equal(navigate(app, "ArrowUp"), 3, "no card above it in its own column: stay put");
});

test("ArrowUp from a top-row masonry card focuses the search box, not the card beside it", () => {
  // Every card in the recorded layout's first row has top 0, but cards 1-4 are taller
  // than the card to their left, so a centre comparison called them "not first row" and
  // ArrowUp fell through to the grid and jumped sideways into that shorter card.
  const cards = USER_LAYOUT.map(g => makeCard({ top: g.top, left: g.left, width: g.w, height: g.h }));
  const grid = { classList: { contains: c => ["masonry", "view-grid"].includes(c) } };
  const handledBy = { where: null };
  const app = {
    lastSelectedIdx: 1,
    filteredImages: cards.map((_, i) => ({ name: `img-${i}.png` })),
    settings: { modals: { getActive: () => null } },
    $: (id) => (id === "cfobGalleryGrid" ? grid
      : id === "cfobSearchInput" ? { focus: () => { handledBy.where = "search"; } }
        : null),
    gallery: { getOrderedCards: () => cards },
    selection: { handleGridNavigation: () => { handledBy.where = "grid"; } }
  };
  const sel = makeSelection(app);

  sel.handleKeydown({
    key: "ArrowUp",
    target: { closest: () => null },
    preventDefault() {},
    stopPropagation() {}
  });

  assert.equal(handledBy.where, "search",
    "ArrowUp on the first row must focus the search box");
});

test("withdrawn correction is still reported as a disagreement, not silently passing", () => {
  // Guards the guard above: if the heuristic ever starts picking 22 here, the withdrawn
  // correction was right after all and this test should be revisited.
  const app = makeUserLayoutApp();
  app.lastSelectedIdx = 15;
  assert.equal(navigate(app, "ArrowDown"), 15,
    "ArrowDown from card 15 has nothing below it in its own column: it stays put. The withdrawn 22 correction was itself a crossing.");
});

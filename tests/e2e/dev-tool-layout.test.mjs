/**
 * End-to-end tests for the dev tool's own layout and controls: it must lay the grid out
 * the way the app does, and its panel must be resizable and hideable.
 *
 * What this covers:
 *   - Horizontal scrolling is a real horizontal layout, not a single column that happens
 *     to overflow. The bug this pins down: dev-grid-nav.html reimplemented the layout by
 *     hand and never computed `--cfob-col-count` / `--cfob-row-count`, so the app's own
 *     stylesheet sized the grid as `repeat(1, 380px)` and every horizontal layout
 *     collapsed to one column. The app was fine; the tool made horizontal scrolling look
 *     broken, which is exactly what it exists to show.
 *   - The counts the tool displays are the app's own: the geometry the browser computes
 *     has to match the row/column counts CFOB_Gallery.syncGridLayout wrote.
 *   - The controls are live: changing a value rebuilds the grid on its own, with no Rebuild
 *     click, and the card-size control actually takes effect.
 *   - Turning masonry off in a horizontal layout must reflow. The masonry packing fits
 *     its own row count to the measured card heights and overwrote the counts without
 *     recording them, so the next plain pass read "unchanged" and skipped its write —
 *     leaving tall masonry cards stranded in a single row after masonry was turned off.
 *   - Leaving horizontal scrolling clears the horizontal-only inline styles, so switching
 *     back to vertical does not leave a stale one-column grid behind.
 *   - The analysis panel resizes and hides. The bug this pins down: the panel was a fixed
 *     460px flex item with no `min-width: 0` on the stage, so at a narrow window the grid
 *     kept its min-content width and the panel was squeezed — the exact collapse the tool
 *     exists to make visible. A resize must also be a trade: the panel widens by the
 *     pointer's own delta and the stage gives up exactly that.
 *   - Clicking a card makes it the current one, the way the app's own card click does.
 *
 * The page is served by the standalone server (`python __init__.py`) at
 * /web/dev-grid-nav.html, so this runs against the real files with no fixture. The dev
 * tool draws its own SVG cards and never calls the API, so the output dir is a formality.
 *
 * Requires Chromium installed by Playwright or a system browser.
 */
import assert from "node:assert/strict";
import { test } from "./fixtures.mjs";

import {
  attachPage,
  sweepStaleProfileDirs,
  waitUntil,
} from "./helpers.mjs";

// Sweep profile/fixture dirs from any run that died uncatchably before this one.
sweepStaleProfileDirs();

/**
 * Reads the layout the browser actually computed, so every assertion below is about what
 * a user would see rather than about the tool's internal state.
 */
const LAYOUT_JS = `(() => {
  const grid = document.getElementById('cfobGalleryGrid');
  const container = document.getElementById('cfobMainContainer');
  const cards = Array.from(grid.querySelectorAll('.image-card'));
  const cs = getComputedStyle(grid);
  return {
    cards: cards.length,
    colCount: cs.getPropertyValue('--cfob-col-count').trim(),
    rowCount: cs.getPropertyValue('--cfob-row-count').trim(),
    columns: new Set(cards.map(c => Math.round(c.getBoundingClientRect().left))).size,
    rows: new Set(cards.map(c => Math.round(c.getBoundingClientRect().top))).size,
    scrollWidth: container.scrollWidth,
    clientWidth: container.clientWidth,
    scrollHeight: container.scrollHeight,
    clientHeight: container.clientHeight,
    rowGap: (() => {
      const byTop = new Map();
      for (const card of cards) {
        const rect = card.getBoundingClientRect();
        const top = Math.round(rect.top);
        if (!byTop.has(top)) byTop.set(top, rect.bottom);
      }
      const rows = [...byTop.entries()].sort((a, b) => a[0] - b[0]);
      return rows.length > 1 ? rows[1][0] - rows[0][1] : 0;
    })(),
    gridHeight: grid.getBoundingClientRect().height,
    lastRowBottom: Math.max(...cards.map(card => card.getBoundingClientRect().bottom)),
    firstPreviewHeight: cards[0]?.querySelector('.card-preview').getBoundingClientRect().height ?? 0,
    display: cs.display,
    inline: grid.style.cssText
  };
})()`;

/**
 * Sets the tool's controls the way a user does: both events, because a select reports
 * `change` and a number field reports `input`. The tool rebuilds as the values change, so
 * no Rebuild click is needed — that is the behaviour under test.
 */
const SET_TOOL_JS = (/** @type {Record<string, string>} */ values) => `(() => {
  const set = (id, value) => {
    const el = document.getElementById(id);
    el.value = value;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  };
  for (const [id, value] of Object.entries(${JSON.stringify(values)})) set(id, value);
  return true;
})()`;

/**
 * The panel's own box plus the stage's: the assertion is that a resize is a trade, not a
 * growth, so the two must still add up to the row.
 */
const PANEL_JS = `(() => {
  const main = document.querySelector('main');
  const aside = document.querySelector('aside');
  const resizer = document.getElementById('asideResizer');
  const grid = document.getElementById('cfobGalleryGrid');
  const r = el => { const b = el.getBoundingClientRect(); return { w: Math.round(b.width), h: Math.round(b.height) }; };
  const cards = Array.from(grid.querySelectorAll('.image-card'));
  return {
    collapsed: main.classList.contains('aside-collapsed'),
    resizing: main.classList.contains('resizing-aside'),
    stage: r(document.getElementById('stage')),
    aside: r(aside),
    resizer: r(resizer),
    main: r(main),
    asideDisplay: getComputedStyle(aside).display,
    resizerDisplay: getComputedStyle(resizer).display,
    toggleLabel: document.getElementById('toggleAside').textContent,
    ariaMin: resizer.getAttribute('aria-valuemin'),
    ariaMax: resizer.getAttribute('aria-valuemax'),
    ariaNow: resizer.getAttribute('aria-valuenow'),
    // The layout has to follow the pane, so the grid's own reading is part of this.
    columns: new Set(cards.map(c => Math.round(c.getBoundingClientRect().left))).size,
    cardCount: cards.length
  };
})()`;

/**
 * Drags the grip with Playwright's real mouse input, exercising pointer capture and the
 * button guard.
 *
 * The coordinates are clamped into the viewport: a drag far past the clamp limit still
 * has to start on the grip, and a press at a negative or off-screen x would land on
 * nothing and silently not grab it.
 *
 * @param {Awaited<ReturnType<typeof attachPage>>} browser
 * @param {{ fromX: number, toX: number, y: number }} drag
 */
async function dragResizer(browser, { fromX, toX, y }) {
  // Chromium only fires mousemove while a button is held, so the press comes first and
  // the release last. The intermediate steps are what make it a gesture at all: a single
  // jump from one end to the other is a flick, and a handler that only acts on movement
  // past the element would never see it. They step in the direction of travel, because a
  // rightward drag that first moves left is not the gesture being described.
  const clamp = x => Math.max(0, Math.min(1279, Math.round(x)));
  const start = clamp(fromX);
  const end = clamp(toX);
  const step = end > start ? 20 : -20;
  const moves = [];
  for (let x = start + step; step > 0 ? x < end : x > end; x += step) moves.push(clamp(x));
  moves.push(end);

  await browser.page.mouse.move(start, y);
  await browser.page.mouse.down();
  for (const x of moves) {
    // eslint-disable-next-line no-await-in-loop
    await browser.page.mouse.move(x, y);
  }
  await browser.page.mouse.up();
}

test("dev tool: the analysis panel can be resized and hidden", async ({ cleanup, page: testPage, context }) => {
  /** @type {Awaited<ReturnType<typeof attachPage>> | null} */
  let browser = null;

  cleanup(async () => {
    if (browser) await browser.stop();
  });

  browser = await attachPage(testPage, context);
  const { evaluate, goto, page } = browser;

  await page.setViewportSize({ width: 1280, height: 1000 });

  await goto("/web/dev-grid-nav.html");
  await waitUntil(evaluate, "document.querySelectorAll('.image-card').length === 24", "the tool to build its grid");
  await evaluate(`(() => { window.__errs = []; window.addEventListener('error', e => window.__errs.push(String(e.message))); return true; })()`);

  // ------------------------------------------------- the grip is a real, reachable box
  // A 1px-wide grip is easy to build and impossible to grab: hit-test its own centre, the
  // way a user's pointer would.
  const hit = await evaluate(`(() => {
    const r = document.getElementById('asideResizer').getBoundingClientRect();
    const el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return { w: r.width, h: r.height, hit: el ? (el.id || el.tagName) : null };
  })()`);
  assert.ok(hit.w > 0 && hit.h > 0, `the grip must have a real box (got ${JSON.stringify(hit)})`);
  assert.equal(hit.hit, "asideResizer", `the grip's own centre must hit the grip, not something above it (got ${hit.hit})`);

  // A 1px element is still a 1px target, so give the test a point inside the drawn centre
  // strip, which is what the ::after paints over.
  const before = await evaluate(PANEL_JS);
  assert.equal(before.asideDisplay, "block", "the panel starts visible");
  assert.equal(before.collapsed, false, "the panel starts expanded");
  assert.equal(before.cardCount, 24, "the grid must still be built");

  // The controls this test is about have to exist. A test that only measured geometry
  // would pass on a page with no grip and no toggle at all, which is exactly the state it
  // is meant to pin down.
  assert.ok(before.resizer.w > 0, "the resize grip must exist and have a width");
  assert.equal(
    await evaluate(`Boolean(document.getElementById('toggleAside'))`),
    true,
    "the panel needs a hide/show control"
  );

  const gripX = before.stage.w + Math.round(before.resizer.w / 2);
  const gripY = Math.round(before.main.h / 2);

  // ------------------------------------------------- drag left: the panel widens
  // The panel is anchored on the right, so moving its left edge leftwards widens it, and
  // the stage must give up what the panel gains. A pixel of slack is fine: the browser
  // rounds each flex item's box independently, so the two halves can be a pixel apart.
  const close = (a, b) => Math.abs(a - b) <= 1;
  await dragResizer(browser, { fromX: gripX, toX: gripX - 120, y: gripY });
  const wider = await evaluate(PANEL_JS);

  assert.equal(wider.resizing, false, "the resize must end on pointerup, not stay latched");
  assert.equal(wider.asideDisplay, "block", "the panel must still be visible after a drag");
  assert.ok(
    close(wider.aside.w - before.aside.w, 120),
    `the panel must widen by the pointer's own delta (before ${before.aside.w}, after ${wider.aside.w})`
  );
  assert.ok(
    close(before.stage.w - wider.stage.w, 120),
    `the stage must give up what the panel gained (before ${before.stage.w}, after ${wider.stage.w})`
  );
  // The trade has to add up to the row, within the same rounding slack.
  const rowOk = (a, b, main) => Math.abs(a + b - main) <= 1;
  assert.ok(
    rowOk(wider.aside.w, wider.stage.w, before.main.w),
    `the row must be a trade, not a growth (${wider.aside.w} + ${wider.stage.w} vs ${before.main.w})`
  );
  assert.ok(
    close(Number(wider.ariaNow), wider.aside.w),
    "aria-valuenow must report the width the panel actually has"
  );

  // The grid is re-laid out by its own ResizeObserver, so it must still be a grid of
  // cards rather than a collapsed strip.
  assert.ok(wider.columns > 1, `the grid must keep its columns after the pane is widened (got ${wider.columns})`);

  // ------------------------------------------------- drag right: the panel shrinks
  // Grab it where it now is: after the widening drag the grip has moved right with the
  // panel, and pressing the old coordinate would press empty space.
  const gripX2 = wider.stage.w + Math.round(wider.resizer.w / 2);
  await dragResizer(browser, { fromX: gripX2, toX: gripX2 + 120, y: gripY });
  const narrower = await evaluate(PANEL_JS);

  assert.ok(
    close(wider.aside.w - narrower.aside.w, 120),
    `the panel must shrink by the pointer's own delta (before ${wider.aside.w}, after ${narrower.aside.w})`
  );

  // ------------------------------------------------- the ceiling: the stage keeps its floor
  // Drag far past the end, from wherever the panel happens to be. The panel must stop at
  // a width that still leaves the stage its minimum, and the row must not grow to fit it.
  const gripX3 = narrower.stage.w + Math.round(narrower.resizer.w / 2);
  await dragResizer(browser, { fromX: gripX3, toX: gripX3 - 2000, y: gripY });
  const atMax = await evaluate(PANEL_JS);

  assert.ok(
    close(atMax.aside.w, before.main.w - 240),
    `the panel must stop at main width minus the stage floor (main ${before.main.w}, panel ${atMax.aside.w})`
  );
  assert.ok(
    close(atMax.stage.w, 240),
    `the stage must keep its 240px floor (got ${atMax.stage.w})`
  );
  assert.ok(
    rowOk(atMax.aside.w, atMax.stage.w, before.main.w),
    `the row must not grow to fit the panel (${atMax.aside.w} + ${atMax.stage.w} vs ${before.main.w})`
  );
  assert.ok(
    close(Number(atMax.ariaMax), atMax.aside.w),
    "aria-valuemax must report the ceiling the clamp enforced"
  );

  // ------------------------------------------------- the floor: the panel keeps its minimum
  // Grab it where it now is — after the ceiling drag the grip has moved left with the
  // panel, so the original coordinate would press empty space.
  const gripX4 = atMax.stage.w + Math.round(atMax.resizer.w / 2);
  await dragResizer(browser, { fromX: gripX4, toX: gripX4 + 2000, y: gripY });
  const atMin = await evaluate(PANEL_JS);

  assert.ok(close(atMin.aside.w, 240), `the panel must stop at its 240px floor (got ${atMin.aside.w})`);
  assert.ok(rowOk(atMin.aside.w, atMin.stage.w, before.main.w), "the row must still add up at the floor");

  // ------------------------------------------------- hide, then show again
  // The panel's space has to go to the grid, and the button must say what it does next.
  await evaluate(`document.getElementById('toggleAside').click(), true`);
  const hidden = await evaluate(PANEL_JS);

  assert.equal(hidden.collapsed, true, "the toggle must hide the panel");
  assert.equal(hidden.asideDisplay, "none", "the panel must be display:none, not merely empty");
  assert.equal(hidden.resizerDisplay, "none", "the grip must go with the panel, not stay as a dead strip");
  assert.equal(hidden.toggleLabel, "Show panel", `the button must offer the way back (got "${hidden.toggleLabel}")`);
  assert.equal(
    hidden.stage.w,
    before.main.w,
    `hiding the panel must hand all of its space to the grid (stage ${hidden.stage.w}, main ${before.main.w})`
  );
  assert.ok(hidden.columns > wider.columns, `the wider grid must get more columns (${wider.columns} -> ${hidden.columns})`);

  await evaluate(`document.getElementById('toggleAside').click(), true`);
  const shown = await evaluate(PANEL_JS);

  assert.equal(shown.collapsed, false, "the second toggle must bring the panel back");
  assert.equal(shown.asideDisplay, "block", "the panel must be visible again");
  assert.equal(shown.aside.w, atMin.aside.w, `the panel must come back at the width it was left at (${atMin.aside.w}, got ${shown.aside.w})`);

  // ------------------------------------------------- the same control by keyboard
  // A pointer-only control is not one; the grip is a separator and must move under
  // ArrowLeft/ArrowRight too, in the opposite direction to the drag.
  await evaluate(`(() => {
    const r = document.getElementById('asideResizer');
    r.focus();
    r.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }));
    return true;
  })()`);
  const keyed = await evaluate(PANEL_JS);

  assert.equal(
    keyed.aside.w,
    Math.max(240, shown.aside.w - 10),
    `ArrowRight on the focused grip must shrink the panel by 10px (was ${shown.aside.w}, now ${keyed.aside.w})`
  );

  assert.deepEqual(await evaluate("window.__errs"), [], "the tool must not throw while resizing or hiding the panel");
});

test("dev tool: clicking a card makes it the current one", async ({ cleanup, page: testPage, context }) => {
  /** @type {Awaited<ReturnType<typeof attachPage>> | null} */
  let browser = null;

  cleanup(async () => {
    if (browser) await browser.stop();
  });

  browser = await attachPage(testPage, context);
  const { evaluate, goto, page } = browser;

  await page.setViewportSize({ width: 1280, height: 1000 });

  await goto("/web/dev-grid-nav.html");
  await waitUntil(evaluate, "document.querySelectorAll('.image-card').length === 24", "the tool to build its grid");
  // A click the tool swallows would leave the old card current, so the initial state is
  // read before the click and asserted afterwards: a no-op click on an already-current
  // card would pass a weaker check.
  await evaluate(`(() => { window.__errs = []; window.addEventListener('error', e => window.__errs.push(String(e.message))); return true; })()`);

  /** Which card carries the focus, the current badge, and where the arrows are drawn. */
  const CURRENT_JS = `(() => {
    const cards = Array.from(document.querySelectorAll('.image-card'));
    return {
      focused: cards.findIndex(c => c.classList.contains('focused')),
      badge: cards.findIndex(c => c.querySelector('.current-badge')),
      lastSelectedIdx: (window.__cfobApp ? window.__cfobApp.lastSelectedIdx : 'no app ref'),
      arrows: cards.map((c, i) => c.querySelector('.nav-arrows') ? i : -1).filter(i => i >= 0),
      verdict: document.getElementById('verdict').textContent
    };
  })()`;

  const atStart = await evaluate(CURRENT_JS);
  assert.equal(atStart.focused, 0, "the tool starts on card 0");
  assert.equal(atStart.badge, 0, "the current badge starts on card 0");

  // A click on the card body — the header, which is the app's own expand toggle. The
  // handler is on the card, so the click reaches it by bubbling.
  const clicked = await evaluate(`(() => {
    const card = document.querySelectorAll('.image-card')[7];
    const header = card.querySelector('.card-header');
    const r = header.getBoundingClientRect();
    // Reachability first: a card can be matched and still be covered by something else.
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    header.dispatchEvent(new MouseEvent('click', {
      bubbles: true, cancelable: true, clientX: r.left + 20, clientY: r.top + 5
    }));
    return { hit: hit ? (hit.className || hit.tagName) : null };
  })()`);
  assert.ok(
    String(clicked.hit).includes('card-header') || String(clicked.hit).includes('card-filename'),
    `the click must land on the card's own header, not on something above it (hit ${JSON.stringify(clicked.hit)})`
  );
  const afterClick = await evaluate(CURRENT_JS);

  assert.equal(afterClick.focused, 7, `the clicked card must take the focus (got ${afterClick.focused})`);
  assert.equal(afterClick.badge, 7, `the current badge must follow the click (got ${afterClick.badge})`);
  assert.ok(
    afterClick.arrows.length > 0 && afterClick.arrows.every(i => i !== 7),
    `the landing arrows must be drawn from the new card, not still from the old one (got ${JSON.stringify(afterClick.arrows)})`
  );
  assert.equal(atStart.focused, 0, "the click must have moved off the card it started on");

  // A click must not take focus either: the card becoming current is not the keyboard
  // arriving, and stealing focus is what made the controls go dead mid-edit.
  const focusAfterClick = await evaluate(`document.activeElement && (document.activeElement.id || document.activeElement.tagName)`);
  assert.ok(
    focusAfterClick !== "asideResizer" && !String(focusAfterClick).includes("image-card"),
    `a click must not leave focus on a card (activeElement is ${focusAfterClick})`
  );

  // ------------------------------------------------- the image counts too
  // The app excludes `.card-preview` from its click handler because an image click opens
  // the full view; this tool has no full view, so the image is just another part of the
  // card. The assertion is that clicking it moves the current card, the way the app's own
  // image click moves the focus before opening the viewer.
  const imgClick = await evaluate(`(() => {
    const card = document.querySelectorAll('.image-card')[3];
    const preview = card.querySelector('.card-preview');
    const r = preview.getBoundingClientRect();
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    preview.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    return { w: r.width, h: r.height, hit: hit ? (hit.className || hit.tagName) : null };
  })()`);
  assert.ok(imgClick.w > 0 && imgClick.h > 0, `the image must have a real box (got ${JSON.stringify(imgClick)})`);
  assert.ok(
    String(imgClick.hit).includes('card-preview'),
    `the click must land on the image itself (hit ${JSON.stringify(imgClick.hit)})`
  );
  const afterImage = await evaluate(CURRENT_JS);
  assert.equal(afterImage.focused, 3, `clicking the image must make its card current (got ${afterImage.focused})`);
  assert.equal(afterImage.badge, 3, `the current badge must follow the image click (got ${afterImage.badge})`);

  // ------------------------------------------------- an arrow chip is a clickable move
  // The chip advertises a destination; clicking it must take it, the way the arrow key
  // does. This is also what proves the chip's click is not swallowed as a card click.
  const chipClick = await evaluate(`(() => {
    const cards = Array.from(document.querySelectorAll('.image-card'));
    const holder = cards.map(c => c.querySelector('.nav-arrows .arr')).find(Boolean);
    if (!holder) return { skipped: true };
    const r = holder.getBoundingClientRect();
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    const before = cards.findIndex(c => c.classList.contains('focused'));
    holder.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    const after = cards.findIndex(c => c.classList.contains('focused'));
    return { skipped: false, before, after, hit: hit ? (hit.className || hit.tagName) : null };
  })()`);
  assert.equal(chipClick.skipped, false, "the tool must be drawing landing arrows to test against");
  assert.ok(
    String(chipClick.hit).includes('arr'),
    `the click must land on the chip itself (hit ${JSON.stringify(chipClick.hit)})`
  );
  assert.notEqual(
    chipClick.before, chipClick.after,
    `clicking a chip must perform the move it describes (before ${chipClick.before}, after ${chipClick.after})`
  );
  const afterChip = await evaluate(CURRENT_JS);
  assert.equal(afterChip.badge, chipClick.after, `the current badge must follow the chip's move (got ${afterChip.badge})`);

  assert.deepEqual(await evaluate("window.__errs"), [], "the tool must not throw while clicking a card");
});

test("dev tool: the landing arrows do not cover the image", async ({ cleanup, page: testPage, context }) => {
  /** @type {Awaited<ReturnType<typeof attachPage>> | null} */
  let browser = null;

  cleanup(async () => {
    if (browser) await browser.stop();
  });

  browser = await attachPage(testPage, context);
  const { evaluate, goto, page } = browser;

  await page.setViewportSize({ width: 1280, height: 1000 });

  await goto("/web/dev-grid-nav.html");
  await waitUntil(evaluate, "document.querySelectorAll('.image-card').length === 24", "the tool to build its grid");

  /**
   * The bug: the landing-arrow chips were centred on the card, which is where the image is.
   * A click on the picture hit the chip, so the card never became current from its image —
   * and the chip, which is a drag-to-correct control, swallowed the click instead.
   *
   * Asserted by hit-testing the image's own centre, which is the point a user clicks.
   */
  const overlap = await evaluate(`(() => {
    const cards = Array.from(document.querySelectorAll('.image-card'));
    // A click on a card is what makes the chips appear, so stage them the way a user does.
    cards[0].querySelector('.card-header').dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    const out = [];
    for (const i of [0, 1, 2, 3, 4]) {
      const card = cards[i];
      const img = card.querySelector('.card-preview').getBoundingClientRect();
      if (img.width === 0 || img.height === 0) { out.push({ i, noBox: true }); continue; }
      const cx = img.left + img.width / 2, cy = img.top + img.height / 2;
      const hit = document.elementFromPoint(cx, cy);
      out.push({
        i,
        chip: !!card.querySelector('.nav-arrows .arr'),
        hit: hit ? (hit.className || hit.tagName) : null,
        hitsImage: hit === card.querySelector('.card-preview')
      });
    }
    return out;
  })()`);

  const withChips = overlap.filter(o => o.chip);
  assert.ok(withChips.length > 0, "the tool must be drawing landing arrows for this to mean anything");
  for (const o of withChips) {
    assert.notEqual(
      o.hit, "arr",
      `card ${o.i} has a landing chip, and the chip must not sit over the image's centre (hit ${o.hit})`
    );
    assert.ok(
      o.hitsImage,
      `the image's centre on card ${o.i} must hit the image itself, not a chip (hit ${o.hit})`
    );
  }
});

test("dev tool: the current card survives a key press", async ({ cleanup, page: testPage, context }) => {
  /** @type {Awaited<ReturnType<typeof attachPage>> | null} */
  let browser = null;

  cleanup(async () => {
    if (browser) await browser.stop();
  });

  browser = await attachPage(testPage, context);
  const { evaluate, goto, page } = browser;

  await page.setViewportSize({ width: 1280, height: 1000 });

  await goto("/web/dev-grid-nav.html");
  await waitUntil(evaluate, "document.querySelectorAll('.image-card').length === 24", "the tool to build its grid");
  await evaluate(`(() => { window.__errs = []; window.addEventListener('error', e => window.__errs.push(String(e.message))); return true; })()`);

  /**
   * The bug: `paint` cleared the `focused` class along with the outlines and only put it
   * back on the rebuild path, so every key press left the tool with no current card — the
   * nav had set the class correctly and the very next line wiped it. A click then looked
   * like the only way to establish a current card at all.
   */
  const read = async () => evaluate(`(() => {
    const cards = Array.from(document.querySelectorAll('.image-card'));
    return {
      focused: cards.findIndex(c => c.classList.contains('focused')),
      focusedCount: cards.filter(c => c.classList.contains('focused')).length,
      badge: cards.findIndex(c => c.querySelector('.current-badge')),
      arrows: cards.map((c, i) => c.querySelector('.nav-arrows') ? i : -1).filter(i => i >= 0)
    };
  })()`);

  const atStart = await read();
  assert.equal(atStart.focused, 0, "the tool must open on card 0");
  assert.equal(atStart.focusedCount, 1, "exactly one card must be current");
  assert.equal(atStart.badge, 0, "the badge must be on the current card");

  // Four presses: the current card has to move each time and stay a single card.
  const moves = [];
  for (const key of ["ArrowRight", "ArrowRight", "ArrowDown", "ArrowLeft"]) {
    // eslint-disable-next-line no-await-in-loop
    await evaluate(`document.body.focus(), document.dispatchEvent(new KeyboardEvent('keydown', { key: ${JSON.stringify(key)}, bubbles: true, cancelable: true })), true`);
    // eslint-disable-next-line no-await-in-loop
    const s = await read();
    moves.push({ key, ...s });
    assert.equal(s.focusedCount, 1, `${key}: exactly one card must be current (got ${s.focusedCount})`);
    assert.equal(s.badge, s.focused, `${key}: the badge must be on the current card (badge ${s.badge}, focused ${s.focused})`);
    assert.ok(s.arrows.length > 0, `${key}: the landing arrows must be drawn from the new current card`);
  }
  assert.equal(moves[0].focused, 1, `ArrowRight must move 0 -> 1 (got ${moves[0].focused})`);
  assert.equal(moves[1].focused, 2, `ArrowRight must move 1 -> 2 (got ${moves[1].focused})`);
  assert.ok(moves[3].focused < moves[2].focused, `ArrowLeft must move backwards (${moves[2].focused} -> ${moves[3].focused})`);

  assert.deepEqual(await evaluate("window.__errs"), [], "the tool must not throw while pressing arrows");
});

test("dev tool: the controls keep focus while their value changes", async ({ cleanup, page: testPage, context }) => {
  /** @type {Awaited<ReturnType<typeof attachPage>> | null} */
  let browser = null;

  cleanup(async () => {
    if (browser) await browser.stop();
  });

  browser = await attachPage(testPage, context);
  const { evaluate, goto, page } = browser;

  await page.setViewportSize({ width: 1280, height: 1000 });

  await goto("/web/dev-grid-nav.html");
  await waitUntil(evaluate, "document.querySelectorAll('.image-card').length === 24", "the tool to build its grid");
  await evaluate(`(() => { window.__errs = []; window.addEventListener('error', e => window.__errs.push(String(e.message))); return true; })()`);

  /**
   * The bug: the page's arrow-key handler called preventDefault() on every arrow key
   * anywhere, and the rebuild that followed stole focus. A number field is driven by the
   * arrow keys, so the second keystroke went to the page instead of the field and the
   * control went dead mid-edit. Both halves are asserted: the key reaches the field, and
   * the field is still focused after the rebuild it triggered.
   */
  const typed = await evaluate(`(() => {
    const size = document.getElementById('size');
    size.focus();
    const log = { focusedOnEntry: document.activeElement && document.activeElement.id };
    // The arrow keys a number field is driven by. Each one fires the event a real field
    // fires on a value change, which is what makes the tool rebuild.
    for (const key of ['ArrowUp', 'ArrowUp', 'ArrowDown']) {
      size.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
      size.dispatchEvent(new Event('input', { bubbles: true }));
      log['after_' + key] = document.activeElement && document.activeElement.id;
    }
    log.value = size.value;
    return log;
  })()`);

  assert.equal(typed.focusedOnEntry, "size", "the field must be focused to edit it");
  for (const key of ["ArrowUp", "ArrowUp", "ArrowDown"]) {
    assert.equal(
      typed[`after_${key}`],
      "size",
      `the field must keep focus across ${key}: the tool must not steal it while the value changes`
    );
  }

  // A select is driven by the arrow keys too, and it must keep them.
  const selected = await evaluate(`(() => {
    const view = document.getElementById('view');
    view.focus();
    const log = { focusedOnEntry: document.activeElement && document.activeElement.id };
    for (const key of ['ArrowDown', 'ArrowUp']) {
      view.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
      log['after_' + key] = document.activeElement && document.activeElement.id;
    }
    log.value = view.value;
    return log;
  })()`);

  assert.equal(selected.focusedOnEntry, "view", "the select must be focused to edit it");
  for (const key of ["ArrowDown", "ArrowUp"]) {
    assert.equal(
      selected[`after_${key}`],
      "view",
      `the select must keep focus across ${key} (got ${selected[`after_${key}`]})`
    );
  }

  // The grid's arrow navigation must still work when the body is focused, or the guard
  // would have disabled the feature it was protecting.
  const gridNav = await evaluate(`(() => {
    document.body.focus();
    const before = Array.from(document.querySelectorAll('.image-card'))
      .findIndex(c => c.classList.contains('focused'));
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }));
    const after = Array.from(document.querySelectorAll('.image-card'))
      .findIndex(c => c.classList.contains('focused'));
    return { before, after };
  })()`);
  assert.ok(
    gridNav.before !== gridNav.after,
    `arrow navigation must still work from the body (before ${gridNav.before}, after ${gridNav.after})`
  );

  assert.deepEqual(await evaluate("window.__errs"), [], "the tool must not throw while editing a control");
});

test("dev tool: horizontal scrolling lays the grid out horizontally, like the app", async ({ cleanup, page: testPage, context }) => {
  /** @type {Awaited<ReturnType<typeof attachPage>> | null} */
  let browser = null;

  cleanup(async () => {
    if (browser) await browser.stop();
  });

  browser = await attachPage(testPage, context);
  const { evaluate, goto, page } = browser;

  // Headless Chromium defaults to an 800x600 window, which is too short for a second row
  // of 200px cards. Give the tool a normal-sized pane so the row count it computes is
  // meaningful rather than clamped to one by the viewport.
  await page.setViewportSize({ width: 1280, height: 1000 });

  await goto("/web/dev-grid-nav.html");
  await waitUntil(evaluate, "document.querySelectorAll('.image-card').length === 24", "the tool to build its grid");

  // A page error anywhere in the run means the tool is broken whatever the geometry says.
  await evaluate(`(() => { window.__errs = []; window.addEventListener('error', e => window.__errs.push(String(e.message))); return true; })()`);

  // ------------------------------------------------- horizontal, row-first, no masonry
  await evaluate(SET_TOOL_JS({ view: "grid", scroll: "horizontal", order: "row", masonry: "0", count: "24", seed: "7" }));
  const horizontal = await evaluate(LAYOUT_JS);

  assert.equal(horizontal.cards, 24, "the tool should still show every card");
  assert.equal(horizontal.display, "grid", "a plain grid should still be a grid");
  assert.ok(
    horizontal.scrollWidth > horizontal.clientWidth,
    `horizontal scrolling should overflow sideways, not squeeze into one column (scrollWidth ${horizontal.scrollWidth}, clientWidth ${horizontal.clientWidth})`
  );
  assert.equal(
    Number(horizontal.colCount),
    horizontal.columns,
    "every column the app counted should be a column the browser drew"
  );
  assert.equal(
    Number(horizontal.rowCount),
    horizontal.rows,
    "every row the app counted should be a row the browser drew"
  );
  assert.ok(
    horizontal.columns > 1,
    `24 cards in a horizontal row-first grid must not collapse to one column (got ${horizontal.columns})`
  );
  assert.ok(horizontal.rows > 1, `the pane is tall enough for more than one row (got ${horizontal.rows})`);
  assert.ok(
    horizontal.scrollHeight <= horizontal.clientHeight + 1,
    `a horizontal layout should not overflow vertically (scrollHeight ${horizontal.scrollHeight}, clientHeight ${horizontal.clientHeight})`
  );
  assert.ok(
    horizontal.rowGap <= 8,
    `masonry-off horizontal rows should have only the normal grid gap (got ${horizontal.rowGap}px)`
  );
  assert.ok(
    horizontal.lastRowBottom >= horizontal.clientHeight - 24,
    `masonry-off rows should use the available panel height (last row ends at ${horizontal.lastRowBottom}px in a ${horizontal.clientHeight}px pane)`
  );
  assert.ok(
    horizontal.firstPreviewHeight > 150,
    `previews should grow with the horizontal row tracks instead of leaving empty panel space (height ${horizontal.firstPreviewHeight}px)`
  );

  // ------------------------------------------------- horizontal column-first, no masonry
  await evaluate(SET_TOOL_JS({ order: "column", masonry: "0" }));
  const horizontalColumnFirst = await evaluate(LAYOUT_JS);
  assert.ok(horizontalColumnFirst.rows > 1, "column-first should have multiple horizontal rows");
  assert.ok(
    horizontalColumnFirst.rowGap <= 8,
    `masonry-off column-first rows should have only the normal grid gap (got ${horizontalColumnFirst.rowGap}px)`
  );
  assert.ok(
    horizontalColumnFirst.lastRowBottom >= horizontalColumnFirst.clientHeight - 24,
    `column-first rows should use available panel height (last row ends at ${horizontalColumnFirst.lastRowBottom}px in a ${horizontalColumnFirst.clientHeight}px pane)`
  );
  assert.ok(
    horizontalColumnFirst.firstPreviewHeight > 150,
    `column-first previews should grow with the row tracks (height ${horizontalColumnFirst.firstPreviewHeight}px)`
  );

  // ------------------------------------------------- the card-size control is live
  // The app sizes its rows from the card size, so shrinking the cards must fit more of
  // them in the pane. This is the control the tool was missing: with the app stylesheet
  // pinning --grid-size on #cfob-root, the old documentElement writes never took effect
  // and every layout ran at 380px cards.
  await evaluate(SET_TOOL_JS({ size: "100", order: "row" }));
  const smaller = await evaluate(LAYOUT_JS);

  assert.ok(
    smaller.rows > horizontal.rows,
    `smaller cards should fit more rows (200px gave ${horizontal.rows}, 100px gave ${smaller.rows})`
  );
  assert.equal(Number(smaller.rowCount), smaller.rows, "the row count should follow the new card size");

  // ------------------------------------------------- masonry on, then off again
  const beforeMasonry = smaller;
  await evaluate(SET_TOOL_JS({ masonry: "1" }));
  const masonry = await evaluate(LAYOUT_JS);

  assert.equal(masonry.display, "grid", "row-first masonry is a packed grid, not CSS columns");
  assert.equal(Number(masonry.colCount), masonry.columns, "masonry columns should match the app's column count");
  assert.ok(masonry.cards === 24, "masonry must not drop any card");
  assert.notEqual(masonry.colCount, "", "masonry must publish its own column count");
  // A masonry column stacks its cards at its own offsets, so distinct top positions are
  // not a row count here — only the columns line up. What matters is that the counts the
  // app wrote are the ones the browser used, which the column count above shows.

  await evaluate(SET_TOOL_JS({ masonry: "0" }));
  const afterMasonry = await evaluate(LAYOUT_JS);

  assert.equal(
    afterMasonry.rows,
    beforeMasonry.rows,
    `turning masonry off must reflow back to the plain row count (was ${beforeMasonry.rows}, still ${afterMasonry.rows})`
  );
  assert.equal(
    Number(afterMasonry.rowCount),
    beforeMasonry.rows,
    "the row count must be rewritten, not left at the masonry value"
  );
  assert.equal(
    Number(afterMasonry.colCount),
    beforeMasonry.columns,
    "the column count must be rewritten, not left at the masonry value"
  );

  // ------------------------------------------------- back to vertical
  // The horizontal-only inline styles belong to that layout; leaving it has to drop them.
  await evaluate(SET_TOOL_JS({ scroll: "vertical" }));
  const vertical = await evaluate(LAYOUT_JS);

  assert.equal(vertical.display, "grid", "vertical row-first masonry is a packed grid");
  assert.ok(vertical.columns > 1, `vertical masonry must still be multi-column (got ${vertical.columns})`);
  assert.ok(vertical.scrollWidth <= vertical.clientWidth, "vertical scrolling must not leave a horizontal scrollbar behind");
  assert.equal(vertical.colCount, "", "the horizontal column count must be cleared, not left stale");
  assert.equal(vertical.rowCount, "", "the horizontal row count must be cleared, not left stale");
  assert.ok(!/--cfob-col-count/.test(vertical.inline), "the grid should not keep the horizontal inline styles");

  // ------------------------------------------------- image-only plain grids keep aligned card sizes
  await evaluate(`document.querySelector('#cfobGalleryGrid').classList.add('hide-card-info')`);
  const plainImageOnly = await evaluate(`(() => {
    const cards = Array.from(document.querySelectorAll('.image-card'));
    const heights = cards.map(card => card.querySelector('.card-preview').getBoundingClientRect().height);
    const cardHeights = cards.map(card => card.getBoundingClientRect().height);
    return {
      previewHeightRange: Math.max(...heights) - Math.min(...heights),
      cardHeightRange: Math.max(...cardHeights) - Math.min(...cardHeights)
    };
  })()`);
  assert.ok(
    plainImageOnly.previewHeightRange < 1,
    `plain image-only previews should use the same height (range ${plainImageOnly.previewHeightRange}px)`
  );
  assert.ok(
    plainImageOnly.cardHeightRange < 1,
    `plain image-only cards should align without aspect-ratio gaps (range ${plainImageOnly.cardHeightRange}px)`
  );

  assert.deepEqual(await evaluate("window.__errs"), [], "the tool must not throw while switching layouts");
});

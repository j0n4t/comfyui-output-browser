# Handoff: masonry grid navigation

Status: **mid-task, nothing committed for the current step.**
Branch: `docs/testing-coverage-plan`. Read this first if you are picking this up.

## Where things stand

Three navigation bugs in masonry are fixed and verified; a dev tool for collecting
corrections is built and verified; the corrections themselves have been collected and the
nearest-centre fix they drove is in; the one remaining gap — ArrowUp crossing columns —
is now closed too, which is the change described at the bottom of this file.

| Step | State |
| --- | --- |
| Masonry `PageUp`/`PageDown` moving sideways | fixed, 6 tests |
| Row-first masonry using DOM index | fixed, 5 tests |
| Masonry arrows ranking by cross-axis gap | fixed from recorded corrections |
| Dev tool: landing arrows | done |
| Dev tool: drag-to-correct + examples export | done, uncommitted |
| Collect examples from the user | done — 11 recorded, 10 reproduced |
| Fix the nav logic from the collected data | done — nearest centre |
| **Vertical arrows crossing columns** | **done — same-column rule** |
| Confirm ArrowUp in the dev tool | **done — the user's answer was "should not cross columns"** |

## Bugs already fixed (do not redo)

**1. Masonry paging moved sideways.** `web/CFOB_Selection.js` scored every card by
distance from `currentY ± containerHeight` with no directional constraint, so near the
top or bottom of the grid it fell back to the nearest card overall — a same-row
neighbour. PageUp moved right, PageDown moved left. Fixed by skipping candidates not
strictly on the requested side; when none qualify, focus stays put.

**2. Row-first masonry used DOM-index arithmetic.** `isMasonry` required
`.grid-column-first`, so row-first masonry never took the spatial branch. But row-first
masonry is a *staggered* packed grid (`CFOB_Gallery.applyRowFirstMasonryPacking`, inline
`grid-row-end` spans): cards are dealt row-major but each lands at the first free slot
scanning right then down, so uneven heights break the link between DOM order and visual
column order. `nextIdx ± cols` jumped to an unrelated card — measured at up to **5468px**
away when one **242px** away was available, on 39–67 of 96 moves. Fixed by dropping the
`grid-column-first` requirement.

**3. Vertical arrows crossed columns.** The masonry arrow branch ranked *every* card in
the pressed direction by centre distance, with no column constraint. Masonry columns sit
one card plus a 6px gutter apart, so a neighbouring column is a full card to the left or
right — and its nearest card can be a few pixels closer than the one directly above or
below. On the recorded layout `ArrowUp` crossed columns on 5 of 23 cards (1→0, 2→3, 3→1,
4→3, 15→13) and `ArrowDown` on 1 (23→21). Fixed by requiring a vertical move to stay in
the current column, decided by left edge (neighbouring columns never overlap horizontally,
so only the left edge distinguishes them). A card with nothing above or below it in its
own column now stays put rather than jumping sideways.

**4. "First row" was a centre test, not a row test.** The `ArrowUp` shortcut asks whether
the current card is in the first row before moving, and the masonry branch answered by
comparing card *centres*. A top-row card with a shorter card to its left therefore looked
like a later row, so `ArrowUp` fell through to the grid and jumped sideways into that
card. The grid branch already used `offsetTop`; the masonry branch now compares `top`.

All four are covered by `tests/unit/grid-navigation.test.mjs` — 25 tests in total:
9 for grid paging/edges, 6 for masonry paging, 5 for row-first masonry, 5 for the recorded
layout and the column rule — and mutation-proven by
`tests/mutation/probe-grid-navigation.mjs` (`npm run test:mutation`, 19 mutations).

### A claim that was wrong, and is retracted

An earlier version of `docs/TESTING_COVERAGE.md` claimed row-first masonry does not render
as masonry at all. **That was wrong.** A probe inferred masonry from `display: block`,
which is only how *column-first* masonry renders (CSS multi-column). Row-first masonry is
a packed grid and reports `display: grid` with `grid-auto-rows: 1px` and per-card
`grid-row-end` spans. Do not re-report row-first masonry as missing — check
`applyRowFirstMasonryPacking` before concluding a feature is absent.

## The dev tool

`web/dev-grid-nav.html`, served by the standalone server at
`http://localhost:8189/web/dev-grid-nav.html`. It drives the **real**
`CFOB_Selection.handleGridNavigation` against a real DOM with the app's own stylesheet,
so what it shows is what the browser computes.

Controls: view (grid/compact), scroll direction, fill order, masonry, card count, seed.
The seed drives a deterministic RNG, so a layout is reproducible from the settings.

For each move it reports which card was picked, which the spatial heuristic would pick,
and the scored candidate list. It exists because a wrong pick is invisible in the real
UI — the wrong card just gets the focus outline.

> **Known tool bug, unrelated to navigation.** The card-size controls are dead:
> `document.documentElement.style.setProperty("--grid-size", …)` is overridden by the app
> stylesheet's `#cfob-root { --grid-size: 380px }`, which is closer to the grid and wins.
> The tool therefore always lays out at 380px cards, and at a narrow window that collapses
> masonry to one column. To get a multi-column layout by hand, set
> `document.getElementById('cfob-root').style.setProperty('--grid-size', '200px')` and
> click Rebuild. Not fixed here — it is a sizing bug, not a navigation one.

### What is drawn

- **current** badge — the card you are on. This is the only label; the old
  `cur N` / `chose N` pair was removed as redundant (after a move, the chosen card *is*
  the current card).
- **Landing arrows** — on each destination card, a chip with the glyph of the key that
  lands there. Centred on the card, 46px. They describe the card you are on **now**;
  an earlier version drew them from the pre-move card and was therefore one step behind.
- **Outlines** — green on the current card, amber on the spatial best when it differs.

The tool's `score()` mirror ranks by cross-axis gap and is kept in step with the code: a
vertical key now also requires the candidate to be in the same column, or the panel would
report drift the code no longer produces.

### Drag-to-correct

Each arrow chip is draggable. Drop it on the card the key should really land on and the
tool records the correction, turns the chip purple, and adds a row to the aside:

    #0 ArrowRight: predicted 1 -> correct 2
    grid masonry / row-first / scroll vertical / 24 cards / seed 7

`Copy JSON` and `Download` both emit the payload; `Clear` empties the list.

**Export shape** — the `layout` block reproduces the layout from the seeded RNG, and
`geometry` is the measured ground truth relative to the grid. Both are needed: the seed
alone cannot confirm a reproduction matches what the user actually saw.

```json
{
  "tool": "comfyui-output-browser/dev-grid-nav",
  "exportedAt": "2026-10-21T...",
  "viewport": { "width": 1500, "height": 950 },
  "examples": [
    {
      "from": 0, "key": "ArrowRight", "predicted": 1, "correct": 2,
      "layout": { "view": "grid", "scroll": "vertical", "order": "row",
                  "masonry": true, "count": 24, "seed": 7 },
      "geometry": [ { "i": 0, "top": 0, "left": 0, "w": 491, "h": 134 } ]
    }
  ]
}
```

## Next run: what to do

1. **The withdrawn case is closed, but differently.** From card 15, `ArrowDown` was
   recorded as "should go to 22", then withdrawn. Nearest-centre picked 20 — itself a
   crossing. With the column rule the move now stays put (15), because nothing is below it
   in its own column. `tests/unit/user-layout-fixture.mjs` carries the raw data and
   `WITHDRAWN` in `grid-navigation.test.mjs` lists what is excluded. If the user wants
   "wrap to the next column when this one runs out" that is a new decision, not a fix.
2. **If more corrections arrive**, reproduce each one before analysing it (read `layout`,
   rebuild, confirm `geometry` matches). Group by symptom, fix the heuristic, extend
   `tests/unit/grid-navigation.test.mjs`, and add a mutation to
   `tests/mutation/probe-grid-navigation.mjs`.
3. **`PageUp`/`PageDown` still cross columns.** The column rule is applied to the arrow
   keys only; the paging branch has a direction guard but no column constraint. Not asked
   for, and no evidence it is wrong — leave it unless the user reports it.
4. **Fix the dev tool's dead card-size controls** (see the note above). One line: set the
   custom property on `#cfob-root` instead of `documentElement`.
5. **Update `docs/TESTING_COVERAGE.md`** — the coverage table, the progress table, and the
   follow-ups section.

## What was fixed from the collected data

The masonry arrow branch ranked candidates by **cross-axis gap** (0 when the two cards
overlapped sideways), then along-axis distance. That preferred any card overlapping the
current one horizontally, even when a nearer card existed. It now takes the **nearest
centre** among cards in the pressed direction — and, for a vertical key, among cards in
the **same column**.

Evidence: 10 of 11 recorded corrections reproduce; correct on 388/388 uniform-grid moves;
changes 18 of 96 moves in the recorded masonry layout (alternatives tested: 53–70).
Browser-verified after the column rule: 34 column crossings on 48 vertical moves before,
0 after.

## Traps that bit during this work

These are all now handled, but they will bite again in a new session.

- **"Same column" is a left-edge test, not an overlap test.** Masonry columns are one card
  plus a gutter wide, so cards in neighbouring columns never overlap horizontally. A
  predicate that asks "do these two rects overlap (allowing a gutter)?" returns true for
  the next column too, and the column rule silently becomes a no-op. Compare `left`.
- **A centre comparison answers "is it beside me", not "is it above me".** Used for
  "first row", it makes a top-row card look like a later row whenever a shorter card sits
  to its left. Compare `top`.
- **Snapshot geometry once.** `handleGridNavigation` calls `scrollIntoView` on its
  destination, so reading a rect before and after the call compares two different
  layouts. Capture positions into an array first.
- **Do not infer a missing feature from one observable property.** See the retraction
  above.
- **Assert the direction invariant, not the exact destination.** "Never moves opposite to
  the key" is the contract; a boundary no-op (delta 0) is correct. Flagging every zero
  delta as a failure reports phantom bugs and hides real ones.
- **A short mutation anchor can match inside a longer line.** `replace(..., 1)` then
  edits the wrong site and the test stays green. Anchor on text the target cannot be a
  substring of, and guard that the mutation changed the file at all.
- **CRLF source.** The probe normalises to LF for matching and converts back on write, or
  every multi-line pattern silently fails to match.
- **Four settings changes fire four `change` events.** Rebuilds must be coalesced
  (one in flight, one pending) or drop listeners stack and one drag records several
  examples.
- **A dev tool's mirror of the code drifts silently.** The tool's `score()` ranked by
  cross-axis gap while the code ranked by centre distance; the panel reported "drift" the
  code had never produced. When the code's rule changes, change the mirror in the same
  commit.

## Verification

```
npm test              # 165/165
npm run lint          # clean
npm run typecheck     # exit 0
npm run test:mutation # 19/19 mutations turn their test red
npm run test:e2e      # 3/3, ~96s
```

`CFOB_Selection.js` unit coverage is 41.46% → 72.97% on this branch.

To probe the real UI without writing a probe each time, reuse
`tests/e2e/helpers.mjs` (`startServer`, `launchChrome`, `waitUntil`,
`makeOutputDir`). Note that `sweepStaleProfileDirs()` deletes any `cfob-e2e-*` dir not
owned by a live process — call it **before** creating your fixture dir, or it deletes
your own fixture.

## Open question for the user

A correction records only *that* the destination was wrong. A free-text field per example
would capture *why* ("should prefer the card in the same column"), at the cost of making
the export harder to analyse mechanically. Default is no field, letting the geometry
speak. Ask before adding one.

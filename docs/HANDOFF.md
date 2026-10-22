# Handoff: masonry grid navigation

Status: **mid-task, nothing committed for the current step.**
Branch: `docs/testing-coverage-plan`. Read this first if you are picking this up.

## Where things stand

Two navigation bugs in masonry are fixed and verified; a dev tool for collecting
corrections is built and verified; the corrections themselves have **not** been
collected yet, so the logic fix they are meant to drive has not started.

| Step | State |
| --- | --- |
| Masonry `PageUp`/`PageDown` moving sideways | fixed, 6 tests |
| Row-first masonry using DOM index | fixed, 5 tests |
| Masonry arrows ranking by cross-axis gap | fixed from recorded corrections |
| Dev tool: landing arrows | done |
| Dev tool: drag-to-correct + examples export | done, uncommitted |
| **Collect examples from the user** | **done — 11 recorded, 10 reproduced** |
| Fix the nav logic from the collected data | **done — nearest centre** |
| **Confirm ArrowUp in the dev tool** | **not done — unverified** |

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

Both are covered by `tests/unit/grid-navigation.test.mjs` — 20 tests in total: 9 for grid
paging/edges, 6 for masonry paging, 5 for row-first masonry — and mutation-proven by
`tests/mutation/probe-grid-navigation.mjs` (`npm run test:mutation`, 13 mutations).

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

### What is drawn

- **current** badge — the card you are on. This is the only label; the old
  `cur N` / `chose N` pair was removed as redundant (after a move, the chosen card *is*
  the current card).
- **Landing arrows** — on each destination card, a chip with the glyph of the key that
  lands there. Centred on the card, 46px. They describe the card you are on **now**;
  an earlier version drew them from the pre-move card and was therefore one step behind.
- **Outlines** — green on the current card, amber on the spatial best when it differs.

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

1. **Confirm ArrowUp in the dev tool.** This is the only outstanding gap. All 11 recorded
   corrections are ArrowRight (9), ArrowLeft (1) and ArrowDown (1) — none is ArrowUp, so
   the nearest-centre behaviour for ArrowUp is arithmetic, not the user's judgement. In
   the recorded layout it crosses columns on 5 of 23 cards (1→0, 2→3, 3→1, 4→3, 15→13).
   Ask the user to check those by eye and record any disagreement.
2. **The withdrawn case.** From card 15, ArrowDown: recorded as "should go to 22", then
   withdrawn. Nearest-centre picks 20. `tests/unit/user-layout-fixture.mjs` carries the
   raw data and `WITHDRAWN` in `grid-navigation.test.mjs` lists what is excluded. Do not
   silently start asserting it.
3. **If more corrections arrive**, reproduce each one before analysing it (read `layout`,
   rebuild, confirm `geometry` matches). Group by symptom, fix the heuristic, extend
   `tests/unit/grid-navigation.test.mjs`, and add a mutation to
   `tests/mutation/probe-grid-navigation.mjs`.
4. **Update `docs/TESTING_COVERAGE.md`** — the coverage table, the progress table, and the
   follow-ups section.

## What was fixed from the collected data

The masonry arrow branch ranked candidates by **cross-axis gap** (0 when the two cards
overlapped sideways), then along-axis distance. That preferred any card overlapping the
current one horizontally, even when a nearer card existed. It now takes the **nearest
centre** among cards in the pressed direction.

Evidence: 10 of 11 recorded corrections reproduced; correct on 388/388 uniform-grid moves;
changes 18 of 96 moves in the recorded masonry layout (alternatives tested: 53–70).

## Traps that bit during this work

These are all now handled, but they will bite again in a new session.

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

## Verification

```
npm test              # 160/160
npm run lint          # clean
npm run typecheck     # exit 0
npm run test:mutation # 13/13 mutations turn their test red
npm run test:e2e      # 3/3, ~90s
```

`CFOB_Selection.js` unit coverage is 41.46% → 66.03% on this branch.

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

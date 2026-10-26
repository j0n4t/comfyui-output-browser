# Testing Coverage Plan

Status: **in progress**. Every number below was measured against the working tree on
`docs/testing-coverage-plan`, not estimated.

| Item | State |
| --- | --- |
| 0. Declare `selectionAnchorIdx` | done — `typecheck` green |
| 1. Grid paging and edges | done — 9 tests, mutation-proven |
| Masonry `PageUp`/`PageDown` sideways | done — fixed, 6 tests, browser-verified |
| Row-first masonry arrow drift | done — fixed, 5 tests, browser-verified |
| Masonry arrows pick the nearest centre | done — fixed from recorded corrections |
| Vertical arrows crossing columns | done — same-column rule, browser-verified |
| 2–6 | not started |

## What "covered" means here

A documented behavior counts as covered only when a test asserts **what the user sees or
what the system does**, not when a test proves a function was called.

- `keydown-dispatch.test.mjs` has 91 tests that assert `calls.includes("handleFieldCopyKey")`.
  That is routing, not behavior. It is counted as *partial* below.
- Line-coverage percentages are a **signal, not the target**. The interesting finding is
  *why* coverage is uneven, not *how low* it is.

## Tiers

| Tier | Runner | Files | Tests | Covers |
| --- | --- | --- | --- | --- |
| Unit | `npm test` | `tests/unit/*.test.mjs` (8 files) | 169 | Pure logic + key dispatch against mock elements |
| E2E | `npm run test:e2e` | `tests/e2e/*.test.mjs` (5 files) | 10 | Real Chromium over CDP against the standalone server (~250 s) |
| Python | — | — | 0 | `__init__.py` (291 LOC, 5 HTTP endpoints) has **no** test of its own |

All three gates were run while writing this and all pass (169/169 unit, 10/10 e2e, 19/19
mutations). E2E only skips when no browser is found, so a green run means the UI actually
worked, not that it was skipped.

`npm run typecheck` exits 0. That was the one red gate on `main`, and item 0 is what fixed
it: `selectionAnchorIdx` is assigned and read on the `ComfyOutputBrowser` instance from
`CFOB_Selection.js` but was never declared on the class. Every sibling property that gets
assigned the same way **is** declared in the constructor. Harmless at runtime, but it meant
the shift-click range-selection anchor had no type safety and no test.

## Measured unit coverage of `web/`

`node --test --experimental-test-coverage "tests/unit/*.test.mjs"`:

| Module | Lines | Branch | Funcs |
| --- | --- | --- | --- |
| `CFOB_Drag.js` | 100.00 | 83.33 | 100.00 |
| `CFOB_Selector.js` | 100.00 | 91.67 | 100.00 |
| `assets/*.js` | 100.00 | 100.00 | 100.00 |
| `CFOB_Filter.js` | 99.51 | 90.24 | 93.10 |
| `CFOB_Selection.js` | 74.56 | 93.10 | 40.00 |
| `CFOB_Settings.js` | 35.04 | 43.75 | 13.64 |
| `CFOB_FullView.js` | 31.91 | 82.76 | 6.90 |
| `PngMetadata.js` | 32.25 | 100.00 | 0.00 |
| `CFOB_API.js` | 30.43 | 100.00 | 21.43 |
| `CFOB_Modal.js` | 28.97 | 100.00 | 11.11 |
| `CFOB_Search.js` | 22.80 | 100.00 | 11.76 |
| `ComfyOutputBrowser.js` | 22.64 | 85.00 | 6.67 |
| `CFOB_Gallery.js` | 20.28 | 100.00 | 7.69 |
| `CFOB_ImageActions.js` | 13.79 | 100.00 | 7.69 |
| **all files** | **56.88** | **90.52** | **59.07** |

### The finding worth acting on

Coverage is high exactly where the code is **pure**: the filter parser (99.51%), the drag
math (100%), launcher placement (100%). It collapses where the code is **DOM-heavy**:
`CFOB_ImageActions.js` (13.79%), `CFOB_Gallery.js` (20.28%), `CFOB_Search.js` (22.80%),
`CFOB_Modal.js` (28.97%).

Branch coverage tells the same story from the other side: it is 90.52% overall, and the
low-module branch figures (`CFOB_Settings.js` 43.75%) are low because whole code paths are
never entered at all, not because conditions are half-tested. The gap is **reachability**,
not assertion depth.

So the plan below targets behaviors at the seams that already exist
(`handleGridNavigation`, `filterImages`, `handleKeydown`, the settings getters/setters)
rather than trying to raise a percentage inside a 1493-line settings module.

## Coverage matrix — documented behavior

### A. Filter syntax (README §Filter syntax)

All 10 documented forms are covered by `tests/unit/filter.test.mjs` (13 tests), including
the blacklist interactions in `search-blacklist.test.mjs`.

| Documented syntax | Tested |
| --- | --- |
| AND (space), OR (comma) | yes |
| `!term` NOT | yes |
| `"exact phrase"` | yes |
| `key:value` field search | yes |
| `index:value` index search | yes |
| `@shortcut` saved filter | yes |
| `[index]` / `[start:end]` ranges | yes |
| `.` force-show-hidden prefix | yes |
| combined chaining | covered by parts |
| blacklist interaction | yes |

**Verdict: done. Do not add more here** unless a syntax regresses.

### B. Keybindings (README §Keybindings Reference)

29 documented behaviors. "Implemented" means present in `web/`. "Asserted" distinguishes two
kinds of test honestly, because `keydown-dispatch.test.mjs` mixes them:

- **yes** — the test calls the *real* production handler (`CFOB_Selection.handleKeydown`,
  `CFOB_FullView.handleKeydown`, `CFOB_Search.handleKeydown`) and asserts the real action
  happened. That is behavior.
- **partial** — the test mocks the handler and asserts the dispatcher *called* it. That is
  routing. It proves the key is wired, not that the feature works.

| Key | Mode | Implemented | Asserted |
| --- | --- | --- | --- |
| `Ctrl+Shift+?` | Global | yes (ComfyUI extension registry) | **no** |
| `Ctrl+1` | Global | yes | partial |
| `Ctrl+2` / `Ctrl+3` / `Ctrl+4` | Global | yes | **no** |
| `Enter` / `Tab` complete suggestion | Search | yes (`CFOB_Search`) | **no** |
| `ArrowUp`/`ArrowDown` cycle suggestions | Search | yes | **no** |
| `ArrowDown` focus first match | Search | yes | partial |
| `ArrowUp` recall previous search | Search | yes | **no** |
| `ArrowUp` from first grid row | Search | yes | yes |
| `Escape` (grid) | Grid | yes | yes |
| `1`–`9` copy metadata field | Grid | yes (`handleFieldCopyKey`) | partial |
| `Ctrl+A` | Grid | yes | yes |
| `Ctrl+Shift+S` | Global | yes | partial |
| `M` / `R` / `I` | Global | yes | yes |
| `Space` (grid) | Grid | yes | yes |
| `Enter` toggle selection | Grid | yes | yes |
| `Delete` / `D` | Global | yes | yes |
| Arrow keys navigate grid | Grid | yes | yes |
| `PageUp` / `PageDown` | Grid | yes (`CFOB_Selection`) | yes |
| `Home` / `End` | Grid | yes | yes |
| `Escape` (full view) | Full View | yes | yes |
| `ArrowLeft` / `ArrowRight` | Full View | yes | yes |
| `ArrowUp` focus search | Full View | yes | yes |
| `M` / `R` | Full View | yes | yes |
| `G` go to position | Full View | yes | yes |
| `Space` toggle overlay | Full View | yes | yes |
| `T` toggle sidebar | Full View | yes | yes |
| `+` / `-` / `0` zoom | Full View | yes | yes |
| `H` hide/show chrome | Grid + Full View | yes | yes (e2e `panel-keys.test.mjs`) |
| `B` send focused image's chips | Grid + Full View | yes | yes |

**Totals: 20 asserted, 4 routing-only, 5 untested.** None of the five is a missing
feature — every one is implemented. These are pure gaps.

### C. Settings (README §Core Operational Modes)

22 `cfob_*` keys are read from `localStorage`. Only **7** appear anywhere in `tests/`:

`cfob_hide_card_info`, `cfob_launcher_hook_element`, `cfob_scroll_dir`,
`cfob_masonry_enabled`, `cfob_launcher_pos`, `cfob_grid_fill_order`,
`cfob_launcher_placement`.

Never exercised by any test:

`cfob_compact_offset`, `cfob_constrain_full_view`, `cfob_filter_shortcuts`,
`cfob_full_view_fit_mode`, `cfob_full_view_sidebar_height`,
`cfob_full_view_sidebar_mode`, `cfob_full_view_sidebar_width`,
`cfob_full_view_ui_hidden`, `cfob_grid_size`,
`cfob_ignored_autocomplete_keywords`, `cfob_panel_offsets`,
`cfob_search_blacklist`*, `cfob_search_history`, `cfob_sort`, `cfob_ui_scale`.

\* `cfob_search_blacklist` is covered as *filter input*, not as a persisted setting — the
round-trip through `localStorage` is untested.

The persistence pattern is already proven by `tests/unit/hide-card-info.test.mjs`, so the
remaining 15 are the same shape, not new work.

### D. Server endpoints (`__init__.py`)

| Endpoint | Tier |
| --- | --- |
| `GET /images` | e2e (the suite boots the server and reads it) |
| `POST /move` | e2e (`move-updates-card.test.mjs`) |
| `POST /rename` | e2e (`move-updates-card.test.mjs`) |
| `POST /delete` | **none** — referenced only in test helpers, never exercised |
| `POST /upload` | **none** |

## Ranked gaps

Ordered by (user-visible risk) / (effort). Each item is a behavior assertion, and each
should be proven to fail before it is trusted.

**0. Declare `selectionAnchorIdx` on the class** — **done.** It sits beside the sibling
index properties in the constructor. `npm run typecheck` exits 0.

**1. Grid paging and edges — `PageUp`/`PageDown`/`Home`/`End`** — **done.**
`tests/unit/grid-navigation.test.mjs`, 9 tests over row-first, column-first and masonry
grids, plus clamping and the empty-grid case. Asserts which card ends up focused and
scrolled into view. Mutation-proven by `tests/mutation/probe-grid-navigation.mjs`
(`npm run test:mutation`): nineteen deliberate breakages of `web/CFOB_Selection.js`, each
one turning its test red.

**2. Metadata copy actually copies — `1`–`9`**
`handleFieldCopyKey` resolves the field config, finds the target image, and writes to the
clipboard. The only existing test asserts the *dispatch* called it. Assert the clipboard
content for a known field config, and that a digit with no configured field is a no-op.

**3. Search suggestion completion and cycling — `Enter`/`Tab`, `ArrowUp`/`ArrowDown`**
The search bar is the primary entry point and its keyboard contract is entirely untested.
`CFOB_Search` already takes a mock element in `keydown-dispatch.test.mjs`, so this is the
same harness with a real suggestion list behind it.

**4. Settings persistence round-trip — the 15 untested keys**
One parameterized test, same shape as `hide-card-info.test.mjs`: write a value, reload,
read it back. Cheap, and it converts 15 silent settings into verified ones.

**5. `Ctrl+1`–`Ctrl+4` view switching, and `Ctrl+Shift+S` sync**
All four view keys and the sync key are wired to handlers that are mocked in the existing
tests. One test over the real `setViewMode`/`fetchServerImages` path closes it.

**6. Server: `POST /delete` and `POST /upload`**
No tier exercises either. Cheapest fix is e2e, since the harness already boots the real
server for `/move` and `/rename`.

### Explicitly not worth doing now

**Raising line coverage in `CFOB_Settings.js` (1493 LOC, 35.04%) and
`ComfyOutputBrowser.js` (1342 LOC, 22.64%).** These are the two lowest numbers in the
table and the two least worth chasing. Their behavior is substantially exercised by the
e2e tier, and the remaining uncovered lines are DOM construction and event wiring — the
kind of code where a green line-coverage number proves nothing a user would notice. Item 4
above gets the real value out of the settings module for a fraction of the cost.

**`Ctrl+Shift+?`.** It is registered through ComfyUI's own extension keybinding registry, not
our dispatch path, so it cannot be unit-tested here and is only reachable inside a full
ComfyUI instance. Low risk, and the workaround is to verify it manually once.

**A Python test harness for `__init__.py`.** The server is 5 thin endpoints, and the e2e
tier already boots it for real. Adding pytest for its own sake would be a new dependency
in service of a number. Cover `/delete` and `/upload` through e2e instead (item 6).

## Follow-ups found while working

**The panel's own chrome had no keyboard toggle — added (`h`).** The full view already hid
its overlay with `Space`/`ArrowDown`; the grid had nothing equivalent, so the only way to
get the chrome out of the way was to close the whole panel. `h` now toggles the top bar
and the action bar in place, reclaiming the space they occupied (`display: none`, not an
invisible flex child, which would have left a dead strip of background), marking them
inert and `aria-hidden`, and bringing them back — including the action bar's own `show`
state, so a selection made while hidden is not lost. `h` in full view drives the same
shared state, and focusing the search input reveals the chrome, since the input is the one
thing that can be focused while the bar around it is hidden.

**`b` sends the focused image to the basket.** The Chips button existed in both the action
bar and the full view's sidebar, but no key reached it. `b` now sends the *focused* card —
deliberately not the multi-selection, matching the button's own single-image contract —
and in full view it clicks the sidebar button, so both surfaces behave identically.

**The chips field picker was unreachable by keyboard and anchored to the wrong thing.** It
opened at the clicked button, so `b` in the grid put it at the action bar while the picture
it is about is in the grid, and nothing was focused, so choosing a field needed a mouse. It
now anchors to the image (the focused card in the grid, the picture in full view), opens
with the first field focused, and supports `ArrowUp`/`ArrowDown`/`Enter`/`Space`/`Escape`.
Escape dismisses the picker and nothing behind it — it was missing from the dismissal
ladder, so Escape closed the panel instead. Dismissing it also returns focus to whoever
owned it (via `settings.dismissPopover()`, which every dismissal path shares), so the
keystrokes the picker interrupted continue where the user expects.

Placement is centred on the anchor when that fits, beside it otherwise, and clamped fully
inside the viewport — a menu must never run off screen. Two bugs were found here by testing
at real sizes rather than the 764px headless default: `b` passed the action-bar button as
the anchor (so the menu opened at the bar, not the card), and the full view's
ArrowDown/ArrowUp were swallowing the picker's own arrow keys, because the dispatcher
routed them to the view before the picker could see them. The picker now takes precedence
for those keys while it is open.

**The full view's bar covered the top of every image and cropped the bottom.** The bar was
absolutely positioned over the picture, which is centred on the whole viewport, so the
image's top edge sat under the bar and the fit maths measured a box the picture did not
have — the bottom was clipped. The bar is now a real layout row above the image area
(`.full-view-body` wraps the image and the sidebar), so it reserves its space instead of
overlapping: no coverage, no cropping, and hiding it genuinely gives the image that height
back. `setFullViewUIHidden` refits on the next frame, because hiding the bar changes the
box the image is fitted to and refitting immediately would measure the old one. Measured
across square, portrait, landscape, tall and wide fixtures in both states.

**Clicking the full-view background did nothing.** The drag handler reset its state on
`mouseup` before the click could be evaluated, so a click on the background was swallowed.
It now toggles the UI exactly as clicking the image does, and a click on the overlay outside
the pane is left alone so ComfyUI's click-outside is unaffected.

**Masonry PageUp/PageDown moved sideways — fixed.** The masonry page branch scored every
card by distance from `currentY +/- containerHeight`, with no directional constraint. Near
the top or bottom of the grid nothing is anywhere near that target, so it fell back to the
nearest card overall — which is a card in the *same row*. Probing the real browser showed
PageUp from the top row moving right (`0 -> 5`, `12 -> 6`, `20 -> 15`) and PageDown from
the bottom row moving left (`29 -> 23`, `23 -> 17`). Fixed by skipping any candidate not
strictly on the requested side; when none qualifies, focus stays put. Re-probed in the
browser afterwards: 42 moves across 7 starting positions, **0 directional reversals**.

**Row-first masonry used index arithmetic for arrow keys — fixed.** `isMasonry` also
required `.grid-column-first`, so row-first masonry never took the spatial branch either.
Row-first masonry is real and is implemented as JS packing
(`CFOB_Gallery.applyRowFirstMasonryPacking`, inline `grid-row-end` spans), not CSS columns.
Cards are dealt row-major but each lands at the first free slot scanning right then down, so
with uneven image heights the DOM order stops matching the visual column order and
`nextIdx ± cols` jumped to an unrelated card. Measured in the browser before the fix:
**39–67 of 96 arrow moves** disagreed with the spatial heuristic across the view × scroll ×
fill-order × masonry combinations. Worst case: `ArrowDown from card 0` picked a card
**5468px** away when one **242px** away was available. Dropping the `grid-column-first`
requirement takes row-first masonry onto the spatial branch; re-measured afterwards,
**0 of 96 in every combination**.

An earlier version of this plan claimed row-first masonry did not render as masonry at all.
That was wrong. The probe inferred masonry from `display: block`, which is only how
*column-first* masonry renders (CSS multi-column). Row-first masonry is a packed grid and
reports `display: grid` with `grid-auto-rows: 1px` and per-card `grid-row-end` spans.

**Masonry arrows ranked by cross-axis gap instead of centre distance — fixed.** The
masonry arrow branch scored candidates by how far they were from the current card on the
cross axis (0 when the two cards overlapped sideways), then by along-axis distance. That
preferred *any* card overlapping the current one horizontally, even when a nearer card
existed, so arrows landed on a card several columns away. `CFOB_Selection.js` now takes the
nearest centre among cards in the pressed direction.

Found from 11 corrections recorded by the user with `web/dev-grid-nav.html`, in the real
layout (grid / masonry / row-first / 24 cards / seed 7): **10 of 11** corrections are
reproduced by nearest-centre. It is also correct on 388/388 moves in uniform grids, so it
does not regress the plain grid, and it changes only 18 of 96 moves in that masonry layout
(the alternatives tested changed 53–70).

The 11th is deliberately not asserted: from card 15, ArrowDown, recorded as "should go to
22" and then withdrawn by the user. Nearest-centre picked 20 there; 20 is itself a crossing,
so the column rule makes the move stay put (15) instead. The `WITHDRAWN` set in
`grid-navigation.test.mjs` records it. If the user wants "wrap into the
next column when this one runs out", that is a new decision rather than a fix to this one.

**Vertical arrows crossed columns — fixed.** All 11 recorded corrections are ArrowRight
(9), ArrowLeft (1) and ArrowDown (1) — none is ArrowUp, so the nearest-centre rule for a
vertical key was arithmetic, not the user's judgement. Confirmed in the dev tool: it made
ArrowUp cross columns on 5 of 23 cards in the recorded layout (1→0, 2→3, 3→1, 4→3, 15→13)
and ArrowDown on 1 (23→21), and the user's ruling was that a vertical arrow should not cross
columns at all.

`CFOB_Selection.js` now requires a vertical move to stay in the current column, decided by
left edge: masonry columns are one card plus a 6px gutter wide, so neighbouring columns never
overlap horizontally and only the left edge tells them apart. A card with nothing above or
below it in its own column stays put.

Measured in a real browser over the dev tool's masonry DOM (4 columns, 24 cards): **34
column crossings on 48 vertical moves before, 0 after**; disabling the check in-page
reproduced the 34.

The same commit fixed a second defect the change would otherwise have exposed: the
"first row" test for the `ArrowUp` shortcut compared card *centres*, so a top-row card with
a shorter card to its left looked like a later row and ArrowUp jumped sideways into that
card. It now compares `top`, matching the grid branch's `offsetTop`.

**Mutation-proving the tests caught two flaws in the tests themselves.** The first version
of the masonry `PageDown`/`PageUp` tests used three cards and asserted the correct
destination — but "nearest card to one viewport away" and "nearest card to the current row"
resolved to the same card, so both tests stayed green when the page offset was deleted from
the production code. The fixtures now include a card in the next row that is *closer* to the
current row than the correct page target, so the two cases disagree and the tests can fail.

The second was caught by a mutation that re-added the `grid-column-first` requirement:
the row-first masonry fixtures were tagged `MASONRY`, which *includes*
`grid-column-first`, so the test was exercising column-first masonry and passing for the
wrong reason. The fixtures now use `["masonry", "view-grid"]`.

Worth remembering: a test that passes is not evidence. `npm run test:mutation` is the
cheap way to check a new test can actually fail.

## Definition of done for each item

- The test asserts an outcome the user can observe (a card moved, a value copied, a setting
  read back), not that a function was invoked.
- The test is proven to fail against the pre-change code — revert the feature, watch it go
  red, restore it.
- `npm test`, `npm run lint`, and `npm run typecheck` all still pass.
- No new dependency, no new test runner.

## Running

```
npm test              # unit, ~2 s
npm run test:e2e      # real Chromium over CDP, ~250 s
npm run lint
npm run typecheck
npm run test:mutation # break the code, confirm the tests catch it (~15 s)
```

Add coverage numbers to the unit run with
`node --test --experimental-test-coverage "tests/unit/*.test.mjs"`.

## Dev tool: grid navigation

`web/dev-grid-nav.html` — open it from the standalone server at
`http://localhost:8189/web/dev-grid-nav.html` (or whichever port you run
`python __init__.py` on). It drives the real `CFOB_Selection.handleGridNavigation` against
a real DOM using the app's own stylesheet, and lets you switch view, scroll direction, fill
order and masonry while pressing arrow keys.

For every move it reports which card was picked, which card the spatial heuristic would have
picked, and the scored candidate list. It exists because the row-first masonry bug was
invisible from the outside — the wrong card gets the focus outline and nothing in the UI
says so. With the bug present it reported:

```
Drift. ArrowRight from card 3 picked 4 (504px away) but the nearest card in that
direction is 1 (521px away).
```

It is a dev page, not part of the UI: it lives in `web/` only because the standalone server
mounts that directory.

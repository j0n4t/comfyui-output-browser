# Testing Plan — ComfyUI Output Browser

Scope: this plan covers what the app actually *does* to the person running ComfyUI and to
its server — the visible grid layout, the keys that move focus, the text that filters the
list, the panels that open, the server calls the UI drives. It is not a coverage report
and not a test inventory. A percentage only tells you a line was executed; it does not tell
you a user sees the right card, or that a setting survives a reload.

The old plan collapsed on this distinction. It recorded *how much* code a test touched,
and it counted mock-store assertions ("the key is in localStorage") as behaviour. That is
routing, not behaviour. A test that passes is not evidence — if a test cannot fail when
the real app breaks, it proves nothing.

## Rules of the plan

- **Every check asserts an outcome the user can see or a system you can observe** — which
  card is focused and scrolled into view, which filter the suggestions list is drawn from,
  which server image a `POST /move` hit. Not that a function was invoked.
- **Behaviour gets the real production code.** A keystroke tests `CFOB_Selection.handleKeydown`
  with the real host object and a real gallery element. A settings value tests the real
  setter wiring, then reads the resulting DOM class. The mock harness is for unit-level
  *logic* (filter parsing, drag math) where there is no DOM; it is never a stand-in for
  the app's own wiring.
- **Node tests for pure logic** (`node --test`); **Chromium for what the real UI does.**
  e2e only skips when no browser exists, so a green run means the UI actually worked.
- **No new dependency, no new test runner.**

## Where the app's behaviour lives

| Surface | What a real check touches |
| --- | --- |
| `CFOB_Filter.js` | Pure parser: AND/OR/NOT/ranges/fields/blacklist. Node. |
| `CFOB_Selection.js` | Grid focus, paging, clamping, column rules, selection. Node + e2e. |
| `CFOB_Search.js` | Suggestion list, completion, cycling, recall. Node + e2e. |
| `CFOB_Gallery.js` | Rendering, packing, fill order. Node + e2e. |
| `CFOB_ImageActions.js` | Metadata copy, basket, chips. Node + e2e. |
| `CFOB_API.js` + `ComfyOutputBrowser.js` | Server fetching, move/rename/delete/upload. e2e. |
| `CFOB_Settings.js` | Persistence, defaults. Node (real setter wiring) + e2e. |

## Feature map — what is covered

| # | Behaviour | Current state | Where |
| --- | --- | --- | --- |
| 1 | Grid renders the right images in the chosen layout (grid / masonry / row-first) | tested | `grid-layout.test.mjs`, e2e `dev-tool-layout` |
| 2 | Keys move focus to the right card and scroll it into view (arrows, paging, edges, clamping, empty grid) | tested | `grid-navigation.test.mjs`, mutation-proven |
| 3 | Masonry arrows go to the nearest card centre, never sideways into the next column | tested | `grid-navigation.test.mjs`, browser-proven |
| 4 | Vertical arrows never cross columns | tested | `grid-navigation.test.mjs`, browser-proven |
| 5 | Search parses a query to a real result list, with suggestions; Enter/Tab complete, ArrowUp/Down cycle | tested | `filter.test.mjs`, `search-blacklist.test.mjs`, `keydown-dispatch.test.mjs`; suggestion tests `83a9c25` |
| 6 | Filter syntax (AND/OR/NOT/ranges/fields/blacklist) | tested | `filter.test.mjs`, `search-blacklist.test.mjs` |
| 7 | Selection: click, Ctrl+A, Delete/D; the focused card is the one actions act on | tested | `keydown-dispatch.test.mjs`, e2e `panel-keys` |
| 8 | Settings survive a reload, in the real `CFOB_Settings` wiring | **not verified** | — |
| 9 | Full view: opens, navigates, `m`/`r` toggle, `Esc` closes, UI hiding reveals the image | tested | e2e `panel-keys`, `dev-tool-layout` |
| 10 | Launcher button opens the panel and drags to a new spot | tested | e2e `launcher-drag` |
| 11 | Server: `GET /images`, `POST /move`, `POST /rename` | tested | e2e `move-updates-card` |
| 12 | Server: `POST /delete`, `POST /upload` | **not exercised** | — |

## The gaps, ranked by user-visible risk / effort

### [ ] 1. Settings persist to localStorage and re-apply on reload

`CFOB_Settings` reads and writes `cfob_*` keys, but no setting test runs the real setter
or checks the gallery the setting changes (only the mock store holds the key).

**Done definition:** a real `CFOB_Settings` instance — set `cfob_masonry_enabled`, assert
the getter returns it and the gallery's masonry class toggles; reload the store; assert the
value comes back. Observable and breakable. Not a mock-store re-read.

### [ ] 2. Ctrl+1–Ctrl+4 switch views, Ctrl+Shift+S syncs

The four view keys and the sync key currently route to a mocked handler.

**Done definition:** dispatch each key on the real dispatch path and assert the gallery class
list changes to the right view (grid / masonry / row-first) and, for `Ctrl+Shift+S`, that
`fetchServerImages` runs (refresh spinner, then the image list updates) — over the real
`setViewMode`/`fetchServerImages` route, not a mocked handler.

### [ ] 3. POST /delete and POST /upload on the server

`/move` and `/rename` run over the real e2e server; two endpoints are still untested.

**Done definition:** boot the real server in the e2e harness, `POST /delete` a test image
(it leaves the grid, and `/images` no longer lists it), `POST /upload` a test file (the card
appears, and the card count rises). Assert on card count and the `/images` response, over
the same harness that already covers `/move` and `/rename`.

### [ ] 4. Search suggestion recall (history)

`ArrowUp` from the first row is done; the previous-search recall and cycling from the top
are not.

**Done definition:** type a query, `ArrowUp` twice — the input shows the prior query and
the suggestion index wraps. One test over `CFOB_Search` with a real suggestion list.

### [ ] 5. Metadata copy really copies

`1`–`9` copy the configured metadata field, but the earlier test was a call-routing
assertion, not a clipboard assertion.

**Done definition:** a configured digit writes the resolved field value to the clipboard,
and a digit with no configured field is a no-op. Assert clipboard content for a known
field config, over the real `handleFieldCopyKey` path.

### Also open (no time budgeted): range selection with Shift+click, row-first masonry
packing correctness, full-view `G` go-to-position. These are either narrow (one layout
edge) or covered by the behaviour tests above once the gaps above are closed.

## Not worth doing now

**Raising coverage percentages** in `CFOB_Settings.js` (35%) or `ComfyOutputBrowser.js`
(22%). The uncovered lines are DOM construction and event wiring; a green percentage
proves nothing a user notices. Convert them to the real-setter and real-DOM checks above
instead.

**Mock-store-only setting tests.** Any test that only asserts `localStorage` contains a
key, without the real `CFOB_Settings` wiring and a real gallery element, is not a
persistence test — it is a key-listing exercise. It can pass while persistence silently
regresses. Drop them from the definition of done.

**Per-key coverage percentages inside one 1493-line settings module.** A setting counts
when its behaviour is observed, not when a line is green.

## How to run

```sh
npm test
npm run test:e2e
npm run lint
npm run typecheck
npm run test:mutation
```
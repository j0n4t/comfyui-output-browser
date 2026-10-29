# ComfyUI Output Browser

Yet Another Output Image and Metadata Browser for ComfyUI, designed to help you view, organize generated images and inspect metadata.

## Core Operational Modes & Features

### 1. Grid / Gallery Mode

- **Masonry Layout:** Toggle masonry on or off under **Options → Display → Masonry Grid**. Masonry preserves each image's aspect ratio and supports both **Row first** and **Column first** ordering across vertical and horizontal scrolling.
- **Hide Card Info:** Enable **Options → Display → Hide Card Info** to hide the filename header and metadata body on grid, compact, and masonry cards — leaving only the image preview. List view is unaffected.
- **Tabbed Options & Panel Sizing:** Open **Options** to adjust display and layout, including showing or hiding selection checkboxes, manage hidden paths and ignored autocomplete keywords together under **Folders & Search**, or customize image card fields under **Custom Fields**. Set the width of left/right drawers and the height of top/bottom drawers with the panel size sliders.
- **Spatial Navigation:** Browse through generated image cards seamlessly using your keyboard arrow keys (`↑`, `↓`, `←`, `→`) without changing selection. Use **`Space`** to toggle the focused image's selection.
- **Grid Fill Order:** Choose row-first or column-first image order under **Options → Display → Grid Fill Order**. Both vertical and horizontal scrolling support row-first and column-first orders for standard and masonry grids.
- **Scroll Direction:** Choose vertical or horizontal scrolling under **Options → Display → Scroll Direction**. Horizontal scrolling supports both row-first and column-first grids; list view remains a horizontal row.
- **Search Navigation:** Type in the search bar and press **`Enter`** or **`Tab`** to complete the selected suggestion (or the first suggestion). While suggestions are open, **`↑` / `↓`** cycle through autocomplete results; otherwise, **`↑`** recalls previous searches and **`↓`** focuses the first matching image without changing selection. In the grid, **`↑`** from its first row returns to search.
- **Selection & Batch Actions:** Use **`Ctrl + A`** to select everything currently filtered, or **`Space`** to toggle the focused image's selection.
- **File Management:** Instantly send unwanted outputs to the trash (`Delete`), download files locally (`D`), rename a selected image (`R`), or move selected images to an existing or newly created folder (`M`).
- **Launcher Placement:** Under **Options → Launcher Button → Placement**, choose where the button that opens this panel lives: **Sidebar**, **Action Bar**, **Floating (draggable)**, or **Pick Element**. With **Pick Element**, the browser UI hides so you can click any element on the ComfyUI page; the launcher then appears as a sibling immediately before that element. A dashed preview shows the exact spot — click the same element again to flip the launcher to the other side of it — then **OK** commits it, and **Cancel** (or `Esc`) restores your previous placement. These settings are hidden in standalone mode, which has no launcher button.
- **Panel Offsets:** Enable **Options → Panel Offsets** to inset the browser panel so it doesn't overlap ComfyUI's sidebar or top bar. The offsets are measured automatically from the live UI.

### 2. Full-Screen View & Zoom

- **Immersive Inspection:** Press **`F`** or **`Enter`** on any highlighted card to enter full-screen mode, allowing you to cycle through batches using the left and right arrow keys.
- **Full View Layout:** Choose **Options → View Mode → Full View** to browse one image at a time with search, sync, and options controls available in the viewer.
- **Precision Zooming:** Zoom in or out smoothly using **`+`** / **`-`** keys, or snap right back to default dimensions with **`0`**.
- **Panel-Sized Full View:** Enable **Options → Constrain Full View to Browser** to keep the image viewer inside the browser panel instead of covering the whole screen.
- **Interface Controls:** Toggle the overlay HUD controls using **`Space`** or collapse/expand the metadata sidebar using **`T`**.

### 3. Metadata Extraction

- **Quick-Copy Fields:** Press any number key from **`1` to `9**` while viewing an image (in grid or full-screen mode) to instantly copy the 1st through 9th metadata field values to your clipboard.
- **Inspector:** Press **`I`** to open a detailed metadata inspector popup.
- **Blacklist:** Hide specific metadata fields from search results under **Options → Folders & Search → Blacklist**. Enter paths like `Node.inputs.seed` to exclude matching values from search. This is useful for keeping sensitive or noisy metadata out of your search index.

Use **Options → Sort By** to order images by server order, filename, modification time (**Older First** or **Newer First**).

## Keybindings Reference

| Operational Mode     | Key Combination                                | Action / Description                                                  |
| -------------------- | ---------------------------------------------- | --------------------------------------------------------------------- |
| **Global**           | **`Ctrl + Shift + ?`**                         | Toggle the browser interface (show/hide).                             |
|                      | **`H`**                                        | Hide or show the panel's own chrome (top bar and action bar) while keeping the grid. |
|                      | **`Ctrl + 1` – `Ctrl + 4`**                    | Switch to Compact, Grid, List, or Full View, respectively.            |
| **Search**           | **`Enter` / `Tab`**                            | Complete the selected suggestion (or the first if none is selected).  |
|                      | **`ArrowUp` / `ArrowDown`** (suggestions open) | Cycle through autocomplete suggestions.                               |
|                      | **`ArrowDown`** (suggestions closed)           | Focus the first matching grid item, or the image in Full View mode.   |
|                      | **`ArrowUp`** (suggestions closed)             | Recall the previous search query.                                     |
|                      | **`ArrowUp`** (first grid row)                 | Return focus to the search bar.                                       |
| **Grid / Gallery**   | **`Escape`**                                   | Close modals, blur inputs, clear selections, or hide the browser.     |
|                      | **`1` – `9`**                                  | Copy the 1st through 9th metadata field value to the clipboard.       |
|                      | **`Ctrl + A` / `Meta + A`**                    | Select all filtered image cards.                                      |
| **Global**           | **`Ctrl + Shift + S` / `Meta + Shift + S`**    | Sync outputs from server, including in Full View mode.                |
|                      | **`M`**                                        | Move selected item(s) to an existing or new folder.                   |
|                      | **`R`**                                        | Rename the selected image; enter a `/`-separated path to move it too. |
|                      | **`I`**                                        | Open the metadata inspector popup.                                    |
|                      | **`Space`**                                    | Open full-screen view for the focused or selected image.              |
|                      | **`Enter`**                                    | Toggle selection state for the focused item.                          |
|                      | **`Delete`**                                   | Move selected item(s) to the trash.                                   |
|                      | **`D`**                                        | Download selected file(s).                                            |
|                      | **`B`**                                        | Send the focused image's chips to the Preset Gallery basket.          |
|                      | **`Arrow Keys`**                               | Navigate the grid without changing selection.                         |
|                      | **`PageUp` / `PageDown`**                      | Move up or down by about one grid page.                               |
|                      | **`Home` / `End`**                             | Focus the first or last image in the grid.                            |
| **Full-Screen View** | **`Escape`**                                   | Exit full-screen mode and return to the grid.                         |
|                      | **`ArrowLeft` / `ArrowRight`**                 | Navigate to the previous or next image in the batch.                  |
|                      | **`ArrowUp`**                                  | Focus the search bar from the image.                                  |
|                      | **`M` / `R`**                                  | Move the image to a folder / rename the image.                        |
|                      | **`G`**                                        | Go to an image by its position in the current results.                |
| **`Space`**                                    | Toggle overlay UI controls.                                           |
|                      | **`B`**                                        | Send this image's chips to the Preset Gallery basket.                 |
|                      | **`H`**                                        | Hide or show the panel chrome (top bar, action bar).                  |
|                      | **`T`**                                        | Collapse or expand the metadata sidebar.                              |
|                      | **`+` / `-` / `0`**                            | Zoom In, Zoom Out, or Reset Zoom level.                               |

## Filter syntax

| Syntax / Feature              | Description                                                                                                                                                                                   | Example                                        |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| **`term1 term2`**             | **AND Logic (Space):** Matches items containing _all_ space-separated terms across general fields.                                                                                            | `cat tree`                                     |
| **`term1, term2`**            | **OR Logic (Comma):** Matches items containing _any_ of the comma-separated groups.                                                                                                           | `cat, dog`                                     |
| **`!term`**                   | **NOT Logic:** Excludes items containing the term.                                                                                                                                            | `cat !dog`                                     |
| **`"exact phrase"`**          | **Exact Match:** Retains spaces to search for an exact, unbroken string.                                                                                                                      | `"blue sky"`                                   |
| **`key:value`**               | **Field Search:** Restricts the search to a specific field (`name`, `path`, `prompt`, `workflow`, or custom label).                                                                           | `name:v1`, `prompt:"blue sky"`                 |
| **`index:value`**             | **Index Search:** Restricts the search to a custom configured field by its numeric order (1-based).                                                                                           | `1:sdxl`, `2:1024`                             |
| **`@shortcut`**               | **Saved Filter:** Expands a named filter shortcut configured under **Options → Folders & Search → Filter Shortcuts**.                                                                         | `@animals`                                     |
| **`[index]` / `[start:end]`** | **Result Range:** Applies to the matching results for its term; ranges on AND terms are intersected. Indexes are zero-based, can be negative (from the end), and slice bounds may be omitted. | `dog[-5:] cat[1]`, `tree[:8]`, `path:temp[-1]` |
| **`.` (Prefix)**              | **Force Show Hidden:** Temporarily overrides the hidden folder filter if the entire query starts with a dot.                                                                                  | `.drafts`, `. name:test`                       |
| **Combined**                  | Syntaxes can be chained to create complex queries.                                                                                                                                            | `prompt:"blue sky" !name:test, 1:sdxl`         |

Use **Options → Folders & Search → Autocomplete Keywords to Ignore** to hide exact words from autocomplete suggestions. Enter one keyword per line or separate them with commas. Ignored words still work in filters; the list is empty by default because no workflow-independent terms can be safely assumed useless.

Configure reusable filters under **Options → Folders & Search → Filter Shortcuts**, one per line in `keyword | filter` format, then reference them as `@keyword`. For example, `animals | dog, cat, wolf` expands `@animals` to those alternatives and can be combined with other terms.

Autocomplete suggestions scroll-load in groups: filter starters first, then recent search history, followed by matching keywords ranked by how many images contain them. `name:` suggests filenames (not folder names), completing at most five characters beyond the typed prefix; `path:` suggests directories, with root folders before nested folders. Starting a new comma-separated filter group also opens suggestions for that group.

## Development tips

- Run the unit suite with `npm test` (Node.js 18 or newer; no dependencies required).
- Run the end-to-end suite with `npm run test:e2e`. Playwright Test manages Chromium and starts one shared static server for dev-tool tests; API tests start isolated servers with throwaway output directories so filesystem mutations cannot race. Install Playwright's browser once with `npx playwright install chromium`; Python with `aiohttp` is also required (the ComfyUI venv is detected automatically). Set `CFOB_PYTHON` to use a custom Python binary.

# ComfyUI Output Browser

Yet Another Output Image and Metadata Browser for ComfyUI, designed to help you organize generated images, inspect metadata, and instantly reload embedded node workflows.

## Core Operational Modes & Features

### 1. Grid / Gallery Mode

- **Spatial Navigation:** Browse through generated image cards seamlessly using your keyboard arrow keys (`↑`, `↓`, `←`, `→`). Combine with **`Shift`** to select ranges or **`Ctrl`** to shift focus without altering selections.
- **Search Navigation:** Type in the search bar and press **`Enter`** or **`Tab`** to complete the selected suggestion (or the first suggestion). While suggestions are open, **`↑` / `↓`** cycle through autocomplete results; otherwise, **`↑`** recalls previous searches and **`↓`** focuses the first matching image. In the grid, **`↑`** from its first row returns to search.
- **Selection & Batch Actions:** Use **`Ctrl + A`** to select everything currently filtered, or **`Ctrl + Space`** to toggle individual item selections.
- **File Management:** Instantly send unwanted outputs to the trash (`Delete`), download files locally (`D`), rename a selected image (`R`), or move selected images to an existing or newly created folder (`M`).
- **Workflow Recovery:** Select any image card and press **`W`** to extract and load its embedded workflow straight back into your ComfyUI workspace.

### 2. Full-Screen View & Zoom

- **Immersive Inspection:** Press **`Enter`** or **`Space`** on any highlighted card to enter full-screen mode, allowing you to cycle through batches using the left and right arrow keys.
- **Precision Zooming:** Zoom in or out smoothly using **`+`** / **`-`** keys, or snap right back to default dimensions with **`0`**.
- **Interface Controls:** Toggle the overlay HUD controls using **`Space`** or collapse/expand the metadata sidebar using **`T`**.

### 3. Metadata Extraction

- **Quick-Copy Fields:** Press any number key from **`1` to `9**` while viewing an image (in grid or full-screen mode) to instantly copy the 1st through 9th metadata field values to your clipboard.
- **Inspector:** Press **`I`** to open a detailed metadata inspector popup.

Use **Options → Sort By** to order images by server order, filename, modification time (**Older First** or **Newer First**).

## Keybindings Reference

| Operational Mode     | Key Combination                                | Action / Description                                                  |
| -------------------- | ---------------------------------------------- | --------------------------------------------------------------------- |
| **Global**           | **`Ctrl + Shift + ?`**                         | Open the browser interface and focus the search bar.                  |
| **Search**           | **`Enter` / `Tab`**                            | Complete the selected suggestion (or the first if none is selected).  |
|                      | **`ArrowUp` / `ArrowDown`** (suggestions open) | Cycle through autocomplete suggestions.                               |
|                      | **`ArrowDown`** (suggestions closed)           | Focus the first matching grid item.                                   |
|                      | **`ArrowUp`** (suggestions closed)             | Recall the previous search query.                                     |
|                      | **`ArrowUp`** (first grid row)                 | Return focus to the search bar.                                       |
| **Grid / Gallery**   | **`Escape`**                                   | Close modals, blur inputs, clear selections, or hide the browser.     |
|                      | **`1` – `9`**                                  | Copy the 1st through 9th metadata field value to the clipboard.       |
|                      | **`Ctrl + A` / `Meta + A`**                    | Select all filtered image cards.                                      |
|                      | **`Ctrl + Shift + S` / `Meta + Shift + S`**    | Sync outputs from server.                                             |
|                      | **`M`**                                        | Move selected item(s) to an existing or new folder.                    |
|                      | **`R`**                                        | Rename the selected image; enter a `/`-separated path to move it too. |
|                      | **`I`**                                        | Open the metadata inspector popup.                                    |
|                      | **`Enter` or `Space`**                         | Open full-screen view for the selected image.                         |
|                      | **`Ctrl + Space`**                             | Toggle selection state for the focused item.                          |
|                      | **`Delete`**                                   | Move selected item(s) to the trash.                                   |
|                      | **`D`**                                        | Download selected file(s).                                            |
|                      | **`W`**                                        | Load the embedded workflow into ComfyUI.                              |
|                      | **`Arrow Keys`**                               | Navigate the grid (hold **`Shift`** to select ranges).                |
| **Full-Screen View** | **`Escape`**                                   | Exit full-screen mode and return to the grid.                         |
|                      | **`ArrowLeft` / `ArrowRight`**                 | Navigate to the previous or next image in the batch.                  |
|                      | **`M` / `R`**                                  | Move the image to a folder / rename the image.                        |
|                      | **`Space`**                                    | Toggle overlay UI controls.                                           |
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
| **`[index]` / `[start:end]`** | **Result Range:** Applies to the matching results for its term; ranges on AND terms are intersected. Indexes are zero-based, can be negative (from the end), and slice bounds may be omitted. | `dog[-5:] cat[1]`, `tree[:8]`, `path:temp[-1]` |
| **`.` (Prefix)**              | **Force Show Hidden:** Temporarily overrides the hidden folder filter if the entire query starts with a dot.                                                                                  | `.drafts`, `. name:test`                       |
| **Combined**                  | Syntaxes can be chained to create complex queries.                                                                                                                                            | `prompt:"blue sky" !name:test, 1:sdxl`         |

Use **Options → Ignore Autocomplete Keywords...** to hide exact words from autocomplete suggestions. Enter one keyword per line or separate them with commas. Ignored words still work in filters; the list is empty by default because no workflow-independent terms can be safely assumed useless.

Autocomplete ranks matching keywords by how many images contain them. `name:` suggests filenames (not folder names), completing at most five characters beyond the typed prefix; `path:` suggests directories, with root folders before nested folders. Starting a new comma-separated filter group also opens suggestions for that group.

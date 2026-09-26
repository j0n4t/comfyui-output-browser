# ComfyUI Output Browser

Yet Another Output Image and Metadata Browser for ComfyUI, designed to help you organize generated images, inspect metadata, and instantly reload embedded node workflows.

## Core Operational Modes & Features

### 1. Grid / Gallery Mode

- **Spatial Navigation:** Browse through generated image cards seamlessly using your keyboard arrow keys (`↑`, `↓`, `←`, `→`). Combine with **`Shift`** to select ranges or **`Ctrl`** to shift focus without altering selections.
- **Selection & Batch Actions:** Use **`Ctrl + A`** to select everything currently filtered, or **`Ctrl + Space`** to toggle individual item selections.
- **File Management:** Instantly send unwanted outputs to the trash (`Delete`), download files locally (`D`), or rename/move items (`M` or `R`).
- **Workflow Recovery:** Select any image card and press **`W`** to extract and load its embedded workflow straight back into your ComfyUI workspace.

### 2. Full-Screen View & Zoom

- **Immersive Inspection:** Press **`Enter`** or **`Space`** on any highlighted card to enter full-screen mode, allowing you to cycle through batches using the left and right arrow keys.
- **Precision Zooming:** Zoom in or out smoothly using **`+`** / **`-`** keys, or snap right back to default dimensions with **`0`**.
- **Interface Controls:** Toggle the overlay HUD controls using **`Space`** or collapse/expand the metadata sidebar using **`T`**.

### 3. Metadata Extraction

- **Quick-Copy Fields:** Press any number key from **`1` to `9**` while viewing an image (in grid or full-screen mode) to instantly copy the 1st through 9th metadata field values to your clipboard.
- **Inspector:** Press **`I`** to open a detailed metadata inspector popup.

## Keybindings Reference

| Operational Mode     | Key Combination                | Action / Description                                              |
| -------------------- | ------------------------------ | ----------------------------------------------------------------- |
| **Global**           | **`Ctrl + E`**                 | Toggle the browser interface open or closed.                      |
| **Grid / Gallery**   | **`Escape`**                   | Close modals, blur inputs, clear selections, or hide the browser. |
|                      | **`1` – `9`**                  | Copy the 1st through 9th metadata field value to the clipboard.   |
|                      | **`Ctrl + A` / `Meta + A`**    | Select all filtered image cards.                                  |
|                      | **`M` or `R`**                 | Rename or move selected item(s).                                  |
|                      | **`I`**                        | Open the metadata inspector popup.                                |
|                      | **`Enter` or `Space`**         | Open full-screen view for the selected image.                     |
|                      | **`Ctrl + Space`**             | Toggle selection state for the focused item.                      |
|                      | **`Delete`**                   | Move selected item(s) to the trash.                               |
|                      | **`D`**                        | Download selected file(s).                                        |
|                      | **`W`**                        | Load the embedded workflow into ComfyUI.                          |
|                      | **`Arrow Keys`**               | Navigate the grid (hold **`Shift`** to select ranges).            |
| **Full-Screen View** | **`Escape`**                   | Exit full-screen mode and return to the grid.                     |
|                      | **`ArrowLeft` / `ArrowRight`** | Navigate to the previous or next image in the batch.              |
|                      | **`Space`**                    | Toggle overlay UI controls.                                       |
|                      | **`T`**                        | Collapse or expand the metadata sidebar.                          |
|                      | **`+` / `-` / `0`**            | Zoom In, Zoom Out, or Reset Zoom level.                           |

## Filter syntax

| Syntax / Feature     | Description                                                                                                         | Example                                |
| -------------------- | ------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| **`term1 term2`**    | **AND Logic (Space):** Matches items containing _all_ space-separated terms across general fields.                  | `cat tree`                             |
| **`term1, term2`**   | **OR Logic (Comma):** Matches items containing _any_ of the comma-separated groups.                                 | `cat, dog`                             |
| **`!term`**          | **NOT Logic:** Excludes items containing the term.                                                                  | `cat !dog`                             |
| **`"exact phrase"`** | **Exact Match:** Retains spaces to search for an exact, unbroken string.                                            | `"blue sky"`                           |
| **`key:value`**      | **Field Search:** Restricts the search to a specific field (`name`, `path`, `prompt`, `workflow`, or custom label). | `name:v1`, `prompt:"blue sky"`         |
| **`index:value`**    | **Index Search:** Restricts the search to a custom configured field by its numeric order (1-based).                 | `1:sdxl`, `2:1024`                     |
| **`.` (Prefix)**     | **Force Show Hidden:** Temporarily overrides the hidden folder filter if the entire query starts with a dot.        | `.drafts`, `. name:test`               |
| **Combined**         | Syntaxes can be chained to create complex queries.                                                                  | `prompt:"blue sky" !name:test, 1:sdxl` |

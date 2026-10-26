// @ts-ignore
import ICONS from "./assets/icons.js";

export default class CFOB_ImageActions {
  /** @param {import("./ComfyOutputBrowser.js").default} app */
  constructor(app) {
    this.app = app;
  }

  async downloadSelected() {
    const app = this.app;
    app.showToast(`Downloading ${app.selectedImages.size} image(s)...`);
    for (const filename of app.selectedImages) {
      const img = app.loadedImages.find(i => i.name === filename);
      if (img) {
        const a = document.createElement('a');
        a.href = img.url;
        a.download = img.name.split('/').pop() || "";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        // eslint-disable-next-line no-await-in-loop
        await new Promise(r => setTimeout(r, 250));
      }
    }
    app.selection.clearSelection();
  }

  async deleteSelected() {
    const app = this.app;
    const files = Array.from(app.selectedImages);
    if (!files.length) return;

    const hasTrashedItems = files.some(f => f.replace(/\\/g, '/').startsWith('.trash/'));
    const isTrash = hasTrashedItems;
    const confirmMsg = isTrash
      ? `Permanently delete at least one of ${files.length} selected image(s)? This cannot be undone.`
      : `Move ${files.length} selected image(s) to Trash?`;

    const confirmed = await app.settings.customConfirm(confirmMsg, isTrash ? "Delete Permanently" : "Move to Trash", isTrash);
    if (!confirmed) return;

    try {
      const res = await fetch("/comfyui-output-browser/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files })
      });
      const data = await res.json();

      const removed = [...(data.deleted || []), ...(data.trashed || [])];

      if (removed.length > 0) {
        app.loadedImages = app.loadedImages.filter(img => !removed.includes(img.name));

        for (const file of removed) {
          app.search.removeImageKeywords(file);
          // eslint-disable-next-line no-await-in-loop
          await app.api.cacheDelete(file);
        }

        app.selection.clearSelection();
        app.gallery.filterGallery();

        if (data.deleted && data.deleted.length > 0) {
          app.showToast(`Permanently deleted ${data.deleted.length} image(s)`);
        } else if (data.trashed && data.trashed.length > 0) {
          app.showToast(`Moved ${data.trashed.length} image(s) to Trash`);
        }
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
      app.showToast("Failed to delete/trash images.");
    }
  }

  async renameSelected() {
    const app = this.app;
    if (app.selectedImages.size !== 1) return;
    const oldName = Array.from(app.selectedImages)[0];
    const initialFilename = oldName.split(/\\|\//).pop() || oldName;
    const newName = await app.settings.customPrompt("Enter a new filename or path:", initialFilename, 'rename');
    if (!newName || newName === oldName || newName === initialFilename) return;

    try {
      const res = await fetch("/comfyui-output-browser/rename", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ old_name: oldName, new_name: newName })
      });
      const data = await res.json();

      if (data.success) {
        const img = app.loadedImages.find(i => i.name === oldName);
        if (img) {
          app.search.removeImageKeywords(oldName);
          img.name = data.new_name;
          img.mtime = data.mtime || img.mtime;
          img.url = app.api.getImageUrl(data.new_name) + (img.mtime ? `&t=${img.mtime}` : '');
          app.search.indexImageKeywords(img);
          const meta = await app.api.cacheGet(oldName);
          if (meta) {
            await app.api.cacheSet(data.new_name, meta, img.mtime);
            await app.api.cacheDelete(oldName);
          }
        }
        app.selection.clearSelection();
        app.gallery.filterGallery();
        app.showToast(`Renamed to ${data.new_name}`);
      } else {
        app.showToast(data.error || "Rename failed.");
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
      app.showToast("Rename request failed.");
    }
  }

  async moveSelected() {
    const app = this.app;
    const files = Array.from(app.selectedImages);
    if (!files.length) return;

    const destFolder = await app.settings.customPrompt(`Move ${files.length} item(s) to folder:`, "", 'move');
    if (destFolder === null) return;

    try {
      const res = await fetch("/comfyui-output-browser/move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files, dest_folder: destFolder })
      });
      const data = await res.json();

      if (data.success) {
        for (const moved of data.moved) {
          const img = app.loadedImages.find(i => i.name === moved.old_name);
          if (!img) continue;
          app.search.removeImageKeywords(moved.old_name);
          img.name = moved.new_name;
          img.mtime = moved.mtime || img.mtime;
          img.url = app.api.getImageUrl(moved.new_name) + (img.mtime ? `&t=${img.mtime}` : '');
          app.search.indexImageKeywords(img);
          // eslint-disable-next-line no-await-in-loop
          const meta = await app.api.cacheGet(moved.old_name);
          if (meta) {
            // eslint-disable-next-line no-await-in-loop
            await app.api.cacheSet(moved.new_name, meta, img.mtime);
            // eslint-disable-next-line no-await-in-loop
            await app.api.cacheDelete(moved.old_name);
          }
        }
        app.selection.clearSelection();
        app.gallery.filterGallery();
        if (data.errors && data.errors.length > 0) {
          app.showToast(`Moved ${data.moved.length}, but ${data.errors.length} failed.`);
          // eslint-disable-next-line no-console
          console.warn("Move errors:", data.errors);
        } else {
          app.showToast(`Moved ${data.moved.length} item(s) to ${destFolder || "root"}`);
        }
      } else {
        app.showToast(data.error || "Move failed.");
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
      app.showToast("Move request failed.");
    }
  }

  inspectSelected() {
    const app = this.app;
    if (app.selectedImages.size !== 1) return;
    const filename = Array.from(app.selectedImages)[0];
    const idx = app.loadedImages.findIndex(i => i.name === filename);
    if (idx !== -1) {
      app.settings.openInspector(idx);
    }
  }

  /** @param {CFOB_Image} img */
  async loadWorkflowImage(img) {
    const app = this.app;
    if (!img || !app.root) return;

    // Check if running in standalone mode by verifying the global ComfyUI app context
    // @ts-ignore
    if (!window.app || typeof window.app.loadGraphData !== 'function') {
      app.showToast("Load Workflow is disabled in standalone mode.");
      return;
    }

    if (!img.isParsed) {
      app.showToast("Loading metadata...");
      await app.api.loadMetadata(img);
    }
    if (img.workflow) {
      // @ts-ignore
      window.app.loadGraphData(img.workflow);
      app.hideWithTransition();
      app.selection.clearSelection();
      app.showToast("Workflow loaded successfully!");
    } else {
      app.showToast("No workflow metadata found in this image.");
    }
  }

  async loadWorkflowSelected() {
    const app = this.app;
    if (app.selectedImages.size !== 1) return;
    const filename = Array.from(app.selectedImages)[0];
    const img = app.loadedImages.find(i => i.name === filename);
    if (img) await this.loadWorkflowImage(img);
  }

  /**
   * @param {{ label: string, paths: string } | null} fieldConfig
   * @param {HTMLElement | null} anchorEl
   * @param {string[] | null} images
   */
  async sendChipsToBasket(fieldConfig = null, anchorEl = null, images = null) {
    const app = this.app;
    const targetImages = images || Array.from(app.selectedImages);
    if (targetImages.length !== 1) return;

    if (!fieldConfig) {
      // Anchor on the image, not on the button: `b` in the grid has no button under the
      // pointer, and the full view's Chips button sits in the sidebar, away from the
      // picture the field choice is about.
      const btn = /** @type {HTMLElement | null} */ (anchorEl || this._chipsAnchor());
      if (btn) this.showFieldPicker(btn, images);
      return;
    }

    const chips = [];
    for (const filename of targetImages) {
      const img = app.loadedImages.find(i => i.name === filename);
      if (!img) continue;

      if (!img.isParsed) {
        app.showToast("Loading metadata...");
        // eslint-disable-next-line no-await-in-loop
        await app.api.loadMetadata(img);
      }

      const chipsValue = app.resolveFieldValue(img, fieldConfig.paths);
      if (chipsValue) {
        const parsed = Array.isArray(chipsValue)
          ? chipsValue
          : String(chipsValue).split(/[,\n]+/).map(s => s.trim()).filter(Boolean);
        chips.push(...parsed);
      }
    }

    if (chips.length === 0) {
      app.showToast("No chips found in selected value.");
      return;
    }

    const pgNode = this._findPresetGalleryNode();
    if (!pgNode) {
      app.showToast("No Preset Gallery node found in the graph.");
      return;
    }

    pgNode.dispatchEvent(new CustomEvent("preset-gallery:add-chips-to-new-tab", {
      detail: { chips }
    }));

    app.showToast(`Sent ${chips.length} chip(s) to Preset Gallery.`);
    app.selection.clearSelection();
  }

  /**
   * The element a chips popover should sit by: the image it is about. In full view that
   * is the picture on screen; in the grid it is the focused card, since the picture and
   * the card are the same thing to the user and the card is what they clicked.
   * @returns {HTMLElement | null}
   */
  _chipsAnchor() {
    const app = this.app;
    if (app.$("cfobFullViewModal")?.classList.contains('active')) {
      return app.$("cfobFullViewImg");
    }
    const cards = app.gallery.getOrderedCards();
    return cards[app.lastSelectedIdx] || app.$("cfobActionSendChips");
  }

  /**
   * Shows a popover menu to pick which custom field to use for chips.
   *
   * The popover is anchored to the image the chips come from and placed *beside* it —
   * never centred over it, because a centred menu covers the picture the choice is
   * about. When there is no room beside it (a grid card's preview is narrower than the
   * menu, and the full-view picture can be too), it drops below instead.
   *
   * @param {HTMLElement | null} anchorEl
   * @param {string[] | null} images
   */
  showFieldPicker(anchorEl, images = null) {
    const app = this.app;
    // Remember who owned focus, so dismissing the picker can give it back.
    const previousFocus = /** @type {HTMLElement | null} */ (document.activeElement);
    if (app.settings.activePopover) app.settings.activePopover.remove();

    const rect = anchorEl?.getBoundingClientRect();
    const menu = document.createElement("div");
    menu.className = "popover-menu";
    // A focusable container, so the arrow keys can move between the fields and Enter
    // picks one — the picker is a choice, not a click target.
    menu.tabIndex = -1;

    let html = `<div class="popover-header">Send Chips From Field:</div>`;
    app.settings.fieldConfigs.forEach((/** @type {CFOB_CardFieldSettings} */ cfg, /** @type {number} */ i) => {
      html += `<button class="popover-item" data-idx="${i}"><span>${app.escapeHtml(cfg.label)}</span></button>`;
    });

    menu.innerHTML = html;
    app.root?.appendChild(menu);

    const menuHeight = menu.offsetHeight;
    const menuWidth = menu.offsetWidth;
    const gap = 8;
    const anchorLeft = rect?.left ?? 0;
    const anchorRight = rect?.right ?? 0;
    const anchorTop = rect?.top ?? 0;
    const anchorBottom = rect?.bottom ?? 0;
    const anchorWidth = rect?.width ?? 0;
    const anchorHeight = rect?.height ?? 0;

    // The popover is `position: fixed` inside #cfob-root, so its coordinates are viewport
    // coordinates — but the root itself may be offset from the viewport (a panel docked
    // to one side, or a floating launcher). Measure the root's box and clamp against
    // what the root can actually show, so the menu is fully visible wherever it lives.
    const rootRect = app.root?.getBoundingClientRect();
    const rootLeft = rootRect?.left ?? 0;
    const rootTop = rootRect?.top ?? 0;
    const rootRight = rootRect?.right ?? window.innerWidth;
    const rootBottom = rootRect?.bottom ?? window.innerHeight;
    /** @param {number} v @param {number} size @param {number} min @param {number} max */
    const clampIn = (v, size, min, max) => Math.max(min + gap, Math.min(v, max - size - gap));

    // Horizontal: centred on the anchor is the preference (covering it a little is fine),
    // then beside it on either side, then clamped inside the root. Fully visible wins,
    // and when neither centring nor sitting beside fits, sitting beside still beats
    // overlapping the anchor: a menu on top of the picture hides the thing the choice
    // is about.
    const centreLeft = anchorLeft + (anchorWidth - menuWidth) / 2;
    const besideRight = anchorRight + gap;
    const besideLeft = anchorLeft - menuWidth - gap;
    if (centreLeft >= rootLeft + gap && centreLeft + menuWidth <= rootRight - gap) {
      menu.style.left = `${centreLeft}px`;
    } else if (besideRight + menuWidth <= rootRight - gap) {
      menu.style.left = `${besideRight}px`;
    } else if (besideLeft >= rootLeft + gap) {
      menu.style.left = `${besideLeft}px`;
    } else {
      // Neither centring nor sitting beside fits. Slide the centred position as far as
      // needed to stop overlapping the anchor, then clamp into the root. Keeping the
      // centred position instead is what made a narrow picture get a menu on top of it.
      const slideLeft = Math.min(centreLeft, besideLeft);
      const slideRight = Math.max(centreLeft, besideRight);
      const fitsLeft = slideLeft >= rootLeft + gap && slideLeft + menuWidth <= rootRight - gap;
      const fitsRight = slideRight >= rootLeft + gap && slideRight + menuWidth <= rootRight - gap;
      if (fitsLeft && (!fitsRight || Math.abs(slideLeft - centreLeft) <= Math.abs(slideRight - centreLeft))) {
        menu.style.left = `${slideLeft}px`;
      } else if (fitsRight) {
        menu.style.left = `${slideRight}px`;
      } else {
        menu.style.left = `${clampIn(centreLeft, menuWidth, rootLeft, rootRight)}px`;
      }
    }

    // Vertical, the same rules.
    const centreTop = anchorTop + (anchorHeight - menuHeight) / 2;
    const belowTop = anchorBottom + gap;
    const aboveTop = anchorTop - menuHeight - gap;
    if (centreTop >= rootTop + gap && centreTop + menuHeight <= rootBottom - gap) {
      menu.style.top = `${centreTop}px`;
    } else if (belowTop + menuHeight <= rootBottom - gap) {
      menu.style.top = `${belowTop}px`;
    } else if (aboveTop >= rootTop + gap) {
      menu.style.top = `${aboveTop}px`;
    } else {
      menu.style.top = `${clampIn(centreTop, menuHeight, rootTop, rootBottom)}px`;
    }

    app.settings.activePopover = menu;
    app.settings.popoverReturnFocus = previousFocus;
    /** Dismisses the picker and hands focus back to whoever had it. */
    const closePicker = () => app.settings.dismissPopover();

    menu.querySelectorAll(".popover-item").forEach(b => {
      b.addEventListener("click", () => {
        const field = app.settings.fieldConfigs[Number(/** @type {HTMLElement} */ (b).dataset.idx)];
        closePicker();
        if (field) this.sendChipsToBasket(field, null, images);
      });
    });

    /** @param {KeyboardEvent} e */
    menu.addEventListener("keydown", (e) => {
      const items = /** @type {HTMLElement[]} */ (Array.from(menu.querySelectorAll(".popover-item")));
      const current = items.indexOf(/** @type {HTMLElement} */ (document.activeElement));
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        closePicker();
      } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        e.stopPropagation();
        const next = e.key === "ArrowDown"
          ? (current + 1) % items.length
          : (current <= 0 ? items.length : current) - 1;
        items[next]?.focus();
      } else if ((e.key === "Enter" || e.key === " ") && current >= 0) {
        e.preventDefault();
        e.stopPropagation();
        items[current].click();
      }
    });

    // The first field is the default; focusing the menu body would leave focus on a
    // non-interactive element, so the choice itself is focused.
    (/** @type {HTMLElement} */ (menu.querySelector(".popover-item")) ?? menu).focus();
  }

  _findPresetGalleryNode() {
    return document.querySelector('.j0n4t-pg-basket-container');
  }

  /**
   * @param {HTMLElement | null} btn
   * @param {any} encodedVal
   */
  copyValue(btn, encodedVal) {
    if (!btn) return;
    const val = decodeURIComponent(encodedVal || "");
    navigator.clipboard.writeText(val).then(() => {
      const origHtml = btn.innerHTML;
      btn.innerHTML = ICONS.check;
      setTimeout(() => { btn.innerHTML = origHtml; }, 1200);
    });
  }
}
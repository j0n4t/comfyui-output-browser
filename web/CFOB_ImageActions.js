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
          const meta = await app.api.cacheGet(moved.old_name);
          if (meta) {
            await app.api.cacheSet(moved.new_name, meta, img.mtime);
            await app.api.cacheDelete(moved.old_name);
          }
        }
        app.selection.clearSelection();
        app.gallery.filterGallery();
        if (data.errors && data.errors.length > 0) {
          app.showToast(`Moved ${data.moved.length}, but ${data.errors.length} failed.`);
          console.warn("Move errors:", data.errors);
        } else {
          app.showToast(`Moved ${data.moved.length} item(s) to ${destFolder || "root"}`);
        }
      } else {
        app.showToast(data.error || "Move failed.");
      }
    } catch (e) {
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
      const btn = anchorEl || app.$("cfobActionSendChips");
      if (btn) this.showFieldPicker(btn, images);
      return;
    }

    const chips = [];
    for (const filename of targetImages) {
      const img = app.loadedImages.find(i => i.name === filename);
      if (!img) continue;

      if (!img.isParsed) {
        app.showToast("Loading metadata...");
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
   * Shows a popover menu to pick which custom field to use for chips.
   * @param {HTMLElement} anchorEl
   * @param {string[] | null} images
   */
  showFieldPicker(anchorEl, images = null) {
    const app = this.app;
    if (app.settings.activePopover) app.settings.activePopover.remove();

    const rect = anchorEl.getBoundingClientRect();
    const menu = document.createElement("div");
    menu.className = "popover-menu";
    menu.style.left = `${Math.min(rect.left, window.innerWidth - 220)}px`;

    let html = `<div class="popover-header">Send Chips From Field:</div>`;
    app.settings.fieldConfigs.forEach((cfg, i) => {
      html += `<button class="popover-item" data-idx="${i}"><span>${app.escapeHtml(cfg.label)}</span></button>`;
    });

    menu.innerHTML = html;
    app.root?.appendChild(menu);

    const menuHeight = menu.offsetHeight;
    const spaceBelow = window.innerHeight - rect.bottom;
    if (spaceBelow < menuHeight + 8) {
      menu.style.top = `${Math.max(4, rect.top - menuHeight - 4)}px`;
    } else {
      menu.style.top = `${rect.bottom + 4}px`;
    }
    app.settings.activePopover = menu;

    menu.querySelectorAll(".popover-item").forEach(b => {
      b.addEventListener("click", () => {
        const field = app.settings.fieldConfigs[/** @type {HTMLElement} */ (b).dataset.idx];
        app.settings.activePopover?.remove();
        app.settings.activePopover = null;
        if (field) this.sendChipsToBasket(field, null, images);
      });
    });
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
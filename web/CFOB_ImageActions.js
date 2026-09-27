// @ts-ignore
import { app as comfyApp } from "../../scripts/app.js";
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
    if (!img.isParsed) {
      app.showToast("Loading metadata...");
      await app.api.loadMetadata(img);
    }
    if (img.workflow) {
      comfyApp.loadGraphData(img.workflow);
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

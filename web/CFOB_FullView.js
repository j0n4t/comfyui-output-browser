import ICONS from "./assets/icons.js";

export const CFOB_FULL_VIEW_HTML = `
  <div class="modal-overlay" id="cfobFullViewModal">
    <div class="full-view-layout">
      <div class="full-view-main" tabindex="-1">
        <div class="full-view-top-bar">
          <button class="full-view-count" id="cfobFullViewCount" type="button" title="Go to image number">1 / 10</button>
          <div style="display: flex; gap: 0.5em; align-items: center;">
            <button class="icon-btn" id="cfobZoomInBtn" title="Zoom In">${ICONS.zoomIn}</button>
            <button class="icon-btn" id="cfobZoomOutBtn" title="Zoom Out">${ICONS.zoomOut}</button>
            <button class="icon-btn" id="cfobZoomResetBtn" title="Reset Zoom">${ICONS.zoomReset}</button>
            <div style="width: 1px; height: 1.25em; background: var(--color-border); margin: 0 0.25em;"></div>
            <button class="icon-btn" id="cfobToggleSidebarBtn" title="Cycle details pane position (T)" aria-label="Cycle details pane position (T)">${ICONS.pane}</button>
            <button class="icon-btn" id="cfobCloseFullViewBtn" title="Close (Esc)">${ICONS.close}</button>
          </div>
        </div>
        <button class="nav-btn prev-btn" id="cfobPrevImgBtn" title="Previous (Left Arrow)">❮</button>
        <img id="cfobFullViewImg" src="" alt="Full View">
        <button class="nav-btn next-btn" id="cfobNextImgBtn" title="Next (Right Arrow)">❯</button>
      </div>
      <div class="full-view-sidebar-resizer" id="cfobFullViewSidebarResizer" role="separator" aria-label="Resize details pane" aria-orientation="vertical" aria-valuemin="240" aria-valuemax="1200" tabindex="0"></div>
      <div class="full-view-sidebar" id="cfobFullViewSidebar">
        <div class="sidebar-header"><h4 id="cfobFullViewTitle" style="margin: 0; font-size: 0.875em; color: var(--color-text-inverse); word-break: break-all;">Filename.png</h4></div>
        <div class="sidebar-body" id="cfobFullViewFields"></div>
        <div class="sidebar-footer">
          <div class="full-view-actions" id="cfobFullViewActions">
            <button class="btn btn-primary" id="cfobFVActionOpen">${ICONS.workflow}<span>Workflow</span></button>
            <button class="btn" id="cfobFVActionInspect">${ICONS.inspect}<span>Inspect</span></button>
            <button class="btn" id="cfobFVActionDownload">${ICONS.download}<span>Download</span></button>
            <button class="btn" id="cfobFVActionRename">${ICONS.move}<span>Move/Rename</span></button>
            <button class="btn btn-danger" id="cfobFVActionDelete">${ICONS.trash}<span>Delete</span></button>
          </div>
        </div>
      </div>
    </div>
  </div>
`;

export const CFOB_FULL_VIEW_STYLES = /*css*/ `
  #cfob-root #fullViewModal { padding: 0; z-index: var(--z-full-view); }
  #cfob-root .full-view-layout { display: flex; width: 100vw; height: 100vh; background: var(--color-bg-full); }
  #cfob-root .full-view-layout .field-value { max-height: 100%; resize: vertical; }

  #cfob-root .full-view-main { flex: 1; position: relative; display: flex; justify-content: center; align-items: center; overflow: hidden; }
  #cfob-root .full-view-main:focus { outline: none; }
  #cfob-root .full-view-main img { max-width: 100%; max-height: 100%; object-fit: contain; }

  #cfob-root .full-view-top-bar {
    position: absolute; top: 0; left: 0; right: 0;
    padding: 0.9375em 1.5625em;
    background: linear-gradient(rgba(0,0,0,0.8), transparent);
    display: flex; justify-content: space-between; align-items: center;
    color: var(--color-text-inverse); z-index: 10;
  }
  #cfob-root .full-view-count { padding: 0; border: 0; background: transparent; color: inherit; font: inherit; font-weight: 600; font-size: 0.875em; cursor: pointer; }
  #cfob-root .full-view-count:hover { text-decoration: underline; }
  #cfob-root .full-view-count:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 3px; }

  #cfob-root .full-view-actions { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5em; width: 100%; }
  #cfob-root .full-view-actions .btn { justify-content: center; font-size: 0.6875em; padding: 0.375em 0.5em; }

  #cfob-root .nav-btn { position: absolute; top: 50%; transform: translateY(-50%); background: rgba(0,0,0,0.4); color: white; border: none; padding: 1.25em 0.9375em; cursor: pointer; font-size: 1.5em; transition: 0.2s; z-index: 10; }
  #cfob-root .nav-btn:hover { background: rgba(0,0,0,0.9); }
  #cfob-root .prev-btn { left: 0; border-radius: 0 var(--radius-md) var(--radius-md) 0; }
  #cfob-root .next-btn { right: 0; border-radius: var(--radius-md) 0 0 var(--radius-md); }

  #cfob-root .full-view-sidebar-resizer { flex: 0 0 7px; position: relative; cursor: col-resize; touch-action: none; z-index: 1; }
  #cfob-root .full-view-sidebar-resizer::after { content: ""; position: absolute; inset: 0 2px; background: var(--color-border); opacity: 0; transition: opacity 0.15s; }
  #cfob-root .full-view-sidebar-resizer:hover::after,
  #cfob-root .full-view-sidebar-resizer:focus-visible::after,
  #cfob-root .full-view-layout.resizing-sidebar .full-view-sidebar-resizer::after { opacity: 1; }
  #cfob-root .full-view-sidebar { width: var(--full-view-sidebar-width, 360px); min-width: 0; flex: 0 0 auto; background: var(--color-bg-panel); border-left: 1px solid var(--color-border); display: flex; flex-direction: column; transition: all 0.3s; overflow: hidden; }
  #cfob-root .full-view-sidebar-resizer.hidden { display: none; }
  #cfob-root .full-view-layout.resizing-sidebar .full-view-sidebar { transition: none; }
  #cfob-root .full-view-layout.sidebar-below { flex-direction: column; }
  #cfob-root .full-view-layout.sidebar-below .full-view-main { min-height: 0; }
  #cfob-root .full-view-layout.sidebar-below .full-view-sidebar { width: 100%; height: var(--full-view-sidebar-height, 50vh); border-left: none; border-top: 1px solid var(--color-border); }
  #cfob-root .full-view-layout.sidebar-below .full-view-sidebar-resizer { flex-basis: 7px; width: 100%; cursor: row-resize; }
  #cfob-root .full-view-layout.sidebar-below .full-view-sidebar-resizer::after { inset: 2px 0; }
  #cfob-root .full-view-layout.sidebar-hidden .full-view-sidebar,
  #cfob-root .full-view-layout.sidebar-hidden .full-view-sidebar-resizer { display: none; }

  #cfob-root .sidebar-header, #cfob-root .sidebar-footer { padding: 0.9375em 1.25em; background: var(--color-bg-header); }
  #cfob-root .sidebar-header { border-bottom: 1px solid var(--color-border); }
  #cfob-root .sidebar-footer { border-top: 1px solid var(--color-border); }
  #cfob-root .sidebar-body { padding: 1.25em; flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 0.75em; }

  /* Floating Launcher Button */
  #cfob-launcher-btn.floating { position: fixed; top: 0.25em; right: 2.8125em; z-index: 9998; background: var(--color-bg-panel); color: var(--color-text-inverse); border: 1px solid var(--color-border); border-radius: var(--radius-lg); width: 1.5em; height: 1.5em; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 0.25em 0.75em rgba(0,0,0,0.4); }
  #cfob-launcher-btn.floating:hover { background: var(--color-border); }

  /* UI Hidden State */
  #cfob-root .full-view-layout.ui-hidden .full-view-top-bar,
  #cfob-root .full-view-layout.ui-hidden .nav-btn {
    opacity: 0; pointer-events: none;
  }

  #cfob-root .full-view-layout .full-view-top-bar,
  #cfob-root .full-view-layout .nav-btn,
  #cfob-root .full-view-layout .full-view-sidebar {
    transition: opacity 0.2s ease, width 0.3s;
  }

  /* Image Pan/Zoom States */
  #cfob-root .full-view-main img {
    max-width: 100%; max-height: 100%; object-fit: contain;
    transition: transform 0.1s ease-out; transform-origin: center; cursor: grab;
  }

  #cfob-root .full-view-main img.dragging {
    transition: none; cursor: grabbing;
  }
`;

export default class CFOB_FullView {
  /** @param {import("./ComfyOutputBrowser.js").default} app  */
  constructor(app) {
    this.app = app;
    this.fvZoom = 1;
    this.fvPanX = 0;
    this.fvPanY = 0;
    this.fvIsDragging = false;
    this.fvStartX = 0;
    this.fvStartY = 0;
    this.fvHasDragged = false;
    this.currentImageIndex = 0;
    const savedSidebarWidth = Number(localStorage.getItem('cfob_full_view_sidebar_width'));
    const savedSidebarHeight = Number(localStorage.getItem('cfob_full_view_sidebar_height'));
    const savedSidebarMode = localStorage.getItem('cfob_full_view_sidebar_mode');
    /** @type {'side' | 'below' | 'hidden'} */
    this.sidebarMode = savedSidebarMode === 'side' || savedSidebarMode === 'below' || savedSidebarMode === 'hidden'
      ? savedSidebarMode
      : (window.matchMedia('(max-width: 768px)').matches ? 'below' : 'side');
    this.sidebarWidth = Number.isFinite(savedSidebarWidth) && savedSidebarWidth > 0 ? savedSidebarWidth : 360;
    this.sidebarHeight = Number.isFinite(savedSidebarHeight) && savedSidebarHeight > 0 ? savedSidebarHeight : window.innerHeight / 2;
    /** @type {HTMLElement | null} */
    this.returnFocusElement = null;
  }

  bindEvents() {
    this.app.$("cfobFullViewFields").addEventListener('click', (e) => {
      /** @type {HTMLElement | null} */
      const btn = /** @type {HTMLElement} */ (e.target).closest('.copy-val-btn');
      if (btn) {
        e.stopPropagation();
        this.app.actions.copyValue(btn, btn.dataset.val);
      }
    });
    this.app.$("cfobCloseFullViewBtn").addEventListener('click', () => this.closeFullView());
    this.app.$("cfobFullViewCount").addEventListener('click', () => this.goToImageNumber());
    const layout = /** @type {HTMLElement} */ (this.app.root?.querySelector('.full-view-layout'));
    const sidebarResizer = this.app.$("cfobFullViewSidebarResizer");
    this.applySidebarSize();
    this.applySidebarMode();
    this.app.$("cfobToggleSidebarBtn").addEventListener('click', () => this.cycleSidebarMode());
    let resizeStart = 0;
    let resizeSize = 0;
    let resizeIsVertical = false;
    sidebarResizer.addEventListener('pointerdown', (e) => {
      resizeIsVertical = this.sidebarMode === 'below';
      resizeStart = resizeIsVertical ? e.clientY : e.clientX;
      resizeSize = resizeIsVertical ? this.sidebarHeight : this.sidebarWidth;
      layout.classList.add('resizing-sidebar');
      document.body.style.userSelect = 'none';
      sidebarResizer.setPointerCapture(e.pointerId);
      e.preventDefault();
    });
    sidebarResizer.addEventListener('pointermove', (e) => {
      if (!sidebarResizer.hasPointerCapture(e.pointerId)) return;
      const position = resizeIsVertical ? e.clientY : e.clientX;
      if (resizeIsVertical) {
        this.sidebarHeight = this.clampSidebarSize(resizeSize - (position - resizeStart), 140, window.innerHeight - 260);
      } else {
        this.sidebarWidth = this.clampSidebarSize(resizeSize - (position - resizeStart), 240, window.innerWidth - 300);
      }
      this.applySidebarSize();
    });
    /** @param {PointerEvent} e */
    const finishSidebarResize = (e) => {
      if (!sidebarResizer.hasPointerCapture(e.pointerId)) return;
      sidebarResizer.releasePointerCapture(e.pointerId);
      layout.classList.remove('resizing-sidebar');
      document.body.style.userSelect = '';
      localStorage.setItem('cfob_full_view_sidebar_width', String(this.sidebarWidth));
      localStorage.setItem('cfob_full_view_sidebar_height', String(this.sidebarHeight));
    };
    sidebarResizer.addEventListener('pointerup', finishSidebarResize);
    sidebarResizer.addEventListener('pointercancel', finishSidebarResize);
    sidebarResizer.addEventListener('keydown', (e) => {
      const vertical = this.sidebarMode === 'below';
      const delta = e.shiftKey ? 40 : 10;
      const change = vertical
        ? (e.key === 'ArrowUp' ? delta : e.key === 'ArrowDown' ? -delta : 0)
        : (e.key === 'ArrowLeft' ? delta : e.key === 'ArrowRight' ? -delta : 0);
      if (!change) return;
      e.preventDefault();
      if (vertical) {
        this.sidebarHeight = this.clampSidebarSize(this.sidebarHeight + change, 140, window.innerHeight - 260);
      } else {
        this.sidebarWidth = this.clampSidebarSize(this.sidebarWidth + change, 240, window.innerWidth - 300);
      }
      this.applySidebarSize();
      localStorage.setItem('cfob_full_view_sidebar_width', String(this.sidebarWidth));
      localStorage.setItem('cfob_full_view_sidebar_height', String(this.sidebarHeight));
    });
    window.addEventListener('resize', () => this.applySidebarSize());
    this.app.$("cfobPrevImgBtn").addEventListener('click', () => this.navigateImage(-1));
    this.app.$("cfobNextImgBtn").addEventListener('click', () => this.navigateImage(1));

    let touchStartX = 0;
    let touchEndX = 0;
    const fvModal = this.app.$("cfobFullViewModal");
    const fvMain = /** @type {HTMLElement} */ (this.app.root?.querySelector('.full-view-main'));

    fvMain.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    fvMain.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;

      if (fvModal.classList.contains('active')) {
        const swipeDistance = touchStartX - touchEndX;
        const minSwipeDistance = 50;

        if (swipeDistance > minSwipeDistance) {
          this.navigateImage(1);
        } else if (swipeDistance < -minSwipeDistance) {
          this.navigateImage(-1);
        }
      }
    }, { passive: true });

    // Zoom Buttons
    this.app.$("cfobZoomInBtn").addEventListener('click', () => this.setFullViewZoom(this.fvZoom * 1.1));
    this.app.$("cfobZoomOutBtn").addEventListener('click', () => this.setFullViewZoom(this.fvZoom / 1.1));
    this.app.$("cfobZoomResetBtn").addEventListener('click', () => this.resetFullViewTransform());

    this.app.$("cfobCloseFullViewBtn").addEventListener('click', () => this.resetFullViewTransform());

    const fvImg = this.app.$("cfobFullViewImg");

    // Pan & Click-to-hide Logic
    fvImg.addEventListener('mousedown', (e) => {
      this.fvIsDragging = true;
      this.fvHasDragged = false;
      this.fvStartX = e.clientX - this.fvPanX;
      this.fvStartY = e.clientY - this.fvPanY;
      fvImg.classList.add('dragging');
      e.preventDefault();
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.fvIsDragging) return;
      const newX = e.clientX - this.fvStartX;
      const newY = e.clientY - this.fvStartY;

      if (Math.abs(newX - this.fvPanX) > 3 || Math.abs(newY - this.fvPanY) > 3) {
        this.fvHasDragged = true;
      }

      this.fvPanX = newX;
      this.fvPanY = newY;
      this.updateFullViewTransform(false);
    });

    window.addEventListener('mouseup', (e) => {
      if (this.fvIsDragging) {
        this.fvIsDragging = false;
        fvImg.classList.remove('dragging');

        if (!this.fvHasDragged && e.target === fvImg) {
          this.toggleFullViewUI();
        }
      }
    });

    // Mouse Wheel Zoom Support
    fvMain.addEventListener('wheel', (e) => {
      if (!this.app.$("cfobFullViewModal").classList.contains('active')) return;
      e.preventDefault();
      this.setFullViewZoom(this.fvZoom * (e.deltaY > 0 ? 0.9 : 1.1));
    }, { passive: false });

    this.app.$("cfobFVActionOpen").addEventListener('click', () => {
      const img = this.app.filteredImages[this.currentImageIndex];
      if (img) this.app.actions.loadWorkflowImage(img);
    });
    this.app.$("cfobFVActionInspect").addEventListener('click', () => {
      const img = this.app.filteredImages[this.currentImageIndex];
      if (img) {
        this.closeFullView();
        this.app.settings.openInspector(this.app.loadedImages.indexOf(img));
      }
    });
    this.app.$("cfobFVActionDownload").addEventListener('click', () => {
      const img = this.app.filteredImages[this.currentImageIndex];
      if (img) {
        const a = document.createElement('a');
        a.href = img.url;
        a.download = img.name.split('/').pop() || "";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    });
    this.app.$("cfobFVActionRename").addEventListener('click', () => this.renameFullViewImage());
    this.app.$("cfobFVActionDelete").addEventListener('click', () => this.deleteFullViewImage());

  }

  /** @param {number} value @param {number} min @param {number} max */
  clampSidebarSize(value, min, max) {
    return Math.max(min, Math.min(value, Math.max(min, max)));
  }

  applySidebarSize() {
    const sidebar = this.app.$("cfobFullViewSidebar");
    const isVertical = this.sidebarMode === 'below';
    if (isVertical) {
      this.sidebarHeight = this.clampSidebarSize(this.sidebarHeight, 140, window.innerHeight - 260);
    } else {
      this.sidebarWidth = this.clampSidebarSize(this.sidebarWidth, 240, window.innerWidth - 300);
    }
    sidebar.style.setProperty('--full-view-sidebar-width', `${this.sidebarWidth}px`);
    sidebar.style.setProperty('--full-view-sidebar-height', `${this.sidebarHeight}px`);
    const resizer = this.app.$("cfobFullViewSidebarResizer");
    resizer.setAttribute('aria-orientation', isVertical ? 'horizontal' : 'vertical');
    resizer.setAttribute('aria-valuemin', String(isVertical ? 140 : 240));
    resizer.setAttribute('aria-valuemax', String(Math.max(
      isVertical ? 140 : 240,
      isVertical ? window.innerHeight - 260 : window.innerWidth - 300
    )));
    resizer.setAttribute('aria-valuenow', String(Math.round(isVertical ? this.sidebarHeight : this.sidebarWidth)));
  }

  applySidebarMode() {
    const layout = /** @type {HTMLElement} */ (this.app.root?.querySelector('.full-view-layout'));
    const sidebarResizer = this.app.$("cfobFullViewSidebarResizer");
    layout.classList.toggle('sidebar-side', this.sidebarMode === 'side');
    layout.classList.toggle('sidebar-below', this.sidebarMode === 'below');
    layout.classList.toggle('sidebar-hidden', this.sidebarMode === 'hidden');
    sidebarResizer.setAttribute('aria-hidden', String(this.sidebarMode === 'hidden'));
    const button = this.app.$("cfobToggleSidebarBtn");
    const nextMode = this.sidebarMode === 'side' ? 'below' : this.sidebarMode === 'below' ? 'hidden' : 'side';
    /** @type {Record<'side' | 'below' | 'hidden', string>} */
    const descriptions = { side: 'on the side', below: 'below', hidden: 'hidden' };
    button.title = `Details pane ${descriptions[this.sidebarMode]}. Activate to show ${descriptions[nextMode]} (T)`;
    button.setAttribute('aria-label', button.title);
  }

  cycleSidebarMode() {
    this.sidebarMode = this.sidebarMode === 'side' ? 'below' : this.sidebarMode === 'below' ? 'hidden' : 'side';
    this.applySidebarMode();
    this.applySidebarSize();
    localStorage.setItem('cfob_full_view_sidebar_mode', this.sidebarMode);
  }

  async renameFullViewImage() {
    const img = this.app.filteredImages[this.currentImageIndex];
    if (!img) return;
    const oldIndex = this.currentImageIndex;
    let newName = await this.app.settings.customPrompt("Enter new path or filename:", img.name, 'rename');
    if (!newName || newName === img.name) return;

    try {
      const res = await fetch("/comfyui-output-browser/rename", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ old_name: img.name, new_name: newName })
      });
      const data = await res.json();
      if (data.success) {
        const oldName = img.name;
        img.name = data.new_name;
        img.url = this.app.api.getImageUrl(data.new_name);
        const meta = await this.app.api.cacheGet(oldName);
        if (meta) {
          await this.app.api.cacheSet(data.new_name, meta);
          await this.app.api.cacheDelete(oldName);
        }
        this.app.gallery.filterGallery();
        this.app.showToast(`Moved to ${data.new_name}`);

        if (this.app.filteredImages.length > 0) {
          this.currentImageIndex = Math.min(Math.max(0, oldIndex - 1), this.app.filteredImages.length - 1);
          this.openFullView(this.app.filteredImages[this.currentImageIndex]);
        } else {
          this.closeFullView();
        }
      } else {
        this.app.showToast(data.error || "Rename failed.");
      }
    } catch (e) {
      console.error(e);
      this.app.showToast("Rename request failed.");
    }
  }

  async deleteFullViewImage() {
    const img = this.app.filteredImages[this.currentImageIndex];
    if (!img) return;
    const oldIndex = this.currentImageIndex;
    const isTrash = img.name.replace(/\\/g, '/').startsWith('.trash/');
    const confirmMsg = isTrash
      ? `Permanently delete ${img.name}?`
      : `Move ${img.name} to Trash?`;

    const confirmed = await this.app.settings.customConfirm(confirmMsg, isTrash ? "Delete Permanently" : "Move to Trash", isTrash);
    if (!confirmed) return;

    try {
      const res = await fetch("/comfyui-output-browser/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files: [img.name] })
      });
      const data = await res.json();
      const removed = [...(data.deleted || []), ...(data.trashed || [])];

      if (removed.length > 0) {
        const imgName = img.name;
        this.app.loadedImages = this.app.loadedImages.filter((/** @type {CFOB_Image} */ i) => i.name !== imgName);
        this.app.search.removeImageKeywords(imgName);
        await this.app.api.cacheDelete(imgName);
        this.app.gallery.filterGallery();
        this.app.showToast(data.deleted?.length ? "Permanently deleted image" : "Moved image to Trash");

        if (this.app.filteredImages.length > 0) {
          this.currentImageIndex = Math.min(Math.max(0, oldIndex - 1), this.app.filteredImages.length - 1);
          this.openFullView(this.app.filteredImages[this.currentImageIndex]);
        } else {
          this.closeFullView();
        }
      }
    } catch (e) {
      console.error(e);
      this.app.showToast("Failed to delete/trash image.");
    }
  }

  /** @param {any} img */
  openFullView(img) {
    const modal = this.app.$("cfobFullViewModal");
    if (!modal.classList.contains('active')) {
      const activeElement = document.activeElement;
      this.returnFocusElement = activeElement instanceof HTMLElement && this.app.root?.contains(activeElement)
        ? activeElement
        : null;
    }
    this.setFullViewUIHidden(false);
    this.currentImageIndex = this.app.filteredImages.indexOf(img);
    this.updateFullViewUI();
    modal.classList.add('active');
    this.app.$("cfobCloseFullViewBtn").focus();
  }

  closeFullView() {
    this.app.$("cfobFullViewModal").classList.remove('active');
    /** @type {HTMLImageElement} */ (this.app.$("cfobFullViewImg")).src = "";
    const returnFocus = this.returnFocusElement;
    this.returnFocusElement = null;
    if (returnFocus?.isConnected && this.app.root?.contains(returnFocus)) returnFocus.focus();
    else this.app.$("cfobSearchInput").focus();
  }

  /** @param {number} dir */
  navigateImage(dir) {
    if (this.app.filteredImages.length === 0) return;
    this.currentImageIndex += dir;
    if (this.currentImageIndex < 0) this.currentImageIndex = this.app.filteredImages.length - 1;
    if (this.currentImageIndex >= this.app.filteredImages.length) this.currentImageIndex = 0;
    this.updateFullViewUI();
  }

  async goToImageNumber() {
    const imageCount = this.app.filteredImages.length;
    if (!imageCount) return;
    const value = await this.app.settings.customPrompt(
      `Go to image number (1-${imageCount}):`,
      String(this.currentImageIndex + 1)
    );
    if (value === null) return;
    const imageNumber = Number(value.trim());
    if (!/^\d+$/.test(value.trim()) || !Number.isInteger(imageNumber) || imageNumber < 1 || imageNumber > imageCount) {
      this.app.showToast(`Enter an image number from 1 to ${imageCount}.`);
      return;
    }
    this.currentImageIndex = imageNumber - 1;
    this.updateFullViewUI();
  }

  updateFullViewUI() {
    const img = this.app.filteredImages[this.currentImageIndex];
    if (!img) return;
    /** @type {HTMLImageElement} */ (this.app.$("cfobFullViewImg")).src = img.url;
    this.app.$("cfobFullViewTitle").innerText = img.name;
    this.app.$("cfobFullViewCount").innerText = `${this.currentImageIndex + 1} / ${this.app.filteredImages.length}`;

    if (!img.isParsed) {
      this.app.$("cfobFullViewFields").innerHTML = "<i style='color: var(--color-text-disabled);'>Loading metadata...</i>";
      this.app.api.loadMetadata(img).then(() => {
        if (this.app.filteredImages[this.currentImageIndex] === img) {
          this.app.$("cfobFullViewFields").innerHTML = this.app.getCardFieldsHtml(img);
        }
      });
    } else {
      this.app.$("cfobFullViewFields").innerHTML = this.app.getCardFieldsHtml(img);
    }
  }

  /**
   * @param {number} newZoom
   */
  setFullViewZoom(newZoom) {
    this.fvZoom = Math.max(0.1, Math.min(newZoom, 15));
    this.updateFullViewTransform(true);
  }

  updateFullViewTransform(useTransition = true) {
    const img = this.app.$("cfobFullViewImg");
    if (!img) return;
    img.style.transition = useTransition ? 'transform 0.1s ease-out' : 'none';
    img.style.transform = `translate(${this.fvPanX}px, ${this.fvPanY}px) scale(${this.fvZoom})`;
  }

  resetFullViewTransform() {
    this.fvZoom = 1;
    this.fvPanX = 0;
    this.fvPanY = 0;
    this.updateFullViewTransform(true);
    this.setFullViewUIHidden(false);
  }

  toggleFullViewUI() {
    const layout = this.app.root?.querySelector('.full-view-layout');
    if (layout) this.setFullViewUIHidden(!layout.classList.contains('ui-hidden'));
  }

  /** @param {boolean} hidden */
  setFullViewUIHidden(hidden) {
    const layout = this.app.root?.querySelector('.full-view-layout');
    const topBar = this.app.root?.querySelector('.full-view-top-bar');
    const previousButton = this.app.$("cfobPrevImgBtn");
    const nextButton = this.app.$("cfobNextImgBtn");
    if (!layout || !topBar) return;

    if (hidden && (topBar.contains(document.activeElement) ||
      previousButton === document.activeElement || nextButton === document.activeElement)) {
      /** @type {HTMLElement} */ (this.app.root?.querySelector('.full-view-main'))?.focus();
    }

    layout.classList.toggle('ui-hidden', hidden);
    /** @type {HTMLElement} */ (topBar).inert = hidden;
    topBar.setAttribute('aria-hidden', String(hidden));
    previousButton.inert = hidden;
    previousButton.setAttribute('aria-hidden', String(hidden));
    nextButton.inert = hidden;
    nextButton.setAttribute('aria-hidden', String(hidden));
  }

}
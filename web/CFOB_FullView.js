import ICONS from "./assets/icons.js";

export const CFOB_FULL_VIEW_HTML = `
  <div class="modal-overlay" id="cfobFullViewModal">
    <div class="full-view-layout">
      <div class="full-view-main" tabindex="-1">
        <div class="full-view-top-bar">
          <button class="full-view-count" id="cfobFullViewCount" type="button" title="Go to image number">1 / 10</button>
          <div class="full-view-browser-controls" id="cfobFullViewBrowserControls"></div>
          <div style="display: flex; gap: 0.5em; align-items: center;">
            <div class="full-view-more-wrap">
              <button class="icon-btn" id="cfobFullViewMoreBtn" title="Zoom and view options" aria-label="Zoom and view options" aria-haspopup="true" aria-expanded="false">
                ${ICONS.more}
              </button>
              <div class="full-view-more-menu" id="cfobFullViewMoreMenu" role="menu" aria-label="Zoom and view options">
                <button class="icon-btn text-btn" id="cfobZoomFitBtn" title="Fit View (F)" role="menuitem">Fit</button>
                <button class="icon-btn text-btn" id="cfobZoomWidthBtn" title="Fit Width (W)" role="menuitem">W</button>
                <button class="icon-btn text-btn" id="cfobZoomHeightBtn" title="Fit Height (H)" role="menuitem">H</button>
                <button class="icon-btn text-btn" id="cfobZoomOriginalBtn" title="Original Size (1 / O)" role="menuitem">1:1</button>
                <div class="full-view-more-divider" role="separator"></div>
                <button class="icon-btn" id="cfobZoomInBtn" title="Zoom In (+)" role="menuitem">${ICONS.zoomIn}</button>
                <button class="icon-btn" id="cfobZoomOutBtn" title="Zoom Out (-)" role="menuitem">${ICONS.zoomOut}</button>
                <button class="icon-btn" id="cfobZoomResetBtn" title="Reset Zoom" role="menuitem">${ICONS.zoomReset}</button>
              </div>
            </div>
            <button class="icon-btn toggle-sidebar-btn" id="cfobToggleSidebarBtn" title="Cycle details pane position (T)" aria-label="Cycle details pane position (T)">${ICONS.pane}</button>
            <button class="icon-btn" id="cfobCloseFullViewBtn" title="Close (Esc)">${ICONS.close}</button>
          </div>
        </div>
        <button class="nav-btn prev-btn" id="cfobPrevImgBtn" title="Previous (Left Arrow)">❮</button>
        <img id="cfobFullViewImg" src="" alt="Full View" tabindex="0">
        <button class="nav-btn next-btn" id="cfobNextImgBtn" title="Next (Right Arrow)">❯</button>
        <div class="full-view-empty-state" id="cfobFullViewEmptyState" hidden>
          ${ICONS.picture}
          <h3>No Images Found</h3>
          <p>No images match the current filter or hidden folder settings.</p>
        </div>
      </div>
      <div class="full-view-sidebar-resizer" id="cfobFullViewSidebarResizer" role="separator" aria-label="Resize details pane" aria-orientation="vertical" aria-valuemin="240" aria-valuemax="1200" tabindex="0"></div>
      <div class="full-view-sidebar" id="cfobFullViewSidebar">
        <div class="sidebar-header">
          <h4 id="cfobFullViewTitle">Filename.png</h4>
          <div class="sidebar-header-actions">
            <div class="full-view-actions-more-wrap">
              <div class="full-view-actions" id="cfobFullViewActions">
                <button class="btn btn-primary" id="cfobFVActionOpen" title="Open workflow" aria-label="Open workflow">${ICONS.workflow}<span>Workflow</span></button>
                <button class="btn" id="cfobFVActionInspect" title="Inspect metadata" aria-label="Inspect metadata">${ICONS.inspect}<span>Inspect</span></button>
                <button class="btn" id="cfobFVActionDownload" title="Download" aria-label="Download">${ICONS.download}<span>Download</span></button>
                <button class="btn" id="cfobFVActionRename" title="Rename" aria-label="Rename">${ICONS.rename}<span>Rename</span></button>
                <button class="btn" id="cfobFVActionMove" title="Move" aria-label="Move">${ICONS.move}<span>Move</span></button>
                <button class="btn" id="cfobFVActionSendChips" title="Send Chips to Preset Gallery" aria-label="Send Chips to Preset Gallery">${ICONS.basket}<span>Chips</span></button>
                <button class="btn btn-danger" id="cfobFVActionDelete" title="Delete" aria-label="Delete">${ICONS.trash}<span>Delete</span></button>
              </div>
              <button class="icon-btn full-view-actions-more-btn" id="cfobFullViewActionsMoreBtn" title="Image actions" aria-label="Image actions" aria-haspopup="true" aria-expanded="false">${ICONS.more}</button>
            </div>
            <button class="icon-btn toggle-sidebar-btn" id="cfobToggleSidebarBtn2" title="Toggle sidebar" aria-label="Toggle sidebar">${ICONS.pane}</button>
          </div>
        </div>
        <div class="sidebar-body" id="cfobFullViewFields"></div>
      </div>
    </div>
  </div>
`;

export const CFOB_FULL_VIEW_STYLES = /*css*/ `
  #cfob-root #cfobFullViewModal.modal-overlay { padding: 0; z-index: var(--z-full-view); }
  #cfob-root .full-view-layout { display: flex; width: 100vw; height: 100vh; background: var(--color-bg-full); }
  #cfob-root.constrain-full-view #cfobFullViewModal.modal-overlay { position: absolute; }
  #cfob-root.constrain-full-view .full-view-layout { width: 100%; height: 100%; }
  #cfob-root .full-view-layout .field-value { max-height: 100%; resize: vertical; }

  #cfob-root .full-view-main { flex: 1; position: relative; display: flex; justify-content: center; align-items: center; overflow: hidden; }
  #cfob-root .full-view-main:focus { outline: none; }
  #cfob-root .full-view-main img { max-width: 100%; max-height: 100%; object-fit: contain; outline: none; }
  #cfob-root .full-view-main.has-no-images > img, #cfob-root .full-view-main.has-no-images > .nav-btn { display: none; }
  #cfob-root .full-view-empty-state { max-width: 32em; padding: 2em; color: var(--color-text-muted); text-align: center; }
  #cfob-root .full-view-empty-state[hidden] { display: none; }
  #cfob-root .full-view-empty-state svg { width: 4em; height: 4em; margin-bottom: 1em; stroke: var(--color-bg-panel-active); }
  #cfob-root .full-view-empty-state h3 { color: var(--color-text-inverse); }

  #cfob-root .full-view-top-bar { position: absolute; top: 0; left: 0; right: 0; padding: 0.4em; background: rgba(39, 39, 42, 0.94); display: flex; justify-content: space-between; align-items: center; gap: 0.75em; color: var(--color-text-primary); z-index: 10; }
  #cfob-root .full-view-browser-controls { display: flex; align-items: center; gap: 0.5em; flex: 1; min-width: 0; }
  #cfob-root .full-view-browser-controls .search-wrapper { max-width: 24em; min-width: 8em; }
  #cfob-root .full-view-browser-controls .btn { font-size: 0.75em; }
  #cfob-root .full-view-top-bar .icon-btn { color: var(--color-text-muted); }
  #cfob-root .full-view-top-bar .icon-btn:hover { color: var(--color-text-inverse); background: var(--color-bg-panel-hover); }
  #cfob-root .full-view-top-bar .text-btn { font-size: 0.75em; font-weight: 600; padding: 0 0.5em; font-family: var(--font-mono, monospace); letter-spacing: 0.5px; border-radius: var(--radius-sm); }
  #cfob-root .full-view-top-bar .full-view-count { color: var(--color-text-muted); font-size: 0.8125em; white-space: nowrap; }
  #cfob-root .full-view-browser-controls .search-input { background: #00000040 }
  #cfob-root .full-view-count { padding: 0; border: 0; background: transparent; color: inherit; font: inherit; font-weight: 600; font-size: 0.875em; cursor: pointer; }
  #cfob-root .full-view-count:hover { text-decoration: underline; }
  #cfob-root .full-view-count:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 3px; }
  #cfob-root .full-view-more-wrap { position: relative; display: flex; }
  #cfob-root .full-view-more-menu { position: absolute; top: calc(100% + 0.4em); right: 0; display: none; flex-direction: row; align-items: stretch; gap: 0.15em; min-width: 9em; padding: 0.4em; background: var(--color-bg-panel); border: 1px solid var(--color-border); border-radius: var(--radius-md, 6px); box-shadow: 0 0.5em 1.5em rgba(0,0,0,0.45); z-index: 20; }
  #cfob-root .full-view-more-menu.open { display: flex; }
  #cfob-root .full-view-more-menu .icon-btn { display: flex; align-items: center; gap: 0.5em; width: 100%; padding: 0.35em 0.5em; border-radius: var(--radius-sm); }
  #cfob-root .full-view-more-menu .text-btn { justify-content: flex-start; font-size: 0.75em; font-weight: 600; font-family: var(--font-mono, monospace); letter-spacing: 0.5px; }
  #cfob-root .full-view-more-divider { height: 1px; background: var(--color-border); margin: 0.15em 0; }

  #cfob-root .full-view-actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 0.25em; }
  #cfob-root .full-view-actions .btn { font-size: 0.6875em; padding: 0.3em; justify-content: center; }
  #cfob-root .full-view-actions .btn span { display: none; }

  #cfob-root .nav-btn { position: absolute; top: 50%; transform: translateY(-50%); background: rgba(0,0,0,0.4); color: white; border: none; padding: 1.25em 0.9375em; cursor: pointer; font-size: 1.5em; transition: 0.2s; z-index: 10; }
  #cfob-root .nav-btn:hover { background: rgba(0,0,0,0.9); }
  #cfob-root .prev-btn { left: 0; border-radius: 0 var(--radius-md) var(--radius-md) 0; }
  #cfob-root .next-btn { right: 0; border-radius: var(--radius-md) 0 0 var(--radius-md); }

  #cfob-root .full-view-sidebar-resizer { flex: 0 0 7px; position: relative; cursor: col-resize; touch-action: none; z-index: 1; }
  #cfob-root .full-view-sidebar-resizer::after { content: ""; position: absolute; inset: 0 2px; background: var(--color-border); opacity: 0; transition: opacity 0.15s; }
  #cfob-root .full-view-sidebar-resizer:hover::after, #cfob-root .full-view-sidebar-resizer:focus-visible::after, #cfob-root .full-view-layout.resizing-sidebar .full-view-sidebar-resizer::after { opacity: 1; }
  #cfob-root .full-view-sidebar { width: var(--full-view-sidebar-width, 360px); min-width: 0; flex: 0 0 auto; background: var(--color-bg-panel); border-left: 1px solid var(--color-border); display: flex; flex-direction: column; transition: all 0.3s; overflow: hidden; container: cfob-fv-sidebar / inline-size; }
  #cfob-root .full-view-sidebar-resizer.hidden { display: none; }
  #cfob-root .full-view-layout.resizing-sidebar .full-view-sidebar { transition: none; }

  #cfob-root .full-view-layout.sidebar-below { flex-direction: column; }
  #cfob-root .full-view-layout.sidebar-below .full-view-main { min-height: 0; }
  #cfob-root .full-view-layout.sidebar-below .full-view-sidebar { width: 100%; height: var(--full-view-sidebar-height, 50vh); border-left: none; border-top: 1px solid var(--color-border); }
  #cfob-root .full-view-layout.sidebar-below .full-view-sidebar-resizer { flex-basis: 7px; width: 100%; cursor: row-resize; }
  #cfob-root .full-view-layout.sidebar-below .full-view-sidebar-resizer::after { inset: 2px 0; }
  #cfob-root .full-view-layout.sidebar-below .toggle-sidebar-btn svg { transform: rotate(90deg); }

  #cfob-root .full-view-layout.sidebar-hidden .full-view-sidebar, #cfob-root .full-view-layout.sidebar-hidden .full-view-sidebar-resizer { display: none; }

  #cfob-root .sidebar-header { display: flex; align-items: center; justify-content: space-between; gap: 0.5em; padding: 0.4em; background: var(--color-bg-header); border-bottom: 1px solid var(--color-border); }
  #cfob-root .sidebar-header #cfobFullViewTitle { margin: 0; min-width: 0; font-size: 0.875em; color: var(--color-text-inverse); text-overflow: ellipsis; overflow: hidden; white-space: nowrap; }
  #cfob-root .sidebar-header-actions { display: flex; align-items: center; gap: 0.25em; flex: 0 0 auto; }
  #cfob-root .full-view-actions-more-wrap { position: relative; display: flex; }
  #cfob-root .full-view-actions-more-wrap .full-view-actions-more-btn { display: none; }
  #cfob-root .full-view-actions-more-wrap.open .full-view-actions { display: flex; }

  /* Collapse the image actions behind the more button when the pane itself is narrow. */
  @container cfob-fv-sidebar (max-width: 320px) {
    #cfob-root .full-view-actions-more-wrap .full-view-actions-more-btn { display: inline-flex; }
    #cfob-root .full-view-actions-more-wrap .full-view-actions { display: none; position: absolute; top: calc(100% + 0.4em); right: 0; z-index: 20; width: max-content; padding: 0.4em; background: var(--color-bg-panel); border: 1px solid var(--color-border); border-radius: var(--radius-md); box-shadow: 0 0.5em 1.5em rgba(0,0,0,0.45); }
    #cfob-root .full-view-actions-more-wrap.open .full-view-actions { display: flex; }
    #cfob-root .full-view-actions .btn { padding: 0.4em; }
  }
  #cfob-root .sidebar-body { padding: 0.4em; flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 0.75em; }

  #cfob-launcher-btn.floating { position: fixed; top: 0.2em; right: 3em; z-index: 9998; background: var(--color-bg-panel); color: var(--color-text-inverse); border: 1px solid var(--color-border); border-radius: var(--radius-lg); width: 2em; height: 2em; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 0.25em 0.75em rgba(0,0,0,0.4); }
  #cfob-launcher-btn.floating:hover { background: var(--color-border); }

  #cfob-root .full-view-layout.ui-hidden .full-view-top-bar,  #cfob-root .full-view-layout.ui-hidden .nav-btn { opacity: 0; pointer-events: none; }
  #cfob-root .full-view-layout .full-view-top-bar, #cfob-root .full-view-layout .nav-btn, #cfob-root .full-view-layout .full-view-sidebar { transition: opacity 0.2s ease, width 0.3s; }

  #cfob-root .full-view-main img { max-width: 100%; max-height: 100%; object-fit: contain; transition: transform 0.1s ease-out; transform-origin: center; cursor: grab; }
  #cfob-root .full-view-main img { touch-action: none; }
  #cfob-root .full-view-main img.dragging { transition: none; cursor: grabbing; }

  @media (max-width: 768px) {
    #cfob-root .full-view-top-bar { top: 0em; left: 0em; right: 0em; padding: 0.3em; gap: 0.3em; }
    #cfob-root .full-view-browser-controls { gap: 0.25em; margin-right: 0.25em; }
    #cfob-root .full-view-browser-controls .search-wrapper { min-width: 5em; }
    #cfob-root .full-view-actions .btn { min-width: auto; }
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
    this.fvFitMode = "fit";
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
    /** @type {() => void} */
    this.actionsMoreClose = () => { };
    /** @type {{element: HTMLElement, placeholder: Comment}[] | null} */
    this.browserControlPlaceholders = null;
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
    this.app.$("cfobToggleSidebarBtn2").addEventListener('click', () => this.cycleSidebarMode());
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
        this.sidebarHeight = this.clampSidebarSize(resizeSize - (position - resizeStart), 140, this.getFullViewDimensions().height - 260);
      } else {
        this.sidebarWidth = this.clampSidebarSize(resizeSize - (position - resizeStart), 240, this.getFullViewDimensions().width - 300);
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
        this.sidebarHeight = this.clampSidebarSize(this.sidebarHeight + change, 140, this.getFullViewDimensions().height - 260);
      } else {
        this.sidebarWidth = this.clampSidebarSize(this.sidebarWidth + change, 240, this.getFullViewDimensions().width - 300);
      }
      this.applySidebarSize();
      localStorage.setItem('cfob_full_view_sidebar_width', String(this.sidebarWidth));
      localStorage.setItem('cfob_full_view_sidebar_height', String(this.sidebarHeight));
    });
    window.addEventListener('resize', () => this.applySidebarSize());
    this.app.$("cfobPrevImgBtn").addEventListener('click', () => this.navigateImage(-1));
    this.app.$("cfobNextImgBtn").addEventListener('click', () => this.navigateImage(1));

    let touchStartX = 0;
    let touchImageInteraction = false;
    const fvModal = this.app.$("cfobFullViewModal");
    const fvMain = /** @type {HTMLElement} */ (this.app.root?.querySelector('.full-view-main'));

    fvMain.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
      if (e.touches.length > 1) touchImageInteraction = true;
    }, { passive: true });

    fvMain.addEventListener('touchend', (e) => {
      if (touchImageInteraction) {
        if (e.touches.length === 0) touchImageInteraction = false;
        return;
      }
      const touchEndX = e.changedTouches[0].screenX;

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

    // Zoom and Fit Mode Buttons
    this.app.$("cfobZoomFitBtn").addEventListener('click', () => this.applyFitMode('fit'));
    this.app.$("cfobZoomWidthBtn").addEventListener('click', () => this.applyFitMode('width'));
    this.app.$("cfobZoomHeightBtn").addEventListener('click', () => this.applyFitMode('height'));
    this.app.$("cfobZoomOriginalBtn").addEventListener('click', () => this.applyFitMode('original'));

    this.app.$("cfobZoomInBtn").addEventListener('click', () => this.setFullViewZoom(this.fvZoom * 1.1));
    this.app.$("cfobZoomOutBtn").addEventListener('click', () => this.setFullViewZoom(this.fvZoom / 1.1));
    this.app.$("cfobZoomResetBtn").addEventListener('click', () => this.resetFullViewTransform());

    // Three-dot popup menu for zoom and fit options
    const moreBtn = this.app.$("cfobFullViewMoreBtn");
    const moreMenu = this.app.$("cfobFullViewMoreMenu");
    /** @param {boolean} open */
    const setMoreMenuOpen = (open) => {
      moreMenu.classList.toggle('open', open);
      moreBtn.setAttribute('aria-expanded', String(open));
    };
    const closeMoreMenu = () => setMoreMenuOpen(false);
    moreBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      setMoreMenuOpen(!moreMenu.classList.contains('open'));
    });
    moreMenu.addEventListener('click', (e) => {
      if (e.target instanceof HTMLElement && e.target.closest('button')) closeMoreMenu();
    });
    document.addEventListener('click', (e) => {
      const target = /** @type {Node} */ (e.target);
      if (!moreMenu.contains(target) && !moreBtn.contains(target)) closeMoreMenu();
    });

    // Sidebar image-actions popup (mobile: actions collapse behind a more button)
    const actionsWrap = /** @type {HTMLElement} */ (this.app.root?.querySelector('.full-view-actions-more-wrap'));
    const actionsMoreBtn = this.app.$("cfobFullViewActionsMoreBtn");
    /** @param {boolean} open */
    const setActionsMoreOpen = (open) => {
      actionsWrap?.classList.toggle('open', open);
      actionsMoreBtn.setAttribute('aria-expanded', String(open));
    };
    const closeActionsMore = () => setActionsMoreOpen(false);
    this.actionsMoreClose = closeActionsMore;
    actionsMoreBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      setActionsMoreOpen(!actionsWrap?.classList.contains('open'));
    });
    document.addEventListener('click', (e) => {
      const target = /** @type {Node} */ (e.target);
      if (!actionsWrap?.contains(target)) closeActionsMore();
    });
    this.app.$("cfobFullViewActions").addEventListener('click', (e) => {
      if (e.target instanceof HTMLElement && e.target.closest('button')) closeActionsMore();
    });

    this.app.$("cfobCloseFullViewBtn").addEventListener('click', () => this.resetFullViewTransform());

    const fvImg = this.app.$("cfobFullViewImg");

    /** @type {Map<number, {x: number, y: number, pointerType: string}>} */
    const activePointers = new Map();
    /** @type {{distance: number, zoom: number, panX: number, panY: number, midpointX: number, midpointY: number} | null} */
    let pinchStart = null;
    const getPinchPoints = () => Array.from(activePointers.values()).slice(0, 2);

    fvImg.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse') return;
      if (e.pointerType === 'touch' && this.fvZoom > 1) touchImageInteraction = true;
      activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY, pointerType: e.pointerType });
      fvImg.setPointerCapture(e.pointerId);

      if (activePointers.size >= 2) {
        touchImageInteraction = true;
        const [first, second] = getPinchPoints();
        const midpointX = (first.x + second.x) / 2;
        const midpointY = (first.y + second.y) / 2;
        pinchStart = {
          distance: Math.max(1, Math.hypot(second.x - first.x, second.y - first.y)),
          zoom: this.fvZoom,
          panX: this.fvPanX,
          panY: this.fvPanY,
          midpointX,
          midpointY
        };
        this.fvIsDragging = false;
        this.fvHasDragged = true;
        fvImg.classList.remove('dragging');
        e.preventDefault();
      }
    });

    fvImg.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
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
      if (!this.fvIsDragging) return;
      this.fvIsDragging = false;
      fvImg.classList.remove('dragging');
      if (!this.fvHasDragged && e.target === fvImg) this.toggleFullViewUI();
    });

    fvImg.addEventListener('pointermove', (e) => {
      if (!activePointers.has(e.pointerId)) return;
      activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY, pointerType: e.pointerType });

      if (pinchStart && activePointers.size >= 2) {
        const [first, second] = getPinchPoints();
        const midpointX = (first.x + second.x) / 2;
        const midpointY = (first.y + second.y) / 2;
        const distance = Math.max(1, Math.hypot(second.x - first.x, second.y - first.y));
        const zoom = Math.max(0.1, Math.min(pinchStart.zoom * distance / pinchStart.distance, 15));
        const bounds = fvMain.getBoundingClientRect();
        const centerX = bounds.left + bounds.width / 2;
        const centerY = bounds.top + bounds.height / 2;
        const zoomRatio = zoom / pinchStart.zoom;
        this.fvZoom = zoom;
        this.fvPanX = midpointX - pinchStart.midpointX + pinchStart.panX
          + (pinchStart.midpointX - centerX) * (1 - zoomRatio);
        this.fvPanY = midpointY - pinchStart.midpointY + pinchStart.panY
          + (pinchStart.midpointY - centerY) * (1 - zoomRatio);
        this.updateFullViewTransform(false);
        this.fvHasDragged = true;
        e.preventDefault();
      } else if (this.fvIsDragging) {
        const newX = e.clientX - this.fvStartX;
        const newY = e.clientY - this.fvStartY;
        if (Math.abs(newX - this.fvPanX) > 3 || Math.abs(newY - this.fvPanY) > 3) {
          this.fvHasDragged = true;
        }
        this.fvPanX = newX;
        this.fvPanY = newY;
        this.updateFullViewTransform(false);
      }
    });

    /** @param {PointerEvent} e */
    const finishImagePointer = (e) => {
      if (!activePointers.has(e.pointerId)) return;
      activePointers.delete(e.pointerId);
      if (fvImg.hasPointerCapture(e.pointerId)) fvImg.releasePointerCapture(e.pointerId);

      if (pinchStart) {
        pinchStart = null;
        this.fvIsDragging = false;
        fvImg.classList.remove('dragging');
        const remainingPointer = activePointers.values().next().value;
        if (remainingPointer?.pointerType === 'touch' && this.fvZoom > 1) {
          this.fvIsDragging = true;
          this.fvStartX = remainingPointer.x - this.fvPanX;
          this.fvStartY = remainingPointer.y - this.fvPanY;
          fvImg.classList.add('dragging');
        }
      } else if (this.fvIsDragging) {
        this.fvIsDragging = false;
        fvImg.classList.remove('dragging');
        if (!this.fvHasDragged && e.pointerType === 'mouse') this.toggleFullViewUI();
      }
    };
    fvImg.addEventListener('pointerup', finishImagePointer);
    fvImg.addEventListener('pointercancel', finishImagePointer);

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
    this.app.$("cfobFVActionMove").addEventListener('click', () => this.moveFullViewImage());
    this.app.$("cfobFVActionSendChips").addEventListener('click', (e) => {
      e.stopPropagation();
      const btn = /** @type {HTMLElement} */ (e.currentTarget);
      const img = this.app.filteredImages[this.currentImageIndex];
      const images = img ? [img.name] : null;
      this.app.actions.sendChipsToBasket(null, btn, images);
    });
    this.app.$("cfobFVActionDelete").addEventListener('click', () => this.deleteFullViewImage());

  }

  /**
   * Applies specific view modes by dynamically calculating the required zoom target.
   * @param {'fit' | 'width' | 'height' | 'original'} mode
   */
  applyFitMode(mode) {
    this.fvFitMode = mode;
    const img = /** @type {HTMLImageElement} */ (this.app.$("cfobFullViewImg"));
    const main = /** @type {HTMLElement} */ (this.app.root?.querySelector('.full-view-main'));
    if (!img || !main || !img.naturalWidth) return;

    // Temporarily clear active transforms to retrieve bounded base CSS dimensions
    const oldTransform = img.style.transform;
    const oldTransition = img.style.transition;
    img.style.transform = 'none';
    img.style.transition = 'none';

    const imgRect = img.getBoundingClientRect();
    const mainRect = main.getBoundingClientRect();

    let targetZoom = 1;
    this.fvPanX = 0;
    this.fvPanY = 0;

    if (mode === 'fit') {
      // Calculate the minimum scale needed to fit both dimensions perfectly
      targetZoom = Math.min(mainRect.width / imgRect.width, mainRect.height / imgRect.height);
    } else if (mode === 'width') {
      targetZoom = mainRect.width / imgRect.width;
    } else if (mode === 'height') {
      targetZoom = mainRect.height / imgRect.height;
    } else if (mode === 'original') {
      targetZoom = img.naturalWidth / imgRect.width;
    }

    // Restore transforms prior to the next frame to prevent flashing
    img.style.transform = oldTransform;
    // eslint-disable-next-line no-unused-expressions
    img.offsetHeight; // Force DOM reflow
    img.style.transition = oldTransition;

    // Constrain the target zoom factor and apply
    this.fvZoom = Math.max(0.1, Math.min(targetZoom, 15));
    this.updateFullViewTransform(true);
  }

  /**
   * Cycles through fit modes: fit -> width -> height -> original -> fit ...
   */
  cycleFitMode() {
    const modes = ["fit", "width", "height", "original"];
    const idx = modes.indexOf(this.fvFitMode);
    // @ts-ignore
    this.applyFitMode(modes[(idx + 1) % modes.length]);
  }
  /** @param {number} value @param {number} min @param {number} max */
  clampSidebarSize(value, min, max) {
    return Math.max(min, Math.min(value, Math.max(min, max)));
  }

  getFullViewDimensions() {
    const layout = /** @type {HTMLElement | null} */ (this.app.root?.querySelector('.full-view-layout'));
    const bounds = layout?.getBoundingClientRect();
    return {
      width: bounds?.width || window.innerWidth,
      height: bounds?.height || window.innerHeight
    };
  }

  applySidebarSize() {
    const sidebar = this.app.$("cfobFullViewSidebar");
    const isVertical = this.sidebarMode === 'below';
    const dimensions = this.getFullViewDimensions();
    if (isVertical) {
      this.sidebarHeight = this.clampSidebarSize(this.sidebarHeight, 140, dimensions.height - 260);
    } else {
      this.sidebarWidth = this.clampSidebarSize(this.sidebarWidth, 240, dimensions.width - 300);
    }
    sidebar.style.setProperty('--full-view-sidebar-width', `${this.sidebarWidth}px`);
    sidebar.style.setProperty('--full-view-sidebar-height', `${this.sidebarHeight}px`);
    const resizer = this.app.$("cfobFullViewSidebarResizer");
    resizer.setAttribute('aria-orientation', isVertical ? 'horizontal' : 'vertical');
    resizer.setAttribute('aria-valuemin', String(isVertical ? 140 : 240));
    resizer.setAttribute('aria-valuemax', String(Math.max(
      isVertical ? 140 : 240,
      isVertical ? dimensions.height - 260 : dimensions.width - 300
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
    const initialFilename = img.name.split(/\\|\//).pop() || img.name;
    const newName = await this.app.settings.customPrompt("Enter a new filename or path:", initialFilename, 'rename');
    if (!newName || newName === img.name || newName === initialFilename) return;

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
        img.mtime = data.mtime || img.mtime;
        img.url = this.app.api.getImageUrl(data.new_name) + (img.mtime ? `&t=${img.mtime}` : '');
        this.app.search.removeImageKeywords(oldName);
        this.app.search.indexImageKeywords(img);
        const meta = await this.app.api.cacheGet(oldName);
        if (meta) {
          await this.app.api.cacheSet(data.new_name, meta, img.mtime);
          await this.app.api.cacheDelete(oldName);
        }
        this.app.gallery.filterGallery();
        this.app.showToast(`Renamed to ${data.new_name}`);

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

  async moveFullViewImage() {
    const img = this.app.filteredImages[this.currentImageIndex];
    if (!img) return;
    const oldIndex = this.currentImageIndex;
    const destFolder = await this.app.settings.customPrompt("Choose a destination folder:", "", 'move');
    if (destFolder === null) return;

    try {
      const res = await fetch("/comfyui-output-browser/move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files: [img.name], dest_folder: destFolder })
      });
      const data = await res.json();
      const moved = data.moved?.[0];
      if (!data.success || !moved) {
        this.app.showToast(data.errors?.[0] || data.error || "Move failed.");
        return;
      }

      const oldName = img.name;
      this.app.search.removeImageKeywords(oldName);
      img.name = moved.new_name;
      img.mtime = moved.mtime || img.mtime;
      img.url = this.app.api.getImageUrl(moved.new_name) + (img.mtime ? `&t=${img.mtime}` : '');
      this.app.search.indexImageKeywords(img);
      const meta = await this.app.api.cacheGet(oldName);
      if (meta) {
        await this.app.api.cacheSet(moved.new_name, meta, img.mtime);
        await this.app.api.cacheDelete(oldName);
      }
      this.app.gallery.filterGallery();
      const newIndex = this.app.filteredImages.indexOf(img);
      if (newIndex >= 0) {
        this.currentImageIndex = newIndex;
        this.updateFullViewUI();
      } else if (this.app.filteredImages.length > 0) {
        this.currentImageIndex = Math.min(oldIndex, this.app.filteredImages.length - 1);
        this.updateFullViewUI();
      } else {
        this.closeFullView();
      }
      this.app.showToast(`Moved to ${moved.new_name}`);
    } catch (e) {
      console.error(e);
      this.app.showToast("Move request failed.");
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
    this.app.settings.activateFullViewMode();
    this.setFullViewUIHidden(false);
    this.currentImageIndex = this.app.filteredImages.indexOf(img);
    this.updateFullViewUI();
    this.mountBrowserControls();
    modal.classList.add('active');
    this.app.root?.classList.add('full-view-active');
    this.applySidebarSize();
    this.app.$("cfobFullViewImg").focus();
  }

  closeFullView() {
    const moreMenu = this.app.$("cfobFullViewMoreMenu");
    moreMenu?.classList.remove('open');
    this.app.$("cfobFullViewMoreBtn")?.setAttribute('aria-expanded', 'false');
    this.app.$("cfobFullViewModal").classList.remove('active');
    this.app.root?.classList.remove('full-view-active');
    this.restoreBrowserControls();
    if (this.app.settings.fullViewMode) {
      this.app.settings.fullViewMode = false;
      this.app.settings.setViewMode(this.app.settings.getGalleryViewMode());
    }
    /** @type {HTMLImageElement} */ (this.app.$("cfobFullViewImg")).src = "";

    // Focus the last viewed image in the grid
    const img = this.app.filteredImages[this.currentImageIndex];
    if (img) {
      const idx = this.app.filteredImages.indexOf(img);
      if (idx >= 0) {
        const cards = this.app.gallery.getOrderedCards();
        const card = idx < cards.length ? cards[idx] : null;
        if (card) {
          this.app.lastSelectedIdx = idx;
          cards.forEach((c, i) => c.classList.toggle('focused', i === idx));
          card.focus();
          this.returnFocusElement = null;
          return;
        }
      }
    }

    const returnFocus = this.returnFocusElement;
    this.returnFocusElement = null;
    if (returnFocus?.isConnected && this.app.root?.contains(returnFocus)) returnFocus.focus();
    else this.app.$("cfobSearchInput").focus();
  }

  mountBrowserControls() {
    if (this.browserControlPlaceholders) return;
    const container = this.app.$("cfobFullViewBrowserControls");
    const controls = [
      { id: "cfobSearchWrapper", element: /** @type {HTMLElement | null} */ (this.app.root?.querySelector(".search-wrapper")) },
      { id: "cfobRefreshBtn", element: this.app.$("cfobRefreshBtn") },
      { id: "cfobMenuBtn", element: this.app.$("cfobMenuBtn") }
    ];
    this.browserControlPlaceholders = controls.flatMap(({ id, element }) => {
      if (!element?.parentNode) return [];
      const placeholder = document.createComment(` ${id} `);
      element.parentNode.insertBefore(placeholder, element);
      container.appendChild(element);
      return [{ element, placeholder }];
    });
  }

  restoreBrowserControls() {
    if (!this.browserControlPlaceholders) return;
    for (const { element, placeholder } of this.browserControlPlaceholders) {
      placeholder.parentNode?.insertBefore(element, placeholder);
      placeholder.remove();
    }
    this.browserControlPlaceholders = null;
  }

  reapplyCurrentFitMode() {
    // @ts-ignore
    this.applyFitMode(this.fvFitMode);
  }

  /** @param {number} dir */
  navigateImage(dir) {
    if (this.app.filteredImages.length === 0) return;
    this.currentImageIndex += dir;
    if (this.currentImageIndex < 0) this.currentImageIndex = this.app.filteredImages.length - 1;
    if (this.currentImageIndex >= this.app.filteredImages.length) this.currentImageIndex = 0;

    // Update UI and re-apply the current fit mode based on zoom state or default preference
    this.updateFullViewUI();

    // If the user was using a specific zoom constraint (e.g., fit, width, height), re-apply it after the image loads
    const imgElement = /** @type {HTMLImageElement} */ (this.app.$("cfobFullViewImg"));
    if (imgElement.complete && imgElement.naturalWidth) {
      this.reapplyCurrentFitMode();
    } else {
      imgElement.onload = () => {
        this.reapplyCurrentFitMode();
        imgElement.onload = null;
      };
    }
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
    const main = /** @type {HTMLElement} */ (this.app.root?.querySelector('.full-view-main'));
    const emptyState = this.app.$("cfobFullViewEmptyState");
    main?.classList.toggle('has-no-images', !img);
    emptyState.hidden = Boolean(img);
    if (!img) {
      /** @type {HTMLImageElement} */ (this.app.$("cfobFullViewImg")).removeAttribute('src');
      this.app.$("cfobFullViewTitle").innerText = "No matching images";
      this.app.$("cfobFullViewCount").innerText = "0 / 0";
      this.app.$("cfobFullViewFields").replaceChildren();
      return;
    }
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
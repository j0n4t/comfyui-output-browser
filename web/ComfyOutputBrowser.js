import { CFOB_QUERY_STYLES, CFOB_STYLES } from "./assets/css.js";
import ICONS from "./assets/icons.js";
import CFOB_API from "./CFOB_API.js";
import CFOB_FullView, { CFOB_FULL_VIEW_HTML, CFOB_FULL_VIEW_STYLES } from "./CFOB_FullView.js";
import CFOB_Settings, { CFOB_SETTINGS_MODALS_HTML, CFOB_SETTINGS_MODALS_STYLES } from "./CFOB_Settings.js";
import CFOB_Search from "./CFOB_Search.js";
import CFOB_Gallery from "./CFOB_Gallery.js";
import CFOB_ImageActions from "./CFOB_ImageActions.js";
import CFOB_Selection from "./CFOB_Selection.js";
import { generateSelector, parseHookTarget, formatHookTarget } from "./CFOB_Selector.js";

const BROWSER_HTML = `
<div id="cfob-resizer"></div>

<div class="top-bar">
  <div class="logo-group">
    ${ICONS.logo}
    <h1>ComfyUI Output Browser</h1>
    <span id="cfobImageCount"></span>
  </div>
  <div class="actions-group">
    <div class="search-wrapper">
      <input type="text" id="cfobSearchInput" class="search-input" placeholder="Filter" autocomplete="off" aria-autocomplete="list" aria-controls="cfobSearchSuggestions" aria-expanded="false">
      <div id="cfobSearchSuggestions" class="search-suggestions" role="listbox" aria-label="Search suggestions" hidden></div>
      <button id="cfobClearSearchBtn" class="search-clear-btn" title="Clear search">${ICONS.close}</button>
    </div>
    <button class="btn" id="cfobRefreshBtn" title="Sync outputs from Server">${ICONS.refresh}<span>Refresh</span></button>
    <button class="btn" id="cfobMenuBtn" title="Options">${ICONS.config}<span>Options</span></button>
    <button class="btn btn-danger" id="cfobCloseBrowserBtn">${ICONS.close}<span>Close</span></button>
  </div>
</div>

<div class="main-container" id="cfobMainContainer">
  <div class="gallery-container view-grid" id="cfobGalleryGrid"></div>
  <div class="empty-state" id="cfobEmptyState">
    ${ICONS.picture}
    <h3 id="cfobEmptyStateTitle">No Images Loaded</h3><p id="cfobEmptyStateDesc">Click Refresh to load ComfyUI outputs to inspect.</p>
  </div>
</div>

<div id="cfobActionBar" class="action-bar">
  <span id="cfobSelectionCount" style="font-weight: 600; color: var(--color-text-inverse); min-width: 5em;">1 selected</span>
  <div style="width: 1px; height: 1.25em; background: var(--color-border);"></div>
  <button class="btn btn-primary" id="cfobActionOpen">${ICONS.workflow}<span>Load Workflow</span></button>
  <button class="btn" id="cfobActionInspect">${ICONS.inspect}<span>Inspect Nodes</span></button>
  <button class="btn" id="cfobActionDownload">${ICONS.download}<span>Download</span></button>
  <button class="btn" id="cfobActionRename">${ICONS.rename}<span>Rename</span></button>
  <button class="btn" id="cfobActionMove">${ICONS.move}<span>Move</span></button>
  <button class="btn" id="cfobActionSendChips">${ICONS.basket}<span>Send Chips</span></button>
  <button class="btn btn-danger" id="cfobActionDelete">${ICONS.trash}<span>Delete</span></button>
  <div style="width: 1px; height: 1.25em; background: var(--color-border);"></div>
  <button class="icon-btn" id="cfobActionClear" title="Clear Selection">${ICONS.close}</button>
</div>

${CFOB_FULL_VIEW_HTML}
${CFOB_SETTINGS_MODALS_HTML}

<div class="toast" id="cfobToastNotice"></div>
`;



export default class ComfyOutputBrowser {
  constructor() {
    /** @type {CFOB_Image[]} */
    this.loadedImages = [];
    /** @type {CFOB_Image[]} */
    this.filteredImages = [];
    this.selectedImages = new Set();

    /** @type {any[]} */
    this.serverOrder = [];
    this.lastSelectedIdx = -1;
    this.isUiVisible = false;
    this.serverImageFetchCount = 0;
    this.isIdleParsing = false;
    /** @type {string[]} */
    this.searchHistory = JSON.parse(localStorage.getItem('cfob_search_history') || '[]');
    /** @type {number} */
    this.searchHistoryIndex = this.searchHistory.length;
    /** @type {number} */
    this.activeSearchSuggestionIndex = -1;
    /** @type {Map<string, Set<string>>} */
    this.imageKeywordIndex = new Map();
    /** @type {Map<string, number>} */
    this.keywordDictionary = new Map();

    this.observer = null;
    this.api = new CFOB_API(this);
    this.settings = new CFOB_Settings(this);
    this.fullView = new CFOB_FullView(this);
    this.search = new CFOB_Search(this);
    this.gallery = new CFOB_Gallery(this);
    this.selection = new CFOB_Selection(this);
    this.actions = new CFOB_ImageActions(this);
    /** @type {(() => void) | null} */
    this._pickCleanup = null;
    this.isPickingElement = false;
    /** @type {{ uiVisible: boolean, placement: 'sidebar' | 'action-bar' | 'floating' | 'hook' } | null} */
    this._pickRestore = null;
    this._pickCommit = false;
    // Set from window.CFOB_STANDALONE in init(); overridable so tests can exercise
    // the launcher in the standalone harness.
    this.launcherDisabled = false;
  }

  /** @param {string} id */
  $(id) { return /** @type {HTMLElement} */ (this.root?.querySelector(`#${id}`)); }

  /**
   * @param {string} relPath
   */
  isImageInHiddenFolder(relPath) {
    const parts = relPath.replace(/\\/g, '/').split('/');
    parts.pop();

    for (const folder of parts) {
      if (!folder) continue;
      if (folder.startsWith('.')) return true;
      for (const pat of this.settings.hiddenFolders) {
        const cleanPat = pat.trim().toLowerCase();
        if (cleanPat && (folder.toLowerCase() === cleanPat || relPath.toLowerCase().includes(cleanPat))) {
          return true;
        }
      }
    }
    return false;
  }

  /**
     * Appends a custom dynamic CSS stylesheet tag into the document head element.
     * @param {string} id - HTML element element ID string.
     * @param {string} css - Raw CSS stylesheet rule strings.
     * @returns {void}
     */
  injectStyles(id, css) {
    if (document.getElementById(id)) return;
    const styles = document.createElement("style");
    styles.id = id;
    styles.textContent = css;
    document.head.appendChild(styles);
  }

  init() {
    this.injectStyles("cfob-main-styles", CFOB_STYLES);
    this.injectStyles("cfob-fv-styles", CFOB_FULL_VIEW_STYLES);
    this.injectStyles("cfob-modal-styles", CFOB_SETTINGS_MODALS_STYLES);
    this.injectStyles("cfob-query-styles", CFOB_QUERY_STYLES);

    this.root = document.createElement("div");
    this.root.id = "cfob-root";
    this.root.innerHTML = BROWSER_HTML;
    document.body.appendChild(this.root);

    this.settings.setUiScale(this.settings.uiScale);
    // Standalone mode is the panel itself — always open, full-bleed — so there is
    // no launcher button to place and no launcher settings to offer.
    this.launcherDisabled = Boolean(/** @type {any} */ (window).CFOB_STANDALONE);
    this.injectLauncherButton();
    this.bindEvents();

    const savedView = localStorage.getItem('comfy_folder_browser_view') || 'grid';
    this.settings.setViewMode(savedView);
    this.settings.setGridFillOrder(this.settings.gridFillOrder);
    this.settings.setScrollDirection(this.settings.scrollDir);
    this.settings.setGridSize(this.settings.gridSize);
    this.settings.setCompactSizeOffset(this.settings.compactSizeOffset);
    this.settings.setPanelOffsets(this.settings.panelOffsets);
    this.settings.setBrowserMode(this.settings.browserMode);
    this.settings.setConstrainFullView(this.settings.constrainFullView);
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const card = /** @type {HTMLElement} */ (entry.target);
          const idx = card.dataset.index;
          // @ts-ignore
          const img = idx ? this.loadedImages[idx] : null;
          if (img && !img.isParsed) {
            this.api.loadMetadata(img).then(() => {
              const cardBody = card.querySelector('.card-body');
              if (cardBody) {
                cardBody.innerHTML = this.getCardFieldsHtml(img);
              }
            });
            this.observer?.unobserve(card);
          }
        }
      });
    }, { root: this.$("cfobMainContainer"), rootMargin: "200px" });
  }

  /**
   * @param {number | null} width
   * @param {number | null} height
   */
  updateSidebarSize(width, height) {
    if (!this.root) return;
    const offsetLeft = parseFloat(this.root.style.getPropertyValue('--cfob-offset-left')) || 0;
    const offsetRight = parseFloat(this.root.style.getPropertyValue('--cfob-offset-right')) || 0;
    const offsetTop = parseFloat(this.root.style.getPropertyValue('--cfob-offset-top')) || 0;
    const offsetBottom = parseFloat(this.root.style.getPropertyValue('--cfob-offset-bottom')) || 0;
    if (width !== null) {
      const maxWidth = Math.max(0, window.innerWidth - offsetLeft - offsetRight - 20);
      this.sidebarWidth = Math.min(Math.max(300, width), maxWidth);
      this.settings.sidebarWidth = this.sidebarWidth;
      this.root.style.width = `${this.sidebarWidth}px`;
    }
    if (height !== null) {
      const maxHeight = Math.max(0, window.innerHeight - offsetTop - offsetBottom - 20);
      this.sidebarHeight = Math.min(Math.max(200, height), maxHeight);
      this.settings.sidebarHeight = this.sidebarHeight;
      this.root.style.height = `${this.sidebarHeight}px`;
    }
  }

  showWithTransition() {
    if (!this.root) return;
    const launcher = document.getElementById("cfob-launcher-btn");
    if (launcher) launcher.classList.add('side-bar-button-selected');
    this.fetchServerImages();
    clearTimeout(this.transitionTimer);
    this.root.style.display = 'flex';
    void this.root.offsetWidth;
    this.root.classList.remove('cfob-hidden');
    this.isUiVisible = true;
    if (this.$("cfobFullViewModal").classList.contains('active')) {
      this.fullView.setFullViewUIHidden(false);
    }
    this.$("cfobSearchInput").focus();
  }

  hideWithTransition() {
    if (!this.root) return;
    const launcher = document.getElementById("cfob-launcher-btn");
    if (launcher) launcher.classList.remove('side-bar-button-selected');
    if (this.root.contains(document.activeElement)) {
      if (launcher instanceof HTMLElement) launcher.focus();
      else if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    }
    this.root.classList.add('cfob-hidden');
    clearTimeout(this.transitionTimer);
    this.transitionTimer = setTimeout(() => {
      if (!this.root) return;
      if (this.root.classList.contains('cfob-hidden')) {
        this.root.style.display = 'none';
        this.isUiVisible = false;
      }
    }, 250);
  }

  toggleUi() {
    if (!this.isUiVisible) {
      this.showWithTransition();
    } else {
      this.hideWithTransition();
    }
  }

  injectLauncherButton() {
    // No launcher button where there is nothing for it to open.
    if (this.launcherDisabled) {
      document.getElementById("cfob-launcher-btn")?.remove();
      return;
    }

    // Clean up previous observer to avoid accumulation
    if (this._launcherObserver) {
      this._launcherObserver.disconnect();
      this._launcherObserver = null;
    }

    let canvasContObserved = false;

    const SIDEBAR_SELECTORS = [
      '[data-testid="sidebar-top-group"]',
      'nav.side-tool-bar-container .sidebar-item-group',
      '.side-tool-bar-container .sidebar-item-group',
      'nav.side-tool-bar-container',
      '.side-tool-bar-container',
    ];
    const ACTION_BAR_SELECTORS = [
      '[data-testid="action-bar-buttons"]',
      '[data-testid="action-bar"]',
      '.comfy-menu',
    ];

    const findSidebarTarget = () => {
      for (const sel of SIDEBAR_SELECTORS) {
        const el = document.querySelector(sel);
        if (el) return el;
      }
      return null;
    };

    const findActionBarTarget = () => {
      for (const sel of ACTION_BAR_SELECTORS) {
        const el = document.querySelector(sel);
        if (el) return el;
      }
      return null;
    };

    // In ComfyUI App mode the top bar exposes a login button (or the current-user
    // button when signed in). Place the launcher next to it when available.
    const LOGIN_BUTTON_SELECTOR = '[data-testid="login-button"], [data-testid="current-user-button"]';
    const findLoginAnchor = () => document.querySelector(LOGIN_BUTTON_SELECTOR);

    const SIDEBAR_CLASS = "side-bar-button cursor-pointer border-none bg-transparent text-muted-foreground hover:bg-secondary-background-hover py-2";
    const ACTION_BAR_CLASS = "cfob-launcher-actionbar";
    const SIDEBAR_HTML = `
      <div class="side-bar-button-content flex flex-col items-center gap-2 py-2">
        <div class="sidebar-icon-wrapper relative">
          <span class="side-bar-button-icon">${ICONS.logo}</span>
        </div>
        <span class="side-bar-button-label line-clamp-2 w-max max-w-[calc(var(--sidebar-width)-var(--sidebar-padding))] text-center text-2xs wrap-break-word whitespace-normal">Outputs</span>
      </div>
    `;

    const applyFloatingPosition = (/** @type {HTMLElement} */ btn) => {
      const saved = localStorage.getItem('cfob_launcher_pos');
      if (saved) {
        try {
          const pos = JSON.parse(saved);
          btn.style.left = typeof pos.left === 'number' ? `${pos.left}px` : '';
          btn.style.top = typeof pos.top === 'number' ? `${pos.top}px` : '';
          btn.style.right = typeof pos.right === 'number' ? `${pos.right}px` : '';
          btn.style.bottom = typeof pos.bottom === 'number' ? `${pos.bottom}px` : '';
        } catch { /* ignore */ }
      }
    };

    const setupFloatingDrag = (/** @type {HTMLElement & { _cfobDragEndedAt?: number }} */ btn) => {
      /** @type {number} */ let startX;
      /** @type {number} */ let startY;
      /** @type {number} */ let startLeft;
      /** @type {number} */ let startTop;
      let dragging = false, moved = false;

      btn.addEventListener('mousedown', (/** @type {MouseEvent} */ e) => {
        if (e.button !== 0) return;
        dragging = true;
        moved = false;
        startX = e.clientX;
        startY = e.clientY;
        // Capture the base position from the inline styles (unaffected by the
        // hover transform), falling back to the measured rect.
        const rect = btn.getBoundingClientRect();
        startLeft = btn.style.left ? parseFloat(btn.style.left) : rect.left;
        startTop = btn.style.top ? parseFloat(btn.style.top) : rect.top;
      });

      window.addEventListener('mousemove', (/** @type {MouseEvent} */ e) => {
        if (!dragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        if (!moved && Math.abs(dx) < 3 && Math.abs(dy) < 3) return;
        if (!moved) {
          // First real move: pin the position so it becomes the drag origin.
          moved = true;
          btn.style.left = `${startLeft}px`;
          btn.style.top = `${startTop}px`;
          btn.style.right = '';
          btn.style.bottom = '';
          document.body.style.userSelect = 'none';
        }
        const newLeft = Math.max(0, Math.min(window.innerWidth - btn.offsetWidth, startLeft + dx));
        const newTop = Math.max(0, Math.min(window.innerHeight - btn.offsetHeight, startTop + dy));
        btn.style.left = `${newLeft}px`;
        btn.style.top = `${newTop}px`;
      });

      window.addEventListener('mouseup', () => {
        if (!dragging) return;
        dragging = false;
        document.body.style.userSelect = '';
        if (moved) {
          const rect = btn.getBoundingClientRect();
          localStorage.setItem('cfob_launcher_pos', JSON.stringify({ left: rect.left, top: rect.top }));
          // Suppress the click that follows a drag so it doesn't toggle the panel
          btn._cfobDragEndedAt = Date.now();
        }
      });
    };

    const updateButtonPlacement = () => {
      let launcherBtn = /** @type {HTMLElement & { _cfobDragEndedAt?: number, _dragSetup?: boolean }} */ (document.getElementById("cfob-launcher-btn"));
      if (!launcherBtn) {
        launcherBtn = document.createElement("button");
        launcherBtn.id = "cfob-launcher-btn";
        launcherBtn.title = "Browse Outputs";
        launcherBtn.setAttribute("aria-label", "Browse Outputs");
        launcherBtn.onclick = () => {
          // Ignore the click synthesized right after a drag ends
          if (launcherBtn._cfobDragEndedAt && Date.now() - launcherBtn._cfobDragEndedAt < 300) return;
          this.toggleUi();
        };
      }

      const placement = this.settings.launcherPlacement;

      if (placement === 'sidebar') {
        const sidebarTarget = findSidebarTarget();
        if (sidebarTarget) {
          if (launcherBtn.className !== SIDEBAR_CLASS) launcherBtn.className = SIDEBAR_CLASS;
          launcherBtn.style.border = "";
          launcherBtn.classList.toggle("side-bar-button-selected", Boolean(this.isUiVisible));
          if (!launcherBtn.querySelector('.side-bar-button-content')) {
            launcherBtn.innerHTML = SIDEBAR_HTML;
          }
          const templatesBtn = sidebarTarget.querySelector('.templates-tab-button, [data-testid="templates-button"]');
          const desiredNextSibling = templatesBtn || null;
          if (launcherBtn.parentElement !== sidebarTarget || launcherBtn.nextElementSibling !== desiredNextSibling) {
            if (templatesBtn) {
              sidebarTarget.insertBefore(launcherBtn, templatesBtn);
            } else {
              sidebarTarget.appendChild(launcherBtn);
            }
          }
          return;
        }
        // Sidebar not available — fall through to floating
      }

      if (placement === 'action-bar') {
        const isVisible = (/** @type {HTMLElement | null} */ el) => {
          if (!el) return false;
          const style = window.getComputedStyle(el);
          if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
          const rect = el.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        };
        const loginAnchor = isVisible(/** @type {HTMLElement | null} */ (findLoginAnchor())) ? /** @type {HTMLElement | null} */ (findLoginAnchor()) : null;
        const tourAnchor = loginAnchor ? null : (isVisible(/** @type {HTMLElement | null} */ (document.querySelector('[aria-label="Take a tour of App Mode"]'))) ? /** @type {HTMLElement | null} */ (document.querySelector('[aria-label="Take a tour of App Mode"]')) : null);
        // In app mode on mobile, fall back to the "More" menu button when login/tour are unavailable
        // Detect app mode by the presence of the mobile workflow selector or the "Graph mode" button
        const isAppMode = !!document.querySelector('[data-testid="linear-mobile-workflows"]') || !!document.querySelector('[aria-label="Graph mode, workflow actions"]');
        const menuAnchor = (!loginAnchor && !tourAnchor && isAppMode && window.innerWidth < 768)
          ? (isVisible(document.querySelector('[aria-label="More"]')) ? document.querySelector('[aria-label="More"]') : null)
          : null;
        // @ts-ignore
        const standardMenuTarget = window.app?.menu?.actionsGroup?.element || window.app?.menu?.settingsGroup?.element;
        const anchor = loginAnchor || tourAnchor || menuAnchor;
        const actionBarTarget = anchor ? anchor.parentElement : (findActionBarTarget() || standardMenuTarget);
        if (actionBarTarget) {
          if (!launcherBtn.classList.contains('cfob-launcher-actionbar')) {
            launcherBtn.className = ACTION_BAR_CLASS;
          }
          launcherBtn.style.border = "";
          if (launcherBtn.innerHTML !== ICONS.logo) launcherBtn.innerHTML = ICONS.logo;
          launcherBtn.classList.toggle("side-bar-button-selected", Boolean(this.isUiVisible));
          if (anchor) {
            // Sit immediately to the left of the login/current-user button, tour button, or menu button.
            if (launcherBtn.nextElementSibling !== anchor) {
              anchor.parentElement?.insertBefore(launcherBtn, anchor);
            }
          } else if (launcherBtn.parentElement !== actionBarTarget) {
            actionBarTarget.appendChild(launcherBtn);
          }
          return;
        }
        // Action bar not available — fall through to floating
      }

      if (placement === 'hook') {
        const hook = parseHookTarget(localStorage.getItem('cfob_launcher_hook_element'));
        const hookTarget = hook ? document.querySelector(hook.selector) : null;
        if (hook && hookTarget && hookTarget.parentElement) {
          if (!launcherBtn.classList.contains('cfob-launcher-hook')) {
            launcherBtn.className = "cfob-launcher-hook";
          }
          launcherBtn.style.border = "";
          if (launcherBtn.innerHTML !== ICONS.logo) launcherBtn.innerHTML = ICONS.logo;
          launcherBtn.classList.toggle("side-bar-button-selected", Boolean(this.isUiVisible));
          const parent = hookTarget.parentElement;
          if (hook.side === 'after') {
            // Sit right after the target: insert before whatever follows it.
            const next = hookTarget.nextElementSibling;
            if (launcherBtn.previousElementSibling !== hookTarget) {
              if (next && next !== launcherBtn) parent.insertBefore(launcherBtn, next);
              else parent.appendChild(launcherBtn);
            }
          } else if (launcherBtn.nextElementSibling !== hookTarget) {
            parent.insertBefore(launcherBtn, hookTarget);
          }
          return;
        }
        // Hook target not found — fall through to floating
      }

      // Floating placement (or fallback)
      if (launcherBtn.className !== "floating") launcherBtn.className = "floating";
      launcherBtn.style.border = "";
      if (launcherBtn.innerHTML !== ICONS.logo) launcherBtn.innerHTML = ICONS.logo;
      if (launcherBtn.parentElement !== document.body) {
        document.body.appendChild(launcherBtn);
      }
      applyFloatingPosition(launcherBtn);
    };

    updateButtonPlacement();

    // Set up floating drag once (track via property to avoid re-adding listeners)
    const launcherBtn = /** @type {HTMLElement & { _dragSetup?: boolean; _cfobDragEndedAt?: number }} */ (document.getElementById("cfob-launcher-btn"));
    if (launcherBtn && !launcherBtn._dragSetup) {
      launcherBtn._dragSetup = true;
      setupFloatingDrag(launcherBtn);
    }

    // Keep the floating launcher inside the viewport when the window resizes
    const clampFloatingToViewport = (/** @type {HTMLElement | null} */ btn) => {
      if (!btn || btn.className !== "floating") return;
      const rect = btn.getBoundingClientRect();
      const maxLeft = Math.max(0, window.innerWidth - rect.width);
      const maxTop = Math.max(0, window.innerHeight - rect.height);
      const currentLeft = btn.style.left ? parseFloat(btn.style.left) : rect.left;
      const currentTop = btn.style.top ? parseFloat(btn.style.top) : rect.top;
      const clampedLeft = Math.min(Math.max(0, currentLeft), maxLeft);
      const clampedTop = Math.min(Math.max(0, currentTop), maxTop);
      if (clampedLeft !== currentLeft) btn.style.left = `${clampedLeft}px`;
      if (clampedTop !== currentTop) btn.style.top = `${clampedTop}px`;
      // Persist the clamped position so it survives subsequent placement updates
      const finalLeft = clampedLeft || 0;
      const finalTop = clampedTop || 0;
      localStorage.setItem('cfob_launcher_pos', JSON.stringify({ left: finalLeft, top: finalTop }));
    };

    window.addEventListener('resize', () => {
      const btn = document.getElementById("cfob-launcher-btn");
      if (btn) clampFloatingToViewport(btn);
    });

    /** @type {ReturnType<typeof setTimeout> | null} */
    let debounceTimer = null;
    this._launcherObserver = new MutationObserver(() => {
      if (debounceTimer) return;
      debounceTimer = setTimeout(() => {
        debounceTimer = null;
        updateButtonPlacement();
        // ComfyUI's chrome may mount after our init; recompute offsets when it appears.
        if (this.settings.panelOffsets) this.settings.setPanelOffsets(true);
        if (!canvasContObserved) {
          const canvasCont = document.getElementById('graph-canvas-container');
          if (canvasCont) {
            this._launcherObserver?.observe(canvasCont, { attributes: true, attributeFilter: ['style', 'class'] });
            canvasContObserved = true;
          }
        }
      }, 50);
    });

    this._launcherObserver.observe(document.body, {
      childList: true,
      subtree: true
    });

    const canvasCont = document.getElementById('graph-canvas-container');
    if (canvasCont) {
      this._launcherObserver.observe(canvasCont, { attributes: true, attributeFilter: ['style', 'class'] });
      canvasContObserved = true;
    }
  }

  /**
   * Enter element picker mode. The browser UI (panel, modals, launcher) is hidden
   * so the user can click the ComfyUI page underneath; a click only marks a
   * candidate. OK commits it as the hook target, Cancel reverts to the placement
   * the user had before, and either button restores the UI.
   * @param {'sidebar' | 'action-bar' | 'floating' | 'hook'} [previousPlacement]
   */
  startElementPicker(previousPlacement) {
    if (this.isPickingElement) return;
    this.isPickingElement = true;

    // Remember what to restore, then get the browser UI out of the way.
    this._pickRestore = {
      uiVisible: this.isUiVisible,
      placement: previousPlacement || this.settings.launcherPlacement,
    };
    clearTimeout(this.transitionTimer);
    if (this.root) {
      this.root.style.display = 'none';
      this.isUiVisible = false;
    }
    document.body.classList.add('cfob-pick-mode');

    /** @type {HTMLElement | null} */
    let picked = null;
    /** @type {'before' | 'after'} */
    let side = 'before';

    const banner = document.createElement('div');
    banner.id = 'cfob-pick-banner';
    banner.innerHTML = `
      <span>Click an element to place the launcher next to it. Click it again to switch sides.</span>
      <button type="button" class="cfob-pick-ok" disabled>OK</button>
      <button type="button" class="cfob-pick-cancel">Cancel</button>
    `;
    document.body.appendChild(banner);

    // Live preview of where the launcher would land. Shown only after a click —
    // tracking the pointer instead is too jittery to be readable.
    const preview = document.createElement('button');
    preview.id = 'cfob-launcher-preview';
    preview.type = 'button';
    preview.disabled = true;
    preview.tabIndex = -1;
    preview.setAttribute('aria-hidden', 'true');
    preview.innerHTML = ICONS.logo;
    preview.hidden = true;
    document.body.appendChild(preview);

    const okBtn = /** @type {HTMLButtonElement} */ (banner.querySelector('.cfob-pick-ok'));
    const cancelBtn = /** @type {HTMLButtonElement} */ (banner.querySelector('.cfob-pick-cancel'));

    /** Shows where the launcher would land — only ever called for a clicked element. */
    const showPreview = (/** @type {HTMLElement} */ target, /** @type {'before' | 'after'} */ side) => {
      // Preview only where the launcher can actually go: a sibling of the target.
      const parent = target.parentElement;
      if (!parent) {
        preview.hidden = true;
        return;
      }
      if (side === 'after') {
        const next = target.nextElementSibling;
        if (next) parent.insertBefore(preview, next);
        else parent.appendChild(preview);
      } else {
        parent.insertBefore(preview, target);
      }
      preview.hidden = false;
    };

    /**
     * Marks `target` as the candidate — only a click does this. Clicking the
     * element that is already the candidate flips which side the launcher sits on.
     */
    const setCandidate = (/** @type {HTMLElement} */ target) => {
      if (target === picked) {
        side = side === 'before' ? 'after' : 'before';
      } else {
        picked?.classList.remove('cfob-pick-selected');
        picked = target;
        picked.classList.add('cfob-pick-selected');
        side = 'before';
      }
      showPreview(target, side);
      okBtn.disabled = false;
    };

    const onClick = (/** @type {MouseEvent} */ e) => {
      const target = e.target instanceof HTMLElement ? e.target : null;
      if (!target || banner.contains(target) || target === preview) return;
      // Keep the click from reaching ComfyUI's own handlers while picking.
      e.preventDefault();
      e.stopPropagation();
      if (!generateSelector(target)) return;
      setCandidate(target);
    };

    const onKeyDown = (/** @type {KeyboardEvent} */ e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        this.finishElementPicker(false);
      }
    };

    okBtn.addEventListener('click', () => {
      const selector = picked ? generateSelector(picked) : null;
      if (!selector) return;
      localStorage.setItem('cfob_launcher_hook_element', formatHookTarget(selector, side));
      this.finishElementPicker(true);
    });
    cancelBtn.addEventListener('click', () => this.finishElementPicker(false));

    document.addEventListener('click', onClick, true);
    document.addEventListener('keydown', onKeyDown, true);

    this._pickCleanup = () => {
      document.removeEventListener('click', onClick, true);
      document.removeEventListener('keydown', onKeyDown, true);
      picked?.classList.remove('cfob-pick-selected');
      preview.remove();
      banner.remove();
      document.body.classList.remove('cfob-pick-mode');
      this.isPickingElement = false;

      // Restore the UI exactly as the user left it — an open modal keeps its
      // state because it was only hidden, never closed.
      const restore = this._pickRestore;
      this._pickRestore = null;
      const commit = this._pickCommit;
      this._pickCommit = false;
      if (restore?.uiVisible && this.root) {
        this.root.style.display = 'flex';
        this.root.classList.remove('cfob-hidden');
        this.isUiVisible = true;
      }
      if (commit) this.injectLauncherButton();
      else if (restore) this.settings.revertLauncherPlacement(restore.placement);
      this._pickCleanup = null;
    };
  }

  /**
   * Leaves picker mode, restoring the browser UI.
   * @param {boolean} commit - true to keep the picked target, false to revert.
   */
  finishElementPicker(commit) {
    this._pickCommit = commit;
    if (this._pickCleanup) this._pickCleanup();
  }

  cancelElementPicker() {
    this.finishElementPicker(false);
  }

  /**
   * @param {KeyboardEvent} e
   */
  handleDocumentKeydown(e) {
    const focusIsInside = this.root?.contains(document.activeElement) || false;
    if (!focusIsInside) return;

    const activeDialog = this.settings.modals.getActive();
    const isFullView = this.$("cfobFullViewModal").classList.contains('active');

    const target = /** @type {HTMLElement} */ (e.target);
    const isEditing = target && (
      (target.tagName === 'INPUT' && !['checkbox', 'radio', 'button', 'submit', 'reset'].includes(/** @type {HTMLInputElement} */(target).type)) ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'SELECT' ||
      target.isContentEditable
    );

    const noModalOpen = !activeDialog;
    const key = e.key.toLowerCase();
    const searchInput = this.$("cfobSearchInput");

    if (e.key === 'Escape') {
      if (activeDialog) return;
      e.preventDefault();
      if (!this.$("cfobSearchSuggestions").hidden) {
        e.stopPropagation(); this.search.hideSearchSuggestions();
      } else if (document.activeElement === searchInput) {
        e.stopPropagation();
        this.search.hideSearchSuggestions();
        if (this.settings.fullViewMode) {
          this.$("cfobFullViewImg")?.focus();
        } else {
          this.focusFirstGridItem();
        }
      } else if (isFullView && noModalOpen) {
        e.preventDefault(); e.stopPropagation(); this.fullView.closeFullView();
      } else if (this.isUiVisible) {
        e.stopPropagation();
        if (isEditing) target.blur();
        else if (this.selectedImages.size > 0) this.selection.clearSelection();
        else this.hideWithTransition();
      }
      return;
    } else if ((e.ctrlKey || e.metaKey) && e.shiftKey && key === 's') {
      e.preventDefault(); e.stopPropagation(); this.fetchServerImages();
    }

    if (!activeDialog && (e.ctrlKey || e.metaKey) && !e.altKey && /^[1-4]$/.test(e.key)) {
      e.preventDefault();
      e.stopPropagation();
      /** @type {Record<string, string>} */
      const viewModes = { '1': 'compact', '2': 'grid', '3': 'list', '4': 'full' };
      this.settings.setViewMode(viewModes[e.key]);
      return;
    }

    if (isEditing) return;

    if (noModalOpen && !e.ctrlKey && !e.altKey && !e.metaKey && key >= '1' && key <= '9') {
      if (isFullView || (this.isUiVisible && !this.root?.classList.contains('cfob-hidden'))) {
        e.preventDefault();
        e.stopPropagation();
        this.handleFieldCopyKey(key);
        return;
      }
    }

    if (isFullView && noModalOpen && !e.ctrlKey) {
      this.fullView.handleKeydown(e);
    } else if (this.isUiVisible && !this.root?.classList.contains('cfob-hidden')) {
      this.selection.handleKeydown(e);
    }
  }

  bindEvents() {
    this.$("cfobCloseBrowserBtn").addEventListener('click', () => this.hideWithTransition());
    this.$("cfobRefreshBtn").addEventListener('click', () => this.fetchServerImages());
    this.$("cfobMenuBtn").addEventListener('click', () => this.settings.toggleOptionsMenu());
    const searchInput = this.$("cfobSearchInput");
    /** @type {ReturnType<typeof setTimeout> | null} */
    let searchInputTimer = null;
    let searchWasFocusedOnPointerDown = false;
    searchInput.addEventListener('pointerdown', () => {
      searchWasFocusedOnPointerDown = document.activeElement === searchInput;
    });
    searchInput.addEventListener('click', () => {
      if (searchWasFocusedOnPointerDown) {
        this.search.toggleSearchSuggestions();
      }
      searchWasFocusedOnPointerDown = false;
    });
    searchInput.addEventListener('input', () => {
      this.searchHistoryIndex = this.searchHistory.length;
      this.activeSearchSuggestionIndex = -1;
      this.search.allowEmptySearchSuggestions = false;
      if (searchInputTimer !== null) clearTimeout(searchInputTimer);
      searchInputTimer = setTimeout(() => {
        this.gallery.filterGallery();
        this.search.refreshSearchSuggestionsIfOpen();
        searchInputTimer = null;
      }, 150);
    });
    searchInput.addEventListener('focus', () => this.search.refreshSearchSuggestionsIfOpen());
    searchInput.addEventListener('blur', () => {
      this.search.addSearchHistory();
      this.search.hideSearchSuggestions();
    });
    searchInput.addEventListener('keydown', (e) => this.search.handleSearchKeydown(e));

    this.$("cfobClearSearchBtn").addEventListener('click', () => {
      if (searchInputTimer !== null) clearTimeout(searchInputTimer);
      searchInputTimer = null;
      /** @type {HTMLInputElement} */ (searchInput).value = "";
      this.searchHistoryIndex = this.searchHistory.length;
      this.gallery.filterGallery();
      this.search.hideSearchSuggestions();
      this.search.refreshSearchSuggestionsIfOpen();
    });

    this.fullView.bindEvents();

    this.$("cfobActionClear").addEventListener('click', () => this.selection.clearSelection());
    this.$("cfobActionDelete").addEventListener('click', () => this.actions.deleteSelected());
    this.$("cfobActionRename").addEventListener('click', () => this.actions.renameSelected());
    this.$("cfobActionMove").addEventListener('click', () => this.actions.moveSelected());
    this.$("cfobActionSendChips").addEventListener('click', (e) => {
      e.stopPropagation();
      this.actions.sendChipsToBasket(null, /** @type {HTMLElement} */ (e.currentTarget));
    });
    this.$("cfobActionDownload").addEventListener('click', () => this.actions.downloadSelected());
    this.$("cfobActionOpen").addEventListener('click', () => this.actions.loadWorkflowSelected());
    this.$("cfobActionInspect").addEventListener('click', () => this.actions.inspectSelected());

    this.settings.bindEvents();

    document.addEventListener('keydown', (e) => this.handleDocumentKeydown(e), { capture: true });

    const resizer = this.$("cfob-resizer");
    let isResizing = false;
    /** @type {number} */
    let startX;
    /** @type {number} */
    let startY;
    /** @type {number} */
    let startWidth;
    /** @type {number} */
    let startHeight;

    resizer.addEventListener('mousedown', (e) => {
      isResizing = true;
      startX = e.clientX;
      startY = e.clientY;
      const bounds = this.root?.getBoundingClientRect();
      startWidth = bounds?.width || 250;
      startHeight = bounds?.height || 250;
      resizer.classList.add('dragging');
      document.body.style.userSelect = 'none';
    });

    window.addEventListener('mousemove', (e) => {
      if (!isResizing) return;
      if (this.settings.browserMode === 'right') {
        this.updateSidebarSize(startWidth - (e.clientX - startX), null);
      } else if (this.settings.browserMode === 'left') {
        this.updateSidebarSize(startWidth + (e.clientX - startX), null);
      } else if (this.settings.browserMode === 'down') {
        this.updateSidebarSize(null, startHeight - (e.clientY - startY));
      } else if (this.settings.browserMode === 'up') {
        this.updateSidebarSize(null, startHeight + (e.clientY - startY));
      }
    });

    window.addEventListener('mouseup', () => {
      if (isResizing) {
        isResizing = false;
        resizer.classList.remove('dragging');
        document.body.style.userSelect = '';
        localStorage.setItem('comfy_folder_browser_width', String(this.sidebarWidth || 250));
        localStorage.setItem('comfy_folder_browser_height', String(this.sidebarHeight || 200));
      }
    });

    // Keep panel offsets in sync with ComfyUI's chrome when the window resizes.
    window.addEventListener('resize', () => {
      if (this.settings.panelOffsets) this.settings.setPanelOffsets(true);
    });

    /** @type {number | undefined} */
    let autoHideTimer;
    /** @type {number | undefined} */
    let autoShowTimer;

    document.addEventListener('mousedown', (e) => {
      const target = /** @type {HTMLElement} */ (e.target);
      if (!target) return;
      const isOpen = this.isUiVisible && !this.root?.classList.contains('cfob-hidden');

      if (this.settings.autoHide && isOpen) {
        const isOutsideRoot = !this.root?.contains(target);
        const isOutsidePopover = !(this.settings.activePopover && this.settings.activePopover.contains(target));

        if (isOutsideRoot && isOutsidePopover) {
          const isToggleButton = target.closest('#cfob-launcher-btn') || target.closest('button[id*="browser"]');
          if (!isToggleButton) {
            this.hideWithTransition();
          }
        }
      }
    });

    this.root?.addEventListener('mouseleave', () => {
      if (this.settings.autoHide && this.settings.browserMode !== 'full') {
        autoHideTimer = setTimeout(() => {
          this.hideWithTransition();
        }, 350);
      }
    });

    this.root?.addEventListener('mouseenter', () => {
      clearTimeout(autoHideTimer);
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.settings.autoHide || this.settings.browserMode === 'full') return;

      const isClosed = !this.isUiVisible || this.root?.classList.contains('cfob-hidden');
      if (!isClosed) return;

      const edgeThreshold = 15;
      let hitEdge = false;

      if (this.settings.browserMode === 'left' && e.clientX <= edgeThreshold) hitEdge = true;
      else if (this.settings.browserMode === 'right' && e.clientX >= window.innerWidth - edgeThreshold) hitEdge = true;
      else if (this.settings.browserMode === 'up' && e.clientY <= edgeThreshold) hitEdge = true;
      else if (this.settings.browserMode === 'down' && e.clientY >= window.innerHeight - edgeThreshold) hitEdge = true;

      if (hitEdge) {
        if (!autoShowTimer) {
          autoShowTimer = setTimeout(() => {
            this.showWithTransition();
            autoShowTimer = undefined;
          }, 300);
        }
      } else {
        clearTimeout(autoShowTimer);
        autoShowTimer = undefined;
      }
    });
  }

  focusFirstGridItem() {
    this.selection.focusFirstGridItem();
  }

  /** @param {string} msg  */
  showToast(msg) {
    const t = this.$("cfobToastNotice");
    t.innerText = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2000);
  }

  /** @param {string} u */
  escapeHtml(u) {
    return (u || "").toString().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  applySort() {
    if (this.settings.currentSort === 'name_asc') {
      this.loadedImages.sort((a, b) => a.name.localeCompare(b.name));
    } else if (this.settings.currentSort === 'name_desc') {
      this.loadedImages.sort((a, b) => b.name.localeCompare(a.name));
    } else if (this.settings.currentSort === 'mtime_asc') {
      this.loadedImages.sort((a, b) => (a.mtime || 0) - (b.mtime || 0));
    } else if (this.settings.currentSort === 'mtime_desc') {
      this.loadedImages.sort((a, b) => (b.mtime || 0) - (a.mtime || 0));
    } else if (this.settings.currentSort === 'default') {
      const orderMap = new Map(this.serverOrder.map((name, i) => [name, i]));
      this.loadedImages.sort((a, b) => {
        const idxA = orderMap.has(a.name) ? orderMap.get(a.name) : 999999;
        const idxB = orderMap.has(b.name) ? orderMap.get(b.name) : 999999;
        // @ts-ignore
        return idxA - idxB;
      });
    }
  }

  updateRefreshButtonAnimation() {
    const refreshButton = this.$("cfobRefreshBtn");
    const isFetching = this.serverImageFetchCount > 0;
    refreshButton.classList.toggle("is-fetching", isFetching || this.isIdleParsing);
    refreshButton.title = isFetching
      ? "Fetching images from server..."
      : this.isIdleParsing
        ? "Parsing image metadata..."
        : "Sync outputs from Server";
  }

  /** @param {boolean} isActive */
  setIdleParsingActive(isActive) {
    this.isIdleParsing = isActive;
    this.updateRefreshButtonAnimation();
    if (!isActive && this.serverImageFetchCount === 0) this.search.refreshSearchSuggestionsIfOpen();
  }

  async fetchServerImages() {
    const isFirstLoad = this.loadedImages.length === 0;

    if (isFirstLoad) {
      this.$("cfobGalleryGrid").innerHTML = "";
      this.$("cfobEmptyStateTitle").innerText = "Loading Outputs...";
      this.$("cfobEmptyStateDesc").innerText = "Fetching image list from server...";
      this.$("cfobEmptyState").style.display = "block";
    }

    this.serverImageFetchCount++;
    this.updateRefreshButtonAnimation();

    try {
      const response = await fetch("/comfyui-output-browser/images");
      const allFilesData = await response.json();
      this.serverOrder = allFilesData.map((/** @type {any} */ f) => f.name);

      const existingMap = new Map(this.loadedImages.map(img => [img.name, img]));
      const validImages = [];
      const newFilesToFetch = [];
      let existingImagesChanged = false;

      for (const fileObj of allFilesData) {
        if (existingMap.has(fileObj.name)) {
          const image = existingMap.get(fileObj.name);
          if (image) {
            if (image.mtime !== fileObj.mtime) {
              this.search.removeImageKeywords(image.name);
              image.mtime = fileObj.mtime;
              image.isParsed = false;
              image.prompt = null;
              image.workflow = null;
              image.url = this.api.getImageUrl(fileObj.name) + (fileObj.mtime ? `&t=${fileObj.mtime}` : '');
              this.gallery.invalidateCard(image.name);
              existingImagesChanged = true;
            }
            validImages.push(image);
          }
        } else {
          newFilesToFetch.push(fileObj);
        }
      }

      const newImages = newFilesToFetch.map((fileObj) => {
        let url = this.api.getImageUrl(fileObj.name);
        if (fileObj.mtime) url += `&t=${fileObj.mtime}`;
        return { name: fileObj.name, mtime: fileObj.mtime, url, prompt: null, workflow: null, isParsed: false, isParsing: false };
      });

      if (newImages.length > 0 || validImages.length !== this.loadedImages.length || existingImagesChanged) {
        this.loadedImages = [...newImages, ...validImages];
        this.search.rebuildKeywordDictionary();
        this.applySort();

        const validNames = new Set(this.loadedImages.map(img => img.name));
        for (const sel of this.selectedImages) {
          if (!validNames.has(sel)) this.selectedImages.delete(sel);
        }

        this.selection.updateActionBar();
        this.gallery.filterGallery();
      } else if (isFirstLoad) {
        this.applySort();
        this.gallery.filterGallery();
      }

      if (this.settings.fullViewMode && this.filteredImages.length && !this.$("cfobFullViewModal").classList.contains('active')) {
        const img = this.filteredImages[this.lastSelectedIdx] || this.filteredImages[0];
        this.fullView.openFullView(img);
      }

      this.api.startIdleParsing();
    } catch (err) {
      this.$("cfobEmptyStateTitle").innerText = "Connection Error";
      this.$("cfobEmptyStateDesc").innerText = "Failed to load outputs from server.";
      this.$("cfobEmptyState").style.display = "block";
      // eslint-disable-next-line no-console
      console.error("Output Browser Error:", err);
    } finally {
      this.serverImageFetchCount--;
      this.updateRefreshButtonAnimation();
      if (this.serverImageFetchCount === 0 && !this.isIdleParsing) this.search.refreshSearchSuggestionsIfOpen();
    }
  }

  /**
   * @param {CFOB_Image} imgData
   * @param {string} pathString
   */
  resolveFieldValue(imgData, pathString) {
    if (!pathString) return null;
    const candidates = pathString.split(/[\n,]+/).map((/** @type {string} */ s) => s.trim()).filter(Boolean);
    const { prompt, workflow } = imgData;
    const getNestedValue = (/** @type {any} */ object, /** @type {string} */ propertyPath) => {
      if (propertyPath === '__self__') return object;
      const parts = propertyPath.replace(/\[(\d+)\]/g, '.$1').split('.').filter(Boolean);
      let value = object;
      for (const part of parts) {
        if (value === null || value === undefined) return undefined;
        value = value[part];
      }
      return value;
    };

    for (const path of candidates) {
      const parts = path.split('.');
      if (parts.length < 2) continue;

      const target = parts[0].trim();
      const prop = parts.slice(1).join('.').trim();
      const match = target.match(/^(.+)\[(\d+)\]$/);
      const targetName = match ? match[1] : target;
      const targetIdx = match ? parseInt(match[2], 10) : 0;

      if (targetName === '@prompt' || targetName === '@workflow') {
        const value = getNestedValue(targetName === '@prompt' ? prompt : workflow, prop);
        if (value !== undefined && value !== null && value !== '') return value;
        continue;
      }

      let matchCount = 0;
      if (prompt) {
        for (const [id, node] of Object.entries(prompt)) {
          const classType = node.class_type || '', title = node._meta?.title || '';
          if (id === targetName || classType.toLowerCase() === targetName.toLowerCase() || title.toLowerCase() === targetName.toLowerCase()) {
            if (matchCount === targetIdx) {
              const val = prop.startsWith('node.')
                ? getNestedValue(node, prop.slice('node.'.length))
                : getNestedValue(node, prop.startsWith('inputs.') ? prop : `inputs.${prop}`);
              const isConnection = Array.isArray(val) && val.length >= 2 && typeof val[0] === 'string' && !isNaN(val[1]);
              if (val !== undefined && val !== null && val !== '' && !isConnection) return val;
            }
            matchCount++;
          }
        }
      }

      if (workflow?.nodes) {
        matchCount = 0;
        for (const node of workflow.nodes) {
          const classType = node.type || '', title = node.title || '', id = String(node.id);
          if (id === targetName || classType.toLowerCase() === targetName.toLowerCase() || title.toLowerCase() === targetName.toLowerCase()) {
            if (matchCount === targetIdx) {
              if (node.widgets_values_named?.[prop] !== undefined) return node.widgets_values_named[prop];
              const wMatch = prop.match(/^widget\[(\d+)\]$/);
              if (wMatch && node.widgets_values) return node.widgets_values[parseInt(wMatch[1], 10)];
              const val = getNestedValue(node, prop);
              if (val !== undefined && val !== null && val !== '') return val;
            }
            matchCount++;
          }
        }
      }
    }
    return null;
  }

  /** @param {string} digitChar */
  async handleFieldCopyKey(digitChar) {
    const fieldIdx = parseInt(digitChar, 10) - 1;
    const config = this.settings.fieldConfigs[fieldIdx];
    if (!config) return;

    let targetImg = null;
    const fvModal = this.$("cfobFullViewModal");
    const isFullView = fvModal && fvModal.classList.contains('active');

    if (isFullView) {
      targetImg = this.filteredImages[this.fullView.currentImageIndex];
    } else {
      if (this.selectedImages.size === 1) {
        const filename = Array.from(this.selectedImages)[0];
        targetImg = this.loadedImages.find(i => i.name === filename);
      } else if (this.lastSelectedIdx !== -1 && this.filteredImages[this.lastSelectedIdx]) {
        targetImg = this.filteredImages[this.lastSelectedIdx];
      } else if (this.selectedImages.size > 0) {
        const filename = Array.from(this.selectedImages)[0];
        targetImg = this.loadedImages.find(i => i.name === filename);
      }
    }

    if (!targetImg) return;

    if (!targetImg.isParsed) {
      this.showToast("Loading metadata...");
      await this.api.loadMetadata(targetImg);
      this.gallery.renderGallery();
      this.fullView.updateFullViewUI();
    }

    const val = this.resolveFieldValue(targetImg, config.paths);
    if (val !== null && val !== undefined && val !== '') {
      navigator.clipboard.writeText(String(val)).then(() => {
        this.showToast(`Copied ${config.label}: ${val}`);
      });
    } else {
      this.showToast(`Field "${config.label}" is empty or not found.`);
    }
  }

  /** @param {CFOB_Image} img */
  getCardFieldsHtml(img) {
    let fieldsHtml = '';
    this.settings.fieldConfigs.forEach((/** @type {{ paths: any; label: any; }} */ cfg) => {
      const val = this.resolveFieldValue(img, cfg.paths);
      const displayVal = val !== null ? String(val) : (img.isParsed ? '—' : 'Loading...');
      const emptyClass = val === null ? 'empty' : '';

      fieldsHtml += ` <div class="field-row">
                        <div class="field-label">${this.escapeHtml(cfg.label)}</div>
                        <div class="field-value-container">
                          <div class="field-value ${emptyClass}">${this.escapeHtml(displayVal)}</div>
                          ${val !== null ? `<button class="icon-btn copy-val-btn" data-val="${encodeURIComponent(String(val))}" title="Copy">${ICONS.copy}</button>` : ''}
                        </div>
                      </div>`;
    });
    return fieldsHtml;
  }
}

const browser = new ComfyOutputBrowser();
// Exposed so an e2e harness can reach the real instance (e.g. to re-enable the
// launcher in standalone mode, where it is off by default).
// @ts-ignore
window.__cfob = browser;

// @ts-ignore Check the flag we injected via __init__.py to prevent the 404 network request
if (window.CFOB_STANDALONE) {
  // eslint-disable-next-line no-console
  console.log("Running Output Browser in standalone mode.");
  window.addEventListener('DOMContentLoaded', () => {
    browser.init();

    // Lock view format for full-screen mode
    browser.settings.setBrowserMode('full');
    browser.showWithTransition();

    // Hide resizer grip
    const resizer = document.getElementById("cfob-resizer");
    if (resizer) resizer.style.display = 'none';
  });
} else {
  // We are inside ComfyUI, safe to import app.js
  // @ts-ignore
  import("../../scripts/app.js").then((module) => {
    const app = module.app;
    app.registerExtension({
      name: "Comfy.OutputBrowser",
      commands: [
        {
          id: "OutputBrowser.Toggle",
          label: "Output Browser: Toggle",
          function: () => { browser.toggleUi(); },
        },
        {
          id: "OutputBrowser.FocusSearch",
          label: "Output Browser: Focus Search",
          function: () => { browser.showWithTransition(); },
        }
      ],
      keybindings: [
        {
          combo: { key: "?", ctrl: true, shift: true },
          commandId: "OutputBrowser.Toggle"
        }
      ],
      async setup() {
        // @ts-ignore
        window.app = app;
        browser.init();
      }
    });
  }).catch((err) => {
    // eslint-disable-next-line no-console
    console.error("Failed to load ComfyUI context:", err);
  });
}

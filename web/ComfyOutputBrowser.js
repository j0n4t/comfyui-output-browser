// @ts-ignore
import { app } from "../../scripts/app.js";
import { CFOB_QUERY_STYLES, CFOB_STYLES } from "./assets/css.js";
import ICONS from "./assets/icons.js";
import CFOB_API from "./CFOB_API.js";
import CFOB_FullView, { CFOB_FULL_VIEW_HTML, CFOB_FULL_VIEW_STYLES } from "./CFOB_FullView.js";
import CFOB_Settings, { CFOB_SETTINGS_MODALS_HTML, CFOB_SETTINGS_MODALS_STYLES } from "./CFOB_Settings.js";
import CFOB_Search from "./CFOB_Search.js";
import CFOB_Gallery from "./CFOB_Gallery.js";
import CFOB_ImageActions from "./CFOB_ImageActions.js";
import CFOB_Selection from "./CFOB_Selection.js";

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
    <button class="btn" id="cfobMenuBtn" title="Options">${ICONS.more}<span>Options</span></button>
    <button class="btn btn-danger" id="cfobCloseBrowserBtn">${ICONS.close}<span>Close</span></button>
  </div>
</div>

<div class="main-container" id="cfobMainContainer">
  <div class="drop-overlay">${ICONS.drop}<h3 style="margin: 0.625em 0 0 0; color: var(--color-text-inverse);">Drop PNGs Here</h3></div>
  <div class="gallery-container view-grid" id="cfobGalleryGrid"></div>
  <div class="empty-state" id="cfobEmptyState">
    ${ICONS.picture}
    <h3 id="cfobEmptyStateTitle">No Images Loaded</h3><p id="cfobEmptyStateDesc">Click Refresh to load ComfyUI outputs, or drop PNGs anywhere to inspect.</p>
  </div>
  
  <div id="cfobActionBar" class="action-bar">
    <span id="cfobSelectionCount" style="font-weight: 600; color: var(--color-text-inverse); min-width: 5em;">1 selected</span>
    <div style="width: 1px; height: 1.25em; background: var(--color-border);"></div>
    <button class="btn btn-primary" id="cfobActionOpen">${ICONS.workflow}<span>Load Workflow</span></button>
    <button class="btn" id="cfobActionInspect">${ICONS.inspect}<span>Inspect Nodes</span></button>
    <button class="btn" id="cfobActionDownload">${ICONS.download}<span>Download</span></button>
    <button class="btn" id="cfobActionRename">${ICONS.rename}<span>Rename</span></button>
    <button class="btn" id="cfobActionMove">${ICONS.move}<span>Move</span></button>
    <button class="btn btn-danger" id="cfobActionDelete">${ICONS.trash}<span>Delete</span></button>
    <div style="width: 1px; height: 1.25em; background: var(--color-border);"></div>
    <button class="icon-btn" id="cfobActionClear" title="Clear Selection">${ICONS.close}</button>
  </div>
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
    this.injectLauncherButton();
    this.bindEvents();

    const savedView = localStorage.getItem('comfy_folder_browser_view') || 'grid';
    this.settings.setViewMode(savedView);
    this.settings.setGridSize(this.settings.gridSize);
    this.settings.setBrowserMode(this.settings.browserMode);
    this.settings.setConstrainFullView(this.settings.constrainFullView);
    this.root.style.setProperty('--grid-size', `${this.settings.gridSize}px`);
    this.root.style.setProperty('--compact-size', `${Math.max(120, this.settings.gridSize - 180)}px`);
    if (this.settings.scrollDir === 'horizontal') {
      this.$("cfobMainContainer").classList.add('scroll-horizontal');
    }
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
    if (width !== null) {
      this.sidebarWidth = Math.max(300, Math.min(width, window.innerWidth - 100));
      this.settings.sidebarWidth = this.sidebarWidth;
      this.root.style.width = `${this.sidebarWidth}px`;
    }
    if (height !== null) {
      this.sidebarHeight = Math.max(200, Math.min(height, window.innerHeight - 100));
      this.settings.sidebarHeight = this.sidebarHeight;
      this.root.style.height = `${this.sidebarHeight}px`;
    }
  }

  showWithTransition() {
    if (!this.root) return;
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
    if (this.root.contains(document.activeElement)) {
      const launcher = document.getElementById("cfob-launcher-btn");
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
    const updateButtonPlacement = (isAppMode = false) => {
      let launcherBtn = document.getElementById("cfob-launcher-btn");
      if (!launcherBtn) {
        launcherBtn = document.createElement("button");
        launcherBtn.id = "cfob-launcher-btn";
        launcherBtn.innerHTML = ICONS.logo;
        launcherBtn.title = "Browse Outputs";
        launcherBtn.onclick = () => this.toggleUi();
      }
      if (isAppMode) {
        launcherBtn.className = "floating";
        document.body.appendChild(launcherBtn);
      } else {
        const standardMenuTarget = app.menu?.actionsGroup?.element || app.menu?.settingsGroup?.element || document.querySelector(".comfy-menu");
        launcherBtn.className = "bg-secondary-background border-none hover:bg-secondary-background-hover inline-flex items-center justify-center size-8";
        launcherBtn.style.border = "4px";
        standardMenuTarget?.appendChild(launcherBtn);
      }
    };

    updateButtonPlacement();

    const observer = new MutationObserver(() => {
      const isAppMode = document.getElementById('graph-canvas-container')?.style.display === 'none';
      updateButtonPlacement(isAppMode);
    });
    const canvasCont = document.getElementById('graph-canvas-container');
    if (canvasCont) {
      observer.observe(canvasCont, { attributes: true });
    }
  }

  bindEvents() {
    this.$("cfobCloseBrowserBtn").addEventListener('click', () => this.hideWithTransition());
    this.$("cfobRefreshBtn").addEventListener('click', () => this.fetchServerImages());
    this.$("cfobMenuBtn").addEventListener('click', (e) => this.settings.toggleOptionsMenu(e));
    const searchInput = this.$("cfobSearchInput");
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
      this.gallery.filterGallery();
      this.search.updateSearchSuggestions(true);
    });
    searchInput.addEventListener('focus', () => this.search.updateSearchSuggestions(true));
    searchInput.addEventListener('blur', () => {
      this.search.addSearchHistory();
      this.search.hideSearchSuggestions();
    });
    searchInput.addEventListener('keydown', (e) => this.search.handleSearchKeydown(e));

    this.$("cfobClearSearchBtn").addEventListener('click', () => {
      /** @type {HTMLInputElement} */ (searchInput).value = "";
      this.searchHistoryIndex = this.searchHistory.length;
      this.gallery.filterGallery();
      this.search.hideSearchSuggestions();
      this.search.updateSearchSuggestions(true);
    });

    this.fullView.bindEvents();

    this.$("cfobActionClear").addEventListener('click', () => this.selection.clearSelection());
    this.$("cfobActionDelete").addEventListener('click', () => this.actions.deleteSelected());
    this.$("cfobActionRename").addEventListener('click', () => this.actions.renameSelected());
    this.$("cfobActionMove").addEventListener('click', () => this.actions.moveSelected());
    this.$("cfobActionDownload").addEventListener('click', () => this.actions.downloadSelected());
    this.$("cfobActionOpen").addEventListener('click', () => this.actions.loadWorkflowSelected());
    this.$("cfobActionInspect").addEventListener('click', () => this.actions.inspectSelected());

    const mainCont = this.$("cfobMainContainer");
    let dragCounter = 0;
    mainCont.addEventListener('dragenter', (e) => {
      e.preventDefault(); dragCounter++;
      mainCont.classList.add('dragover');
    });
    mainCont.addEventListener('dragover', (e) => {
      e.preventDefault();
    });
    mainCont.addEventListener('dragleave', (e) => {
      e.preventDefault();
      dragCounter--;
      if (dragCounter <= 0) {
        dragCounter = 0;
        mainCont.classList.remove('dragover');
      }
    });
    mainCont.addEventListener('drop', (e) => {
      e.preventDefault();
      dragCounter = 0;
      mainCont.classList.remove('dragover');
      if (e.dataTransfer?.files.length) this.api.handleLocalFiles(e.dataTransfer.files);
    });

    this.settings.bindEvents();

    document.addEventListener('keydown', (e) => {
      const focusIsInside = this.root?.contains(document.activeElement) || false;
      const browserIsVisible = this.isUiVisible && !this.root?.classList.contains('cfob-hidden');
      if (!focusIsInside && !(e.key === 'Escape' && browserIsVisible)) return;

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
        if (isFullView && noModalOpen) {
          e.preventDefault(); e.stopPropagation(); this.fullView.closeFullView();
        } else if (this.isUiVisible) {
          e.stopPropagation();
          if (target === searchInput && !this.$("cfobSearchSuggestions").hidden) this.search.hideSearchSuggestions();
          else if (isEditing) target.blur();
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
        if (key === '/' && !e.altKey && !e.metaKey) {
          e.preventDefault(); e.stopPropagation(); searchInput.focus();
        }
        else if (e.key === 'ArrowUp' && target.id === 'cfobFullViewImg') {
          e.preventDefault(); e.stopPropagation(); searchInput.focus();
        }
        else if (e.key === 'ArrowLeft') { e.preventDefault(); e.stopPropagation(); this.fullView.navigateImage(-1); }
        else if (e.key === 'ArrowRight') { e.preventDefault(); e.stopPropagation(); this.fullView.navigateImage(1); }
        else if (!noModalOpen) return;

        else if (key === 'm') { e.preventDefault(); e.stopPropagation(); this.fullView.moveFullViewImage(); }
        else if (key === 'r') { e.preventDefault(); e.stopPropagation(); this.fullView.renameFullViewImage(); }
        else if (key === 'g') { e.preventDefault(); e.stopPropagation(); this.fullView.goToImageNumber(); }
        else if (key === 'i') { e.preventDefault(); e.stopPropagation(); this.$("cfobFVActionInspect").click(); }
        else if (e.key === 'Delete') { e.preventDefault(); e.stopPropagation(); this.fullView.deleteFullViewImage(); }
        else if (key === 'd') { e.preventDefault(); e.stopPropagation(); this.$("cfobFVActionDownload").click(); }
        else if (key === 'w') { e.preventDefault(); e.stopPropagation(); this.$("cfobFVActionOpen").click(); }
        else if (key === ' ') {
          if (target.closest('button, a, [role="button"]')) return;
          e.preventDefault(); e.stopPropagation();
          this.fullView.toggleFullViewUI();
        }
        else if (key === 't') { e.preventDefault(); e.stopPropagation(); this.fullView.cycleSidebarMode(); }
        else if (key === '+' || key === '=' || e.code === 'NumpadAdd') {
          e.preventDefault(); e.stopPropagation();
          this.fullView.setFullViewZoom(this.fullView.fvZoom * 1.1);
        }
        else if (key === '-' || key === '_' || e.code === 'NumpadSubtract') {
          e.preventDefault(); e.stopPropagation();
          this.fullView.setFullViewZoom(this.fullView.fvZoom / 1.1);
        }
        else if (key === '0') {
          e.preventDefault(); e.stopPropagation();
          this.fullView.resetFullViewTransform();
        }
      } else if (this.isUiVisible && !this.root?.classList.contains('cfob-hidden')) {
        if (!noModalOpen) return;

        if (key === '/' && !e.ctrlKey) {
          e.preventDefault(); e.stopPropagation(); this.$("cfobSearchInput").focus();
        }
        else if ((e.ctrlKey || e.metaKey) && key === 'a') {
          e.preventDefault(); e.stopPropagation(); this.selection.selectAllFiltered();
        }
        else if ((key === 'm' || key === 'r') && !e.ctrlKey && !e.metaKey && !e.altKey) {
          if (key === 'm' ? this.selectedImages.size > 0 : this.selectedImages.size === 1) {
            e.preventDefault(); e.stopPropagation();
            if (key === 'm') this.actions.moveSelected();
            else this.actions.renameSelected();
          }
        }
        else if (key === 'i' && !e.ctrlKey) {
          if (this.selectedImages.size === 1) { e.preventDefault(); e.stopPropagation(); this.actions.inspectSelected(); }
        }
        else if (key === 'enter' && !e.ctrlKey) {
          if (!target.closest('button, a, [role="button"]')) {
            const focusedImage = this.filteredImages[this.lastSelectedIdx];
            if (focusedImage || this.selectedImages.size === 1) {
              e.preventDefault(); e.stopPropagation();
              const img = focusedImage || this.loadedImages.find(i => i.name === Array.from(this.selectedImages)[0]);
              if (img) this.fullView.openFullView(img);
            }
          }
        }
        else if (key === ' ') {
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault(); e.stopPropagation();
            if (this.lastSelectedIdx !== -1 && this.filteredImages[this.lastSelectedIdx]) {
              const targetImg = this.filteredImages[this.lastSelectedIdx];
              if (this.selectedImages.has(targetImg.name)) {
                this.selectedImages.delete(targetImg.name);
              } else {
                this.selectedImages.add(targetImg.name);
              }
              this.selectionAnchorIdx = this.lastSelectedIdx; // Reset anchor

              const cards = Array.from(this.$("cfobGalleryGrid").querySelectorAll('.image-card'));
              const targetCard = cards[this.lastSelectedIdx];
              if (targetCard) {
                const cb = /** @type {HTMLInputElement} */ (targetCard.querySelector('.card-checkbox'));
                if (cb) cb.checked = this.selectedImages.has(targetImg.name);
              }
              this.selection.updateCardStyles();
              this.selection.updateActionBar();
            }
          }
          else if (
            target.tagName !== 'INPUT' &&
            !target.closest('button, a, [role="button"]') &&
            (this.filteredImages[this.lastSelectedIdx] || this.selectedImages.size === 1)
          ) {
            // Standard Space: Open Full View
            e.preventDefault(); e.stopPropagation();
            const img = this.filteredImages[this.lastSelectedIdx] ||
              this.loadedImages.find(i => i.name === Array.from(this.selectedImages)[0]);
            if (img) this.fullView.openFullView(img);
          }
        }
        else if (e.key === 'Delete') {
          if (this.selectedImages.size > 0) { e.preventDefault(); e.stopPropagation(); this.actions.deleteSelected(); }
        }
        else if (key === 'd') {
          if (this.selectedImages.size > 0) { e.preventDefault(); e.stopPropagation(); this.actions.downloadSelected(); }
        }
        else if (key === 'w') {
          if (this.selectedImages.size === 1) { e.preventDefault(); e.stopPropagation(); this.actions.loadWorkflowSelected(); }
        }
        else if (
          ['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'pageup', 'pagedown', 'home', 'end'].includes(key) &&
          !target.closest('button, a, [role="button"]')
        ) {
          if (e.key === 'ArrowUp' && this.lastSelectedIdx < 0) {
            e.preventDefault(); e.stopPropagation();
            searchInput.focus();
            return;
          }
          if (e.key === 'ArrowUp' && this.lastSelectedIdx >= 0) {
            const grid = this.$("cfobGalleryGrid");
            const firstCard = grid.querySelector('.image-card');
            const currentCard = grid.querySelectorAll('.image-card')[this.lastSelectedIdx];
            if (firstCard && currentCard && /** @type {HTMLElement} */ (currentCard).offsetTop <= /** @type {HTMLElement} */ (firstCard).offsetTop) {
              e.preventDefault(); e.stopPropagation();
              searchInput.focus();
              return;
            }
          }
          e.preventDefault(); e.stopPropagation(); this.selection.handleGridNavigation(e);
        }
      }
    }, { capture: true });

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
    if (!isActive && this.serverImageFetchCount === 0) this.search.updateSearchSuggestions();
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

      for (const fileObj of allFilesData) {
        if (existingMap.has(fileObj.name)) {
          const image = existingMap.get(fileObj.name);
          if (image) {
            if (fileObj.mtime && image.mtime && image.mtime !== fileObj.mtime) {
              this.search.removeImageKeywords(image.name);
              image.mtime = fileObj.mtime;
              image.isParsed = false;
              image.prompt = null;
              image.workflow = null;
              image.url = this.api.getImageUrl(fileObj.name) + `&t=${fileObj.mtime}`;
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

      if (newImages.length > 0 || validImages.length !== this.loadedImages.length) {
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
      console.error("Output Browser Error:", err);
    } finally {
      this.serverImageFetchCount--;
      this.updateRefreshButtonAnimation();
      if (this.serverImageFetchCount === 0 && !this.isIdleParsing) this.search.updateSearchSuggestions();
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

app.registerExtension({
  name: "Comfy.OutputBrowser",
  commands: [
    {
      id: "OutputBrowser.FocusSearch",
      label: "Output Browser: Focus Search",
      function: () => { browser.showWithTransition(); },
    }
  ],
  keybindings: [
    {
      combo: { key: "?", ctrl: true, shift: true },
      commandId: "OutputBrowser.FocusSearch"
    }
  ],
  async setup() {
    browser.init();
  }
});
// @ts-ignore
import { app } from "../../scripts/app.js";
import { CFOB_QUERY_STYLES, CFOB_STYLES } from "./assets/css.js";
import ICONS from "./assets/icons.js";
import CFOB_API from "./CFOB_API.js";
import CFOB_FullView, { CFOB_FULL_VIEW_HTML, CFOB_FULL_VIEW_STYLES } from "./CFOB_FullView.js";
import CFOB_Settings, { CFOB_SETTINGS_MODALS_HTML, CFOB_SETTINGS_MODALS_STYLES } from "./CFOB_Settings.js";

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
      <input type="text" id="cfobSearchInput" class="search-input" placeholder="Filter">
      <button id="cfobClearSearchBtn" class="search-clear-btn" title="Clear search">${ICONS.close}</button>
    </div>
    <button class="btn" id="cfobRefreshBtn" title="Sync outputs from Server">${ICONS.refresh}<span>Refresh</span></button>
    <button class="btn" id="cfobMenuBtn" title="Options">${ICONS.more}</button>
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
    <button class="btn" id="cfobActionRename">${ICONS.move}<span>Move/Rename</span></button>
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

    this.observer = null;
    this.api = new CFOB_API(this);
    this.settings = new CFOB_Settings(this);
    this.fullView = new CFOB_FullView(this);
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
            this.observer.unobserve(card);
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
      this.root.style.width = `${this.sidebarWidth}px`;
    }
    if (height !== null) {
      this.sidebarHeight = Math.max(200, Math.min(height, window.innerHeight - 100));
      this.root.style.height = `${this.sidebarHeight}px`;
    }
  }

  showWithTransition() {
    if (!this.root) return;
    clearTimeout(this.transitionTimer);
    this.root.style.display = 'flex';
    void this.root.offsetWidth;
    this.root.classList.remove('cfob-hidden');
    this.isUiVisible = true;
    this.$("cfobSearchInput").focus();
  }

  hideWithTransition() {
    if (!this.root) return;
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
      this.fetchServerImages();
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
    this.$("cfobSearchInput").addEventListener('input', () => this.filterGallery());

    this.$("cfobClearSearchBtn").addEventListener('click', () => {
      /** @type {HTMLInputElement} */ (this.$("cfobSearchInput")).value = "";
      this.filterGallery();
    });

    this.fullView.bindEvents();

    this.$("cfobActionClear").addEventListener('click', () => this.clearSelection());
    this.$("cfobActionDelete").addEventListener('click', () => this.deleteSelected());
    this.$("cfobActionRename").addEventListener('click', () => this.renameSelected());
    this.$("cfobActionDownload").addEventListener('click', () => this.downloadSelected());
    this.$("cfobActionOpen").addEventListener('click', () => this.loadWorkflowSelected());
    this.$("cfobActionInspect").addEventListener('click', () => this.inspectSelected());

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
      const fvModal = this.$("cfobFullViewModal");
      const configModal = this.$("cfobConfigModal");
      const inspectorModal = this.$("cfobInspectorModal");
      const hiddenModal = this.$("cfobHiddenFoldersModal");
      const confirmModal = this.$("cfobConfirmModal");
      const promptModal = this.$("cfobPromptModal");

      const target = /** @type {HTMLElement} */ (e.target);
      const isEditing = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

      const noModalOpen = !configModal.classList.contains('active') &&
        !inspectorModal.classList.contains('active') &&
        !hiddenModal.classList.contains('active') &&
        !confirmModal.classList.contains('active') &&
        !promptModal.classList.contains('active');

      const isFullView = fvModal.classList.contains('active');
      const key = e.key.toLowerCase();

      if (e.key === 'Escape') {
        if (isFullView) {
          e.preventDefault(); e.stopPropagation(); this.fullView.closeFullView();
        } else if (this.isUiVisible) {
          e.stopPropagation();
          if (confirmModal.classList.contains('active')) this.$("cfobConfirmCancelBtn").click();
          else if (promptModal.classList.contains('active')) this.$("cfobPromptCancelBtn").click();
          else if (configModal.classList.contains('active')) configModal.classList.remove('active');
          else if (inspectorModal.classList.contains('active')) inspectorModal.classList.remove('active');
          else if (hiddenModal.classList.contains('active')) hiddenModal.classList.remove('active');
          else if (isEditing) target.blur();
          else if (this.selectedImages.size > 0) this.clearSelection();
          else this.hideWithTransition();
        }
        return;
      }

      if (isEditing) return;

      if (isFullView) {
        if (e.key === 'ArrowLeft') { e.preventDefault(); e.stopPropagation(); this.fullView.navigateImage(-1); }
        else if (e.key === 'ArrowRight') { e.preventDefault(); e.stopPropagation(); this.fullView.navigateImage(1); }
        else if (!noModalOpen) return;

        else if (key === 'm' || key === 'r') { e.preventDefault(); e.stopPropagation(); this.fullView.renameFullViewImage(); }
        else if (key === 'i') { e.preventDefault(); e.stopPropagation(); this.$("cfobFVActionInspect").click(); }
        else if (e.key === 'Delete') { e.preventDefault(); e.stopPropagation(); this.fullView.deleteFullViewImage(); }
        else if (key === 'd') { e.preventDefault(); e.stopPropagation(); this.$("cfobFVActionDownload").click(); }
        else if (key === 'w') { e.preventDefault(); e.stopPropagation(); this.$("cfobFVActionOpen").click(); }

      } else if (this.isUiVisible && !this.root?.classList.contains('cfob-hidden')) {
        if (!noModalOpen) return;

        if ((e.ctrlKey || e.metaKey) && key === 'a') {
          e.preventDefault(); e.stopPropagation(); this.selectAllFiltered();
        }
        else if (key === 'm' || key === 'r') {
          if (this.selectedImages.size > 0) { e.preventDefault(); e.stopPropagation(); this.renameSelected(); }
        }
        else if (key === 'i') {
          if (this.selectedImages.size === 1) { e.preventDefault(); e.stopPropagation(); this.inspectSelected(); }
        }
        else if (key === 'enter') {
          if (this.selectedImages.size === 1) {
            e.preventDefault(); e.stopPropagation();
            const img = this.loadedImages.find(i => i.name === Array.from(this.selectedImages)[0]);
            if (img) this.fullView.openFullView(img);
          }
        }
        else if (key === ' ') {
          if (e.ctrlKey || e.metaKey) {
            // Ctrl+Space: Toggle selection of the currently focused item without losing existing selection
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
              this.updateCardStyles();
              this.updateActionBar();
            }
          }
          else if (this.selectedImages.size === 1) {
            // Standard Space: Open Full View
            e.preventDefault(); e.stopPropagation();
            const img = this.loadedImages.find(i => i.name === Array.from(this.selectedImages)[0]);
            if (img) this.fullView.openFullView(img);
          }
        }
        else if (e.key === 'Delete') {
          if (this.selectedImages.size > 0) { e.preventDefault(); e.stopPropagation(); this.deleteSelected(); }
        }
        else if (key === 'd') {
          if (this.selectedImages.size > 0) { e.preventDefault(); e.stopPropagation(); this.downloadSelected(); }
        }
        else if (key === 'w') {
          if (this.selectedImages.size === 1) { e.preventDefault(); e.stopPropagation(); this.loadWorkflowSelected(); }
        }
        else if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
          e.preventDefault(); e.stopPropagation(); this.handleGridNavigation(e);
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
      startWidth = this.sidebarWidth || 250;
      startHeight = this.sidebarHeight || 200;
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

  async fetchServerImages() {
    const isFirstLoad = this.loadedImages.length === 0;

    if (isFirstLoad) {
      this.$("cfobGalleryGrid").innerHTML = "";
      this.$("cfobEmptyStateTitle").innerText = "Loading Outputs...";
      this.$("cfobEmptyStateDesc").innerText = "Fetching image list from server...";
      this.$("cfobEmptyState").style.display = "block";
    }

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
        this.applySort();

        const validNames = new Set(this.loadedImages.map(img => img.name));
        for (const sel of this.selectedImages) {
          if (!validNames.has(sel)) this.selectedImages.delete(sel);
        }

        this.updateActionBar();
        this.filterGallery();
      } else if (isFirstLoad) {
        this.applySort();
        this.filterGallery();
      }

      this.api.startIdleParsing();
    } catch (err) {
      this.$("cfobEmptyStateTitle").innerText = "Connection Error";
      this.$("cfobEmptyStateDesc").innerText = "Failed to load outputs from server.";
      this.$("cfobEmptyState").style.display = "block";
      console.error("Output Browser Error:", err);
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

    for (const path of candidates) {
      const parts = path.split('.');
      if (parts.length < 2) continue;

      const target = parts[0].trim();
      const prop = parts.slice(1).join('.').trim();
      const match = target.match(/^(.+)\[(\d+)\]$/);
      const targetName = match ? match[1] : target;
      const targetIdx = match ? parseInt(match[2], 10) : 0;

      let matchCount = 0;
      if (prompt) {
        for (const [id, node] of Object.entries(prompt)) {
          const classType = node.class_type || '', title = node._meta?.title || '';
          if (id === targetName || classType.toLowerCase() === targetName.toLowerCase() || title.toLowerCase() === targetName.toLowerCase()) {
            if (matchCount === targetIdx) {
              let val = prop.startsWith('inputs.') ? (node.inputs ? node.inputs[prop.replace('inputs.', '')] : undefined) : node.inputs?.[prop];
              if (val !== undefined && !Array.isArray(val) && val !== null && val !== '') return val;
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
            }
            matchCount++;
          }
        }
      }
    }
    return null;
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

  /**
   * Navigates the grid focus spatially using arrow keys
   * @param {KeyboardEvent} e 
   */
  handleGridNavigation(e) {
    if (!this.filteredImages.length) return;

    const grid = this.$("cfobGalleryGrid");
    const cards = Array.from(grid.querySelectorAll('.image-card'));
    if (!cards.length) return;

    const direction = e.key;
    const isShift = e.shiftKey;
    const isCtrl = e.ctrlKey || e.metaKey;

    let currentIdx = this.lastSelectedIdx;
    if (currentIdx === -1) currentIdx = 0;

    let cols = 1;
    const firstOffset = /** @type {HTMLElement} */(cards[0]).offsetTop;
    for (let i = 1; i < cards.length; i++) {
      if (/** @type {HTMLElement} */(cards[i]).offsetTop > firstOffset) {
        cols = i;
        break;
      }
      if (i === cards.length - 1) cols = cards.length;
    }

    let nextIdx = currentIdx;
    if (direction === 'ArrowLeft') nextIdx--;
    else if (direction === 'ArrowRight') nextIdx++;
    else if (direction === 'ArrowUp') nextIdx -= cols;
    else if (direction === 'ArrowDown') nextIdx += cols;

    nextIdx = Math.max(0, Math.min(nextIdx, this.filteredImages.length - 1));

    if (this.selectionAnchorIdx === undefined) {
      this.selectionAnchorIdx = currentIdx;
    }

    if (isShift) {
      this.clearSelection(false);
      const start = Math.min(this.selectionAnchorIdx, nextIdx);
      const end = Math.max(this.selectionAnchorIdx, nextIdx);
      for (let i = start; i <= end; i++) {
        this.selectedImages.add(this.filteredImages[i].name);
      }
    } else if (isCtrl) {
      // Move focus only, update anchor for future shift-selects
      this.selectionAnchorIdx = nextIdx;
    } else {
      // Standard single select
      this.clearSelection(false);
      this.selectedImages.add(this.filteredImages[nextIdx].name);
      this.selectionAnchorIdx = nextIdx;
    }

    this.lastSelectedIdx = nextIdx;

    cards.forEach((c, i) => {
      const cb = /** @type {HTMLInputElement} */ (c.querySelector('.card-checkbox'));
      if (cb) cb.checked = this.selectedImages.has(this.filteredImages[i].name);

      const el = /** @type {HTMLElement} */ (c);
      if (i === nextIdx) {
        el.classList.toggle('focused', i === nextIdx);
        el.scrollIntoView({ behavior: 'auto', block: 'nearest' });
      } else {
        el.classList.toggle('focused', i === nextIdx);
      }
    });

    this.updateCardStyles();
    this.updateActionBar();
  }

  updateActionBar() {
    const bar = this.$("cfobActionBar");
    const count = this.selectedImages.size;
    if (count > 0) {
      bar.classList.add('show');
      this.$("cfobSelectionCount").innerText = `${count} selected`;

      const isSingle = count === 1;
      this.$("cfobActionInspect").style.display = isSingle ? 'inline-flex' : 'none';
      this.$("cfobActionOpen").style.display = isSingle ? 'inline-flex' : 'none';
      this.$("cfobActionRename").style.display = 'inline-flex';
      /** @type {HTMLElement} */ (this.$("cfobActionRename").querySelector('span')).innerText = isSingle ? 'Move/Rename' : 'Move to Folder';
    } else {
      bar.classList.remove('show');
      this.lastSelectedIdx = -1;
    }
  }

  updateCardStyles() {
    this.root?.querySelectorAll('.image-card').forEach(card => {
      const name = /** @type {HTMLElement} */ (card).dataset.name;
      if (this.selectedImages.has(name)) card.classList.add('selected');
      else card.classList.remove('selected');
    });
  }

  /**
   * @param {PointerEvent} e
   * @param {string} filename
   */
  handleCheckboxClick(e, filename) {
    e.stopPropagation();
    const target = /** @type {HTMLInputElement} */ (e.target);
    const fIdx = this.filteredImages.findIndex(img => img.name === filename);
    if (fIdx === -1) return;

    if (e.shiftKey && this.selectionAnchorIdx !== undefined && this.selectionAnchorIdx !== -1) {
      const start = Math.min(this.selectionAnchorIdx, fIdx);
      const end = Math.max(this.selectionAnchorIdx, fIdx);
      const isChecked = target.checked;

      for (let i = start; i <= end; i++) {
        const targetImg = this.filteredImages[i];
        if (isChecked) this.selectedImages.add(targetImg.name);
        else this.selectedImages.delete(targetImg.name);
      }

      this.root?.querySelectorAll('.card-checkbox').forEach(cb => {
        /** @type {HTMLInputElement} */ (cb).checked = this.selectedImages.has(/** @type {HTMLInputElement} */(cb).value);
      });
    } else {
      if (target.checked) this.selectedImages.add(filename);
      else this.selectedImages.delete(filename);
      this.selectionAnchorIdx = fIdx; // Sync anchor for keyboard usage
    }

    this.lastSelectedIdx = fIdx;

    this.root?.querySelectorAll('.image-card').forEach((c, i) => {
        /** @type {HTMLElement} */ (c).classList.toggle('focused', i === fIdx);
    });

    this.updateActionBar();
    this.updateCardStyles();
  }

  /** @param {boolean} resetAnchor */
  clearSelection(resetAnchor = true) {
    this.selectedImages.clear();
    this.root?.querySelectorAll('.card-checkbox').forEach(cb => /** @type {HTMLInputElement} */(cb).checked = false);

    if (resetAnchor) {
      this.lastSelectedIdx = -1;
      this.selectionAnchorIdx = -1;
      this.root?.querySelectorAll('.image-card').forEach(c => /** @type {HTMLElement} */(c).style.boxShadow = '');
    }

    this.updateCardStyles();
    this.updateActionBar();
  }

  selectAllFiltered() {
    if (!this.filteredImages.length) return;
    this.filteredImages.forEach(img => this.selectedImages.add(img.name));
    this.root?.querySelectorAll('.card-checkbox').forEach(cb => {
      /** @type {HTMLInputElement} */ (cb).checked = this.selectedImages.has(/** @type {HTMLInputElement} */(cb).value);
    });
    this.updateCardStyles();
    this.updateActionBar();
  }

  async downloadSelected() {
    this.showToast(`Downloading ${this.selectedImages.size} image(s)...`);
    for (const filename of this.selectedImages) {
      const img = this.loadedImages.find(i => i.name === filename);
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
    this.clearSelection();
  }

  async deleteSelected() {
    const files = Array.from(this.selectedImages);
    if (!files.length) return;

    const hasTrashedItems = files.some(f => f.replace(/\\/g, '/').startsWith('.trash/'));
    const isTrash = hasTrashedItems;
    const confirmMsg = isTrash
      ? `Permanently delete at least one of ${files.length} selected image(s)? This cannot be undone.`
      : `Move ${files.length} selected image(s) to Trash?`;

    const confirmed = await this.settings.customConfirm(confirmMsg, isTrash ? "Delete Permanently" : "Move to Trash", isTrash);
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
        this.loadedImages = this.loadedImages.filter(img => !removed.includes(img.name));

        for (const file of removed) {
          await this.api.cacheDelete(file);
        }

        this.clearSelection();
        this.filterGallery();

        if (data.deleted && data.deleted.length > 0) {
          this.showToast(`Permanently deleted ${data.deleted.length} image(s)`);
        } else if (data.trashed && data.trashed.length > 0) {
          this.showToast(`Moved ${data.trashed.length} image(s) to Trash`);
        }
      }
    } catch (e) {
      console.error(e);
      this.showToast("Failed to delete/trash images.");
    }
  }

  async renameSelected() {
    const count = this.selectedImages.size;
    if (count === 0) return;

    if (count === 1) {
      const oldName = Array.from(this.selectedImages)[0];
      let newName = await this.settings.customPrompt("Enter new path or filename:", oldName, 'rename');

      if (!newName || newName === oldName) return;

      try {
        const res = await fetch("/comfyui-output-browser/rename", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ old_name: oldName, new_name: newName })
        });
        const data = await res.json();

        if (data.success) {
          const img = this.loadedImages.find(i => i.name === oldName);
          if (img) {
            img.name = data.new_name;
            img.mtime = data.mtime || img.mtime;
            img.url = this.api.getImageUrl(data.new_name) + (img.mtime ? `&t=${img.mtime}` : '');
            const meta = await this.api.cacheGet(oldName);
            if (meta) {
              await this.api.cacheSet(data.new_name, meta, img.mtime);
              await this.api.cacheDelete(oldName);
            }
          }
          this.clearSelection();
          this.filterGallery();
          this.showToast(`Moved to ${data.new_name}`);
        } else {
          this.showToast(data.error || "Rename failed.");
        }
      } catch (e) {
        console.error(e);
        this.showToast("Rename request failed.");
      }
    } else {
      let destFolder = await this.settings.customPrompt(`Move ${count} items to folder:`, "", 'move');
      if (destFolder === null || destFolder.trim() === "") return;

      try {
        const res = await fetch("/comfyui-output-browser/move", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ files: Array.from(this.selectedImages), dest_folder: destFolder })
        });
        const data = await res.json();

        if (data.success) {
          for (const m of data.moved) {
            const img = this.loadedImages.find(i => i.name === m.old_name);
            if (img) {
              img.name = m.new_name;
              img.mtime = m.mtime || img.mtime;
              img.url = this.api.getImageUrl(m.new_name) + (img.mtime ? `&t=${img.mtime}` : '');
              const meta = await this.api.cacheGet(m.old_name);
              if (meta) {
                await this.api.cacheSet(m.new_name, meta, img.mtime);
                await this.api.cacheDelete(m.old_name);
              }
            }
          }
          this.clearSelection();
          this.filterGallery();
          if (data.errors && data.errors.length > 0) {
            this.showToast(`Moved ${data.moved.length}, but ${data.errors.length} failed.`);
            console.warn("Move errors:", data.errors);
          } else {
            this.showToast(`Moved ${data.moved.length} item(s) to ${destFolder}`);
          }
        } else {
          this.showToast(data.error || "Move failed.");
        }
      } catch (e) {
        console.error(e);
        this.showToast("Move request failed.");
      }
    }
  }

  inspectSelected() {
    if (this.selectedImages.size !== 1) return;
    const filename = Array.from(this.selectedImages)[0];
    const idx = this.loadedImages.findIndex(i => i.name === filename);
    if (idx !== -1) {
      this.settings.openInspector(idx);
    }
  }

  /**
   * @param {CFOB_Image} img
   */
  async loadWorkflowImage(img) {
    if (!img || !this.root) return;
    if (!img.isParsed) {
      this.showToast("Loading metadata...");
      await this.api.loadMetadata(img);
    }
    if (img.workflow) {
      app.loadGraphData(img.workflow);
      this.hideWithTransition();
      this.clearSelection();
      this.showToast("Workflow loaded successfully!");
    } else {
      this.showToast("No workflow metadata found in this image.");
    }
  }

  async loadWorkflowSelected() {
    if (this.selectedImages.size !== 1) return;
    const filename = Array.from(this.selectedImages)[0];
    const img = this.loadedImages.find(i => i.name === filename);
    if (img) await this.loadWorkflowImage(img);
  }

  /**
   * @param {{ innerHTML: string; }} btn
   * @param {any} encodedVal
   */
  copyValue(btn, encodedVal) {
    const val = decodeURIComponent(encodedVal || "");
    navigator.clipboard.writeText(val).then(() => {
      const origHtml = btn.innerHTML;
      btn.innerHTML = ICONS.check;
      setTimeout(() => { btn.innerHTML = origHtml; }, 1200);
    });
  }

  filterGallery() {
    const searchInput = /** @type {HTMLInputElement} */ (this.$("cfobSearchInput"));
    const searchStr = searchInput ? searchInput.value.trim() : "";

    // Force show hidden if query starts with a dot
    const forceShowHidden = searchStr.startsWith('.');
    const effectiveShowHidden = this.settings.showHiddenFolders || forceShowHidden;

    const clearBtn = this.$("cfobClearSearchBtn");
    if (clearBtn) clearBtn.style.display = searchStr ? 'flex' : 'none';

    // 1. Pre-parse the query outside the image loop to prevent redundant regex and parsing overhead
    const rawOrGroups = searchStr.split(',').map((/** @type {string} */ g) => g.trim()).filter(Boolean);

    const parsedQuery = rawOrGroups.map(groupStr => {
      const andTerms = groupStr.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
      return andTerms.map((/** @type {string} */ term) => {
        const isNot = term.startsWith('!');
        const actualTerm = isNot ? term.substring(1) : term;
        if (!actualTerm) return null;

        let searchKey = null;
        let searchValue = actualTerm;

        const colonIdx = actualTerm.indexOf(':');
        if (colonIdx > 0 && !actualTerm.startsWith('"')) {
          searchKey = actualTerm.substring(0, colonIdx).toLowerCase();
          searchValue = actualTerm.substring(colonIdx + 1);
        }

        if (searchValue.startsWith('"') && searchValue.endsWith('"') && searchValue.length >= 2) {
          searchValue = searchValue.substring(1, searchValue.length - 1);
        }

        searchValue = searchValue.toLowerCase();

        let fieldIdx = NaN;
        let fieldMatch = null;

        if (searchKey && !['name', 'path', 'prompt', 'workflow'].includes(searchKey)) {
          fieldIdx = parseInt(searchKey, 10);
          if (isNaN(fieldIdx) || fieldIdx <= 0 || fieldIdx > this.settings.fieldConfigs.length) {
            fieldMatch = this.settings.fieldConfigs.find((/** @type {{ label: string; }} */ c) => c.label.toLowerCase() === searchKey);
          }
        }

        return { isNot, searchKey, searchValue, fieldIdx, fieldMatch };
      }).filter(Boolean);
    }).filter(g => g.length > 0);

    this.filteredImages = this.loadedImages.filter(img => {
      // Check hidden folder constraint first
      if (!effectiveShowHidden && this.isImageInHiddenFolder(img.name)) return false;

      // If no valid search terms, return true
      if (parsedQuery.length === 0) return true;

      // 2. Lazy caching avoids calling JSON.stringify thousands of times during broad/multi-term searches
      /** @type {string | null} */
      let nameStr = null;
      /** @type {string | null} */
      let promptStr = null;
      /** @type {string | null} */
      let workflowStr = null;

      // Evaluate OR groups
      return parsedQuery.some(andGroup => {
        // Evaluate AND terms
        return andGroup.every(term => {
          if (!term) return;
          let match = false;

          // Generate string cache precisely when requested
          if (nameStr === null) nameStr = (img.name || "").toLowerCase();

          if (term.searchKey) {
            if (term.searchKey === 'name' || term.searchKey === 'path') {
              match = nameStr.includes(term.searchValue);
            } else if (term.searchKey === 'prompt') {
              if (promptStr === null) promptStr = img.prompt ? JSON.stringify(img.prompt).toLowerCase() : "";
              match = promptStr.includes(term.searchValue);
            } else if (term.searchKey === 'workflow') {
              if (workflowStr === null) workflowStr = img.workflow ? JSON.stringify(img.workflow).toLowerCase() : "";
              match = workflowStr.includes(term.searchValue);
            } else {
              // Custom field mapping via pre-parsed checks
              if (!isNaN(term.fieldIdx) && term.fieldIdx > 0 && term.fieldIdx <= this.settings.fieldConfigs.length) {
                const val = this.resolveFieldValue(img, this.settings.fieldConfigs[term.fieldIdx - 1].paths);
                match = val !== null && String(val).toLowerCase().includes(term.searchValue);
              } else if (term.fieldMatch) {
                const val = this.resolveFieldValue(img, term.fieldMatch.paths);
                match = val !== null && String(val).toLowerCase().includes(term.searchValue);
              }
            }
          } else {
            // Standard global search
            if (promptStr === null) promptStr = img.prompt ? JSON.stringify(img.prompt).toLowerCase() : "";
            if (workflowStr === null) workflowStr = img.workflow ? JSON.stringify(img.workflow).toLowerCase() : "";
            match = nameStr.includes(term.searchValue) || promptStr.includes(term.searchValue) || workflowStr.includes(term.searchValue);
          }

          return term.isNot ? !match : match;
        });
      });
    });

    if (typeof this.renderGallery === 'function') this.renderGallery();
    if (typeof this.updateActionBar === 'function') this.updateActionBar();
  }

  renderGallery() {
    const grid = this.$("cfobGalleryGrid");
    if (!grid) return;

    grid.innerHTML = "";

    const countSpan = this.$("cfobImageCount");
    if (countSpan) {
      countSpan.innerText = `(${this.filteredImages.length})`;
    }

    const emptyState = this.$("cfobEmptyState");
    if (this.filteredImages.length === 0) {
      if (emptyState) {
        emptyState.style.display = "block";
        this.$("cfobEmptyStateTitle").innerText = "No Images Found";
        this.$("cfobEmptyStateDesc").innerText = this.loadedImages.length === 0
          ? "Click Refresh to load ComfyUI outputs, or drop PNGs anywhere to inspect."
          : "No images match the current filter or hidden folder settings.";
      }
      return;
    } else {
      if (emptyState) emptyState.style.display = "none";
    }

    const fragment = document.createDocumentFragment();

    this.filteredImages.forEach((img, idx) => {
      const isSelected = this.selectedImages.has(img.name);
      const card = document.createElement("div");
      card.className = `image-card ${isSelected ? 'selected' : ''}`;
      card.dataset.name = img.name;
      card.dataset.index = String(this.loadedImages.indexOf(img));

      card.innerHTML = `
        <div class="checkbox-wrapper">
          <input type="checkbox" class="card-checkbox" value="${this.escapeHtml(img.name)}" ${isSelected ? 'checked' : ''}>
        </div>
        <img class="card-preview" src="${this.escapeHtml(img.url)}" alt="${this.escapeHtml(img.name)}" loading="lazy">
        <div class="card-content-wrapper">
          <div class="card-header" title="${this.escapeHtml(img.name)}">
            <span class="card-filename">${this.escapeHtml(img.name)}</span>
            ${ICONS.toggle}
          </div>
          <div class="card-body">
            ${img.isParsed ? this.getCardFieldsHtml(img) : '<i style="color: var(--color-text-disabled);">Loading...</i>'}
          </div>
        </div>
      `;

      const cb = /** @type {HTMLInputElement} */ (card.querySelector('.card-checkbox'));
      cb.addEventListener('click', (e) => this.handleCheckboxClick(e, img.name));

      const previewImg = /** @type {HTMLImageElement} */ (card.querySelector('.card-preview'));
      previewImg.addEventListener('click', () => this.fullView.openFullView(img));

      const header = /** @type {HTMLElement} */ (card.querySelector('.card-header'));
      header.addEventListener('click', () => {
        card.classList.toggle('expanded');
      });

      card.addEventListener('click', (e) => {
        /** @type {HTMLElement | null} */
        const copyBtn = /** @type {HTMLElement} */ (e.target).closest('.copy-val-btn');
        if (copyBtn) {
          e.stopPropagation();
          this.copyValue(copyBtn, copyBtn.dataset.val);
        }
      });

      if (this.observer) this.observer.observe(card);

      fragment.appendChild(card);
    });

    grid.appendChild(fragment);
  }
}

const browser = new ComfyOutputBrowser();

app.registerExtension({
  name: "Comfy.OutputBrowser",
  commands: [
    {
      id: "Comfy.OutputBrowser.toggle",
      label: "Toggle Comfy Output Browser",
      function: () => { browser.toggleUi(); },
    }
  ],
  keybindings: [
    {
      combo: { key: "e", ctrl: true },
      commandId: "Comfy.OutputBrowser.toggle"
    }
  ],
  async setup() {
    browser.init();
  }
});
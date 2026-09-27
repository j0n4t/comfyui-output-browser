import ICONS from "./assets/icons.js";

export default class CFOB_Gallery {
  /** @param {import("./ComfyOutputBrowser.js").default} app */
  constructor(app) {
    this.app = app;
  }

  filterGallery() {
    const searchInput = /** @type {HTMLInputElement} */ (this.app.$("cfobSearchInput"));
    const searchStr = searchInput ? searchInput.value.trim() : "";

    // Force show hidden if query starts with a dot
    const forceShowHidden = searchStr.startsWith('.');
    const effectiveShowHidden = this.app.settings.showHiddenFolders || forceShowHidden;

    const clearBtn = this.app.$("cfobClearSearchBtn");
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
          if (isNaN(fieldIdx) || fieldIdx <= 0 || fieldIdx > this.app.settings.fieldConfigs.length) {
            fieldMatch = this.app.settings.fieldConfigs.find((/** @type {{ label: string; }} */ c) => c.label.toLowerCase() === searchKey);
          }
        }

        return { isNot, searchKey, searchValue, fieldIdx, fieldMatch };
      }).filter(Boolean);
    }).filter(g => g.length > 0);

    this.app.filteredImages = this.app.loadedImages.filter(img => {
      // Check hidden folder constraint first
      if (!effectiveShowHidden && this.app.isImageInHiddenFolder(img.name)) return false;

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
              if (!isNaN(term.fieldIdx) && term.fieldIdx > 0 && term.fieldIdx <= this.app.settings.fieldConfigs.length) {
                const val = this.app.resolveFieldValue(img, this.app.settings.fieldConfigs[term.fieldIdx - 1].paths);
                match = val !== null && String(val).toLowerCase().includes(term.searchValue);
              } else if (term.fieldMatch) {
                const val = this.app.resolveFieldValue(img, term.fieldMatch.paths);
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

    this.renderGallery();
    this.app.selection.updateActionBar();
  }

  renderGallery() {
    const grid = this.app.$("cfobGalleryGrid");
    if (!grid) return;

    grid.innerHTML = "";

    const countSpan = this.app.$("cfobImageCount");
    if (countSpan) {
      countSpan.innerText = `(${this.app.filteredImages.length})`;
    }

    const emptyState = this.app.$("cfobEmptyState");
    if (this.app.filteredImages.length === 0) {
      if (emptyState) {
        emptyState.style.display = "block";
        this.app.$("cfobEmptyStateTitle").innerText = "No Images Found";
        this.app.$("cfobEmptyStateDesc").innerText = this.app.loadedImages.length === 0
          ? "Click Refresh to load ComfyUI outputs, or drop PNGs anywhere to inspect."
          : "No images match the current filter or hidden folder settings.";
      }
      return;
    } else {
      if (emptyState) emptyState.style.display = "none";
    }

    const fragment = document.createDocumentFragment();

    this.app.filteredImages.forEach((img, idx) => {
      const isSelected = this.app.selectedImages.has(img.name);
      const card = document.createElement("div");
      card.className = `image-card ${isSelected ? 'selected' : ''}`;
      card.tabIndex = -1;
      card.dataset.name = img.name;
      card.dataset.index = String(this.app.loadedImages.indexOf(img));

      card.innerHTML = `
        <div class="checkbox-wrapper">
          <input type="checkbox" class="card-checkbox" value="${this.app.escapeHtml(img.name)}" ${isSelected ? 'checked' : ''}>
        </div>
        <img class="card-preview" src="${this.app.escapeHtml(img.url)}" alt="${this.app.escapeHtml(img.name)}" loading="lazy">
        <div class="card-content-wrapper">
          <div class="card-header" title="${this.app.escapeHtml(img.name)}">
            <span class="card-filename">${this.app.escapeHtml(img.name)}</span>
            ${ICONS.toggle}
          </div>
          <div class="card-body">
            ${img.isParsed ? this.app.getCardFieldsHtml(img) : '<i style="color: var(--color-text-disabled);">Loading...</i>'}
          </div>
        </div>
      `;

      const cb = /** @type {HTMLInputElement} */ (card.querySelector('.card-checkbox'));
      cb.addEventListener('click', (e) => this.app.selection.handleCheckboxClick(e, img.name));

      const previewImg = /** @type {HTMLImageElement} */ (card.querySelector('.card-preview'));
      previewImg.addEventListener('click', () => this.app.fullView.openFullView(img));

      const header = /** @type {HTMLElement} */ (card.querySelector('.card-header'));
      header.addEventListener('click', () => {
        card.classList.toggle('expanded');
      });

      card.addEventListener('click', (e) => {
        /** @type {HTMLElement | null} */
        const copyBtn = /** @type {HTMLElement} */ (e.target).closest('.copy-val-btn');
        if (copyBtn) {
          e.stopPropagation();
          this.app.actions.copyValue(copyBtn, copyBtn.dataset.val);
        }
      });

      if (this.app.observer) this.app.observer.observe(card);

      fragment.appendChild(card);
    });

    grid.appendChild(fragment);
  }
}

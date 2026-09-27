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
    const searchQuery = searchStr.replace(/^\.\s+/, '');
    const rawOrGroups = searchQuery.split(',').map((/** @type {string} */ g) => g.trim()).filter(Boolean);

    const parsedQuery = rawOrGroups.map(groupStr => {
      const andTerms = groupStr.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
      return andTerms.map((/** @type {string} */ term) => {
        const isNot = term.startsWith('!');
        const actualTerm = isNot ? term.substring(1) : term;
        if (!actualTerm) return null;

        let termValue = actualTerm;
        /** @type {{ kind: 'index'; index: number } | { kind: 'slice'; start?: number; end?: number } | null} */
        let range = null;
        const rangeMatch = termValue.match(/\[(-?\d+)?(?::(-?\d+)?)?\]$/);
        if (rangeMatch && (rangeMatch[1] !== undefined || rangeMatch[2] !== undefined || rangeMatch[0].includes(':'))) {
          termValue = termValue.slice(0, rangeMatch.index);
          range = rangeMatch[0].includes(':')
            ? {
                kind: 'slice',
                start: rangeMatch[1] === undefined ? undefined : Number(rangeMatch[1]),
                end: rangeMatch[2] === undefined ? undefined : Number(rangeMatch[2])
              }
            : { kind: 'index', index: Number(rangeMatch[1]) };
        }
        if (!termValue) return null;

        let searchKey = null;
        let searchValue = termValue;

        const colonIdx = termValue.indexOf(':');
        if (colonIdx > 0 && !termValue.startsWith('"')) {
          searchKey = termValue.substring(0, colonIdx).toLowerCase();
          searchValue = termValue.substring(colonIdx + 1);
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

        return { isNot, searchKey, searchValue, fieldIdx, fieldMatch, range };
      }).filter(Boolean);
    }).filter(g => g.length > 0);

    const eligibleImages = this.app.loadedImages.filter(img =>
      effectiveShowHidden || !this.app.isImageInHiddenFolder(img.name)
    );
    /** @type {WeakMap<CFOB_Image, { name: string; prompt: string | null; workflow: string | null }>} */
    const imageTextCache = new WeakMap();
    const matchesTerm = (/** @type {CFOB_Image} */ img, /** @type {NonNullable<(typeof parsedQuery)[number][number]>} */ term) => {
      let text = imageTextCache.get(img);
      if (!text) {
        text = { name: (img.name || "").toLowerCase(), prompt: null, workflow: null };
        imageTextCache.set(img, text);
      }
      let match = false;
      if (term.searchKey) {
        if (term.searchKey === 'name' || term.searchKey === 'path') {
          match = text.name.includes(term.searchValue);
        } else if (term.searchKey === 'prompt') {
          if (text.prompt === null) text.prompt = img.prompt ? JSON.stringify(img.prompt).toLowerCase() : "";
          match = text.prompt.includes(term.searchValue);
        } else if (term.searchKey === 'workflow') {
          if (text.workflow === null) text.workflow = img.workflow ? JSON.stringify(img.workflow).toLowerCase() : "";
          match = text.workflow.includes(term.searchValue);
        } else if (!isNaN(term.fieldIdx) && term.fieldIdx > 0 && term.fieldIdx <= this.app.settings.fieldConfigs.length) {
          const value = this.app.resolveFieldValue(img, this.app.settings.fieldConfigs[term.fieldIdx - 1].paths);
          match = value !== null && String(value).toLowerCase().includes(term.searchValue);
        } else if (term.fieldMatch) {
          const value = this.app.resolveFieldValue(img, term.fieldMatch.paths);
          match = value !== null && String(value).toLowerCase().includes(term.searchValue);
        }
      } else {
        if (text.prompt === null) text.prompt = img.prompt ? JSON.stringify(img.prompt).toLowerCase() : "";
        if (text.workflow === null) text.workflow = img.workflow ? JSON.stringify(img.workflow).toLowerCase() : "";
        match = text.name.includes(term.searchValue) || text.prompt.includes(term.searchValue) || text.workflow.includes(term.searchValue);
      }
      return term.isNot ? !match : match;
    };
    const applyRange = (
      /** @type {CFOB_Image[]} */ images,
      /** @type {NonNullable<(typeof parsedQuery)[number][number]['range']>} */ range
    ) => {
      if (range.kind === 'slice') return images.slice(range.start, range.end);
      const index = range.index < 0 ? images.length + range.index : range.index;
      return index >= 0 ? images.slice(index, index + 1) : [];
    };

    const matchingGroups = parsedQuery.length
      ? parsedQuery.map(andGroup => {
          let groupMatches = null;
          for (const term of andGroup) {
            let termMatches = eligibleImages.filter(img => matchesTerm(img, term));
            if (term.range) termMatches = applyRange(termMatches, term.range);
            const termMatchSet = new Set(termMatches);
            groupMatches = groupMatches === null
              ? termMatchSet
              : new Set([...groupMatches].filter(img => termMatchSet.has(img)));
            if (groupMatches.size === 0) break;
          }
          return groupMatches || new Set(eligibleImages);
        })
      : [new Set(eligibleImages)];
    const matchingImageSet = new Set(matchingGroups.flatMap(group => [...group]));
    this.app.filteredImages = eligibleImages.filter(img => matchingImageSet.has(img));

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

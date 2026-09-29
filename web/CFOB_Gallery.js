import ICONS from "./assets/icons.js";

/**
 * @typedef {{ kind: 'index'; index: number } | { kind: 'slice'; start?: number; end?: number }} CFOB_SearchRange
 * @typedef {{ isNot: boolean; searchKey: string | null; searchValue: string; fieldIdx: number; fieldMatch: CFOB_CardFieldSettings | null; range: CFOB_SearchRange | null }} CFOB_SearchTerm
 */

export default class CFOB_Gallery {
  /** @param {import("./ComfyOutputBrowser.js").default} app */
  constructor(app) {
    this.app = app;
    /** @type {CFOB_Image[]} */
    this.lastRenderedLoadedImages = [];
  }

  filterGallery() {
    const previousFilteredImages = this.app.filteredImages;
    const currentFullViewImage = this.app.settings.fullViewMode
      ? this.app.filteredImages[this.app.fullView.currentImageIndex]
      : null;
    const searchInput = /** @type {HTMLInputElement} */ (this.app.$("cfobSearchInput"));
    const searchStr = searchInput ? searchInput.value.trim() : "";

    // Force show hidden if query starts with a dot
    const forceShowHidden = searchStr.startsWith('.');
    const effectiveShowHidden = this.app.settings.showHiddenFolders || forceShowHidden;

    const clearBtn = this.app.$("cfobClearSearchBtn");
    if (clearBtn) clearBtn.style.display = searchStr ? 'flex' : 'none';

    // 1. Pre-parse the query outside the image loop to prevent redundant regex and parsing overhead
    const searchQuery = this.expandFilterShortcuts(searchStr.replace(/^\.\s+/, ''));
    const rawOrGroups = searchQuery.split(',').map((/** @type {string} */ g) => g.trim()).filter(Boolean);

    /** @type {CFOB_SearchTerm[][]} */
    const parsedQuery = rawOrGroups.map(groupStr => {
      const andTerms = groupStr.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
      return andTerms.flatMap((/** @type {string} */ term) => {
        const isNot = term.startsWith('!');
        const actualTerm = isNot ? term.substring(1) : term;
        if (!actualTerm) return [];

        let termValue = actualTerm;
        /** @type {CFOB_SearchRange | null} */
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
        if (!termValue) return [];

        /** @type {string | null} */
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
        /** @type {CFOB_CardFieldSettings | null} */
        let fieldMatch = null;

        if (searchKey && !['name', 'path', 'prompt', 'workflow'].includes(searchKey)) {
          fieldIdx = parseInt(searchKey, 10);
          if (isNaN(fieldIdx) || fieldIdx <= 0 || fieldIdx > this.app.settings.fieldConfigs.length) {
            fieldMatch = this.app.settings.fieldConfigs.find((/** @type {CFOB_CardFieldSettings} */ c) => c.label.toLowerCase() === searchKey) || null;
          }
        }

        return [{ isNot, searchKey, searchValue, fieldIdx, fieldMatch, range }];
      });
    }).filter(group => group.length > 0);

    const eligibleImages = this.app.loadedImages.filter(img =>
      effectiveShowHidden || !this.app.isImageInHiddenFolder(img.name)
    );
    /** @type {WeakMap<CFOB_Image, { name: string; prompt: string | null; workflow: string | null; fields: Map<string, string | null> }>} */
    const imageTextCache = new WeakMap();
    const matchesTerm = (/** @type {CFOB_Image} */ img, /** @type {CFOB_SearchTerm} */ term) => {
      let text = imageTextCache.get(img);
      if (!text) {
        text = { name: (img.name || "").toLowerCase(), prompt: null, workflow: null, fields: new Map() };
        imageTextCache.set(img, text);
      }
      const matchesField = (/** @type {string} */ paths) => {
        if (!text.fields.has(paths)) {
          const value = this.app.resolveFieldValue(img, paths);
          text.fields.set(paths, value === null ? null : String(value).toLowerCase());
        }
        return text.fields.get(paths)?.includes(term.searchValue) || false;
      };
      let match = false;
      if (term.searchKey) {
        if (term.searchKey === 'name' || term.searchKey === 'path') {
          match = text.name.includes(term.searchValue);
        } else if (term.searchKey === 'prompt') {
          if (text.prompt === null) text.prompt = img.prompt ? (JSON.stringify(img.prompt) || "").toLowerCase() : "";
          match = text.prompt.includes(term.searchValue);
        } else if (term.searchKey === 'workflow') {
          if (text.workflow === null) text.workflow = img.workflow ? (JSON.stringify(img.workflow) || "").toLowerCase() : "";
          match = text.workflow.includes(term.searchValue);
        } else if (!isNaN(term.fieldIdx) && term.fieldIdx > 0 && term.fieldIdx <= this.app.settings.fieldConfigs.length) {
          match = matchesField(this.app.settings.fieldConfigs[term.fieldIdx - 1].paths);
        } else if (term.fieldMatch) {
          match = matchesField(term.fieldMatch.paths);
        }
      } else {
        if (text.prompt === null) text.prompt = img.prompt ? (JSON.stringify(img.prompt) || "").toLowerCase() : "";
        if (text.workflow === null) text.workflow = img.workflow ? (JSON.stringify(img.workflow) || "").toLowerCase() : "";
        match = text.name.includes(term.searchValue) || text.prompt.includes(term.searchValue) || text.workflow.includes(term.searchValue);
      }
      return term.isNot ? !match : match;
    };
    const applyRange = (
      /** @type {CFOB_Image[]} */ images,
      /** @type {CFOB_SearchRange} */ range
    ) => {
      if (range.kind === 'slice') return images.slice(range.start, range.end);
      const index = range.index < 0 ? images.length + range.index : range.index;
      return index >= 0 ? images.slice(index, index + 1) : [];
    };

    const matchingGroups = parsedQuery.length
      ? parsedQuery.map(andGroup => {
          /** @type {CFOB_Image[] | null} */
          let groupMatches = null;
          for (const term of andGroup) {
            if (groupMatches === null) {
              groupMatches = eligibleImages.filter(img => matchesTerm(img, term));
              if (term.range) groupMatches = applyRange(groupMatches, term.range);
            } else if (term.range) {
              const termMatches = applyRange(eligibleImages.filter(img => matchesTerm(img, term)), term.range);
              const termMatchSet = new Set(termMatches);
              groupMatches = groupMatches.filter(img => termMatchSet.has(img));
            } else {
              groupMatches = groupMatches.filter(img => matchesTerm(img, term));
            }
            if (groupMatches.length === 0) break;
          }
          return groupMatches || eligibleImages;
        })
      : [eligibleImages];
    const matchingImageSet = new Set(matchingGroups.flat());
    this.app.filteredImages = eligibleImages.filter(img => matchingImageSet.has(img));

    const sourceImagesChanged = this.lastRenderedLoadedImages.length !== this.app.loadedImages.length ||
      this.lastRenderedLoadedImages.some((img, index) => img !== this.app.loadedImages[index]);
    const resultsChanged = previousFilteredImages.length !== this.app.filteredImages.length ||
      previousFilteredImages.some((img, index) => img !== this.app.filteredImages[index]);
    if (sourceImagesChanged || resultsChanged) this.renderGallery();
    this.app.selection.updateActionBar();
    if (this.app.settings.fullViewMode && this.app.$("cfobFullViewModal").classList.contains('active')) {
      if (this.app.filteredImages.length) {
        const currentIndex = currentFullViewImage
          ? this.app.filteredImages.findIndex(img => img.name === currentFullViewImage.name)
          : -1;
        this.app.fullView.currentImageIndex = currentIndex >= 0 ? currentIndex : 0;
      } else {
        this.app.fullView.currentImageIndex = 0;
      }
      this.app.fullView.updateFullViewUI();
    }
  }

  /** @param {string} query */
  expandFilterShortcuts(query) {
    const shortcuts = new Map(this.app.settings.filterShortcuts.map(
      (/** @type {{keyword: string, filter: string}} */ shortcut) => [shortcut.keyword.toLowerCase(), shortcut.filter]
    ));
    if (!shortcuts.size) return query;

    const splitOutsideQuotes = (/** @type {string} */ text, /** @type {(character: string) => boolean} */ isSeparator) => {
      const parts = [];
      let start = 0;
      let inQuotes = false;
      for (let index = 0; index < text.length; index++) {
        if (text[index] === '"') inQuotes = !inQuotes;
        else if (!inQuotes && isSeparator(text[index])) {
          parts.push(text.slice(start, index));
          start = index + 1;
        }
      }
      parts.push(text.slice(start));
      return parts;
    };

    return splitOutsideQuotes(query, character => character === ',')
      .flatMap(group => {
        const terms = group.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
        return terms.reduce((/** @type {string[]} */ expansions, /** @type {string} */ term) => {
          const reference = term.match(/^@([\p{L}\p{N}_-]+)$/u);
          const filter = reference ? shortcuts.get(reference[1].toLowerCase()) : undefined;
          if (!filter) return expansions.map(expansion => `${expansion} ${term}`.trim());
          const alternatives = splitOutsideQuotes(filter, character => character === ',')
            .map(alternative => alternative.trim()).filter(Boolean);
          if (!alternatives.length) return expansions.map(expansion => `${expansion} ${term}`.trim());
          return expansions.flatMap(expansion => alternatives.map(alternative =>
            `${expansion} ${alternative}`.trim()
          ));
        }, ['']);
      })
      .join(', ');
  }

  renderGallery() {
    const grid = this.app.$("cfobGalleryGrid");
    if (!grid) return;
    this.lastRenderedLoadedImages = this.app.loadedImages.slice();

    const activeElement = document.activeElement;
    const focusedCard = activeElement instanceof HTMLElement && grid.contains(activeElement)
      ? activeElement.closest('.image-card')
      : null;
    const focusedName = focusedCard instanceof HTMLElement ? focusedCard.dataset.name : null;
    const previousIndex = focusedName
      ? this.app.lastSelectedIdx
      : -1;

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
      if (focusedCard) {
        this.app.lastSelectedIdx = -1;
        this.app.$("cfobSearchInput").focus();
      }
      return;
    } else {
      if (emptyState) emptyState.style.display = "none";
    }

    const fragment = document.createDocumentFragment();
    const loadedImageIndexes = new Map(this.app.loadedImages.map((img, index) => [img, index]));

    this.app.filteredImages.forEach((img, idx) => {
      const isSelected = this.app.selectedImages.has(img.name);
      const card = document.createElement("div");
      card.className = `image-card ${isSelected ? 'selected' : ''} ${idx === this.app.lastSelectedIdx ? 'focused' : ''}`;
      card.tabIndex = -1;
      card.dataset.name = img.name;
      card.dataset.index = String(loadedImageIndexes.get(img) ?? -1);

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
      previewImg.addEventListener('click', () => {
        this.app.lastSelectedIdx = idx;
        this.app.root?.querySelectorAll('.image-card').forEach((item, index) => {
          item.classList.toggle('focused', index === idx);
        });
        card.focus();
        this.app.fullView.openFullView(img);
      });

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
          return;
        }
        const target = /** @type {HTMLElement} */ (e.target);
        if (!target.closest('.card-preview, button, input, a, [contenteditable="true"]')) {
          this.app.lastSelectedIdx = idx;
          this.app.root?.querySelectorAll('.image-card').forEach((item, index) => {
            item.classList.toggle('focused', index === idx);
          });
          card.focus();
        }
      });

      if (this.app.observer) this.app.observer.observe(card);

      fragment.appendChild(card);
    });

    grid.appendChild(fragment);
    if (focusedCard) {
      const focusIndex = this.app.filteredImages.findIndex(img => img.name === focusedName);
      const targetIndex = focusIndex >= 0
        ? focusIndex
        : Math.max(0, Math.min(previousIndex, this.app.filteredImages.length - 1));
      const card = grid.querySelectorAll('.image-card')[targetIndex];
      if (card) {
        this.app.lastSelectedIdx = targetIndex;
        grid.querySelectorAll('.image-card').forEach((item, index) => {
          item.classList.toggle('focused', index === targetIndex);
        });
        /** @type {HTMLElement} */ (card).focus();
      } else {
        this.app.lastSelectedIdx = -1;
        this.app.$("cfobSearchInput").focus();
      }
    }
  }
}

import ICONS from "./assets/icons.js";
import { filterImages } from "./CFOB_Filter.js";

export default class CFOB_Gallery {
  /** @param {import("./ComfyOutputBrowser.js").default} app */
  constructor(app) {
    this.app = app;
    /** @type {CFOB_Image[]} */
    this.lastRenderedLoadedImages = [];
    /** @type {Map<string, HTMLElement>} */
    this.cardCache = new Map();
    /** @type {ResizeObserver | null} */
    this.resizeObserver = null;
    /** @type {number | null} */
    this._resizeRafId = null;
    // Cache last syncGridLayout result to skip redundant style writes
    this._lastSyncRows = -1;
    this._lastSyncCols = -1;
    this._lastSyncAvailableHeight = -1;
    this._lastSyncItemSize = -1;
    /** @type {boolean | null} */
    this._lastSyncIsHorizontalRow = null;
    /** @type {boolean} */
    this._packingActive = false;
    /** @type {boolean} */
    this._packingHorizontal = false;
    /** @type {HTMLElement[]} */
    this._packingCards = [];
    /** @type {number | null} */
    this._packingRafId = null;
  }

  /**
 * Builds the card node exactly once.
 * @param {CFOB_Image} img 
 * @returns {HTMLElement}
 */
  createCard(img) {
    const card = document.createElement("div");
    card.className = "image-card";
    card.tabIndex = -1;
    card.dataset.name = img.name;

    card.innerHTML = `
      <div class="checkbox-wrapper">
        <input type="checkbox" class="card-checkbox" value="${this.app.escapeHtml(img.name)}">
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

    if (img.isParsed) card.dataset.parsed = "true";

    // Cache frequently accessed child refs directly on the card element to avoid
    // repeated querySelector calls during every render pass.
    const cb = /** @type {HTMLInputElement} */ (card.querySelector('.card-checkbox'));
    /** @type {any} */ (card)._cfobCheckbox = cb;
    /** @type {any} */ (card)._cfobBody = card.querySelector('.card-body');

    cb.addEventListener('click', (e) => this.app.selection.handleCheckboxClick(e, img.name));

    const previewImg = /** @type {HTMLImageElement} */ (card.querySelector('.card-preview'));
    previewImg.addEventListener('click', () => {
      const idx = Number(card.dataset.filterIndex);
      this._setFocusedIdx(idx);
      card.focus();
      this.app.fullView.openFullView(img);
    });
    // Masonry packing measures card heights, so it has to be redone once a
    // thumbnail loads and its natural aspect ratio is known. Without this the
    // spans stay sized for the not-yet-loaded cards and the grid overlaps.
    previewImg.addEventListener('load', () => this._scheduleRepack());

    const header = /** @type {HTMLElement} */ (card.querySelector('.card-header'));
    header.addEventListener('click', () => {
      card.classList.toggle('expanded');
      // Expanding reveals the metadata body, which changes the card's height and
      // so the number of masonry rows it must span.
      this._scheduleRepack();
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
        const idx = Number(card.dataset.filterIndex);
        this._setFocusedIdx(idx);
        card.focus();
      }
    });

    if (this.app.observer) this.app.observer.observe(card);

    return card;
  }

  /** @param {string} name */
  invalidateCard(name) {
    const card = this.cardCache.get(name);
    if (!card) return;
    if (this.app.observer) this.app.observer.unobserve(card);
    this.cardCache.delete(name);
  }

  /**
   * Updates app.lastSelectedIdx and toggles the 'focused' CSS class on only the
   * previously-focused card and the newly-focused card. This replaces the old
   * O(n) querySelectorAll+forEach broadcast that iterated the entire grid.
   * @param {number} idx
   */
  _setFocusedIdx(idx) {
    const prev = this.app.lastSelectedIdx;
    this.app.lastSelectedIdx = idx;
    if (prev !== idx && prev >= 0) {
      const grid = this.app.$("cfobGalleryGrid");
      const prevCard = grid
        ? /** @type {HTMLElement | null} */ (grid.querySelector(`.image-card[data-filter-index="${prev}"]`))
        : null;
      prevCard?.classList.remove('focused');
    }
    const grid = this.app.$("cfobGalleryGrid");
    const newCard = grid
      ? /** @type {HTMLElement | null} */ (grid.querySelector(`.image-card[data-filter-index="${idx}"]`))
      : null;
    newCard?.classList.add('focused');
  }

  /** @returns {HTMLElement[]} */
  getOrderedCards() {
    const grid = this.app.$("cfobGalleryGrid");
    if (!grid) return [];
    // Thanks to replaceChildren pooling, visible cards are now naturally in the exact DOM order 
    // without any hidden item gaps, entirely eliminating the need to parse and sort datasets in JS.
    return Array.from(grid.querySelectorAll('.image-card'));
  }

  filterGallery() {
    const previousFilteredImages = this.app.filteredImages;
    const currentFullViewImage = this.app.settings.fullViewMode
      ? this.app.filteredImages[this.app.fullView.currentImageIndex]
      : null;
    const searchInput = /** @type {HTMLInputElement} */ (this.app.$("cfobSearchInput"));
    const searchStr = searchInput ? searchInput.value.trim() : "";

    const clearBtn = this.app.$("cfobClearSearchBtn");
    if (clearBtn) clearBtn.style.display = searchStr ? 'flex' : 'none';

    this.app.filteredImages = filterImages(this.app.loadedImages, searchStr, {
      fieldConfigs: this.app.settings.fieldConfigs,
      filterShortcuts: this.app.settings.filterShortcuts,
      showHiddenFolders: this.app.settings.showHiddenFolders,
      isImageInHiddenFolder: name => this.app.isImageInHiddenFolder(name),
      resolveFieldValue: (img, paths) => this.app.resolveFieldValue(img, paths)
    });

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
          ? "Click Refresh to load ComfyUI outputs to inspect."
          : "No images match the current filter or hidden folder settings.";
      }
      if (focusedCard) {
        this.app.lastSelectedIdx = -1;
        this.app.$("cfobSearchInput").focus();
      }
      grid.replaceChildren(); // Safely remove all visible cards without destroying events
      this.syncGridLayout();
      return;
    } else {
      if (emptyState) emptyState.style.display = "none";
    }

    // Clean up removed items from the cache if loaded images shrink (deleted from disk/refresh)
    const loadedNames = new Set(this.app.loadedImages.map(img => img.name));
    if (this.cardCache.size > loadedNames.size) {
      for (const [name, card] of this.cardCache.entries()) {
        if (!loadedNames.has(name)) {
          if (this.app.observer) this.app.observer.unobserve(card);
          this.cardCache.delete(name);
        }
      }
    }

    // Provision missing cards on load/refresh incrementally
    this.app.loadedImages.forEach((img) => {
      if (!this.cardCache.has(img.name)) {
        this.cardCache.set(img.name, this.createCard(img));
      }
    });

    const loadedImageIndexes = new Map(this.app.loadedImages.map((img, index) => [img, index]));
    const fragment = document.createDocumentFragment();
    const lastSelectedIdx = this.app.lastSelectedIdx;
    const selectedImages = this.app.selectedImages;

    // Populate fragment strictly with filtered items.
    // By keeping hidden items out of the flow entirely, CSS Masonry & Flex/Grid flow works flawlessly.
    this.app.filteredImages.forEach((img, idx) => {
      const card = this.cardCache.get(img.name);
      if (!card) return;

      const isSelected = selectedImages.has(img.name);

      // Update state classes independently without wiping .expanded class
      card.classList.toggle('selected', isSelected);
      card.classList.toggle('focused', idx === lastSelectedIdx);
      card.dataset.index = String(loadedImageIndexes.get(img) ?? -1);
      card.dataset.filterIndex = String(idx);

      // Use cached checkbox ref — avoids one querySelector per card per render
      const cb = /** @type {HTMLInputElement} */ (/** @type {any} */ (card)._cfobCheckbox);
      if (cb && cb.checked !== isSelected) cb.checked = isSelected;

      // Parse metadata updates incrementally on-the-fly without destroying the main node
      if (img.isParsed && !card.dataset.parsed) {
        card.dataset.parsed = "true";
        // Use cached body ref — avoids one querySelector per card per render
        const body = /** @type {HTMLElement | null} */ (/** @type {any} */ (card)._cfobBody);
        if (body) body.innerHTML = this.app.getCardFieldsHtml(img);
      }

      fragment.appendChild(card);
    });

    // Single batch DOM swap (auto-removes cards no longer in the filtered fragment instantly)
    grid.replaceChildren(fragment);
    this.syncGridLayout();

    if (focusedCard) {
      const focusIndex = this.app.filteredImages.findIndex(img => img.name === focusedName);
      const targetIndex = focusIndex >= 0
        ? focusIndex
        : Math.max(0, Math.min(previousIndex, this.app.filteredImages.length - 1));

      const orderedCards = this.getOrderedCards();
      const card = orderedCards[targetIndex];

      if (card) {
        this.app.lastSelectedIdx = targetIndex;
        orderedCards.forEach((item, i) => {
          item.classList.toggle('focused', i === targetIndex);
        });
        /** @type {HTMLElement} */ (card).focus();
      } else {
        this.app.lastSelectedIdx = -1;
        this.app.$("cfobSearchInput").focus();
      }
    }
  }

  syncGridLayout() {
    const grid = this.app.$("cfobGalleryGrid");
    const container = this.app.$("cfobMainContainer");
    if (!grid || !container) return;

    if (!this.resizeObserver && typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        // Debounce via rAF: coalesce rapid resize events into a single layout pass
        if (this._resizeRafId !== null) return;
        this._resizeRafId = requestAnimationFrame(() => {
          this._resizeRafId = null;
          // Invalidate cached height so the next syncGridLayout recomputes
          this._lastSyncAvailableHeight = -1;
          this.syncGridLayout();
        });
      });
      this.resizeObserver.observe(container);
    }

    const settings = this.app.settings;
    const viewMode = settings.getGalleryViewMode();
    const isHorizontal = settings.scrollDir === 'horizontal';
    const isRowOrder = settings.gridFillOrder === 'row';
    const isMasonryGrid = settings.masonryEnabled && isRowOrder
      && (viewMode === 'grid' || viewMode === 'compact');

    // Vertical row-first masonry can pack right away; the horizontal case needs
    // the column count computed below, so it packs after that instead.
    this.applyRowFirstMasonryPacking(isMasonryGrid && !isHorizontal, grid, false);

    const isHorizontalRow = isHorizontal && isRowOrder && viewMode !== 'list';

    if (!isHorizontalRow) {
      if (this._lastSyncIsHorizontalRow !== false) {
        this._lastSyncIsHorizontalRow = false;
        grid.style.removeProperty('--cfob-col-count');
        grid.style.removeProperty('--cfob-row-count');
        // Reset cached values so they are recomputed if layout switches back
        this._lastSyncRows = -1;
        this._lastSyncCols = -1;
      }
      // Any earlier horizontal packing has to go, whatever the reason we left it.
      this.applyRowFirstMasonryPacking(false, grid, true);
      return;
    }

    const count = this.app.filteredImages.length;
    if (count === 0) {
      if (this._lastSyncRows !== 1 || this._lastSyncCols !== 1 || this._lastSyncIsHorizontalRow !== true) {
        this._lastSyncIsHorizontalRow = true;
        this._lastSyncRows = 1;
        this._lastSyncCols = 1;
        grid.style.setProperty('--cfob-col-count', '1');
        grid.style.setProperty('--cfob-row-count', '1');
      }
      this.applyRowFirstMasonryPacking(isMasonryGrid, grid, true);
      return;
    }

    const itemSize = parseFloat(getComputedStyle(grid).getPropertyValue('--gallery-item-size')) || this.app.settings.gridSize || 380;
    const fontSize = parseFloat(getComputedStyle(grid).fontSize) || 16;
    const gap = 0.4 * fontSize;
    const paddingBottom = 1.25 * fontSize;
    const availableHeight = Math.max(1, container.clientHeight - paddingBottom);
    const rows = Math.max(1, Math.floor((availableHeight + gap) / (itemSize + gap)));
    const cols = Math.max(1, Math.ceil(count / rows));

    // The packing below replaces the fixed track list, so it must run even when the
    // computed row/column counts are unchanged.
    const layoutUnchanged = this._lastSyncIsHorizontalRow === true
      && this._lastSyncRows === rows
      && this._lastSyncCols === cols
      && this._lastSyncAvailableHeight === availableHeight
      && this._lastSyncItemSize === itemSize;

    if (!layoutUnchanged) {
      this._lastSyncIsHorizontalRow = true;
      this._lastSyncRows = rows;
      this._lastSyncCols = cols;
      this._lastSyncAvailableHeight = availableHeight;
      this._lastSyncItemSize = itemSize;

      grid.style.setProperty('--cfob-row-count', String(rows));
      grid.style.setProperty('--cfob-col-count', String(cols));
    }

    this.applyRowFirstMasonryPacking(isMasonryGrid, grid, true);
  }

  /**
   * Removes the vertical gaps row-first masonry leaves below short cards.
   *
   * Row-first masonry keeps the source order, so a row is as tall as its tallest
   * card and any shorter card in that row leaves dead space until the next row.
   * Measuring each card and letting it span the exact number of grid rows it
   * occupies packs every column tightly while preserving the reading order.
   *
   * Vertical scrolling uses the implicit columns from the stylesheet; horizontal
   * scrolling has its fixed row tracks replaced so the columns can size themselves.
   *
   * @param {boolean} enabled
   * @param {HTMLElement} grid
   * @param {boolean} horizontal
   */
  applyRowFirstMasonryPacking(enabled, grid, horizontal) {
    const alreadyPacked = this._packingActive && this._packingHorizontal === horizontal;

    if (!enabled) {
      // Only clear the packing when it was this layout's; the other orientation
      // clears its own on its way in. The grid's own styles must go too: they are
      // inline, so the stylesheet cannot take back over while they are set.
      if (this._packingActive && this._packingHorizontal === horizontal) {
        this._clearPacking(grid, true);
      }
      return;
    }

    if (!alreadyPacked) {
      // Switching orientation: drop the other layout's packing and let the grid
      // return to its natural sizing before the heights are measured.
      if (this._packingActive) this._clearPacking(grid, true);
      else if (horizontal) this._clearHorizontalPacking(grid);
    }

    const cards = /** @type {HTMLElement[]} */ (Array.from(grid.querySelectorAll('.image-card')));
    if (!cards.length) return;

    const fontSize = parseFloat(getComputedStyle(grid).fontSize) || 16;
    const gap = 0.4 * fontSize;
    // One row unit per pixel (with row-gap zeroed, the gap is baked into each
    // span). Row tracks are then as tall as the cards, never shorter: a span that
    // under-counts its card makes the card overflow and overlap the next one.
    const unit = 1;

    // Height has to be read while the grid is still a plain grid: with spans
    // applied, a card's height is governed by its own span and would be circular.
    const heights = cards.map(card => card.getBoundingClientRect().height);

    grid.style.setProperty('grid-auto-rows', `${unit}px`);
    grid.style.setProperty('row-gap', '0px');
    // Plain row flow: the spans already fill the holes a short card would leave, and
    // unlike 'dense' it can never reorder a card into an earlier column.
    grid.style.setProperty('grid-auto-flow', 'row');

    /** @type {{ cols: number, colWidth: number } | null} */
    let columns = null;
    if (horizontal) {
      const container = this.app.$("cfobMainContainer");
      const gridStyle = getComputedStyle(grid);
      const itemSize = parseFloat(gridStyle.getPropertyValue('--gallery-item-size'))
        || this.app.settings.gridSize || 380;
      const paddingRight = parseFloat(gridStyle.paddingRight) || 0;
      const paddingBottom = parseFloat(gridStyle.paddingBottom) || 0;
      const availableWidth = Math.max(1, (container ? container.clientWidth : grid.clientWidth) - paddingRight);
      const availableHeight = Math.max(1, (container ? container.clientHeight : grid.clientHeight) - paddingBottom);

      // The stylesheet sizes rows from the nominal item size, but a masonry card is
      // as tall as its image, so that row count puts a card past the bottom edge.
      // Fit the rows to the measured heights instead: a card that cannot fit above
      // the bottom moves into the next column, the way column-first behaves.
      const rows = this._fitMasonryRows(heights, availableHeight, gap);
      const cols = Math.max(1, Math.ceil(heights.length / rows));
      // Resolve the column width the way CSS multi-column does, so row-first and
      // column-first end up with the same card width instead of 380 vs 386.
      const visible = Math.max(1, Math.floor((availableWidth + gap) / (itemSize + gap)));
      const colWidth = Math.round(((availableWidth - (visible - 1) * gap) / visible) * 100) / 100;

      grid.style.setProperty('--cfob-col-count', String(cols));
      grid.style.setProperty('--cfob-row-count', String(rows));
      // The stylesheet pins the row count for horizontal scrolling; the packed
      // columns need rows sized by their content instead.
      grid.style.setProperty('grid-template-rows', 'none');
      grid.style.setProperty('align-content', 'start');
      columns = { cols, colWidth };
    }

    for (let i = 0; i < cards.length; i++) {
      const span = Math.max(1, Math.ceil((heights[i] + gap) / unit));
      cards[i].style.setProperty('grid-row-end', `span ${span}`);
    }
    if (columns) {
      grid.style.setProperty('grid-template-columns', `repeat(${columns.cols}, ${columns.colWidth}px)`);
    }

    this._packingActive = true;
    this._packingHorizontal = horizontal;
    this._packingCards = cards;
  }

  /**
   * Largest number of rows at which no column's stacked cards exceed the pane.
   *
   * Cards are dealt row-major, so column c holds cards c, c+cols, c+2*cols...; the
   * tallest of those sums decides whether the row count fits. Feasibility falls as
   * the row count rises (fewer columns means more cards per column), so the first
   * feasible count found scanning downwards is the one to use.
   *
   * @param {number[]} heights
   * @param {number} availableHeight
   * @param {number} gap
   * @returns {number}
   */
  _fitMasonryRows(heights, availableHeight, gap) {
    const count = heights.length;
    for (let rows = count; rows >= 1; rows--) {
      const cols = Math.ceil(count / rows);
      let fits = true;
      for (let c = 0; c < cols && fits; c++) {
        let total = 0;
        let n = 0;
        for (let i = c; i < count; i += cols) {
          total += heights[i] + (n ? gap : 0);
          n++;
        }
        if (total > availableHeight) fits = false;
      }
      if (fits) return rows;
    }
    return 1;
  }

  /**
   * Drops the packing styles. The cards' spans are always removed; the grid's own
   * properties only when asked, since the incoming layout may have already set them.
   * @param {HTMLElement} grid
   * @param {boolean} clearGridStyles
   */
  _clearPacking(grid, clearGridStyles) {
    for (const card of this._packingCards) card.style.removeProperty('grid-row-end');
    this._packingCards = [];
    this._packingActive = false;
    this._packingHorizontal = false;
    if (clearGridStyles) this._clearHorizontalPacking(grid);
  }

  /** @param {HTMLElement} grid */
  _clearHorizontalPacking(grid) {
    grid.style.removeProperty('grid-auto-rows');
    grid.style.removeProperty('row-gap');
    grid.style.removeProperty('grid-auto-flow');
    grid.style.removeProperty('grid-template-rows');
    grid.style.removeProperty('grid-template-columns');
    grid.style.removeProperty('align-content');
  }

  /**
   * Re-packs the masonry grid when a card's height changes for a reason the layout
   * pass cannot see: a thumbnail finishing loading (its natural aspect ratio is
   * only known once decoded) or a card being expanded to show its metadata.
   * Batched through rAF because a grid full of images fires this many times at once.
   */
  _scheduleRepack() {
    if (this._packingRafId !== null) return;
    this._packingRafId = requestAnimationFrame(() => {
      this._packingRafId = null;
      if (!this._packingActive) return;
      const grid = this.app.$("cfobGalleryGrid");
      if (!grid) return;
      // Heights are measured while the spans are still applied, so clear them
      // first and let the grid return to its natural sizing.
      const horizontal = this._packingHorizontal;
      this._clearPacking(grid, true);
      this.applyRowFirstMasonryPacking(true, grid, horizontal);
    });
  }
}
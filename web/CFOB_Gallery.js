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

    const cb = /** @type {HTMLInputElement} */ (card.querySelector('.card-checkbox'));
    cb.addEventListener('click', (e) => this.app.selection.handleCheckboxClick(e, img.name));

    const previewImg = /** @type {HTMLImageElement} */ (card.querySelector('.card-preview'));
    previewImg.addEventListener('click', () => {
      const idx = Number(card.dataset.filterIndex);
      this.app.lastSelectedIdx = idx;
      this.app.root?.querySelectorAll('.image-card').forEach(item => {
        item.classList.toggle('focused', Number(/** @type {HTMLElement} */(item).dataset.filterIndex) === idx);
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
        const idx = Number(card.dataset.filterIndex);
        this.app.lastSelectedIdx = idx;
        this.app.root?.querySelectorAll('.image-card').forEach(item => {
          item.classList.toggle('focused', Number(/** @type {HTMLElement} */(item).dataset.filterIndex) === idx);
        });
        card.focus();
      }
    });

    if (this.app.observer) this.app.observer.observe(card);

    return card;
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
          ? "Click Refresh to load ComfyUI outputs, or drop PNGs anywhere to inspect."
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

    // Populate fragment strictly with filtered items.
    // By keeping hidden items out of the flow entirely, CSS Masonry & Flex/Grid flow works flawlessly.
    this.app.filteredImages.forEach((img, idx) => {
      const card = this.cardCache.get(img.name);
      if (!card) return;

      const isSelected = this.app.selectedImages.has(img.name);

      // Update state classes independently without wiping .expanded class
      card.classList.toggle('selected', isSelected);
      card.classList.toggle('focused', idx === this.app.lastSelectedIdx);
      card.dataset.index = String(loadedImageIndexes.get(img) ?? -1);
      card.dataset.filterIndex = String(idx);

      const cb = /** @type {HTMLInputElement} */ (card.querySelector('.card-checkbox'));
      if (cb && cb.checked !== isSelected) cb.checked = isSelected;

      // Parse metadata updates incrementally on-the-fly without destroying the main node
      if (img.isParsed && !card.dataset.parsed) {
        card.dataset.parsed = "true";
        const body = card.querySelector('.card-body');
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
        this.syncGridLayout();
      });
      this.resizeObserver.observe(container);
    }

    const isHorizontalRow = this.app.settings.scrollDir === 'horizontal'
      && this.app.settings.gridFillOrder === 'row'
      && this.app.settings.getGalleryViewMode() !== 'list'
      && this.app.settings.getGalleryViewMode() !== 'full';

    if (!isHorizontalRow) {
      grid.style.removeProperty('--cfob-col-count');
      grid.style.removeProperty('--cfob-row-count');
      return;
    }

    const count = this.app.filteredImages.length;
    if (count === 0) {
      grid.style.setProperty('--cfob-col-count', '1');
      grid.style.setProperty('--cfob-row-count', '1');
      return;
    }

    const itemSize = parseFloat(getComputedStyle(grid).getPropertyValue('--gallery-item-size')) || this.app.settings.gridSize || 380;
    const fontSize = parseFloat(getComputedStyle(grid).fontSize) || 16;
    const gap = 0.4 * fontSize;
    const paddingBottom = 1.25 * fontSize;
    const availableHeight = Math.max(1, container.clientHeight - paddingBottom);
    const rows = Math.max(1, Math.floor((availableHeight + gap) / (itemSize + gap)));
    const cols = Math.max(1, Math.ceil(count / rows));

    grid.style.setProperty('--cfob-row-count', String(rows));
    grid.style.setProperty('--cfob-col-count', String(cols));
  }
}
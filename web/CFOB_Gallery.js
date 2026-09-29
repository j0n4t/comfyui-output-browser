import ICONS from "./assets/icons.js";
import { filterImages } from "./CFOB_Filter.js";

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

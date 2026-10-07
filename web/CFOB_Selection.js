export default class CFOB_Selection {
  /** @param {import("./ComfyOutputBrowser.js").default} app */
  constructor(app) {
    this.app = app;
  }

  focusFirstGridItem() {
    const app = this.app;
    if (!app.filteredImages.length) return;

    app.lastSelectedIdx = 0;
    const cards = app.gallery.getOrderedCards();
    cards.forEach((card, index) => card.classList.toggle('focused', index === 0));
    const firstCard = cards[0];
    firstCard?.scrollIntoView({ behavior: 'auto', block: 'nearest', inline: 'nearest' });
    firstCard?.focus();
  }

  /**
   * Navigates the grid focus spatially using arrow keys.
   * @param {KeyboardEvent} e
   */
  handleGridNavigation(e) {
    const app = this.app;
    if (!app.filteredImages.length) return;

    const grid = app.$("cfobGalleryGrid");
    const cards = app.gallery.getOrderedCards();
    if (!cards.length) return;

    const direction = e.key;
    let currentIdx = Math.max(0, Math.min(app.lastSelectedIdx, cards.length - 1));

    const isMasonry = grid.classList.contains('masonry')
      && grid.classList.contains('grid-column-first')
      && (grid.classList.contains('view-grid') || grid.classList.contains('view-compact'));
    const isColumnFlow = grid.classList.contains('grid-column-first');
    let masonryNextIdx = currentIdx;
    if (isMasonry && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'PageUp', 'PageDown'].includes(direction)) {
      const currentRect = cards[currentIdx].getBoundingClientRect();
      const currentX = currentRect.left + currentRect.width / 2;
      const currentY = currentRect.top + currentRect.height / 2;
      const isVertical = direction === 'ArrowUp' || direction === 'ArrowDown' || direction === 'PageUp' || direction === 'PageDown';
      const isBackward = direction === 'ArrowLeft' || direction === 'ArrowUp' || direction === 'PageUp';
      let nextScore = Infinity;

      if (direction === 'PageUp' || direction === 'PageDown') {
        const targetY = currentY + (direction === 'PageUp' ? -1 : 1) * app.$("cfobMainContainer").clientHeight;
        for (let i = 0; i < cards.length; i++) {
          if (i === currentIdx) continue;
          const rect = cards[i].getBoundingClientRect();
          const score = Math.abs(rect.top + rect.height / 2 - targetY)
            + Math.abs(rect.left + rect.width / 2 - currentX) * 0.25;
          if (score < nextScore) {
            nextScore = score;
            masonryNextIdx = i;
          }
        }
      } else {
        let bestCrossDistance = Infinity;
        for (let i = 0; i < cards.length; i++) {
          if (i === currentIdx) continue;
          const rect = cards[i].getBoundingClientRect();
          const candidateX = rect.left + rect.width / 2;
          const candidateY = rect.top + rect.height / 2;
          const primaryDistance = isVertical ? candidateY - currentY : candidateX - currentX;
          if ((isBackward && primaryDistance >= 0) || (!isBackward && primaryDistance <= 0)) continue;
          const crossDistance = isVertical
            ? Math.max(0, Math.max(currentRect.left - rect.right, rect.left - currentRect.right))
            : Math.max(0, Math.max(currentRect.top - rect.bottom, rect.top - currentRect.bottom));
          if (crossDistance < bestCrossDistance
            || (crossDistance === bestCrossDistance && Math.abs(primaryDistance) < nextScore)) {
            bestCrossDistance = crossDistance;
            nextScore = Math.abs(primaryDistance);
            masonryNextIdx = i;
          }
        }
      }
    }

    let cols = 1;
    if (!isMasonry) {
      const firstOffset = isColumnFlow
        ? cards[0].offsetLeft
        : cards[0].offsetTop;
      for (let i = 1; i < cards.length; i++) {
        const offset = isColumnFlow
          ? cards[i].offsetLeft
          : cards[i].offsetTop;
        if (offset > firstOffset) {
          cols = i;
          break;
        }
        if (i === cards.length - 1) cols = cards.length;
      }
    }

    let nextIdx = isMasonry ? masonryNextIdx : app.lastSelectedIdx;
    if (nextIdx === -1) nextIdx = 0;
    if (!isMasonry && direction === 'ArrowLeft') nextIdx -= isColumnFlow ? cols : 1;
    else if (!isMasonry && direction === 'ArrowRight') nextIdx += isColumnFlow ? cols : 1;
    else if (!isMasonry && direction === 'ArrowUp') nextIdx -= isColumnFlow ? 1 : cols;
    else if (!isMasonry && direction === 'ArrowDown') nextIdx += isColumnFlow ? 1 : cols;
    else if (!isMasonry && (direction === 'PageUp' || direction === 'PageDown')) {
      const container = app.$("cfobMainContainer");
      const pageRows = Math.max(1, Math.floor(container.clientHeight / Math.max(1, cards[0].clientHeight)));
      const pageItems = (isColumnFlow ? 1 : cols) * pageRows;
      nextIdx += direction === 'PageUp' ? -pageItems : pageItems;
    }
    else if (direction === 'Home') nextIdx = 0;
    else if (direction === 'End') nextIdx = app.filteredImages.length - 1;

    nextIdx = Math.max(0, Math.min(nextIdx, app.filteredImages.length - 1));

    app.lastSelectedIdx = nextIdx;

    cards.forEach((c, i) => {
      const el = c;
      el.classList.toggle('focused', i === nextIdx);
      if (i === nextIdx) el.scrollIntoView({ behavior: 'auto', block: 'nearest', inline: 'nearest' });
    });
    cards[nextIdx].focus();
  }

  updateActionBar() {
    const app = this.app;
    const bar = app.$("cfobActionBar");
    const count = app.selectedImages.size;
    if (count > 0) {
      bar.classList.add('show');
      app.$("cfobSelectionCount").innerText = `${count} selected`;

      const isSingle = count === 1;
      app.$("cfobActionInspect").style.display = isSingle ? 'inline-flex' : 'none';
      app.$("cfobActionOpen").style.display = isSingle ? 'inline-flex' : 'none';
      app.$("cfobActionRename").style.display = isSingle ? 'inline-flex' : 'none';
      app.$("cfobActionMove").style.display = 'inline-flex';
      app.$("cfobActionSendChips").style.display = isSingle ? 'inline-flex' : 'none';
    } else {
      bar.classList.remove('show');
    }
  }

  updateCardStyles() {
    const app = this.app;
    app.root?.querySelectorAll('.image-card').forEach(card => {
      const name = /** @type {HTMLElement} */ (card).dataset.name;
      if (app.selectedImages.has(name)) card.classList.add('selected');
      else card.classList.remove('selected');
    });
  }

  /**
   * @param {PointerEvent} e
   * @param {string} filename
   */
  handleCheckboxClick(e, filename) {
    const app = this.app;
    e.stopPropagation();
    const target = /** @type {HTMLInputElement} */ (e.target);
    const card = target.closest('.image-card');
    const fIdx = app.filteredImages.findIndex(img => img.name === filename);
    if (fIdx === -1 || !card) return;

    if (e.shiftKey && app.selectionAnchorIdx !== undefined && app.selectionAnchorIdx !== -1) {
      const start = Math.min(app.selectionAnchorIdx, fIdx);
      const end = Math.max(app.selectionAnchorIdx, fIdx);
      const isChecked = target.checked;

      for (let i = start; i <= end; i++) {
        const targetImg = app.filteredImages[i];
        if (isChecked) app.selectedImages.add(targetImg.name);
        else app.selectedImages.delete(targetImg.name);
      }

      app.root?.querySelectorAll('.card-checkbox').forEach(cb => {
        /** @type {HTMLInputElement} */ (cb).checked = app.selectedImages.has(/** @type {HTMLInputElement} */(cb).value);
      });
    } else {
      if (target.checked) app.selectedImages.add(filename);
      else app.selectedImages.delete(filename);
      app.selectionAnchorIdx = fIdx;
    }

    const prevIdx = app.lastSelectedIdx;
    app.lastSelectedIdx = fIdx;

    // Only touch the two affected cards instead of iterating the whole grid
    const grid = app.$("cfobGalleryGrid");
    if (grid && prevIdx !== fIdx && prevIdx >= 0) {
      /** @type {HTMLElement | null} */ (grid.querySelector(`.image-card[data-filter-index="${prevIdx}"]`))?.classList.remove('focused');
    }
    if (grid) {
      /** @type {HTMLElement | null} */ (grid.querySelector(`.image-card[data-filter-index="${fIdx}"]`))?.classList.add('focused');
    }

    app.selection.updateActionBar();
    app.selection.updateCardStyles();
    /** @type {HTMLElement} */ (card).focus();
  }

  /** @param {boolean} resetAnchor */
  clearSelection(resetAnchor = true) {
    const app = this.app;
    const activeElement = document.activeElement;
    const restoreGridFocus = activeElement instanceof HTMLElement && app.$("cfobActionBar").contains(activeElement);
    const focusedCard = activeElement instanceof HTMLElement ? activeElement.closest('.image-card') : null;
    const focusedIndex = focusedCard instanceof HTMLElement
      ? app.filteredImages.findIndex(img => img.name === focusedCard.dataset.name)
      : -1;
    const previousIndex = app.lastSelectedIdx;
    app.selectedImages.clear();
    app.root?.querySelectorAll('.card-checkbox').forEach(cb => /** @type {HTMLInputElement} */(cb).checked = false);

    if (resetAnchor) {
      app.lastSelectedIdx = focusedIndex >= 0 ? focusedIndex : (focusedCard || restoreGridFocus) ? previousIndex : -1;
      app.selectionAnchorIdx = -1;
      app.root?.querySelectorAll('.image-card').forEach(c => /** @type {HTMLElement} */(c).style.boxShadow = '');
    }

    app.selection.updateCardStyles();
    app.selection.updateActionBar();

    if (restoreGridFocus) {
      const cards = app.gallery.getOrderedCards();
      const card = cards[Math.max(0, Math.min(previousIndex, cards.length - 1))];
      if (card) {
        app.lastSelectedIdx = Math.max(0, Math.min(previousIndex, cards.length - 1));
        card.focus();
      }
      else app.$("cfobSearchInput").focus();
    }
  }

  selectAllFiltered() {
    const app = this.app;
    if (!app.filteredImages.length) return;
    app.filteredImages.forEach(img => app.selectedImages.add(img.name));
    app.root?.querySelectorAll('.card-checkbox').forEach(cb => {
      /** @type {HTMLInputElement} */ (cb).checked = app.selectedImages.has(/** @type {HTMLInputElement} */(cb).value);
    });
    app.selection.updateCardStyles();
    app.selection.updateActionBar();
  }
}

export default class CFOB_Selection {
  /** @param {import("./ComfyOutputBrowser.js").default} app */
  constructor(app) {
    this.app = app;
  }

  focusFirstGridItem() {
    const app = this.app;
    if (!app.filteredImages.length) return;

    app.selection.clearSelection(false);
    app.lastSelectedIdx = 0;
    app.selectionAnchorIdx = 0;
    app.selectedImages.add(app.filteredImages[0].name);
    const cards = Array.from(app.$("cfobGalleryGrid").querySelectorAll('.image-card'));
    cards.forEach((card, index) => /** @type {HTMLElement} */(card).classList.toggle('focused', index === 0));
    const firstCard = cards[0];
    firstCard?.scrollIntoView({ behavior: 'auto', block: 'nearest' });
    /** @type {HTMLElement | undefined} */ (firstCard)?.focus();
    app.selection.updateCardStyles();
    app.selection.updateActionBar();
  }

  /**
   * Navigates the grid focus spatially using arrow keys.
   * @param {KeyboardEvent} e
   */
  handleGridNavigation(e) {
    const app = this.app;
    if (!app.filteredImages.length) return;

    const grid = app.$("cfobGalleryGrid");
    const cards = Array.from(grid.querySelectorAll('.image-card'));
    if (!cards.length) return;

    const direction = e.key;
    const isShift = e.shiftKey;
    const isCtrl = e.ctrlKey || e.metaKey;

    let currentIdx = app.lastSelectedIdx;
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
    else if (direction === 'PageUp' || direction === 'PageDown') {
      const container = app.$("cfobMainContainer");
      const pageRows = Math.max(1, Math.floor(container.clientHeight / Math.max(1, cards[0].clientHeight)));
      const pageItems = cols * pageRows;
      nextIdx += direction === 'PageUp' ? -pageItems : pageItems;
    }
    else if (direction === 'Home') nextIdx = 0;
    else if (direction === 'End') nextIdx = app.filteredImages.length - 1;

    nextIdx = Math.max(0, Math.min(nextIdx, app.filteredImages.length - 1));

    if (app.selectionAnchorIdx === undefined) {
      app.selectionAnchorIdx = currentIdx;
    }

    if (isShift) {
      app.selection.clearSelection(false);
      const start = Math.min(app.selectionAnchorIdx, nextIdx);
      const end = Math.max(app.selectionAnchorIdx, nextIdx);
      for (let i = start; i <= end; i++) {
        app.selectedImages.add(app.filteredImages[i].name);
      }
    } else if (isCtrl) {
      app.selectionAnchorIdx = nextIdx;
    } else {
      app.selection.clearSelection(false);
      app.selectedImages.add(app.filteredImages[nextIdx].name);
      app.selectionAnchorIdx = nextIdx;
    }

    app.lastSelectedIdx = nextIdx;

    cards.forEach((c, i) => {
      const cb = /** @type {HTMLInputElement} */ (c.querySelector('.card-checkbox'));
      if (cb) cb.checked = app.selectedImages.has(app.filteredImages[i].name);

      const el = /** @type {HTMLElement} */ (c);
      el.classList.toggle('focused', i === nextIdx);
      if (i === nextIdx) el.scrollIntoView({ behavior: 'auto', block: 'nearest' });
    });
    /** @type {HTMLElement} */ (cards[nextIdx]).focus();

    app.selection.updateCardStyles();
    app.selection.updateActionBar();
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

    app.lastSelectedIdx = fIdx;
    app.root?.querySelectorAll('.image-card').forEach((c, i) => {
      /** @type {HTMLElement} */ (c).classList.toggle('focused', i === fIdx);
    });

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
      app.lastSelectedIdx = focusedIndex >= 0 ? focusedIndex : restoreGridFocus ? previousIndex : -1;
      app.selectionAnchorIdx = -1;
      app.root?.querySelectorAll('.image-card').forEach(c => /** @type {HTMLElement} */(c).style.boxShadow = '');
    }

    app.selection.updateCardStyles();
    app.selection.updateActionBar();

    if (restoreGridFocus) {
      const cards = app.$("cfobGalleryGrid").querySelectorAll('.image-card');
      const card = cards[Math.max(0, Math.min(previousIndex, cards.length - 1))];
      if (card) {
        app.lastSelectedIdx = Math.max(0, Math.min(previousIndex, cards.length - 1));
        /** @type {HTMLElement} */ (card).focus();
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

export default class CFOB_Modal {
  /** @param {import("./ComfyOutputBrowser.js").default} app */
  constructor(app) {
    this.app = app;
    /** @type {WeakMap<HTMLElement, HTMLElement | null>} */
    this.returnFocus = new WeakMap();
  }

  bindEvents() {
    document.addEventListener('keydown', (e) => {
      const modal = this.getActive();
      if (!modal) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopImmediatePropagation();
        this.requestClose(modal);
      } else if (e.key === 'Tab') {
        this.trapFocus(e, modal);
      }
    });

    this.app.root?.addEventListener('click', (e) => {
      const target = e.target instanceof Element ? e.target.closest('[data-modal-dismiss]') : null;
      const modal = target?.closest('.modal-overlay[data-dialog-modal]');
      if (modal instanceof HTMLElement) this.close(modal);
    });
  }

  /** @returns {HTMLElement | null} */
  getActive() {
    const modals = this.app.root?.querySelectorAll('.modal-overlay[data-dialog-modal].active');
    return /** @type {HTMLElement | undefined} */ (modals?.[modals.length - 1]) || null;
  }

  /** @param {HTMLElement} modal @param {HTMLElement | null} [focusTarget] */
  open(modal, focusTarget = null) {
    this.captureFocus(modal);
    modal.classList.add('active');
    focusTarget?.focus();
  }

  /** @param {HTMLElement} modal */
  captureFocus(modal) {
    if (modal.classList.contains('active') || this.returnFocus.has(modal)) return;
    const activeElement = document.activeElement;
    const activeModal = activeElement instanceof HTMLElement ? activeElement.closest('.modal-overlay') : null;
    this.returnFocus.set(
      modal,
      activeElement instanceof HTMLElement &&
        this.app.root?.contains(activeElement) &&
        !modal.contains(activeElement) &&
        (!activeModal || activeModal.classList.contains('active'))
        ? activeElement
        : null
    );
  }

  /** @param {HTMLElement} modal */
  close(modal) {
    modal.classList.remove('active');
    const returnFocus = this.returnFocus.get(modal);
    this.returnFocus.delete(modal);
    const activeModal = this.getActive();
    if (returnFocus?.isConnected && this.app.root?.contains(returnFocus) &&
      (!activeModal || activeModal.contains(returnFocus))) {
      returnFocus.focus();
    } else if (activeModal) {
      this.getFocusable(activeModal)[0]?.focus();
    } else if (this.app.root?.isConnected && !this.app.root.classList.contains('cfob-hidden')) {
      this.app.$("cfobSearchInput").focus();
    }
  }

  /** @param {HTMLElement} modal */
  requestClose(modal) {
    const closeButton = modal.querySelector('[data-modal-cancel], [data-modal-dismiss]');
    if (closeButton instanceof HTMLElement) closeButton.click();
    else this.close(modal);
  }

  /** @param {KeyboardEvent} e @param {HTMLElement} modal */
  trapFocus(e, modal) {
    const focusable = this.getFocusable(modal);
    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (!modal.contains(document.activeElement)) {
      e.preventDefault();
      (e.shiftKey ? last : first).focus();
    } else if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  /** @param {HTMLElement} modal @returns {HTMLElement[]} */
  getFocusable(modal) {
    return /** @type {HTMLElement[]} */ (Array.from(modal.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]'
    )).filter(element => element.getClientRects().length > 0));
  }
}

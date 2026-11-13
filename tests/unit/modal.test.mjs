// Setup DOM globals before anything else
class FakeElement {
  constructor(tag, { className = "", id = "", dataset = {}, parent = null } = {}) {
    this.tagName = tag.toUpperCase();
    this.id = id;
    this.dataset = { ...dataset };
    this.parentElement = parent;
    this.children = [];
    this.style = {};
    this.isConnected = true;
    this.tabIndex = 0;
    this.disabled = false;
    this._listeners = new Map();
    this._classList = new Set(className ? className.split(/\s+/).filter(Boolean) : []);
  }

  get classList() {
    const list = this._classList;
    return {
      add: (...tokens) => tokens.forEach(t => list.add(t)),
      remove: (...tokens) => tokens.forEach(t => list.delete(t)),
      toggle: (token, force) => {
        if (force === undefined) {
          if (list.has(token)) { list.delete(token); return false; }
          list.add(token); return true;
        }
        if (force) { list.add(token); return true; }
        list.delete(token); return false;
      },
      contains: (token) => list.has(token),
    };
  }

  addEventListener(type, fn) {
    if (!this._listeners.has(type)) this._listeners.set(type, []);
    this._listeners.get(type).push(fn);
  }

  removeEventListener(type, fn) {
    const arr = this._listeners.get(type) || [];
    const idx = arr.indexOf(fn);
    if (idx !== -1) arr.splice(idx, 1);
  }

  focus() {
    globalThis.document.activeElement = this;
  }

  blur() {
    if (globalThis.document.activeElement === this) {
      globalThis.document.activeElement = null;
    }
  }

  contains(child) {
    if (!child) return false;
    if (child === this) return true;
    let cur = child.parentElement;
    while (cur) {
      if (cur === this) return true;
      cur = cur.parentElement;
    }
    return false;
  }

  closest(selector) {
    let cur = this;
    while (cur) {
      if (selector === '.modal-overlay' && cur.classList.contains('modal-overlay')) return cur;
      if (selector === '.modal-overlay[data-dialog-modal]' && cur.classList.contains('modal-overlay') && 'dialogModal' in cur.dataset) return cur;
      if (selector === '[data-modal-dismiss]' && ('modalDismiss' in cur.dataset)) return cur;
      if (selector === '[data-modal-cancel], [data-modal-dismiss]' && ('modalCancel' in cur.dataset || 'modalDismiss' in cur.dataset)) return cur;
      cur = cur.parentElement;
    }
    return null;
  }

  querySelector(selector) {
    const all = this.querySelectorAll(selector);
    return all.length ? all[0] : null;
  }

  querySelectorAll(selector) {
    const results = [];
    function walk(node) {
      for (const child of node.children) {
        let match = false;
        if (selector.includes('.modal-overlay[data-dialog-modal].active')) {
          if (child.classList.contains('modal-overlay') && 'dialogModal' in child.dataset && child.classList.contains('active')) match = true;
        } else if (selector.includes('[data-modal-cancel]') || selector.includes('[data-modal-dismiss]')) {
          if ('modalCancel' in child.dataset || 'modalDismiss' in child.dataset) match = true;
        } else if (selector.includes('button') || selector.includes('[tabindex="0"]')) {
          if ((child.tagName === 'BUTTON' || child.tagName === 'INPUT') && !child.disabled) match = true;
        }
        if (match) results.push(child);
        walk(child);
      }
    }
    walk(this);
    return results;
  }

  appendChild(child) {
    child.parentElement = this;
    this.children.push(child);
    return child;
  }

  getClientRects() {
    return [{ width: 100, height: 30 }];
  }
}

globalThis.HTMLElement = FakeElement;
globalThis.Element = FakeElement;
globalThis.document = {
  activeElement: null,
  addEventListener: () => {},
  removeEventListener: () => {},
};

import assert from "node:assert/strict";
import test from "node:test";

import CFOB_Modal from "../../web/CFOB_Modal.js";

function createElement(tag, opts) {
  return new FakeElement(tag, opts);
}

test("CFOB_Modal: getActive returns topmost active dialog modal", () => {
  const root = createElement("div", { id: "cfob-root" });
  const modal1 = createElement("div", { className: "modal-overlay active", dataset: { dialogModal: "true" } });
  const modal2 = createElement("div", { className: "modal-overlay active", dataset: { dialogModal: "true" } });
  root.appendChild(modal1);
  root.appendChild(modal2);

  const app = { root, $(id) { if (id === "cfobSearchInput") return createElement("input"); return null; } };
  const manager = new CFOB_Modal(app);

  assert.equal(manager.getActive(), modal2, "should return the last (topmost) active modal");

  modal2.classList.remove("active");
  assert.equal(manager.getActive(), modal1, "should return modal1 after modal2 is deactivated");

  modal1.classList.remove("active");
  assert.equal(manager.getActive(), null, "should return null when no modals are active");
});

test("CFOB_Modal: open captures active element and focuses target", () => {
  const root = createElement("div", { id: "cfob-root" });
  const triggerBtn = createElement("button", { id: "openSettings" });
  const modal = createElement("div", { className: "modal-overlay", dataset: { dialogModal: "true" } });
  const input = createElement("input", { id: "settingInput" });
  modal.appendChild(input);
  root.appendChild(triggerBtn);
  root.appendChild(modal);

  triggerBtn.focus();

  const app = { root, $(id) { if (id === "cfobSearchInput") return createElement("input"); return null; } };
  const manager = new CFOB_Modal(app);

  manager.open(modal, input);

  assert.ok(modal.classList.contains("active"), "modal should have active class");
  assert.equal(globalThis.document.activeElement, input, "focus target should have focus");
  assert.equal(manager.returnFocus.get(modal), triggerBtn, "returnFocus should record the triggering element");
});

test("CFOB_Modal: close restores focus to triggering element", () => {
  const root = createElement("div", { id: "cfob-root" });
  const triggerBtn = createElement("button", { id: "openSettings" });
  const modal = createElement("div", { className: "modal-overlay", dataset: { dialogModal: "true" } });
  root.appendChild(triggerBtn);
  root.appendChild(modal);

  triggerBtn.focus();

  const app = { root, $(id) { if (id === "cfobSearchInput") return createElement("input"); return null; } };
  const manager = new CFOB_Modal(app);

  manager.open(modal);
  manager.close(modal);

  assert.equal(modal.classList.contains("active"), false, "modal should not have active class");
  assert.equal(globalThis.document.activeElement, triggerBtn, "focus should be restored to triggerBtn");
});

test("CFOB_Modal: trapFocus cycles Tab from last to first element, and Shift+Tab from first to last", () => {
  const modal = createElement("div", { className: "modal-overlay active" });
  const btnFirst = createElement("button", { id: "btnFirst" });
  const btnLast = createElement("button", { id: "btnLast" });
  modal.appendChild(btnFirst);
  modal.appendChild(btnLast);

  const manager = new CFOB_Modal({ root: modal });

  // Tab on last element -> wraps to first
  btnLast.focus();
  let prevented = false;
  const tabEvent = {
    key: "Tab",
    shiftKey: false,
    preventDefault: () => { prevented = true; }
  };
  manager.trapFocus(tabEvent, modal);
  assert.ok(prevented, "Tab on last element should preventDefault");
  assert.equal(globalThis.document.activeElement, btnFirst, "Tab on last element should wrap focus to first");

  // Shift+Tab on first element -> wraps to last
  btnFirst.focus();
  let shiftPrevented = false;
  const shiftTabEvent = {
    key: "Tab",
    shiftKey: true,
    preventDefault: () => { shiftPrevented = true; }
  };
  manager.trapFocus(shiftTabEvent, modal);
  assert.ok(shiftPrevented, "Shift+Tab on first element should preventDefault");
  assert.equal(globalThis.document.activeElement, btnLast, "Shift+Tab on first element should wrap focus to last");
});

test("CFOB_Modal: requestClose clicks cancel or dismiss button if present", () => {
  const modal = createElement("div", { className: "modal-overlay active" });
  let cancelClicked = false;
  const cancelBtn = createElement("button", { dataset: { modalCancel: "true" } });
  cancelBtn.click = () => { cancelClicked = true; };
  modal.appendChild(cancelBtn);

  const manager = new CFOB_Modal({ root: modal, $(_id) { return createElement("input"); } });
  manager.requestClose(modal);

  assert.ok(cancelClicked, "requestClose should invoke cancel button click when present");
});

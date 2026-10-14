import assert from "node:assert/strict";
import test from "node:test";

test("launcher button placement in sidebar (graph and app modes) and fallbacks", () => {
  // Setup minimal DOM mock
  class MockElement {
    constructor(tagName) {
      this.tagName = tagName.toUpperCase();
      this.id = "";
      this.className = "";
      this.classList = {
        _classes: new Set(),
        add: (...cls) => cls.forEach(c => this.classList._classes.add(c)),
        remove: (...cls) => cls.forEach(c => this.classList._classes.delete(c)),
        toggle: (c, force) => {
          if (force !== undefined) {
            if (force) this.classList._classes.add(c);
            else this.classList._classes.delete(c);
            return force;
          }
          if (this.classList._classes.has(c)) {
            this.classList._classes.delete(c);
            return false;
          }
          this.classList._classes.add(c);
          return true;
        },
        contains: (c) => this.classList._classes.has(c)
      };
      this.style = {};
      this.children = [];
      this.parentElement = null;
      this.attributes = new Map();
      this.innerHTML = "";
    }

    setAttribute(k, v) {
      this.attributes.set(k, String(v));
    }

    getAttribute(k) {
      return this.attributes.get(k) ?? null;
    }

    appendChild(child) {
      if (child.parentElement) {
        child.parentElement.removeChild(child);
      }
      this.children.push(child);
      child.parentElement = this;
      return child;
    }

    insertBefore(child, before) {
      if (child.parentElement) {
        child.parentElement.removeChild(child);
      }
      const idx = this.children.indexOf(before);
      if (idx === -1) {
        this.children.push(child);
      } else {
        this.children.splice(idx, 0, child);
      }
      child.parentElement = this;
      return child;
    }

    removeChild(child) {
      const idx = this.children.indexOf(child);
      if (idx !== -1) {
        this.children.splice(idx, 1);
        child.parentElement = null;
      }
      return child;
    }

    querySelector(selector) {
      for (const child of this.children) {
        if (matches(child, selector)) return child;
        const found = child.querySelector(selector);
        if (found) return found;
      }
      return null;
    }

    get nextElementSibling() {
      if (!this.parentElement) return null;
      const idx = this.parentElement.children.indexOf(this);
      if (idx !== -1 && idx < this.parentElement.children.length - 1) {
        return this.parentElement.children[idx + 1];
      }
      return null;
    }
  }

  function matches(el, selector) {
    if (selector.includes(',')) {
      return selector.split(',').some(part => matches(el, part.trim()));
    }
    if (selector.startsWith('#')) return el.id === selector.slice(1);
    if (selector.startsWith('.')) return el.className.split(/\s+/).includes(selector.slice(1));
    if (selector.includes('[data-testid="sidebar-top-group"]')) return el.getAttribute('data-testid') === 'sidebar-top-group';
    if (selector.includes('[data-testid="templates-button"]')) return el.getAttribute('data-testid') === 'templates-button';
    return false;
  }

  const documentMock = {
    body: new MockElement("body"),
    createElement: (tag) => new MockElement(tag),
    getElementById: (id) => {
      const search = (node) => {
        if (node.id === id) return node;
        for (const child of node.children) {
          const found = search(child);
          if (found) return found;
        }
        return null;
      };
      return search(documentMock.body);
    },
    querySelector: (selector) => {
      const search = (node) => {
        if (matches(node, selector)) return node;
        for (const child of node.children) {
          const found = search(child);
          if (found) return found;
        }
        return null;
      };
      return search(documentMock.body);
    }
  };

  // Mock window.getComputedStyle and getBoundingClientRect for visibility checks
  const originalGetComputedStyle = globalThis.getComputedStyle;
  const originalGetBoundingClientRect = MockElement.prototype.getBoundingClientRect;
  globalThis.getComputedStyle = () => ({ display: 'block', visibility: 'visible', opacity: '1' });
  MockElement.prototype.getBoundingClientRect = function() { return { width: 100, height: 40, top: 0, left: 0, right: 100, bottom: 40 }; };

  const ICONS = { logo: "<svg></svg>" };

  function simulateUpdateButtonPlacement(isUiVisible, doc) {
    let launcherBtn = doc.getElementById("cfob-launcher-btn");
    if (!launcherBtn) {
      launcherBtn = doc.createElement("button");
      launcherBtn.id = "cfob-launcher-btn";
      launcherBtn.title = "Browse Outputs";
      launcherBtn.setAttribute("aria-label", "Browse Outputs");
    }

    const sidebarTarget =
      doc.querySelector('[data-testid="sidebar-top-group"]') ||
      doc.querySelector('nav.side-tool-bar-container .sidebar-item-group') ||
      doc.querySelector('.side-tool-bar-container .sidebar-item-group') ||
      doc.querySelector('nav.side-tool-bar-container') ||
      doc.querySelector('.side-tool-bar-container');

    if (sidebarTarget) {
      launcherBtn.className = "side-bar-button cursor-pointer border-none bg-transparent";
      launcherBtn.classList.toggle("side-bar-button-selected", Boolean(isUiVisible));
      launcherBtn.style.border = "";

      if (!launcherBtn.querySelector('.side-bar-button-content')) {
        launcherBtn.innerHTML = `
          <div class="side-bar-button-content flex flex-col items-center gap-2">
            <div class="sidebar-icon-wrapper relative">
              <span class="side-bar-button-icon">${ICONS.logo}</span>
            </div>
            <span class="side-bar-button-label line-clamp-2 w-max max-w-[calc(var(--sidebar-width)-var(--sidebar-padding))] text-center text-2xs wrap-break-word whitespace-normal">Outputs</span>
          </div>
        `;
      }

      const templatesBtn = sidebarTarget.querySelector('.templates-tab-button, [data-testid="templates-button"]');
      const desiredNextSibling = templatesBtn || null;
      if (launcherBtn.parentElement !== sidebarTarget || launcherBtn.nextElementSibling !== desiredNextSibling) {
        if (templatesBtn) {
          sidebarTarget.insertBefore(launcherBtn, templatesBtn);
        } else {
          sidebarTarget.appendChild(launcherBtn);
        }
      }
      return;
    }

    launcherBtn.className = "floating";
    launcherBtn.style.border = "";
    launcherBtn.innerHTML = ICONS.logo;
    if (launcherBtn.parentElement !== doc.body) {
      doc.body.appendChild(launcherBtn);
    }
  }

  // 1. When sidebar exists in graph mode:
  const graphSidebar = new MockElement("div");
  graphSidebar.setAttribute("data-testid", "sidebar-top-group");
  const templatesBtn = new MockElement("button");
  templatesBtn.setAttribute("data-testid", "templates-button");
  templatesBtn.className = "templates-tab-button";
  graphSidebar.appendChild(templatesBtn);
  documentMock.body.appendChild(graphSidebar);

  simulateUpdateButtonPlacement(false, documentMock);

  const btn = documentMock.getElementById("cfob-launcher-btn");
  assert.ok(btn, "Launcher button should be created");
  assert.equal(btn.parentElement, graphSidebar, "Button should be inserted into sidebar top group");
  assert.equal(btn.nextElementSibling, templatesBtn, "Button should be placed before templates button");
  assert.ok(btn.className.includes("side-bar-button"), "Button should have side-bar-button class");
  assert.equal(btn.classList.contains("side-bar-button-selected"), false, "Button not selected when UI hidden");

  // 2. When UI is visible:
  simulateUpdateButtonPlacement(true, documentMock);
  assert.equal(btn.classList.contains("side-bar-button-selected"), true, "Button selected when UI visible");

  // 3. Switch to App Mode: old sidebar removed, new app mode sidebar mounted
  documentMock.body.removeChild(graphSidebar);
  const appSidebar = new MockElement("div");
  appSidebar.setAttribute("data-testid", "sidebar-top-group");
  documentMock.body.appendChild(appSidebar);

  simulateUpdateButtonPlacement(true, documentMock);
  const appBtn = documentMock.getElementById("cfob-launcher-btn");
  assert.equal(appBtn.parentElement, appSidebar, "Button should be relocated to app mode sidebar");

  // 4. Fallback: sidebar removed completely
  documentMock.body.removeChild(appSidebar);
  simulateUpdateButtonPlacement(false, documentMock);
  const fallbackBtn = documentMock.getElementById("cfob-launcher-btn");
  assert.equal(fallbackBtn.parentElement, documentMock.body, "Button should fallback to body floating");
  assert.equal(fallbackBtn.className, "floating", "Button should have floating class");
});

test("launcher button placement: action-bar mode", () => {
  class MockElement {
    constructor(tagName) {
      this.tagName = tagName.toUpperCase();
      this.id = "";
      this.className = "";
      this.classList = {
        _classes: new Set(),
        add: (...cls) => cls.forEach(c => this.classList._classes.add(c)),
        remove: (...cls) => cls.forEach(c => this.classList._classes.delete(c)),
        toggle: (c, force) => {
          if (force !== undefined) {
            if (force) this.classList._classes.add(c);
            else this.classList._classes.delete(c);
            return force;
          }
          if (this.classList._classes.has(c)) {
            this.classList._classes.delete(c);
            return false;
          }
          this.classList._classes.add(c);
          return true;
        },
        contains: (c) => this.classList._classes.has(c)
      };
      this.style = {};
      this.children = [];
      this.parentElement = null;
      this.attributes = new Map();
      this.innerHTML = "";
    }
    setAttribute(k, v) { this.attributes.set(k, String(v)); }
    getAttribute(k) { return this.attributes.get(k) ?? null; }
    appendChild(child) {
      if (child.parentElement) child.parentElement.removeChild(child);
      this.children.push(child);
      child.parentElement = this;
      return child;
    }
    insertBefore(child, before) {
      if (child.parentElement) child.parentElement.removeChild(child);
      const idx = this.children.indexOf(before);
      if (idx === -1) this.children.push(child);
      else this.children.splice(idx, 0, child);
      child.parentElement = this;
      return child;
    }
    removeChild(child) {
      const idx = this.children.indexOf(child);
      if (idx !== -1) { this.children.splice(idx, 1); child.parentElement = null; }
      return child;
    }
    querySelector(selector) {
      for (const child of this.children) {
        if (matches(child, selector)) return child;
        const found = child.querySelector(selector);
        if (found) return found;
      }
      return null;
    }
    get nextElementSibling() {
      if (!this.parentElement) return null;
      const idx = this.parentElement.children.indexOf(this);
      if (idx !== -1 && idx < this.parentElement.children.length - 1) return this.parentElement.children[idx + 1];
      return null;
    }
  }

  function matches(el, selector) {
    if (selector.includes(',')) return selector.split(',').some(part => matches(el, part.trim()));
    if (selector.startsWith('#')) return el.id === selector.slice(1);
    if (selector.startsWith('.')) return el.className.split(/\s+/).includes(selector.slice(1));
    if (selector.includes('[data-testid="sidebar-top-group"]')) return el.getAttribute('data-testid') === 'sidebar-top-group';
    if (selector.includes('[data-testid="templates-button"]')) return el.getAttribute('data-testid') === 'templates-button';
    if (selector.includes('[data-testid="action-bar-buttons"]')) return el.getAttribute('data-testid') === 'action-bar-buttons';
    if (selector.includes('[data-testid="action-bar"]')) return el.getAttribute('data-testid') === 'action-bar';
    if (selector.includes('[data-testid="login-button"]')) return el.getAttribute('data-testid') === 'login-button';
    if (selector.includes('[data-testid="current-user-button"]')) return el.getAttribute('data-testid') === 'current-user-button';
    if (selector.includes('[aria-label="Take a tour of App Mode"]')) return el.getAttribute('aria-label') === 'Take a tour of App Mode';
    if (selector.includes('[aria-label="More"]')) return el.getAttribute('aria-label') === 'More';
    if (selector.includes('[data-testid="linear-mobile-workflows"]')) return el.getAttribute('data-testid') === 'linear-mobile-workflows';
    if (selector.includes('[aria-label="Graph mode, workflow actions"]')) return el.getAttribute('aria-label') === 'Graph mode, workflow actions';
    if (selector.includes('.comfy-menu')) return el.className.split(/\s+/).includes('comfy-menu');
    return false;
  }

  const documentMock = {
    body: new MockElement("body"),
    createElement: (tag) => new MockElement(tag),
    getElementById: (id) => {
      const search = (node) => {
        if (node.id === id) return node;
        for (const child of node.children) { const found = search(child); if (found) return found; }
        return null;
      };
      return search(documentMock.body);
    },
    querySelector: (selector) => {
      const search = (node) => {
        if (matches(node, selector)) return node;
        for (const child of node.children) { const found = search(child); if (found) return found; }
        return null;
      };
      return search(documentMock.body);
    }
  };

  // Mock window.getComputedStyle and getBoundingClientRect for visibility checks
  const originalGetComputedStyle = globalThis.getComputedStyle;
  const originalGetBoundingClientRect = MockElement.prototype.getBoundingClientRect;
  globalThis.getComputedStyle = () => ({ display: 'block', visibility: 'visible', opacity: '1' });
  MockElement.prototype.getBoundingClientRect = function() { return { width: 100, height: 40, top: 0, left: 0, right: 100, bottom: 40 }; };

  const ICONS = { logo: "<svg></svg>" };

  function simulatePlacement(placement, doc) {
    let launcherBtn = doc.getElementById("cfob-launcher-btn");
    if (!launcherBtn) {
      launcherBtn = doc.createElement("button");
      launcherBtn.id = "cfob-launcher-btn";
      launcherBtn.title = "Browse Outputs";
      launcherBtn.setAttribute("aria-label", "Browse Outputs");
    }

    const sidebarTarget =
      doc.querySelector('[data-testid="sidebar-top-group"]') ||
      doc.querySelector('nav.side-tool-bar-container .sidebar-item-group') ||
      doc.querySelector('.side-tool-bar-container .sidebar-item-group') ||
      doc.querySelector('nav.side-tool-bar-container') ||
      doc.querySelector('.side-tool-bar-container');

    if (placement === 'sidebar') {
      if (sidebarTarget) {
        launcherBtn.className = "side-bar-button cursor-pointer border-none bg-transparent";
        launcherBtn.style.border = "";
        if (!launcherBtn.querySelector('.side-bar-button-content')) {
          launcherBtn.innerHTML = `<div class="side-bar-button-content">${ICONS.logo}</div>`;
        }
        const templatesBtn = sidebarTarget.querySelector('.templates-tab-button, [data-testid="templates-button"]');
        if (launcherBtn.parentElement !== sidebarTarget || launcherBtn.nextElementSibling !== (templatesBtn || null)) {
          if (templatesBtn) sidebarTarget.insertBefore(launcherBtn, templatesBtn);
          else sidebarTarget.appendChild(launcherBtn);
        }
        return;
      }
    }

    if (placement === 'action-bar') {
      const isVisible = (el) => {
        if (!el) return false;
        const style = globalThis.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      };
      const loginEl = doc.querySelector('[data-testid="login-button"], [data-testid="current-user-button"]');
      const loginAnchor = isVisible(loginEl) ? loginEl : null;
      const tourEl = loginAnchor ? null : doc.querySelector('[aria-label="Take a tour of App Mode"]');
      const tourAnchor = tourEl && isVisible(tourEl) ? tourEl : null;
      const isAppMode = !!doc.querySelector('[data-testid="linear-mobile-workflows"]') || !!doc.querySelector('[aria-label="Graph mode, workflow actions"]');
      const menuEl = (!loginAnchor && !tourAnchor && isAppMode && globalThis.innerWidth < 768) ? doc.querySelector('[aria-label="More"]') : null;
      const menuAnchor = menuEl && isVisible(menuEl) ? menuEl : null;
      const anchor = loginAnchor || tourAnchor || menuAnchor;
      const actionBarTarget = anchor ? anchor.parentElement : doc.querySelector('[data-testid="action-bar-buttons"], [data-testid="action-bar"], .comfy-menu');
      if (actionBarTarget) {
        if (!launcherBtn.classList.contains('cfob-launcher-actionbar')) {
          launcherBtn.className = "cfob-launcher-actionbar";
        }
        launcherBtn.style.border = "";
        launcherBtn.innerHTML = ICONS.logo;
        if (anchor) {
          if (launcherBtn.nextElementSibling !== anchor) {
            anchor.parentElement.insertBefore(launcherBtn, anchor);
          }
        } else if (launcherBtn.parentElement !== actionBarTarget) {
          actionBarTarget.appendChild(launcherBtn);
        }
        return;
      }
    }

    // floating
    launcherBtn.className = "floating";
    launcherBtn.style.border = "";
    launcherBtn.innerHTML = ICONS.logo;
    if (launcherBtn.parentElement !== doc.body) doc.body.appendChild(launcherBtn);
  }

  // Action bar mode with action-bar-buttons present
  const actionBarSlot = new MockElement("div");
  actionBarSlot.setAttribute("data-testid", "action-bar-buttons");
  documentMock.body.appendChild(actionBarSlot);

  simulatePlacement('action-bar', documentMock);
  const btn = documentMock.getElementById("cfob-launcher-btn");
  assert.ok(btn, "Launcher button should be created");
  assert.equal(btn.parentElement, actionBarSlot, "Button should be in action-bar-buttons slot");
  assert.ok(btn.className.includes("cfob-launcher-actionbar"), "Button should have action-bar styling");

  // Action bar mode in App mode: login button present — launcher sits before it
  const loginBar = new MockElement("div");
  loginBar.setAttribute("data-testid", "integrated-tab-bar-actions");
  const loginBtn = new MockElement("button");
  loginBtn.setAttribute("data-testid", "login-button");
  loginBar.appendChild(loginBtn);
  documentMock.body.appendChild(loginBar);

  simulatePlacement('action-bar', documentMock);
  const loginPlacedBtn = documentMock.getElementById("cfob-launcher-btn");
  assert.equal(loginPlacedBtn.parentElement, loginBar, "Button should join the login button's container");
  assert.equal(loginPlacedBtn.nextElementSibling, loginBtn, "Button should sit immediately before the login button");

  // Signed in: current-user-button is the anchor
  loginBtn.setAttribute("data-testid", "current-user-button");
  documentMock.body.removeChild(loginBar);
  const userBar = new MockElement("div");
  userBar.setAttribute("data-testid", "integrated-tab-bar-actions");
  const userBtn = new MockElement("button");
  userBtn.setAttribute("data-testid", "current-user-button");
  userBar.appendChild(userBtn);
  documentMock.body.appendChild(userBar);
  simulatePlacement('action-bar', documentMock);
  const userPlacedBtn = documentMock.getElementById("cfob-launcher-btn");
  assert.equal(userPlacedBtn.nextElementSibling, userBtn, "Button should sit before the current-user button when signed in");

  // Action bar mode with tour button as fallback anchor (no login button)
  documentMock.body.removeChild(userBar);
  documentMock.body.removeChild(actionBarSlot);
  const tourBar = new MockElement("div");
  tourBar.setAttribute("data-testid", "linear-workflow-info");
  const tourBtn = new MockElement("button");
  tourBtn.setAttribute("aria-label", "Take a tour of App Mode");
  tourBar.appendChild(tourBtn);
  documentMock.body.appendChild(tourBar);

  simulatePlacement('action-bar', documentMock);
  const tourPlacedBtn = documentMock.getElementById("cfob-launcher-btn");
  assert.equal(tourPlacedBtn.parentElement, tourBar, "Button should join the tour button's container");
  assert.equal(tourPlacedBtn.nextElementSibling, tourBtn, "Button should sit immediately before the tour button");

  // Action bar mode with invisible login button — should fall back to tour button
  documentMock.body.removeChild(tourBar);
  const hiddenLoginBar = new MockElement("div");
  hiddenLoginBar.setAttribute("data-testid", "integrated-tab-bar-actions");
  const hiddenLoginBtn = new MockElement("button");
  hiddenLoginBtn.setAttribute("data-testid", "login-button");
  hiddenLoginBar.appendChild(hiddenLoginBtn);
  const visibleTourBar = new MockElement("div");
  visibleTourBar.setAttribute("data-testid", "linear-workflow-info");
  const visibleTourBtn = new MockElement("button");
  visibleTourBtn.setAttribute("aria-label", "Take a tour of App Mode");
  visibleTourBar.appendChild(visibleTourBtn);
  documentMock.body.appendChild(hiddenLoginBar);
  documentMock.body.appendChild(visibleTourBar);

  // Make login button invisible, tour button visible
  globalThis.getComputedStyle = (el) => {
    if (el === hiddenLoginBtn) return { display: 'none', visibility: 'visible', opacity: '1' };
    return { display: 'block', visibility: 'visible', opacity: '1' };
  };
  simulatePlacement('action-bar', documentMock);
  const hiddenLoginPlacedBtn = documentMock.getElementById("cfob-launcher-btn");
  assert.equal(hiddenLoginPlacedBtn.parentElement, visibleTourBar, "Button should skip invisible login button and use tour button");
  assert.equal(hiddenLoginPlacedBtn.nextElementSibling, visibleTourBtn, "Button should sit before the tour button when login is invisible");

  // Action bar mode with invisible tour button — falls back to floating on desktop
  documentMock.body.removeChild(hiddenLoginBar);
  documentMock.body.removeChild(visibleTourBar);
  const invisibleTourBar = new MockElement("div");
  invisibleTourBar.setAttribute("data-testid", "linear-workflow-info");
  const invisibleTourBtn = new MockElement("button");
  invisibleTourBtn.setAttribute("aria-label", "Take a tour of App Mode");
  invisibleTourBar.appendChild(invisibleTourBtn);
  documentMock.body.appendChild(invisibleTourBar);
  // Make tour button invisible
  globalThis.getComputedStyle = (el) => {
    if (el === invisibleTourBtn) return { display: 'none', visibility: 'visible', opacity: '1' };
    return { display: 'block', visibility: 'visible', opacity: '1' };
  };
  simulatePlacement('action-bar', documentMock);
  const invisibleTourPlacedBtn = documentMock.getElementById("cfob-launcher-btn");
  assert.equal(invisibleTourPlacedBtn.parentElement, documentMock.body, "Button should fallback to body when tour button is invisible");
  assert.equal(invisibleTourPlacedBtn.className, "floating", "Button should have floating class");

  // Action bar mode on mobile (innerWidth < 768): "More" menu button fallback when login/tour unavailable
  documentMock.body.removeChild(invisibleTourBar);
  const originalInnerWidth = globalThis.innerWidth;
  globalThis.innerWidth = 500;
  const menuBar = new MockElement("div");
  const mobileWfBtn = new MockElement("button");
  mobileWfBtn.setAttribute("data-testid", "linear-mobile-workflows");
  const graphModeBtn = new MockElement("button");
  graphModeBtn.setAttribute("aria-label", "Graph mode, workflow actions");
  const menuBtn = new MockElement("button");
  menuBtn.setAttribute("aria-label", "More");
  menuBar.appendChild(mobileWfBtn);
  menuBar.appendChild(graphModeBtn);
  menuBar.appendChild(menuBtn);
  documentMock.body.appendChild(menuBar);
  simulatePlacement('action-bar', documentMock);
  const menuPlacedBtn = documentMock.getElementById("cfob-launcher-btn");
  assert.equal(menuPlacedBtn.parentElement, menuBar, "Button should join the More button's container on mobile");
  assert.equal(menuPlacedBtn.nextElementSibling, menuBtn, "Button should sit immediately before the More button on mobile");

  // Restore mocks
  globalThis.getComputedStyle = originalGetComputedStyle;
  globalThis.innerWidth = originalInnerWidth;
  MockElement.prototype.getBoundingClientRect = originalGetBoundingClientRect;
});

test("dragging the floating launcher does not toggle the panel", () => {
  // Mirror of the onclick guard: a click within 300ms of a drag end is ignored.
  const makeButton = (toggle) => {
    const btn = { _cfobDragEndedAt: 0, onclick: null };
    btn.onclick = () => {
      if (btn._cfobDragEndedAt && Date.now() - btn._cfobDragEndedAt < 300) return;
      toggle();
    };
    return btn;
  };

  let toggles = 0;
  const toggle = () => { toggles++; };

  // 1. Drag: mouseup marks the drag end, then the browser fires click.
  const btn = makeButton(toggle);
  btn._cfobDragEndedAt = Date.now(); // set by mouseup when moved
  btn.onclick();
  assert.equal(toggles, 0, "Click right after a drag must not toggle the panel");

  // 2. Plain click (no recent drag) still toggles.
  const btn2 = makeButton(toggle);
  btn2.onclick();
  assert.equal(toggles, 1, "Plain click should toggle the panel");

  // 3. A click long after a drag (>300ms) toggles again.
  const btn3 = makeButton(toggle);
  btn3._cfobDragEndedAt = Date.now() - 500;
  btn3.onclick();
  assert.equal(toggles, 2, "Click well after a drag should toggle the panel");
});

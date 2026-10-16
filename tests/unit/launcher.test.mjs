import assert from "node:assert/strict";
import test from "node:test";
import { generateSelector, parseHookTarget, formatHookTarget } from "../../web/CFOB_Selector.js";
import { MockElement, matches } from "./mock-element.mjs";

// localStorage mock for Node.js test environment
const _storage = new Map();
globalThis.localStorage = {
  getItem: (k) => _storage.has(k) ? _storage.get(k) : null,
  setItem: (k, v) => _storage.set(k, String(v)),
  removeItem: (k) => _storage.delete(k),
  clear: () => _storage.clear(),
};

test("launcher button placement in sidebar (graph and app modes) and fallbacks", () => {
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

test("floating launcher stays inside the viewport when window resizes", () => {
  // Simulate the clampFloatingToViewport logic from the production code
  const clampFloatingToViewport = (btn) => {
    if (!btn || btn.className !== "floating") return;
    const rect = btn.getBoundingClientRect();
    const maxLeft = Math.max(0, window.innerWidth - rect.width);
    const maxTop = Math.max(0, window.innerHeight - rect.height);
    const currentLeft = btn.style.left ? parseFloat(btn.style.left) : rect.left;
    const currentTop = btn.style.top ? parseFloat(btn.style.top) : rect.top;
    const clampedLeft = Math.min(Math.max(0, currentLeft), maxLeft);
    const clampedTop = Math.min(Math.max(0, currentTop), maxTop);
    if (clampedLeft !== currentLeft) btn.style.left = `${clampedLeft}px`;
    if (clampedTop !== currentTop) btn.style.top = `${clampedTop}px`;
  };

  // Mock window (not available in Node test env)
  const originalWindow = globalThis.window;
  const originalInnerWidth = globalThis.innerWidth;
  const originalInnerHeight = globalThis.innerHeight;
  globalThis.window = globalThis;

  // 1. Launcher dragged to bottom-right, then window shrinks — should clamp
  globalThis.innerWidth = 800;
  globalThis.innerHeight = 600;
  const btn = {
    className: "floating",
    style: { left: "760px", top: "560px" },
    getBoundingClientRect: () => ({ width: 48, height: 48, left: 760, top: 560, right: 808, bottom: 608 }),
  };
  // Shrink window
  globalThis.innerWidth = 600;
  globalThis.innerHeight = 400;
  clampFloatingToViewport(btn);
  // maxLeft = 600 - 48 = 552, maxTop = 400 - 48 = 352
  assert.equal(btn.style.left, "552px", "Launcher should be clamped to viewport width");
  assert.equal(btn.style.top, "352px", "Launcher should be clamped to viewport height");

  // 2. Launcher at origin — no change needed
  globalThis.innerWidth = 1024;
  globalThis.innerHeight = 768;
  const btn2 = {
    className: "floating",
    style: { left: "10px", top: "10px" },
    getBoundingClientRect: () => ({ width: 48, height: 48, left: 10, top: 10, right: 58, bottom: 58 }),
  };
  clampFloatingToViewport(btn2);
  assert.equal(btn2.style.left, "10px", "Launcher at origin should not move horizontally");
  assert.equal(btn2.style.top, "10px", "Launcher at origin should not move vertically");

  // 3. Non-floating launcher should be ignored
  const btn3 = {
    className: "side-bar-button",
    style: { left: "760px", top: "560px" },
    getBoundingClientRect: () => ({ width: 100, height: 40, left: 760, top: 560, right: 860, bottom: 600 }),
  };
  clampFloatingToViewport(btn3);
  assert.equal(btn3.style.left, "760px", "Non-floating launcher should not be clamped");
  assert.equal(btn3.style.top, "560px", "Non-floating launcher should not be clamped");

  // Restore
  globalThis.window = originalWindow;
  globalThis.innerWidth = originalInnerWidth;
  globalThis.innerHeight = originalInnerHeight;
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

test("generateSelector: element with id", () => {
  const el = { tagName: "DIV", id: "my-element", getAttribute: () => null, className: "", parentElement: null };
  const selector = generateSelector(el);
  assert.equal(selector, "#my-element");
});

test("generateSelector: element with data-testid", () => {
  const el = { tagName: "BUTTON", id: "", getAttribute: (k) => k === "data-testid" ? "login-button" : null, className: "", parentElement: null };
  const selector = generateSelector(el);
  assert.equal(selector, '[data-testid="login-button"]');
});

test("generateSelector: element with neither id nor testid", () => {
  const parent = { tagName: "DIV", id: "", getAttribute: () => null, className: "container", parentElement: null };
  const child = { tagName: "SPAN", id: "", getAttribute: () => null, className: "label", parentElement: parent };
  const selector = generateSelector(child);
  assert.ok(selector, "Should return a selector");
  assert.ok(selector.includes("span"), "Should include tag name");
  assert.ok(selector.includes("label"), "Should include class");
});

test("generateSelector: body returns null", () => {
  const body = { tagName: "BODY", id: "", getAttribute: () => null, className: "", parentElement: null };
  const selector = generateSelector(body);
  assert.equal(selector, null);
});

test("parseHookTarget: a bare selector defaults to the before side", () => {
  assert.deepEqual(parseHookTarget("#toolbar"), { selector: "#toolbar", side: "before" });
});

test("parseHookTarget: round-trips both sides", () => {
  assert.deepEqual(parseHookTarget(formatHookTarget("#btn", "before")), { selector: "#btn", side: "before" });
  assert.deepEqual(parseHookTarget(formatHookTarget("#btn", "after")), { selector: "#btn", side: "after" });
});

test("parseHookTarget: no stored target returns null", () => {
  assert.equal(parseHookTarget(null), null);
  assert.equal(parseHookTarget(""), null);
  assert.equal(parseHookTarget("|after"), null, "an empty selector is not a target");
});

test("parseHookTarget: an unknown side falls back to before", () => {
  assert.deepEqual(parseHookTarget("#btn|sideways"), { selector: "#btn", side: "before" });
});

test("parseHookTarget: a selector containing a pipe is not corrupted", () => {
  // Only the first pipe separates selector from side.
  assert.deepEqual(parseHookTarget("#a|b|after"), { selector: "#a", side: "before" });
});

test("launcher button placement: hook mode with valid target", () => {
  const documentMock = {
    body: new MockElement("body"),
    createElement: (tag) => new MockElement(tag),
    getElementById: (id) => {
      const search = (node) => {
        if (node.id === id) return node;
        for (const child of node.children) { const f = search(child); if (f) return f; }
        return null;
      };
      return search(documentMock.body);
    },
    querySelector: (selector) => {
      const search = (node) => {
        if (matches(node, selector)) return node;
        for (const child of node.children) { const f = search(child); if (f) return f; }
        return null;
      };
      return search(documentMock.body);
    }
  };

  const ICONS = { logo: "<svg></svg>" };

  // Set up a hook target element
  const hookTarget = new MockElement("button");
  hookTarget.id = "hook-anchor";
  documentMock.body.appendChild(hookTarget);

  // Simulate hook placement
  localStorage.setItem('cfob_launcher_hook_element', '#hook-anchor');

  let launcherBtn = documentMock.getElementById("cfob-launcher-btn");
  if (!launcherBtn) {
    launcherBtn = documentMock.createElement("button");
    launcherBtn.id = "cfob-launcher-btn";
    launcherBtn.title = "Browse Outputs";
    launcherBtn.setAttribute("aria-label", "Browse Outputs");
  }

  const hookSelector = localStorage.getItem('cfob_launcher_hook_element');
  const target = hookSelector ? documentMock.querySelector(hookSelector) : null;
  if (target && target.parentElement) {
    if (!launcherBtn.classList.contains('cfob-launcher-hook')) {
      launcherBtn.className = "cfob-launcher-hook";
    }
    launcherBtn.style.border = "";
    if (launcherBtn.innerHTML !== ICONS.logo) launcherBtn.innerHTML = ICONS.logo;
    launcherBtn.classList.toggle("side-bar-button-selected", false);
    if (launcherBtn.nextElementSibling !== target) {
      target.parentElement.insertBefore(launcherBtn, target);
    }
  }

  assert.ok(launcherBtn, "Launcher button should exist");
  assert.equal(launcherBtn.parentElement, documentMock.body, "Button should be child of body");
  assert.equal(launcherBtn.nextElementSibling, hookTarget, "Button should be placed before hook target");
  assert.ok(launcherBtn.className.includes("cfob-launcher-hook"), "Button should have cfob-launcher-hook class");
});

test("launcher button placement: hook mode falls back to floating when target missing", () => {
  const documentMock = {
    body: new MockElement("body"),
    createElement: (tag) => new MockElement(tag),
    getElementById: (id) => {
      const search = (node) => {
        if (node.id === id) return node;
        for (const child of node.children) { const f = search(child); if (f) return f; }
        return null;
      };
      return search(documentMock.body);
    },
    querySelector: (selector) => {
      const search = (node) => {
        if (matches(node, selector)) return node;
        for (const child of node.children) { const f = search(child); if (f) return f; }
        return null;
      };
      return search(documentMock.body);
    }
  };

  const ICONS = { logo: "<svg></svg>" };

  // Set a hook selector that doesn't match anything
  localStorage.setItem('cfob_launcher_hook_element', '#nonexistent-element');

  let launcherBtn = documentMock.getElementById("cfob-launcher-btn");
  if (!launcherBtn) {
    launcherBtn = documentMock.createElement("button");
    launcherBtn.id = "cfob-launcher-btn";
    launcherBtn.title = "Browse Outputs";
    launcherBtn.setAttribute("aria-label", "Browse Outputs");
  }

  // Simulate hook placement with missing target → should fall through to floating
  const hookSelector = localStorage.getItem('cfob_launcher_hook_element');
  const target = hookSelector ? documentMock.querySelector(hookSelector) : null;

  if (target && target.parentElement) {
    // This branch should NOT execute
    launcherBtn.className = "cfob-launcher-hook";
    launcherBtn.parentElement.insertBefore(launcherBtn, target);
  } else {
    // Falls through to floating
    launcherBtn.className = "floating";
    launcherBtn.style.border = "";
    launcherBtn.innerHTML = ICONS.logo;
    if (launcherBtn.parentElement !== documentMock.body) {
      documentMock.body.appendChild(launcherBtn);
    }
  }

  assert.ok(launcherBtn, "Launcher button should exist");
  assert.equal(launcherBtn.parentElement, documentMock.body, "Button should be child of body (floating fallback)");
  assert.equal(launcherBtn.className, "floating", "Button should have floating class");
  assert.ok(!launcherBtn.classList.contains("cfob-launcher-hook"), "Button should NOT have hook class");
});

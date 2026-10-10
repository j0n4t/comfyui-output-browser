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

export class MockElement {
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

  get previousElementSibling() {
    if (!this.parentElement) return null;
    const idx = this.parentElement.children.indexOf(this);
    if (idx > 0) return this.parentElement.children[idx - 1];
    return null;
  }
}

/**
 * Matches an element against a CSS selector.
 * Supports: #id, .class, [data-testid="..."], [aria-label="..."], tag, and comma-separated groups.
 */
export function matches(el, selector) {
  if (selector.includes(',')) {
    return selector.split(',').some(part => matches(el, part.trim()));
  }
  if (selector.startsWith('#')) return el.id === selector.slice(1);
  if (selector.startsWith('.')) return el.className.split(/\s+/).includes(selector.slice(1));
  if (selector.includes('[data-testid=')) {
    const m = selector.match(/\[data-testid="(.+?)"\]/);
    return m ? el.getAttribute('data-testid') === m[1] : false;
  }
  if (selector.includes('[aria-label=')) {
    const m = selector.match(/\[aria-label="(.+?)"\]/);
    return m ? el.getAttribute('aria-label') === m[1] : false;
  }
  return false;
}

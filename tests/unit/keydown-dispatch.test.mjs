import assert from "node:assert/strict";
import test from "node:test";

// Mock localStorage before importing the module (it reads from it at load time)
const _storage = new Map();
globalThis.localStorage = {
  getItem: (k) => _storage.has(k) ? _storage.get(k) : null,
  setItem: (k, v) => _storage.set(k, String(v)),
  removeItem: (k) => _storage.delete(k),
  clear: () => _storage.clear(),
};

// Mock window before importing the module (it creates an instance at load time)
globalThis.window = globalThis;
globalThis.addEventListener = () => {};
globalThis.matchMedia = () => ({ matches: false });
globalThis.innerWidth = 1024;
globalThis.innerHeight = 768;
// Avoid the app.js import chain (which pulls in indexedDB and other browser APIs)
globalThis.CFOB_STANDALONE = true;
// Mock indexedDB to prevent async errors from module side effects
globalThis.indexedDB = {
  open: () => ({
    onupgradeneeded: null,
    onsuccess: null,
    onerror: null,
    onblocked: null,
    result: {
      createObjectStore: () => ({ createIndex: () => {} }),
      transaction: () => ({ objectStore: () => ({ put: () => {}, get: () => ({ success: true }) }) }),
    },
  }),
};
globalThis.document = {
  createElement: () => ({
    style: {},
    classList: { add: () => {}, remove: () => {}, toggle: () => {} },
    setAttribute: () => {},
    appendChild: () => {},
    dataset: {},
    addEventListener: () => {},
  }),
  body: { appendChild: () => {} },
  getElementById: () => null,
  addEventListener: () => {},
  activeElement: null,
};

const { default: ComfyOutputBrowser } = await import("../../web/ComfyOutputBrowser.js");

/**
 * Test that handleDocumentKeydown routes keys to the correct domain handler
 * based on context (search focused, full view active, gallery visible, etc.)
 */

function createMockApp(overrides = {}) {
  const calls = [];

  const searchInput = {
    tagName: 'INPUT',
    type: 'text',
    focus: () => calls.push('searchInput.focus'),
    blur: () => calls.push('searchInput.blur'),
  };

  const searchSuggestions = {
    hidden: true,
  };

  const fullViewModal = {
    classList: {
      contains: (cls) => cls === 'active' && (overrides.isFullView ?? false),
    },
  };

  const root = {
    contains: (el) => el === searchInput || (overrides.focusIsInside ?? true),
    classList: {
      contains: (cls) => cls === 'cfob-hidden' && (overrides.isHidden ?? false),
    },
    querySelector: () => null,
    style: {},
  };

  const app = {
    root,
    isUiVisible: overrides.isUiVisible ?? true,
    isFullView: overrides.isFullView ?? false,
    uiHidden: false,
    selectedImages: new Set(),
    filteredImages: overrides.filteredImages ?? [{ name: 'test.png', url: 'test.png', prompt: null, workflow: null, isParsed: true }],
    loadedImages: [{ name: 'test.png', url: 'test.png', prompt: null, workflow: null, isParsed: true }],
    lastSelectedIdx: 0,
    selectionAnchorIdx: -1,
    settings: {
      fullViewMode: overrides.fullViewMode ?? false,
      modals: {
        getActive: () => overrides.activeDialog ?? null,
      },
      setViewMode: () => calls.push('settings.setViewMode'),
      cycleBrowserMode: () => calls.push('settings.cycleBrowserMode'),
      setConstrainFullView: () => calls.push('settings.setConstrainFullView'),
      getGalleryViewMode: () => 'grid',
      setCompactSizeOffset: () => calls.push('settings.setCompactSizeOffset'),
      setGridSize: () => calls.push('settings.setGridSize'),
    },
    search: {
      hideSearchSuggestions: () => calls.push('search.hideSearchSuggestions'),
      handleKeydown(e) {
        calls.push('search.handleKeydown');
        // Simulate real behavior: only handle Escape when search input is focused or suggestions are open
        if (e.key === 'Escape') {
          const suggestions = app.$("cfobSearchSuggestions");
          if (!suggestions.hidden) return true;
          if (document.activeElement === app.$("cfobSearchInput")) return true;
        }
        return false;
      },
    },
    fullView: {
      closeFullView: () => calls.push('fullView.closeFullView'),
      toggleFullViewUI: () => calls.push('fullView.toggleFullViewUI'),
      navigateImage: (dir) => calls.push(`fullView.navigateImage(${dir})`),
      setFullViewUIHidden: () => calls.push('fullView.setFullViewUIHidden'),
      cycleFitMode: () => calls.push('fullView.cycleFitMode'),
      moveFullViewImage: () => calls.push('fullView.moveFullViewImage'),
      renameFullViewImage: () => calls.push('fullView.renameFullViewImage'),
      goToImageNumber: () => calls.push('fullView.goToImageNumber'),
      deleteFullViewImage: () => calls.push('fullView.deleteFullViewImage'),
      cycleSidebarMode: () => calls.push('fullView.cycleSidebarMode'),
      setFullViewZoom: () => calls.push('fullView.setFullViewZoom'),
      resetFullViewTransform: () => calls.push('fullView.resetFullViewTransform'),
      openFullView: () => calls.push('fullView.openFullView'),
      fvZoom: 1,
      handleKeydown() {
        calls.push('fullView.handleKeydown');
        return true;
      },
    },
    selection: {
      clearSelection: () => calls.push('selection.clearSelection'),
      selectAllFiltered: () => calls.push('selection.selectAllFiltered'),
      handleGridNavigation: () => calls.push('selection.handleGridNavigation'),
      updateCardStyles: () => calls.push('selection.updateCardStyles'),
      updateActionBar: () => calls.push('selection.updateActionBar'),
      handleKeydown() {
        calls.push('selection.handleKeydown');
        return true;
      },
    },
    actions: {
      moveSelected: () => calls.push('actions.moveSelected'),
      renameSelected: () => calls.push('actions.renameSelected'),
      inspectSelected: () => calls.push('actions.inspectSelected'),
      deleteSelected: () => calls.push('actions.deleteSelected'),
      downloadSelected: () => calls.push('actions.downloadSelected'),
      sendChipsToBasket: () => calls.push('actions.sendChipsToBasket'),
    },
    gallery: {
      getOrderedCards: () => [],
    },
    fetchServerImages: () => calls.push('fetchServerImages'),
    handleFieldCopyKey: () => calls.push('handleFieldCopyKey'),
    focusFirstGridItem: () => calls.push('focusFirstGridItem'),
    hideWithTransition: () => calls.push('hideWithTransition'),
    setChromeHidden: () => calls.push('setChromeHidden'),
    toggleUi: () => calls.push('toggleUi'),
    $: (id) => {
      if (id === 'cfobSearchInput') return searchInput;
      if (id === 'cfobSearchSuggestions') return searchSuggestions;
      if (id === 'cfobFullViewModal') return fullViewModal;
      if (id === 'cfobFullViewImg') return { focus: () => calls.push('cfobFullViewImg.focus') };
      if (id === 'cfobGalleryGrid') return { classList: { contains: () => false } };
      if (id === 'cfobConstrainStatus') return { textContent: '' };
      if (id === 'cfobFVActionInspect') return { click: () => calls.push('cfobFVActionInspect.click') };
      if (id === 'cfobFVActionDownload') return { click: () => calls.push('cfobFVActionDownload.click') };
      if (id === 'cfobFVActionSendChips') return { click: () => calls.push('cfobFVActionSendChips.click') };
      if (id === 'cfobActionSendChips') return { id: 'cfobActionSendChips' };
      return null;
    },
  };

  return { app, calls, searchInput, searchSuggestions };
}

function createKeyEvent(key, opts = {}) {
  return {
    key,
    ctrlKey: opts.ctrlKey ?? false,
    shiftKey: opts.shiftKey ?? false,
    altKey: opts.altKey ?? false,
    metaKey: opts.metaKey ?? false,
    code: opts.code ?? '',
    target: opts.target ?? null,
    preventDefault: () => {},
    stopPropagation: () => {},
  };
}

test("Escape on search input delegates to search.handleKeydown", () => {
  const { app, calls, searchInput } = createMockApp();

  // Simulate: search input is focused, user presses Escape
  globalThis.document.activeElement = searchInput;
  const keyEvent = createKeyEvent('Escape', { target: searchInput });

  // Call the handler directly
  ComfyOutputBrowser.prototype.handleDocumentKeydown.call(app, keyEvent);

  // Assert: search.handleKeydown was called
  assert.ok(calls.includes('search.handleKeydown'), "search.handleKeydown should be called");
  assert.ok(!calls.includes('hideWithTransition'), "panel should NOT be hidden");
});

test("full-view keys delegate to fullView.handleKeydown when full view is active", () => {
  const { app, calls } = createMockApp({ isFullView: true });

  // Simulate: full view is active, user presses 'f' (cycle fit mode)
  globalThis.document.activeElement = null;
  const keyEvent = createKeyEvent('f');

  ComfyOutputBrowser.prototype.handleDocumentKeydown.call(app, keyEvent);

  assert.ok(calls.includes('fullView.handleKeydown'), "fullView.handleKeydown should be called");
  assert.ok(!calls.includes('actions.inspectSelected'), "gallery 'i' handler should NOT be called");
});

test("gallery keys delegate to selection.handleKeydown when gallery is visible", () => {
  const { app, calls } = createMockApp({ isUiVisible: true, isFullView: false });

  // Simulate: gallery visible, user presses 'ctrl+a' (select all)
  globalThis.document.activeElement = null;
  const keyEvent = createKeyEvent('a', { ctrlKey: true });

  ComfyOutputBrowser.prototype.handleDocumentKeydown.call(app, keyEvent);

  assert.ok(calls.includes('selection.handleKeydown'), "selection.handleKeydown should be called");
});

test("gallery 'm' delegates to selection.handleKeydown", () => {
  const { app, calls } = createMockApp({ isUiVisible: true, isFullView: false });

  const mockTarget = { closest: () => null, matches: () => false };
  globalThis.document.activeElement = mockTarget;
  const keyEvent = createKeyEvent('m', { target: mockTarget });

  ComfyOutputBrowser.prototype.handleDocumentKeydown.call(app, keyEvent);

  assert.ok(calls.includes('selection.handleKeydown'), "selection.handleKeydown should be called");
});

test("gallery 'd' delegates to selection.handleKeydown", () => {
  const { app, calls } = createMockApp({ isUiVisible: true, isFullView: false });

  const mockTarget = { closest: () => null, matches: () => false };
  globalThis.document.activeElement = mockTarget;
  const keyEvent = createKeyEvent('d', { target: mockTarget });

  ComfyOutputBrowser.prototype.handleDocumentKeydown.call(app, keyEvent);

  assert.ok(calls.includes('selection.handleKeydown'), "selection.handleKeydown should be called");
});

test("gallery 'Delete' delegates to selection.handleKeydown", () => {
  const { app, calls } = createMockApp({ isUiVisible: true, isFullView: false });

  const mockTarget = { closest: () => null, matches: () => false };
  globalThis.document.activeElement = mockTarget;
  const keyEvent = createKeyEvent('Delete', { target: mockTarget });

  ComfyOutputBrowser.prototype.handleDocumentKeydown.call(app, keyEvent);

  assert.ok(calls.includes('selection.handleKeydown'), "selection.handleKeydown should be called");
});

test("gallery '/' delegates to selection.handleKeydown", () => {
  const { app, calls } = createMockApp({ isUiVisible: true, isFullView: false });

  globalThis.document.activeElement = null;
  const keyEvent = createKeyEvent('/');

  ComfyOutputBrowser.prototype.handleDocumentKeydown.call(app, keyEvent);

  assert.ok(calls.includes('selection.handleKeydown'), "selection.handleKeydown should be called");
});

test("gallery 'shift+f' delegates to selection.handleKeydown", () => {
  const { app, calls } = createMockApp({ isUiVisible: true, isFullView: false });

  globalThis.document.activeElement = null;
  const keyEvent = createKeyEvent('f', { shiftKey: true });

  ComfyOutputBrowser.prototype.handleDocumentKeydown.call(app, keyEvent);

  assert.ok(calls.includes('selection.handleKeydown'), "selection.handleKeydown should be called");
});

test("gallery arrow keys delegate to selection.handleKeydown", () => {
  const { app, calls } = createMockApp({ isUiVisible: true, isFullView: false });

  const mockTarget = { closest: () => null, matches: () => false };
  globalThis.document.activeElement = mockTarget;
  const keyEvent = createKeyEvent('ArrowDown', { target: mockTarget });

  ComfyOutputBrowser.prototype.handleDocumentKeydown.call(app, keyEvent);

  assert.ok(calls.includes('selection.handleKeydown'), "selection.handleKeydown should be called");
});

test("panel-level ctrl+shift+s routes to fetchServerImages", () => {
  const { app, calls } = createMockApp({ isUiVisible: true, isFullView: false });

  globalThis.document.activeElement = null;
  const keyEvent = createKeyEvent('s', { ctrlKey: true, shiftKey: true });

  ComfyOutputBrowser.prototype.handleDocumentKeydown.call(app, keyEvent);

  assert.ok(calls.includes('fetchServerImages'), "fetchServerImages should be called");
});

test("panel-level ctrl+1 routes to settings.setViewMode", () => {
  const { app, calls } = createMockApp({ isUiVisible: true, isFullView: false });

  globalThis.document.activeElement = null;
  const keyEvent = createKeyEvent('1', { ctrlKey: true });

  ComfyOutputBrowser.prototype.handleDocumentKeydown.call(app, keyEvent);

  assert.ok(calls.includes('settings.setViewMode'), "settings.setViewMode should be called");
});

test("Escape in full view routes to fullView.closeFullView", () => {
  const { app, calls } = createMockApp({ isFullView: true, isUiVisible: true });

  globalThis.document.activeElement = null;
  const keyEvent = createKeyEvent('Escape');

  ComfyOutputBrowser.prototype.handleDocumentKeydown.call(app, keyEvent);

  assert.ok(calls.includes('fullView.closeFullView'), "fullView.closeFullView should be called");
});

test("Escape with selection clears selection", () => {
  const { app, calls } = createMockApp({ isUiVisible: true, isFullView: false });
  app.selectedImages.add('test.png');

  globalThis.document.activeElement = null;
  const keyEvent = createKeyEvent('Escape');

  ComfyOutputBrowser.prototype.handleDocumentKeydown.call(app, keyEvent);

  assert.ok(calls.includes('selection.clearSelection'), "selection.clearSelection should be called");
  assert.ok(!calls.includes('hideWithTransition'), "panel should NOT be hidden when selection exists");
});

test("Escape with no selection hides panel", () => {
  const { app, calls } = createMockApp({ isUiVisible: true, isFullView: false });

  globalThis.document.activeElement = null;
  const keyEvent = createKeyEvent('Escape');

  ComfyOutputBrowser.prototype.handleDocumentKeydown.call(app, keyEvent);

  assert.ok(calls.includes('hideWithTransition'), "hideWithTransition should be called");
});

test("full-view ArrowLeft delegates to fullView.handleKeydown", () => {
  const { app, calls } = createMockApp({ isFullView: true });

  globalThis.document.activeElement = null;
  const keyEvent = createKeyEvent('ArrowLeft');

  ComfyOutputBrowser.prototype.handleDocumentKeydown.call(app, keyEvent);

  assert.ok(calls.includes('fullView.handleKeydown'), "fullView.handleKeydown should be called");
});

test("full-view ArrowRight delegates to fullView.handleKeydown", () => {
  const { app, calls } = createMockApp({ isFullView: true });

  globalThis.document.activeElement = null;
  const keyEvent = createKeyEvent('ArrowRight');

  ComfyOutputBrowser.prototype.handleDocumentKeydown.call(app, keyEvent);

  assert.ok(calls.includes('fullView.handleKeydown'), "fullView.handleKeydown should be called");
});

test("full-view 't' delegates to fullView.handleKeydown", () => {
  const { app, calls } = createMockApp({ isFullView: true });

  globalThis.document.activeElement = null;
  const keyEvent = createKeyEvent('t');

  ComfyOutputBrowser.prototype.handleDocumentKeydown.call(app, keyEvent);

  assert.ok(calls.includes('fullView.handleKeydown'), "fullView.handleKeydown should be called");
});

test("full-view '0' delegates to fullView.handleKeydown", () => {
  const { app, calls } = createMockApp({ isFullView: true });

  globalThis.document.activeElement = null;
  const keyEvent = createKeyEvent('0');

  ComfyOutputBrowser.prototype.handleDocumentKeydown.call(app, keyEvent);

  assert.ok(calls.includes('fullView.handleKeydown'), "fullView.handleKeydown should be called");
});

test("full-view 'g' delegates to fullView.handleKeydown", () => {
  const { app, calls } = createMockApp({ isFullView: true });

  globalThis.document.activeElement = null;
  const keyEvent = createKeyEvent('g');

  ComfyOutputBrowser.prototype.handleDocumentKeydown.call(app, keyEvent);

  assert.ok(calls.includes('fullView.handleKeydown'), "fullView.handleKeydown should be called");
});

test("full-view 'r' delegates to fullView.handleKeydown", () => {
  const { app, calls } = createMockApp({ isFullView: true });

  globalThis.document.activeElement = null;
  const keyEvent = createKeyEvent('r');

  ComfyOutputBrowser.prototype.handleDocumentKeydown.call(app, keyEvent);

  assert.ok(calls.includes('fullView.handleKeydown'), "fullView.handleKeydown should be called");
});

test("full-view 'm' delegates to fullView.handleKeydown", () => {
  const { app, calls } = createMockApp({ isFullView: true });

  globalThis.document.activeElement = null;
  const keyEvent = createKeyEvent('m');

  ComfyOutputBrowser.prototype.handleDocumentKeydown.call(app, keyEvent);

  assert.ok(calls.includes('fullView.handleKeydown'), "fullView.handleKeydown should be called");
});

test("full-view 'Delete' delegates to fullView.handleKeydown", () => {
  const { app, calls } = createMockApp({ isFullView: true });

  globalThis.document.activeElement = null;
  const keyEvent = createKeyEvent('Delete');

  ComfyOutputBrowser.prototype.handleDocumentKeydown.call(app, keyEvent);

  assert.ok(calls.includes('fullView.handleKeydown'), "fullView.handleKeydown should be called");
});

test("full-view 'd' delegates to fullView.handleKeydown", () => {
  const { app, calls } = createMockApp({ isFullView: true });

  globalThis.document.activeElement = null;
  const keyEvent = createKeyEvent('d');

  ComfyOutputBrowser.prototype.handleDocumentKeydown.call(app, keyEvent);

  assert.ok(calls.includes('fullView.handleKeydown'), "fullView.handleKeydown should be called");
});

test("full-view 'i' delegates to fullView.handleKeydown", () => {
  const { app, calls } = createMockApp({ isFullView: true });

  globalThis.document.activeElement = null;
  const keyEvent = createKeyEvent('i');

  ComfyOutputBrowser.prototype.handleDocumentKeydown.call(app, keyEvent);

  assert.ok(calls.includes('fullView.handleKeydown'), "fullView.handleKeydown should be called");
});

test("full-view 'shift+f' delegates to fullView.handleKeydown", () => {
  const { app, calls } = createMockApp({ isFullView: true });

  globalThis.document.activeElement = null;
  const keyEvent = createKeyEvent('f', { shiftKey: true });

  ComfyOutputBrowser.prototype.handleDocumentKeydown.call(app, keyEvent);

  assert.ok(calls.includes('fullView.handleKeydown'), "fullView.handleKeydown should be called");
});

test("full-view '/' delegates to fullView.handleKeydown", () => {
  const { app, calls } = createMockApp({ isFullView: true });

  globalThis.document.activeElement = null;
  const keyEvent = createKeyEvent('/');

  ComfyOutputBrowser.prototype.handleDocumentKeydown.call(app, keyEvent);

  assert.ok(calls.includes('fullView.handleKeydown'), "fullView.handleKeydown should be called");
});

test("full-view ArrowUp delegates to fullView.handleKeydown", () => {
  const { app, calls } = createMockApp({ isFullView: true });

  globalThis.document.activeElement = null;
  const keyEvent = createKeyEvent('ArrowUp');

  ComfyOutputBrowser.prototype.handleDocumentKeydown.call(app, keyEvent);

  assert.ok(calls.includes('fullView.handleKeydown'), "fullView.handleKeydown should be called");
});

test("full-view ArrowDown delegates to fullView.handleKeydown", () => {
  const { app, calls } = createMockApp({ isFullView: true });

  globalThis.document.activeElement = null;
  const keyEvent = createKeyEvent('ArrowDown');

  ComfyOutputBrowser.prototype.handleDocumentKeydown.call(app, keyEvent);

  assert.ok(calls.includes('fullView.handleKeydown'), "fullView.handleKeydown should be called");
});

test("full-view '+' delegates to fullView.handleKeydown", () => {
  const { app, calls } = createMockApp({ isFullView: true });

  globalThis.document.activeElement = null;
  const keyEvent = createKeyEvent('+');

  ComfyOutputBrowser.prototype.handleDocumentKeydown.call(app, keyEvent);

  assert.ok(calls.includes('fullView.handleKeydown'), "fullView.handleKeydown should be called");
});

test("full-view '-' delegates to fullView.handleKeydown", () => {
  const { app, calls } = createMockApp({ isFullView: true });

  globalThis.document.activeElement = null;
  const keyEvent = createKeyEvent('-');

  ComfyOutputBrowser.prototype.handleDocumentKeydown.call(app, keyEvent);

  assert.ok(calls.includes('fullView.handleKeydown'), "fullView.handleKeydown should be called");
});

test("gallery 'i' delegates to selection.handleKeydown", () => {
  const { app, calls } = createMockApp({ isUiVisible: true, isFullView: false });

  const mockTarget = { closest: () => null, matches: () => false };
  globalThis.document.activeElement = mockTarget;
  const keyEvent = createKeyEvent('i', { target: mockTarget });

  ComfyOutputBrowser.prototype.handleDocumentKeydown.call(app, keyEvent);

  assert.ok(calls.includes('selection.handleKeydown'), "selection.handleKeydown should be called");
});

test("gallery 'r' delegates to selection.handleKeydown", () => {
  const { app, calls } = createMockApp({ isUiVisible: true, isFullView: false });

  const mockTarget = { closest: () => null, matches: () => false };
  globalThis.document.activeElement = mockTarget;
  const keyEvent = createKeyEvent('r', { target: mockTarget });

  ComfyOutputBrowser.prototype.handleDocumentKeydown.call(app, keyEvent);

  assert.ok(calls.includes('selection.handleKeydown'), "selection.handleKeydown should be called");
});

test("gallery 'alt++' delegates to selection.handleKeydown", () => {
  const { app, calls } = createMockApp({ isUiVisible: true, isFullView: false });

  globalThis.document.activeElement = null;
  const keyEvent = createKeyEvent('+', { altKey: true });

  ComfyOutputBrowser.prototype.handleDocumentKeydown.call(app, keyEvent);

  assert.ok(calls.includes('selection.handleKeydown'), "selection.handleKeydown should be called");
});

test("gallery 'alt--' delegates to selection.handleKeydown", () => {
  const { app, calls } = createMockApp({ isUiVisible: true, isFullView: false });

  globalThis.document.activeElement = null;
  const keyEvent = createKeyEvent('-', { altKey: true });

  ComfyOutputBrowser.prototype.handleDocumentKeydown.call(app, keyEvent);

  assert.ok(calls.includes('selection.handleKeydown'), "selection.handleKeydown should be called");
});

test("number keys route to handleFieldCopyKey", () => {
  const { app, calls } = createMockApp({ isUiVisible: true, isFullView: false });

  globalThis.document.activeElement = null;
  const keyEvent = createKeyEvent('1');

  ComfyOutputBrowser.prototype.handleDocumentKeydown.call(app, keyEvent);

  assert.ok(calls.includes('handleFieldCopyKey'), "handleFieldCopyKey should be called");
});

test("keys are ignored when focus is outside the panel", () => {
  const { app, calls } = createMockApp({ focusIsInside: false });

  globalThis.document.activeElement = null;
  const keyEvent = createKeyEvent('f');

  ComfyOutputBrowser.prototype.handleDocumentKeydown.call(app, keyEvent);

  assert.equal(calls.length, 0, "no handlers should be called when focus is outside");
});

test("keys are ignored when editing (isEditing)", () => {
  const { app, calls } = createMockApp({ isUiVisible: true, isFullView: false });

  const editingInput = { tagName: 'INPUT', type: 'text', isContentEditable: false };
  globalThis.document.activeElement = editingInput;
  const keyEvent = createKeyEvent('f', { target: editingInput });

  ComfyOutputBrowser.prototype.handleDocumentKeydown.call(app, keyEvent);

  assert.ok(!calls.includes('settings.cycleBrowserMode'), "shift+f should NOT route to cycleBrowserMode when editing");
});

test("modal open blocks gallery shortcuts", () => {
  const { app, calls } = createMockApp({ isUiVisible: true, isFullView: false, activeDialog: {} });

  globalThis.document.activeElement = null;
  const keyEvent = createKeyEvent('a', { ctrlKey: true });

  ComfyOutputBrowser.prototype.handleDocumentKeydown.call(app, keyEvent);

  assert.ok(!calls.includes('selection.selectAllFiltered'), "gallery shortcuts should be blocked when modal is open");
});

test("Escape with modal open does nothing (modal handles it)", () => {
  const { app, calls } = createMockApp({ isUiVisible: true, isFullView: false, activeDialog: {} });

  globalThis.document.activeElement = null;
  const keyEvent = createKeyEvent('Escape');

  ComfyOutputBrowser.prototype.handleDocumentKeydown.call(app, keyEvent);

  assert.ok(!calls.includes('hideWithTransition'), "Escape should NOT hide panel when modal is open");
  assert.ok(!calls.includes('selection.clearSelection'), "Escape should NOT clear selection when modal is open");
});

test("Escape with search suggestions open delegates to search.handleKeydown", () => {
  const { app, calls, searchInput, searchSuggestions } = createMockApp();
  searchSuggestions.hidden = false;
  globalThis.document.activeElement = searchInput;
  const keyEvent = createKeyEvent('Escape', { target: searchInput });

  ComfyOutputBrowser.prototype.handleDocumentKeydown.call(app, keyEvent);

  assert.ok(calls.includes('search.handleKeydown'), "search.handleKeydown should be called");
  assert.ok(!calls.includes('hideWithTransition'), "panel should NOT be hidden");
});

test("Escape when editing blurs the input", () => {
  const { app, calls } = createMockApp({ isUiVisible: true, isFullView: false });

  const editingInput = { tagName: 'INPUT', type: 'text', isContentEditable: false, blur: () => calls.push('target.blur') };
  globalThis.document.activeElement = editingInput;
  const keyEvent = createKeyEvent('Escape', { target: editingInput });

  ComfyOutputBrowser.prototype.handleDocumentKeydown.call(app, keyEvent);

  assert.ok(calls.includes('target.blur'), "target.blur should be called when editing");
  assert.ok(!calls.includes('hideWithTransition'), "panel should NOT be hidden when editing");
});

test("full-view space delegates to fullView.handleKeydown", () => {
  const { app, calls } = createMockApp({ isFullView: true });

  const mockTarget = { closest: () => null };
  globalThis.document.activeElement = mockTarget;
  const keyEvent = createKeyEvent(' ', { target: mockTarget });

  ComfyOutputBrowser.prototype.handleDocumentKeydown.call(app, keyEvent);

  assert.ok(calls.includes('fullView.handleKeydown'), "fullView.handleKeydown should be called");
});

test("gallery space delegates to selection.handleKeydown", () => {
  const { app, calls } = createMockApp({ isUiVisible: true, isFullView: false });

  const mockTarget = { closest: () => null, matches: () => false };
  globalThis.document.activeElement = mockTarget;
  const keyEvent = createKeyEvent(' ', { target: mockTarget });

  ComfyOutputBrowser.prototype.handleDocumentKeydown.call(app, keyEvent);

  assert.ok(calls.includes('selection.handleKeydown'), "selection.handleKeydown should be called");
});

test("gallery enter delegates to selection.handleKeydown", () => {
  const { app, calls } = createMockApp({ isUiVisible: true, isFullView: false });

  const mockTarget = { closest: () => null, matches: () => false };
  globalThis.document.activeElement = mockTarget;
  const keyEvent = createKeyEvent('Enter', { target: mockTarget });

  ComfyOutputBrowser.prototype.handleDocumentKeydown.call(app, keyEvent);

  assert.ok(calls.includes('selection.handleKeydown'), "selection.handleKeydown should be called");
});

test("gallery ArrowUp delegates to selection.handleKeydown", () => {
  const { app, calls } = createMockApp({ isUiVisible: true, isFullView: false });
  app.lastSelectedIdx = -1;

  const mockTarget = { closest: () => null, matches: () => false };
  globalThis.document.activeElement = mockTarget;
  const keyEvent = createKeyEvent('ArrowUp', { target: mockTarget });

  ComfyOutputBrowser.prototype.handleDocumentKeydown.call(app, keyEvent);

  assert.ok(calls.includes('selection.handleKeydown'), "selection.handleKeydown should be called");
});

test("gallery ArrowUp on first row delegates to selection.handleKeydown", () => {
  const { app, calls } = createMockApp({ isUiVisible: true, isFullView: false, lastSelectedIdx: 0 });

  // Mock the grid to report first row
  app.$ = ((orig) => (id) => {
    if (id === 'cfobGalleryGrid') return { classList: { contains: () => true } };
    return orig(id);
  })(app.$);
  app.gallery.getOrderedCards = () => [{ offsetTop: 0, getBoundingClientRect: () => ({ top: 0, height: 100 }) }];

  const mockTarget = { closest: () => null, matches: () => false };
  globalThis.document.activeElement = mockTarget;
  const keyEvent = createKeyEvent('ArrowUp', { target: mockTarget });

  ComfyOutputBrowser.prototype.handleDocumentKeydown.call(app, keyEvent);

  assert.ok(calls.includes('selection.handleKeydown'), "selection.handleKeydown should be called");
});

// --- Real CFOB_FullView.handleKeydown tests ---

const { default: CFOB_FullView } = await import("../../web/CFOB_FullView.js");

function createMockFullView() {
  const calls = [];
  const searchInput = { focus: () => calls.push('searchInput.focus') };
  const app = {
    root: { querySelector: () => null },
    showChrome: () => calls.push('app.showChrome'),
    settings: { modals: { getActive: () => null }, constrainFullView: false, setConstrainFullView: () => calls.push('settings.setConstrainFullView') },
    $: (id) => {
      if (id === 'cfobSearchInput') return searchInput;
      if (id === 'cfobConstrainStatus') return { textContent: '' };
      if (id === 'cfobFVActionInspect') return { click: () => calls.push('cfobFVActionInspect.click') };
      if (id === 'cfobFVActionDownload') return { click: () => calls.push('cfobFVActionDownload.click') };
      if (id === 'cfobFVActionSendChips') return { click: () => calls.push('cfobFVActionSendChips.click') };
      return null;
    },
  };
  const fv = {
    app,
    fvZoom: 1,
    setFullViewUIHidden: () => calls.push('setFullViewUIHidden'),
    toggleFullViewUI: () => calls.push('toggleFullViewUI'),
    navigateImage: (dir) => calls.push(`navigateImage(${dir})`),
    cycleFitMode: () => calls.push('cycleFitMode'),
    moveFullViewImage: () => calls.push('moveFullViewImage'),
    renameFullViewImage: () => calls.push('renameFullViewImage'),
    goToImageNumber: () => calls.push('goToImageNumber'),
    deleteFullViewImage: () => calls.push('deleteFullViewImage'),
    cycleSidebarMode: () => calls.push('cycleSidebarMode'),
    setFullViewZoom: () => calls.push('setFullViewZoom'),
    resetFullViewTransform: () => calls.push('resetFullViewTransform'),
  };
  return { fv, calls };
}

test("real CFOB_FullView.handleKeydown: 'f' routes to cycleFitMode", () => {
  const { fv, calls } = createMockFullView();
  const e = createKeyEvent('f');
  const handled = CFOB_FullView.prototype.handleKeydown.call(fv, e);
  assert.ok(handled, "should return true");
  assert.ok(calls.includes('cycleFitMode'), "cycleFitMode should be called");
});

test("real CFOB_FullView.handleKeydown: ArrowLeft routes to navigateImage(-1)", () => {
  const { fv, calls } = createMockFullView();
  const e = createKeyEvent('ArrowLeft');
  const handled = CFOB_FullView.prototype.handleKeydown.call(fv, e);
  assert.ok(handled, "should return true");
  assert.ok(calls.includes('navigateImage(-1)'), "navigateImage(-1) should be called");
});

test("real CFOB_FullView.handleKeydown: '/' focuses search input", () => {
  const { fv, calls } = createMockFullView();
  const e = createKeyEvent('/');
  const handled = CFOB_FullView.prototype.handleKeydown.call(fv, e);
  assert.ok(handled, "should return true");
  assert.ok(calls.includes('app.showChrome'), "showChrome should be called");
  assert.ok(calls.includes('searchInput.focus'), "searchInput.focus should be called");
});

test("real CFOB_FullView.handleKeydown: 'shift+f' routes to setConstrainFullView", () => {
  const { fv, calls } = createMockFullView();
  const e = createKeyEvent('f', { shiftKey: true });
  const handled = CFOB_FullView.prototype.handleKeydown.call(fv, e);
  assert.ok(handled, "should return true");
  assert.ok(calls.includes('settings.setConstrainFullView'), "settings.setConstrainFullView should be called");
});

test("real CFOB_FullView.handleKeydown: '0' routes to resetFullViewTransform", () => {
  const { fv, calls } = createMockFullView();
  const e = createKeyEvent('0');
  const handled = CFOB_FullView.prototype.handleKeydown.call(fv, e);
  assert.ok(handled, "should return true");
  assert.ok(calls.includes('resetFullViewTransform'), "resetFullViewTransform should be called");
});

test("real CFOB_FullView.handleKeydown: 'g' routes to goToImageNumber", () => {
  const { fv, calls } = createMockFullView();
  const e = createKeyEvent('g');
  const handled = CFOB_FullView.prototype.handleKeydown.call(fv, e);
  assert.ok(handled, "should return true");
  assert.ok(calls.includes('goToImageNumber'), "goToImageNumber should be called");
});

test("real CFOB_FullView.handleKeydown: 'r' routes to renameFullViewImage", () => {
  const { fv, calls } = createMockFullView();
  const e = createKeyEvent('r');
  const handled = CFOB_FullView.prototype.handleKeydown.call(fv, e);
  assert.ok(handled, "should return true");
  assert.ok(calls.includes('renameFullViewImage'), "renameFullViewImage should be called");
});

test("real CFOB_FullView.handleKeydown: 'm' routes to moveFullViewImage", () => {
  const { fv, calls } = createMockFullView();
  const e = createKeyEvent('m');
  const handled = CFOB_FullView.prototype.handleKeydown.call(fv, e);
  assert.ok(handled, "should return true");
  assert.ok(calls.includes('moveFullViewImage'), "moveFullViewImage should be called");
});

test("real CFOB_FullView.handleKeydown: 'Delete' routes to deleteFullViewImage", () => {
  const { fv, calls } = createMockFullView();
  const e = createKeyEvent('Delete');
  const handled = CFOB_FullView.prototype.handleKeydown.call(fv, e);
  assert.ok(handled, "should return true");
  assert.ok(calls.includes('deleteFullViewImage'), "deleteFullViewImage should be called");
});

test("real CFOB_FullView.handleKeydown: 'd' routes to cfobFVActionDownload.click", () => {
  const { fv, calls } = createMockFullView();
  const e = createKeyEvent('d');
  const handled = CFOB_FullView.prototype.handleKeydown.call(fv, e);
  assert.ok(handled, "should return true");
  assert.ok(calls.includes('cfobFVActionDownload.click'), "cfobFVActionDownload.click should be called");
});

test("real CFOB_FullView.handleKeydown: 'i' routes to cfobFVActionInspect.click", () => {
  const { fv, calls } = createMockFullView();
  const e = createKeyEvent('i');
  const handled = CFOB_FullView.prototype.handleKeydown.call(fv, e);
  assert.ok(handled, "should return true");
  assert.ok(calls.includes('cfobFVActionInspect.click'), "cfobFVActionInspect.click should be called");
});

test("real CFOB_FullView.handleKeydown: 't' routes to cycleSidebarMode", () => {
  const { fv, calls } = createMockFullView();
  const e = createKeyEvent('t');
  const handled = CFOB_FullView.prototype.handleKeydown.call(fv, e);
  assert.ok(handled, "should return true");
  assert.ok(calls.includes('cycleSidebarMode'), "cycleSidebarMode should be called");
});

test("real CFOB_FullView.handleKeydown: '+' routes to setFullViewZoom", () => {
  const { fv, calls } = createMockFullView();
  const e = createKeyEvent('+');
  const handled = CFOB_FullView.prototype.handleKeydown.call(fv, e);
  assert.ok(handled, "should return true");
  assert.ok(calls.includes('setFullViewZoom'), "setFullViewZoom should be called");
});

test("real CFOB_FullView.handleKeydown: '-' routes to setFullViewZoom", () => {
  const { fv, calls } = createMockFullView();
  const e = createKeyEvent('-');
  const handled = CFOB_FullView.prototype.handleKeydown.call(fv, e);
  assert.ok(handled, "should return true");
  assert.ok(calls.includes('setFullViewZoom'), "setFullViewZoom should be called");
});

test("real CFOB_FullView.handleKeydown: ArrowUp focuses search input", () => {
  const { fv, calls } = createMockFullView();
  const e = createKeyEvent('ArrowUp');
  const handled = CFOB_FullView.prototype.handleKeydown.call(fv, e);
  assert.ok(handled, "should return true");
  assert.ok(calls.includes('searchInput.focus'), "searchInput.focus should be called");
});

test("real CFOB_FullView.handleKeydown: ArrowDown routes to toggleFullViewUI", () => {
  const { fv, calls } = createMockFullView();
  const e = createKeyEvent('ArrowDown');
  const handled = CFOB_FullView.prototype.handleKeydown.call(fv, e);
  assert.ok(handled, "should return true");
  assert.ok(calls.includes('toggleFullViewUI'), "toggleFullViewUI should be called");
});

test("real CFOB_FullView.handleKeydown: space routes to toggleFullViewUI", () => {
  const { fv, calls } = createMockFullView();
  const e = createKeyEvent(' ', { target: { closest: () => null } });
  const handled = CFOB_FullView.prototype.handleKeydown.call(fv, e);
  assert.ok(handled, "should return true");
  assert.ok(calls.includes('toggleFullViewUI'), "toggleFullViewUI should be called");
});

test("real CFOB_FullView.handleKeydown: space on button returns false", () => {
  const { fv, calls } = createMockFullView();
  const e = createKeyEvent(' ', { target: { closest: () => ({}) } });
  const handled = CFOB_FullView.prototype.handleKeydown.call(fv, e);
  assert.ok(!handled, "should return false when space is on a button");
  assert.ok(!calls.includes('toggleFullViewUI'), "toggleFullViewUI should NOT be called");
});

test("real CFOB_FullView.handleKeydown: unknown key returns false", () => {
  const { fv } = createMockFullView();
  const e = createKeyEvent('z');
  const handled = CFOB_FullView.prototype.handleKeydown.call(fv, e);
  assert.ok(!handled, "should return false for unknown key");
});

test("real CFOB_FullView.handleKeydown: modal open blocks shortcuts", () => {
  const { fv, calls } = createMockFullView();
  fv.app.settings.modals.getActive = () => ({});
  const e = createKeyEvent('f');
  const handled = CFOB_FullView.prototype.handleKeydown.call(fv, e);
  assert.ok(!handled, "should return false when modal is open");
  assert.ok(!calls.includes('cycleFitMode'), "cycleFitMode should NOT be called when modal is open");
});

// --- Real CFOB_Selection.handleKeydown tests ---

const { default: CFOB_Selection } = await import("../../web/CFOB_Selection.js");

function createMockSelection() {
  const calls = [];
  const searchInput = { focus: () => calls.push('searchInput.focus') };
  const app = {
    filteredImages: [{ name: 'test.png', url: 'test.png', prompt: null, workflow: null, isParsed: true }],
    loadedImages: [{ name: 'test.png', url: 'test.png', prompt: null, workflow: null, isParsed: true }],
    selectedImages: new Set(),
    lastSelectedIdx: 0,
    selectionAnchorIdx: -1,
    uiHidden: false,
    showChrome: () => calls.push('app.showChrome'),
    settings: {
      modals: { getActive: () => null },
      cycleBrowserMode: () => calls.push('settings.cycleBrowserMode'),
      getGalleryViewMode: () => 'grid',
      compactSizeOffset: 0,
      gridSize: 100,
      setCompactSizeOffset: () => calls.push('settings.setCompactSizeOffset'),
      setGridSize: () => calls.push('settings.setGridSize'),
    },
    selection: {
      selectAllFiltered: () => calls.push('selection.selectAllFiltered'),
      handleGridNavigation: () => calls.push('selection.handleGridNavigation'),
      updateCardStyles: () => calls.push('selection.updateCardStyles'),
      updateActionBar: () => calls.push('selection.updateActionBar'),
    },
    actions: {
      moveSelected: () => calls.push('actions.moveSelected'),
      renameSelected: () => calls.push('actions.renameSelected'),
      inspectSelected: () => calls.push('actions.inspectSelected'),
      deleteSelected: () => calls.push('actions.deleteSelected'),
      downloadSelected: () => calls.push('actions.downloadSelected'),
      sendChipsToBasket: (...args) => { calls.push('actions.sendChipsToBasket'); sel.app.actions.sendChipsToBasket.lastImages = args[2]; },
    },
    fullView: {
      openFullView: () => calls.push('fullView.openFullView'),
    },
    gallery: {
      getOrderedCards: () => [],
    },
    $: (id) => {
      if (id === 'cfobSearchInput') return searchInput;
      if (id === 'cfobGalleryGrid') return { classList: { contains: () => false } };
      return null;
    },
  };
  const sel = { app };
  return { sel, calls };
}

test("real CFOB_Selection.handleKeydown: 'ctrl+a' routes to selectAllFiltered", () => {
  const { sel, calls } = createMockSelection();
  const e = createKeyEvent('a', { ctrlKey: true });
  const handled = CFOB_Selection.prototype.handleKeydown.call(sel, e);
  assert.ok(handled, "should return true");
  assert.ok(calls.includes('selection.selectAllFiltered'), "selection.selectAllFiltered should be called");
});

test("real CFOB_Selection.handleKeydown: 'shift+f' routes to cycleBrowserMode", () => {
  const { sel, calls } = createMockSelection();
  const e = createKeyEvent('f', { shiftKey: true });
  const handled = CFOB_Selection.prototype.handleKeydown.call(sel, e);
  assert.ok(handled, "should return true");
  assert.ok(calls.includes('settings.cycleBrowserMode'), "settings.cycleBrowserMode should be called");
});

test("real CFOB_Selection.handleKeydown: '/' focuses search input", () => {
  const { sel, calls } = createMockSelection();
  const e = createKeyEvent('/');
  const handled = CFOB_Selection.prototype.handleKeydown.call(sel, e);
  assert.ok(handled, "should return true");
  assert.ok(calls.includes('app.showChrome'), "showChrome should be called");
  assert.ok(calls.includes('searchInput.focus'), "searchInput.focus should be called");
});

test("real CFOB_Selection.handleKeydown: 'm' routes to moveSelected", () => {
  const { sel, calls } = createMockSelection();
  const e = createKeyEvent('m', { target: { closest: () => null, matches: () => false } });
  const handled = CFOB_Selection.prototype.handleKeydown.call(sel, e);
  assert.ok(handled, "should return true");
  assert.ok(calls.includes('actions.moveSelected'), "actions.moveSelected should be called");
});

test("real CFOB_Selection.handleKeydown: 'r' routes to renameSelected", () => {
  const { sel, calls } = createMockSelection();
  const e = createKeyEvent('r', { target: { closest: () => null, matches: () => false } });
  const handled = CFOB_Selection.prototype.handleKeydown.call(sel, e);
  assert.ok(handled, "should return true");
  assert.ok(calls.includes('actions.renameSelected'), "actions.renameSelected should be called");
});

test("real CFOB_Selection.handleKeydown: 'i' routes to inspectSelected", () => {
  const { sel, calls } = createMockSelection();
  const e = createKeyEvent('i', { target: { closest: () => null, matches: () => false } });
  const handled = CFOB_Selection.prototype.handleKeydown.call(sel, e);
  assert.ok(handled, "should return true");
  assert.ok(calls.includes('actions.inspectSelected'), "actions.inspectSelected should be called");
});

test("real CFOB_Selection.handleKeydown: 'd' routes to downloadSelected", () => {
  const { sel, calls } = createMockSelection();
  const e = createKeyEvent('d', { target: { closest: () => null, matches: () => false } });
  const handled = CFOB_Selection.prototype.handleKeydown.call(sel, e);
  assert.ok(handled, "should return true");
  assert.ok(calls.includes('actions.downloadSelected'), "actions.downloadSelected should be called");
});

test("real CFOB_Selection.handleKeydown: 'b' sends the focused card to the basket", () => {
  const { sel, calls } = createMockSelection();
  const e = createKeyEvent('b', { target: { closest: () => null, matches: () => false } });
  const handled = CFOB_Selection.prototype.handleKeydown.call(sel, e);
  assert.ok(handled, "should return true");
  assert.ok(calls.includes('actions.sendChipsToBasket'), "actions.sendChipsToBasket should be called");
});

test("real CFOB_Selection.handleKeydown: 'b' is always the focused card, never the multi-selection", () => {
  const { sel } = createMockSelection();
  sel.app.selectedImages = new Set(['other.png']);
  sel.app.filteredImages = [{ name: 'focused.png', url: 'focused.png', prompt: null, workflow: null, isParsed: true }];
  const e = createKeyEvent('b', { target: { closest: () => null, matches: () => false } });
  CFOB_Selection.prototype.handleKeydown.call(sel, e);
  // The basket action received the focused card's own name, and did not add the
  // selection to it: 'b' is a single-image gesture, like the full view's Chips button.
  assert.deepEqual(sel.app.actions.sendChipsToBasket.lastImages, ['focused.png']);
});

test("real CFOB_Selection.handleKeydown: 'b' with no focused image does nothing", () => {
  const { sel, calls } = createMockSelection();
  sel.app.lastSelectedIdx = -1;
  const e = createKeyEvent('b', { target: { closest: () => null, matches: () => false } });
  const handled = CFOB_Selection.prototype.handleKeydown.call(sel, e);
  assert.ok(!handled, "should return false when there is no focused image");
  assert.ok(!calls.includes('actions.sendChipsToBasket'), "actions.sendChipsToBasket should NOT be called");
});

test("real CFOB_Selection.handleKeydown: 'b' is not swallowed by a modifier", () => {
  const { sel, calls } = createMockSelection();
  const e = createKeyEvent('b', { ctrlKey: true, target: { closest: () => null, matches: () => false } });
  const handled = CFOB_Selection.prototype.handleKeydown.call(sel, e);
  assert.ok(!handled, "ctrl+b should fall through");
  assert.ok(!calls.includes('actions.sendChipsToBasket'), "actions.sendChipsToBasket should NOT be called");
});

test("real CFOB_Selection.handleKeydown: 'Delete' routes to deleteSelected", () => {
  const { sel, calls } = createMockSelection();
  const e = createKeyEvent('Delete', { target: { closest: () => null, matches: () => false } });
  const handled = CFOB_Selection.prototype.handleKeydown.call(sel, e);
  assert.ok(handled, "should return true");
  assert.ok(calls.includes('actions.deleteSelected'), "actions.deleteSelected should be called");
});

test("real CFOB_Selection.handleKeydown: space routes to openFullView", () => {
  const { sel, calls } = createMockSelection();
  const e = createKeyEvent(' ', { target: { closest: () => null } });
  const handled = CFOB_Selection.prototype.handleKeydown.call(sel, e);
  assert.ok(handled, "should return true");
  assert.ok(calls.includes('fullView.openFullView'), "fullView.openFullView should be called");
});

test("real CFOB_Selection.handleKeydown: enter toggles selection", () => {
  const { sel, calls } = createMockSelection();
  const e = createKeyEvent('Enter', { target: { closest: () => null, matches: () => false } });
  const handled = CFOB_Selection.prototype.handleKeydown.call(sel, e);
  assert.ok(handled, "should return true");
  assert.ok(calls.includes('selection.updateCardStyles'), "selection.updateCardStyles should be called");
  assert.ok(calls.includes('selection.updateActionBar'), "selection.updateActionBar should be called");
});

test("real CFOB_Selection.handleKeydown: ArrowDown routes to handleGridNavigation", () => {
  const { sel, calls } = createMockSelection();
  const e = createKeyEvent('ArrowDown', { target: { closest: () => null } });
  const handled = CFOB_Selection.prototype.handleKeydown.call(sel, e);
  assert.ok(handled, "should return true");
  assert.ok(calls.includes('selection.handleGridNavigation'), "selection.handleGridNavigation should be called");
});

test("real CFOB_Selection.handleKeydown: ArrowUp with no selection focuses search", () => {
  const { sel, calls } = createMockSelection();
  sel.app.lastSelectedIdx = -1;
  const e = createKeyEvent('ArrowUp', { target: { closest: () => null } });
  const handled = CFOB_Selection.prototype.handleKeydown.call(sel, e);
  assert.ok(handled, "should return true");
  assert.ok(calls.includes('searchInput.focus'), "searchInput.focus should be called");
});

test("real CFOB_Selection.handleKeydown: 'alt++' routes to setGridSize", () => {
  const { sel, calls } = createMockSelection();
  const e = createKeyEvent('+', { altKey: true });
  const handled = CFOB_Selection.prototype.handleKeydown.call(sel, e);
  assert.ok(handled, "should return true");
  assert.ok(calls.includes('settings.setGridSize'), "settings.setGridSize should be called");
});

test("real CFOB_Selection.handleKeydown: 'alt--' routes to setGridSize", () => {
  const { sel, calls } = createMockSelection();
  const e = createKeyEvent('-', { altKey: true });
  const handled = CFOB_Selection.prototype.handleKeydown.call(sel, e);
  assert.ok(handled, "should return true");
  assert.ok(calls.includes('settings.setGridSize'), "settings.setGridSize should be called");
});

test("real CFOB_Selection.handleKeydown: unknown key returns false", () => {
  const { sel } = createMockSelection();
  const e = createKeyEvent('z', { target: { closest: () => null, matches: () => false } });
  const handled = CFOB_Selection.prototype.handleKeydown.call(sel, e);
  assert.ok(!handled, "should return false for unknown key");
});

test("real CFOB_Selection.handleKeydown: modal open blocks shortcuts", () => {
  const { sel, calls } = createMockSelection();
  sel.app.settings.modals.getActive = () => ({});
  const e = createKeyEvent('a', { ctrlKey: true });
  const handled = CFOB_Selection.prototype.handleKeydown.call(sel, e);
  assert.ok(!handled, "should return false when modal is open");
  assert.ok(!calls.includes('selection.selectAllFiltered'), "selection.selectAllFiltered should NOT be called when modal is open");
});

// --- Real CFOB_Search.handleKeydown tests ---

const { default: CFOB_Search } = await import("../../web/CFOB_Search.js");

function createMockSearch() {
  const calls = [];
  const searchInput = { focus: () => calls.push('searchInput.focus') };
  const searchSuggestions = { hidden: true };
  const app = {
    settings: { fullViewMode: false },
    focusFirstGridItem: () => calls.push('focusFirstGridItem'),
    $: (id) => {
      if (id === 'cfobSearchInput') return searchInput;
      if (id === 'cfobSearchSuggestions') return searchSuggestions;
      if (id === 'cfobFullViewImg') return { focus: () => calls.push('cfobFullViewImg.focus') };
      return null;
    },
  };
  const search = {
    app,
    hideSearchSuggestions: () => calls.push('search.hideSearchSuggestions'),
  };
  return { search, calls, searchInput, searchSuggestions };
}

test("real CFOB_Search.handleKeydown: Escape with suggestions open hides suggestions", () => {
  const { search, calls, searchSuggestions } = createMockSearch();
  searchSuggestions.hidden = false;
  const e = createKeyEvent('Escape');
  const handled = CFOB_Search.prototype.handleKeydown.call(search, e);
  assert.ok(handled, "should return true");
  assert.ok(calls.includes('search.hideSearchSuggestions'), "search.hideSearchSuggestions should be called");
});

test("real CFOB_Search.handleKeydown: Escape on search input moves focus to grid", () => {
  const { search, calls, searchInput } = createMockSearch();
  globalThis.document.activeElement = searchInput;
  const e = createKeyEvent('Escape');
  const handled = CFOB_Search.prototype.handleKeydown.call(search, e);
  assert.ok(handled, "should return true");
  assert.ok(calls.includes('search.hideSearchSuggestions'), "search.hideSearchSuggestions should be called");
  assert.ok(calls.includes('focusFirstGridItem'), "focusFirstGridItem should be called");
});

test("real CFOB_Search.handleKeydown: Escape on search input in full-view mode focuses full-view image", () => {
  const { search, calls, searchInput } = createMockSearch();
  search.app.settings.fullViewMode = true;
  globalThis.document.activeElement = searchInput;
  const e = createKeyEvent('Escape');
  const handled = CFOB_Search.prototype.handleKeydown.call(search, e);
  assert.ok(handled, "should return true");
  assert.ok(calls.includes('cfobFullViewImg.focus'), "cfobFullViewImg.focus should be called");
});

test("real CFOB_Search.handleKeydown: Escape when not on search input returns false", () => {
  const { search } = createMockSearch();
  globalThis.document.activeElement = null;
  const e = createKeyEvent('Escape');
  const handled = CFOB_Search.prototype.handleKeydown.call(search, e);
  assert.ok(!handled, "should return false when not on search input");
});

test("real CFOB_Search.handleKeydown: non-Escape key returns false", () => {
  const { search } = createMockSearch();
  const e = createKeyEvent('f');
  const handled = CFOB_Search.prototype.handleKeydown.call(search, e);
  assert.ok(!handled, "should return false for non-Escape key");
});

// --- Metadata copy tests (item 2): digit keys must actually copy field values ---

function createMockAppForFieldCopy(overrides = {}) {
  const testImage = {
    name: 'test.png',
    url: 'test.png',
    prompt: { inputs: { seed: 42 } },
    workflow: { nodes: [] },
    isParsed: true,
  };

  const settings = {
    fieldConfigs: overrides.fieldConfigs ?? [
      { label: 'Seed', paths: '@prompt.inputs.seed' },
    ],
    modals: { getActive: () => overrides.activeDialog ?? null },
    showToast: () => {},
  };

  const app = {
    selectedImages: new Set(),
    lastSelectedIdx: 0,
    isUiVisible: true,
    uiHidden: false,
    filteredImages: [testImage],
    loadedImages: [testImage],
    settings,
    showToast: () => {},
    $: (id) => (id === 'cfobFullViewModal' ? { classList: { contains: () => false } } : null),
    resolveFieldValue(img, paths) {
      return ComfyOutputBrowser.prototype.resolveFieldValue.call(app, img, paths);
    },
  };

  return { app, testImage, settings };
}

test("digit keys copy configured metadata fields to the clipboard", async () => {
  const clipboard = { lastValue: '', writeText: async (v) => { clipboard.lastValue = v; } };
  Object.defineProperty(globalThis, 'navigator', { value: { clipboard }, configurable: true });
  const { app } = createMockAppForFieldCopy();

  // '1' resolves to fieldConfigs[0] = 'Seed', whose paths read prompt.inputs.seed = 42.
  await ComfyOutputBrowser.prototype.handleFieldCopyKey.call(app, '1');

  assert.equal(clipboard.lastValue, '42', "the configured field value is written to the clipboard");
});

test("digit key with no configured field is a no-op", async () => {
  const clipboard = { lastValue: '', writeText: async (v) => { clipboard.lastValue = v; } };
  Object.defineProperty(globalThis, 'navigator', { value: { clipboard }, configurable: true });
  const { app } = createMockAppForFieldCopy({
    fieldConfigs: [],
  });

  // No config matched, so nothing is written to the clipboard and no toast.
  await ComfyOutputBrowser.prototype.handleFieldCopyKey.call(app, '1');

  assert.equal(clipboard.lastValue, '', "no value should be written when the digit has no configured field");
});

// --- Search suggestion completion and cycling (item 3) ---

function createMockAppForSearch(overrides = {}) {
  const keywordDictionary = new Map(overrides.keywordDictionary ?? [
    ['cat', 5],
    ['catnip', 3],
    ['catalog', 2],
  ]);

  const app = {
    settings: {
      searchBlacklist: [],
      filterShortcuts: [],
      ignoredAutocompleteKeywords: [],
      fieldConfigs: [{ label: 'Seed', paths: '@prompt.inputs.seed' }],
    },
    serverImageFetchCount: 0,
    isIdleParsing: false,
    searchHistory: [],
    searchHistoryIndex: 0,
    activeSearchSuggestionIndex: -1,
    keywordDictionary,
    imageKeywordIndex: new Map(),
    loadedImages: [],
    gallery: { filterGallery: () => {} },
    focusFirstGridItem: () => {},
    _searchInput: {
      value: 'cat',
      setSelectionRange: () => {},
      setAttribute: () => {},
    },
    _searchSuggestions: {
      hidden: false,
      replaceChildren: () => {},
      scrollTop: 0,
      clientHeight: 200,
      scrollHeight: 300,
      querySelectorAll: () => [],
      addEventListener: () => {},
      appendChild: () => {},
    },
    $ (id) {
      if (id === 'cfobSearchInput') return this._searchInput;
      if (id === 'cfobSearchSuggestions') return this._searchSuggestions;
      return null;
    },
  };

  return { app };
}

test("CFOB_Search: ArrowDown/ArrowUp cycle the active suggestion", async () => {
  const { app } = createMockAppForSearch();
  const search = new CFOB_Search(app);

  // Populate the suggestion list from a real keyword dictionary.
  const input = app.$("cfobSearchInput");
  globalThis.document.activeElement = input;
  search.updateSearchSuggestions(true);

  assert.equal(app.activeSearchSuggestionIndex, -1, "starts with no active suggestion");

  const down = { key: 'ArrowDown', preventDefault: () => {}, stopPropagation: () => {} };
  search.handleSearchKeydown(down);
  assert.equal(app.activeSearchSuggestionIndex, 0, "ArrowDown moves to first suggestion");

  search.handleSearchKeydown({ key: 'ArrowDown', preventDefault: () => {}, stopPropagation: () => {} });
  assert.equal(app.activeSearchSuggestionIndex, 1, "ArrowDown wraps to the next suggestion");

  search.handleSearchKeydown({ key: 'ArrowUp', preventDefault: () => {}, stopPropagation: () => {} });
  assert.equal(app.activeSearchSuggestionIndex, 0, "ArrowUp moves back to the previous suggestion");
});

test("CFOB_Search: Enter completes the active suggestion", () => {
  const { app } = createMockAppForSearch();
  const search = new CFOB_Search(app);

  const input = app.$("cfobSearchInput");
  globalThis.document.activeElement = input;
  search.updateSearchSuggestions(true);

  assert.equal(app.activeSearchSuggestionIndex, -1, "starts with no active suggestion");

  search.handleSearchKeydown({ key: 'Enter', preventDefault: () => {}, stopPropagation: () => {} });
  assert.equal(input.value, 'catnip ', "Enter completes the active suggestion into the input");
});

test("CFOB_Search: Tab completes the active suggestion", () => {
  const { app } = createMockAppForSearch();
  const search = new CFOB_Search(app);

  const input = app.$("cfobSearchInput");
  globalThis.document.activeElement = input;
  search.updateSearchSuggestions(true);

  search.handleSearchKeydown({ key: 'Tab', preventDefault: () => {}, stopPropagation: () => {} });
  assert.equal(input.value, 'catnip ', "Tab completes the active suggestion into the input");
});

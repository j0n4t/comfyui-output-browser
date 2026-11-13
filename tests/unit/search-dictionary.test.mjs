import assert from "node:assert/strict";
import test from "node:test";

const _storage = new Map();
globalThis.localStorage = {
  getItem: (k) => _storage.has(k) ? _storage.get(k) : null,
  setItem: (k, v) => _storage.set(k, String(v)),
  removeItem: (k) => _storage.delete(k),
  clear: () => _storage.clear(),
};
globalThis.document = { activeElement: null };

import CFOB_Search from "../../web/CFOB_Search.js";

function setupSearchHarness(initialHistory = []) {
  _storage.clear();
  if (initialHistory.length) {
    _storage.set('cfob_search_history', JSON.stringify(initialHistory));
  }

  const input = {
    value: "",
    _selectionStart: 0,
    _selectionEnd: 0,
    setSelectionRange(s, e) {
      this._selectionStart = s;
      this._selectionEnd = e;
    },
    setAttribute: () => {},
    blur: () => {},
  };

  const suggestionsEl = {
    hidden: true,
    replaceChildren: () => {},
    querySelectorAll: () => [],
  };

  const app = {
    searchHistory: [...initialHistory],
    searchHistoryIndex: initialHistory.length,
    activeSearchSuggestionIndex: -1,
    imageKeywordIndex: new Map(),
    keywordDictionary: new Map(),
    loadedImages: [],
    filteredImages: [],
    serverImageFetchCount: 0,
    isIdleParsing: false,
    settings: {
      searchBlacklist: [],
      filterShortcuts: [],
      fieldConfigs: [{ label: "Seed", paths: "@prompt.inputs.seed" }],
      ignoredAutocompleteKeywords: [],
      fullViewMode: false,
    },
    gallery: {
      filterGallery: () => {},
    },
    $(id) {
      if (id === "cfobSearchInput") return input;
      if (id === "cfobSearchSuggestions") return suggestionsEl;
      return null;
    }
  };

  const search = new CFOB_Search(app);
  return { app, search, input, suggestionsEl };
}

test("CFOB_Search: indexImageKeywords populates dictionary with word frequencies", () => {
  const { app, search } = setupSearchHarness();

  const img1 = {
    name: "cat_jump.png",
    prompt: { "1": { inputs: { text: "cute cat jumping high" } } },
    workflow: null,
    textChunks: null
  };

  search.indexImageKeywords(img1, false);

  assert.ok(app.imageKeywordIndex.has("cat_jump.png"));
  assert.equal(app.keywordDictionary.get("cat"), 1);
  assert.equal(app.keywordDictionary.get("jumping"), 1);

  // Index another image containing overlapping keywords
  const img2 = {
    name: "cat_sleep.png",
    prompt: { "1": { inputs: { text: "sleepy cat" } } },
    workflow: null,
    textChunks: null
  };

  search.indexImageKeywords(img2, false);

  assert.equal(app.keywordDictionary.get("cat"), 2, "word count incremented to 2");
  assert.equal(app.keywordDictionary.get("sleepy"), 1);
});

test("CFOB_Search: removeImageKeywords decrements ref counts and removes zero-count entries", () => {
  const { app, search } = setupSearchHarness();

  const img1 = {
    name: "photo1.png",
    prompt: { "1": { inputs: { text: "sunset ocean" } } },
    workflow: null,
    textChunks: null
  };
  const img2 = {
    name: "photo2.png",
    prompt: { "1": { inputs: { text: "sunset mountains" } } },
    workflow: null,
    textChunks: null
  };

  search.indexImageKeywords(img1, false);
  search.indexImageKeywords(img2, false);

  assert.equal(app.keywordDictionary.get("sunset"), 2);
  assert.equal(app.keywordDictionary.get("ocean"), 1);

  // Remove photo1: ocean should be deleted, sunset should decrement to 1
  search.removeImageKeywords("photo1.png", false);

  assert.equal(app.imageKeywordIndex.has("photo1.png"), false);
  assert.equal(app.keywordDictionary.has("ocean"), false, "count dropped to 0, deleted from dictionary");
  assert.equal(app.keywordDictionary.get("sunset"), 1);

  // Remove photo2: sunset should be deleted
  search.removeImageKeywords("photo2.png", false);
  assert.equal(app.keywordDictionary.has("sunset"), false);
});

test("CFOB_Search: rebuildKeywordDictionary clears and reindexes only parsed images", () => {
  const { app, search } = setupSearchHarness();

  app.loadedImages = [
    {
      name: "parsed.png",
      isParsed: true,
      prompt: { "1": { inputs: { text: "galaxy stars" } } },
      workflow: null,
      textChunks: null
    },
    {
      name: "unparsed.png",
      isParsed: false,
      prompt: { "1": { inputs: { text: "should not index" } } },
      workflow: null,
      textChunks: null
    }
  ];

  search.rebuildKeywordDictionary();

  assert.equal(app.keywordDictionary.get("galaxy"), 1);
  assert.equal(app.keywordDictionary.get("stars"), 1);
  assert.equal(app.keywordDictionary.has("should"), false);
});

test("CFOB_Search: addSearchHistory appends query, avoids duplicates, and limits to 50", () => {
  const { app, search, input } = setupSearchHarness();

  input.value = "landscape";
  search.addSearchHistory();
  assert.deepEqual(app.searchHistory, ["landscape"]);
  assert.deepEqual(JSON.parse(_storage.get("cfob_search_history")), ["landscape"]);

  // Re-adding identical trailing query should be ignored
  input.value = "landscape";
  search.addSearchHistory();
  assert.equal(app.searchHistory.length, 1);

  // Adding distinct query
  input.value = "portrait";
  search.addSearchHistory();
  assert.deepEqual(app.searchHistory, ["landscape", "portrait"]);

  // Cap at 50 entries
  for (let i = 0; i < 60; i++) {
    input.value = `query_${i}`;
    search.addSearchHistory();
  }
  assert.equal(app.searchHistory.length, 50);
  assert.equal(app.searchHistory[app.searchHistory.length - 1], "query_59");
});

test("CFOB_Search: completeSearchSuggestion appends token with proper spacing", () => {
  const { search, input } = setupSearchHarness();

  // Keyword token completion from existing partial text
  input.value = "prompt:";
  search.completeSearchSuggestion("cat", false);
  assert.equal(input.value, "cat ");

  // Qualifier token completion ending with colon (should not append trailing space)
  input.value = "";
  search.completeSearchSuggestion("name:", false);
  assert.equal(input.value, "name:");

  // Replace whole query (e.g. from history click)
  search.completeSearchSuggestion("sunset beach 4k", true);
  assert.equal(input.value, "sunset beach 4k");
});

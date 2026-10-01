export default class CFOB_Search {
  /** @param {import("./ComfyOutputBrowser.js").default} app */
  constructor(app) {
    this.app = app;
    this.allowEmptySearchSuggestions = false;
    /** @type {{value: string, kind: string, group: string}[]} */
    this.suggestionItems = [];
    this.renderedSuggestionCount = 0;
    this.suggestionBatchSize = 30;
    this.lastSuggestionGroup = "";
    this.suggestionScrollBound = false;
    this.wasFocusedBeforeClick = false; // Tracks if input was already focused
  }

  /** @param {CFOB_Image} img @param {boolean} [refreshSuggestions] */
  indexImageKeywords(img, refreshSuggestions = true) {
    this.removeImageKeywords(img.name, false);
    const keywords = new Set();
    const values = [img.name, img.prompt, img.workflow];
    while (values.length) {
      const value = values.pop();
      if (typeof value === 'string') {
        for (const match of value.matchAll(/[\p{L}\p{N}_-]{2,}/gu)) keywords.add(match[0].toLowerCase());
      } else if (Array.isArray(value)) {
        for (const item of value) values.push(item);
      } else if (value && typeof value === 'object') {
        for (const item of Object.values(value)) values.push(item);
      }
    }
    this.app.imageKeywordIndex.set(img.name, keywords);
    for (const keyword of keywords) {
      this.app.keywordDictionary.set(keyword, (this.app.keywordDictionary.get(keyword) || 0) + 1);
    }

    // Update silently if background parsing happens while focused, without forcing the menu open
    const suggestions = this.app.$("cfobSearchSuggestions");
    if (refreshSuggestions && document.activeElement === this.app.$("cfobSearchInput") && suggestions && !suggestions.hidden) {
      this.updateSearchSuggestions();
    }
  }

  /** @param {string} imageName @param {boolean} [refreshSuggestions] */
  removeImageKeywords(imageName, refreshSuggestions = true) {
    const keywords = this.app.imageKeywordIndex.get(imageName);
    if (!keywords) return;
    for (const keyword of keywords) {
      const count = this.app.keywordDictionary.get(keyword) || 0;
      if (count <= 1) this.app.keywordDictionary.delete(keyword);
      else this.app.keywordDictionary.set(keyword, count - 1);
    }
    this.app.imageKeywordIndex.delete(imageName);

    const suggestions = this.app.$("cfobSearchSuggestions");
    if (refreshSuggestions && document.activeElement === this.app.$("cfobSearchInput") && suggestions && !suggestions.hidden) {
      this.updateSearchSuggestions();
    }
  }

  rebuildKeywordDictionary() {
    this.app.imageKeywordIndex.clear();
    this.app.keywordDictionary.clear();
    for (const img of this.app.loadedImages) {
      if (img.isParsed) this.indexImageKeywords(img, false);
    }

    const suggestions = this.app.$("cfobSearchSuggestions");
    if (document.activeElement === this.app.$("cfobSearchInput") && suggestions && !suggestions.hidden) {
      this.updateSearchSuggestions();
    }
  }

  /** @param {KeyboardEvent} e */
  handleSearchKeydown(e) {
    const input = /** @type {HTMLInputElement} */ (this.app.$("cfobSearchInput"));
    const suggestions = this.app.$("cfobSearchSuggestions");
    if ((e.ctrlKey || e.metaKey) && e.key === ' ') {
      e.preventDefault();
      this.toggleSearchSuggestions();
    } else if (e.key === 'Tab') {
      const index = this.app.activeSearchSuggestionIndex < 0 ? 0 : this.app.activeSearchSuggestionIndex;
      const suggestion = this.suggestionItems[index];
      if (suggestion) {
        e.preventDefault();
        this.completeSearchSuggestion(suggestion.value, suggestion.kind === 'history');
      }
    } else if (e.key === 'ArrowUp') {
      if (!suggestions.hidden && this.suggestionItems.length) {
        e.preventDefault();
        this.cycleSearchSuggestions(-1, this.suggestionItems.length);
      } else if (this.app.searchHistory.length) {
        e.preventDefault();
        this.app.searchHistoryIndex = Math.max(0, this.app.searchHistoryIndex - 1);
        input.value = this.app.searchHistory[this.app.searchHistoryIndex];
        this.app.activeSearchSuggestionIndex = -1;
        this.app.gallery.filterGallery();
        this.updateSearchSuggestions(true);
      }
    } else if (e.key === 'ArrowDown') {
      if (!suggestions.hidden && this.suggestionItems.length) {
        e.preventDefault();
        this.cycleSearchSuggestions(1, this.suggestionItems.length);
      } else {
        e.preventDefault();
        this.addSearchHistory();
        this.hideSearchSuggestions();
        if (this.app.settings.fullViewMode) {
          this.app.$("cfobFullViewImg").focus();
        } else {
          this.app.focusFirstGridItem();
        }
        if (this.app.filteredImages.length) input.blur();
      }
    } else if (e.key === 'Enter') {
      const index = this.app.activeSearchSuggestionIndex < 0 ? 0 : this.app.activeSearchSuggestionIndex;
      const suggestion = this.suggestionItems[index];
      if (!suggestions.hidden && suggestion) {
        e.preventDefault();
        this.completeSearchSuggestion(suggestion.value, suggestion.kind === 'history');
      } else {
        this.addSearchHistory();
        this.hideSearchSuggestions();
      }
    }
  }

  /** @param {number} direction @param {number} optionCount */
  cycleSearchSuggestions(direction, optionCount) {
    if (this.app.activeSearchSuggestionIndex < 0) {
      this.app.activeSearchSuggestionIndex = direction > 0 ? 0 : optionCount - 1;
    } else {
      this.app.activeSearchSuggestionIndex = (this.app.activeSearchSuggestionIndex + direction + optionCount) % optionCount;
    }
    this.renderSuggestionsThrough(this.app.activeSearchSuggestionIndex);
    this.app.$("cfobSearchSuggestions").querySelectorAll('[role="option"]').forEach((option, index) => {
      const active = index === this.app.activeSearchSuggestionIndex;
      option.setAttribute('aria-selected', String(active));
      if (active) option.scrollIntoView({ block: 'nearest' });
    });
  }

  addSearchHistory() {
    const query = /** @type {HTMLInputElement} */ (this.app.$("cfobSearchInput")).value.trim();
    if (!query || this.app.searchHistory[this.app.searchHistory.length - 1] === query) {
      this.app.searchHistoryIndex = this.app.searchHistory.length;
      return;
    }
    this.app.searchHistory = [...this.app.searchHistory.filter(item => item !== query), query].slice(-50);
    this.app.searchHistoryIndex = this.app.searchHistory.length;
    localStorage.setItem('cfob_search_history', JSON.stringify(this.app.searchHistory));
  }

  hideSearchSuggestions() {
    this.allowEmptySearchSuggestions = false;
    const suggestions = this.app.$("cfobSearchSuggestions");
    suggestions.hidden = true;
    suggestions.replaceChildren();
    this.suggestionItems = [];
    this.renderedSuggestionCount = 0;
    this.lastSuggestionGroup = "";
    this.app.$("cfobSearchInput").setAttribute('aria-expanded', 'false');
  }

  updateSearchSuggestions(force = false) {
    if (!force && (this.app.serverImageFetchCount > 0 || this.app.isIdleParsing)) return;
    const input = /** @type {HTMLInputElement} */ (this.app.$("cfobSearchInput"));
    const suggestions = this.app.$("cfobSearchSuggestions");
    const value = input.value;
    if (!value.trim() && !this.allowEmptySearchSuggestions) {
      this.hideSearchSuggestions();
      return;
    }
    let inQuotes = false, tokenStart = 0;
    for (let i = 0; i < value.length; i++) {
      if (value[i] === '"') inQuotes = !inQuotes;
      else if (!inQuotes && (value[i] === ' ' || value[i] === ',')) tokenStart = i + 1;
    }
    const token = value.slice(tokenStart);
    const colonIndex = token.indexOf(':');
    const key = colonIndex >= 0 ? token.slice(0, colonIndex).toLowerCase() : "";
    const candidates = ['name:', 'path:', 'prompt:', 'workflow:'];
    this.app.settings.fieldConfigs.forEach((/** @type {{ label: string; }} */ field, /** @type {number} */ index) => {
      candidates.push(`${index + 1}:`);
      if (!/\s/.test(field.label)) candidates.push(`${field.label}:`);
    });
    this.app.settings.filterShortcuts.forEach((/** @type {{ keyword: string; }} */ shortcut) => {
      candidates.push(`@${shortcut.keyword}`);
    });
    const prefix = token.toLowerCase();
    const ignored = new Set(this.app.settings.ignoredAutocompleteKeywords.map(keyword => keyword.toLowerCase()));
    const keywordPrefix = colonIndex >= 0 ? token.slice(colonIndex + 1).toLowerCase() : prefix;
    const qualifier = colonIndex >= 0 ? token.slice(0, colonIndex + 1) : "";
    /** @type {{value: string, kind: string, group: string}[]} */
    const matches = [];
    const seen = new Set();
    const add = (/** @type {string} */ match, kind = 'completion', group = 'keywords') => {
      if (seen.has(match)) return;
      seen.add(match);
      matches.push({ value: match, kind, group });
    };
    if (!token.trim()) {
      candidates.forEach(candidate => add(candidate, 'completion', 'starters'));
      if (!value.trim()) {
        [...this.app.searchHistory].reverse().forEach(query => add(query, 'history', 'history'));
      }
      this.addKeywordSuggestions(add, ignored, '', '');
    } else if (key === 'name') {
      for (const filename of new Set(this.app.loadedImages.map(image => image.name.replace(/\\/g, '/').split('/').pop() || ""))) {
        if (filename.toLowerCase().startsWith(keywordPrefix) && filename.toLowerCase() !== keywordPrefix) add(`name:${filename.slice(0, keywordPrefix.length + 5)}`);
      }
    } else if (key === 'path') {
      const directories = new Set();
      for (const image of this.app.loadedImages) {
        const parts = image.name.replace(/\\/g, '/').split('/');
        parts.pop();
        for (let i = 1; i <= parts.length; i++) directories.add(parts.slice(0, i).join('/') + '/');
      }
      Array.from(directories).filter(d => d.toLowerCase().startsWith(keywordPrefix))
        .sort((a, b) => a.split('/').length - b.split('/').length || a.localeCompare(b))
        .forEach(directory => add(`path:${directory}`));
    } else {
      candidates.filter(candidate => candidate.toLowerCase().startsWith(prefix) && candidate.toLowerCase() !== prefix)
        .forEach(candidate => add(candidate, 'completion', 'starters'));
      if (!key && !/\s/.test(token)) {
        for (const filename of new Set(this.app.loadedImages.map(image => image.name.replace(/\\/g, '/').split('/').pop() || ""))) {
          if (filename.toLowerCase().startsWith(prefix) && filename.toLowerCase() !== prefix) {
            add(filename.slice(0, prefix.length + 5), 'completion', 'starters');
          }
        }
      }
      if (!key) {
        const historyPrefix = value.trim().toLowerCase();
        this.app.searchHistory.slice().reverse()
          .filter(query => query.toLowerCase().startsWith(historyPrefix) && query.toLowerCase() !== historyPrefix)
          .forEach(query => add(query, 'history', 'history'));
      }
      this.addKeywordSuggestions(add, ignored, keywordPrefix, qualifier);
    }
    this.suggestionItems = matches;
    this.renderedSuggestionCount = 0;
    this.lastSuggestionGroup = "";
    suggestions.replaceChildren();
    suggestions.scrollTop = 0;
    if (!matches.length || document.activeElement !== input) {
      this.hideSearchSuggestions();
      return;
    }
    this.app.activeSearchSuggestionIndex = -1;
    if (!this.suggestionScrollBound) {
      suggestions.addEventListener('scroll', () => {
        if (suggestions.scrollTop + suggestions.clientHeight >= suggestions.scrollHeight - 32) {
          this.renderMoreSuggestions();
        }
      });
      this.suggestionScrollBound = true;
    }
    this.renderMoreSuggestions();
    suggestions.hidden = false;
    input.setAttribute('aria-expanded', 'true');
  }

  /**
   * @param {(match: string, kind?: string, group?: string) => void} add
   * @param {Set<string>} ignored
   * @param {string} prefix
   * @param {string} qualifier
   */
  addKeywordSuggestions(add, ignored, prefix, qualifier) {
    Array.from(this.app.keywordDictionary.entries())
      .filter(([keyword]) => !ignored.has(keyword) && keyword.startsWith(prefix) && keyword !== prefix)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .forEach(([keyword]) => add(`${qualifier}${keyword}`, 'completion', 'keywords'));
  }

  renderMoreSuggestions() {
    const suggestions = this.app.$("cfobSearchSuggestions");
    const end = Math.min(this.suggestionItems.length, this.renderedSuggestionCount + this.suggestionBatchSize);
    while (this.renderedSuggestionCount < end) {
      const suggestion = this.suggestionItems[this.renderedSuggestionCount++];
      if (suggestion.group !== this.lastSuggestionGroup) {
        const heading = document.createElement('div');
        heading.className = 'search-suggestion-group';
        heading.setAttribute('role', 'presentation');
        heading.textContent = suggestion.group === 'starters' ? 'Starters'
          : suggestion.group === 'history' ? 'History' : 'Most Frequent Keywords';
        suggestions.appendChild(heading);
        this.lastSuggestionGroup = suggestion.group;
      }
      const option = document.createElement('div');
      option.className = 'search-suggestion';
      option.setAttribute('role', 'option');
      option.setAttribute('aria-selected', 'false');
      option.dataset.value = suggestion.value;
      option.dataset.kind = suggestion.kind;
      option.textContent = suggestion.value;
      option.addEventListener('mousedown', event => event.preventDefault());
      option.addEventListener('click', () => this.completeSearchSuggestion(suggestion.value, suggestion.kind === 'history'));
      suggestions.appendChild(option);
    }
  }

  /** @param {number} index */
  renderSuggestionsThrough(index) {
    while (this.renderedSuggestionCount <= index && this.renderedSuggestionCount < this.suggestionItems.length) {
      this.renderMoreSuggestions();
    }
  }

  showEmptySearchSuggestions() {
    this.allowEmptySearchSuggestions = true;
    this.updateSearchSuggestions(true);
  }

  refreshSearchSuggestionsIfOpen() {
    const suggestions = this.app.$("cfobSearchSuggestions");
    if (document.activeElement === this.app.$("cfobSearchInput") && suggestions && !suggestions.hidden) {
      this.updateSearchSuggestions(true);
    }
  }

  toggleSearchSuggestions() {
    if (this.app.$("cfobSearchSuggestions").hidden) {
      this.allowEmptySearchSuggestions = true;
      this.updateSearchSuggestions(true);
    } else {
      this.hideSearchSuggestions();
    }
  }

  /** @param {string} completion @param {boolean} [replaceQuery] */
  completeSearchSuggestion(completion, replaceQuery = false) {
    const input = /** @type {HTMLInputElement} */ (this.app.$("cfobSearchInput"));
    const value = input.value;
    if (replaceQuery) {
      input.value = completion;
      input.setSelectionRange(input.value.length, input.value.length);
      this.app.searchHistoryIndex = this.app.searchHistory.length;
      this.app.activeSearchSuggestionIndex = -1;
      this.app.gallery.filterGallery();
      this.updateSearchSuggestions(true);
      return;
    }
    let inQuotes = false, tokenStart = 0;
    for (let i = 0; i < value.length; i++) {
      if (value[i] === '"') inQuotes = !inQuotes;
      else if (!inQuotes && (value[i] === ' ' || value[i] === ',')) tokenStart = i + 1;
    }
    input.value = `${value.slice(0, tokenStart)}${completion}${completion.endsWith(':') ? '' : ' '}`;
    input.setSelectionRange(input.value.length, input.value.length);
    this.app.searchHistoryIndex = this.app.searchHistory.length;
    this.app.activeSearchSuggestionIndex = -1;
    this.app.gallery.filterGallery();
    this.updateSearchSuggestions(true);
  }
}

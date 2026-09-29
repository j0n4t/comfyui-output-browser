/**
 * @typedef {{ kind: 'index'; index: number } | { kind: 'slice'; start?: number; end?: number }} CFOB_SearchRange
 * @typedef {{ isNot: boolean; searchKey: string | null; searchValue: string; fieldIdx: number; fieldMatch: CFOB_CardFieldSettings | null; range: CFOB_SearchRange | null }} CFOB_SearchTerm
 */

/**
 * @param {CFOB_Image[]} images
 * @param {string} query
 * @param {{
 *   fieldConfigs: CFOB_CardFieldSettings[];
 *   filterShortcuts: { keyword: string; filter: string }[];
 *   showHiddenFolders: boolean;
 *   isImageInHiddenFolder: (name: string) => boolean;
 *   resolveFieldValue: (img: CFOB_Image, paths: string) => unknown;
 * }} options
 * @returns {CFOB_Image[]}
 */
export function filterImages(images, query, options) {
  const forceShowHidden = query.startsWith('.');
  const effectiveShowHidden = options.showHiddenFolders || forceShowHidden;
  const searchQuery = expandFilterShortcuts(query.replace(/^\.\s+/, ''), options.filterShortcuts);
  const rawOrGroups = searchQuery.split(',').map(group => group.trim()).filter(Boolean);

  /** @type {CFOB_SearchTerm[][]} */
  const parsedQuery = rawOrGroups.map(groupStr => {
    const andTerms = groupStr.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
    return andTerms.flatMap(term => {
      const isNot = term.startsWith('!');
      const actualTerm = isNot ? term.substring(1) : term;
      if (!actualTerm) return [];

      let termValue = actualTerm;
      /** @type {CFOB_SearchRange | null} */
      let range = null;
      const rangeMatch = termValue.match(/\[(-?\d+)?(?::(-?\d+)?)?\]$/);
      if (rangeMatch && (rangeMatch[1] !== undefined || rangeMatch[2] !== undefined || rangeMatch[0].includes(':'))) {
        termValue = termValue.slice(0, rangeMatch.index);
        range = rangeMatch[0].includes(':')
          ? {
            kind: 'slice',
            start: rangeMatch[1] === undefined ? undefined : Number(rangeMatch[1]),
            end: rangeMatch[2] === undefined ? undefined : Number(rangeMatch[2])
          }
          : { kind: 'index', index: Number(rangeMatch[1]) };
      }
      if (!termValue) return [];

      /** @type {string | null} */
      let searchKey = null;
      let searchValue = termValue;

      const colonIdx = termValue.indexOf(':');
      if (colonIdx > 0 && !termValue.startsWith('"')) {
        searchKey = termValue.substring(0, colonIdx).toLowerCase();
        searchValue = termValue.substring(colonIdx + 1);
      }

      if (searchValue.startsWith('"') && searchValue.endsWith('"') && searchValue.length >= 2) {
        searchValue = searchValue.substring(1, searchValue.length - 1);
      }

      searchValue = searchValue.toLowerCase();

      let fieldIdx = NaN;
      /** @type {CFOB_CardFieldSettings | null} */
      let fieldMatch = null;

      if (searchKey && !['name', 'path', 'prompt', 'workflow'].includes(searchKey)) {
        fieldIdx = parseInt(searchKey, 10);
        if (isNaN(fieldIdx) || fieldIdx <= 0 || fieldIdx > options.fieldConfigs.length) {
          fieldMatch = options.fieldConfigs.find(config => config.label.toLowerCase() === searchKey) || null;
        }
      }

      return [{ isNot, searchKey, searchValue, fieldIdx, fieldMatch, range }];
    });
  }).filter(group => group.length > 0);

  const eligibleImages = images.filter(img =>
    effectiveShowHidden || !options.isImageInHiddenFolder(img.name)
  );
  /** @type {WeakMap<CFOB_Image, { name: string; prompt: string | null; workflow: string | null; fields: Map<string, string | null> }>} */
  const imageTextCache = new WeakMap();
  const matchesTerm = (/** @type {CFOB_Image} */ img, /** @type {CFOB_SearchTerm} */ term) => {
    let text = imageTextCache.get(img);
    if (!text) {
      text = { name: (img.name || "").toLowerCase(), prompt: null, workflow: null, fields: new Map() };
      imageTextCache.set(img, text);
    }
    const matchesField = (/** @type {string} */ paths) => {
      if (!text.fields.has(paths)) {
        const value = options.resolveFieldValue(img, paths);
        text.fields.set(paths, value === null ? null : String(value).toLowerCase());
      }
      return text.fields.get(paths)?.includes(term.searchValue) || false;
    };
    let match = false;
    if (term.searchKey) {
      if (term.searchKey === 'name' || term.searchKey === 'path') {
        match = text.name.includes(term.searchValue);
      } else if (term.searchKey === 'prompt') {
        if (text.prompt === null) text.prompt = img.prompt ? (JSON.stringify(img.prompt) || "").toLowerCase() : "";
        match = text.prompt.includes(term.searchValue);
      } else if (term.searchKey === 'workflow') {
        if (text.workflow === null) text.workflow = img.workflow ? (JSON.stringify(img.workflow) || "").toLowerCase() : "";
        match = text.workflow.includes(term.searchValue);
      } else if (!isNaN(term.fieldIdx) && term.fieldIdx > 0 && term.fieldIdx <= options.fieldConfigs.length) {
        match = matchesField(options.fieldConfigs[term.fieldIdx - 1].paths);
      } else if (term.fieldMatch) {
        match = matchesField(term.fieldMatch.paths);
      }
    } else {
      if (text.prompt === null) text.prompt = img.prompt ? (JSON.stringify(img.prompt) || "").toLowerCase() : "";
      if (text.workflow === null) text.workflow = img.workflow ? (JSON.stringify(img.workflow) || "").toLowerCase() : "";
      match = text.name.includes(term.searchValue) || text.prompt.includes(term.searchValue) || text.workflow.includes(term.searchValue);
    }
    return term.isNot ? !match : match;
  };
  const applyRange = (
    /** @type {CFOB_Image[]} */ matchingImages,
    /** @type {CFOB_SearchRange} */ range
  ) => {
    if (range.kind === 'slice') return matchingImages.slice(range.start, range.end);
    const index = range.index < 0 ? matchingImages.length + range.index : range.index;
    return index >= 0 ? matchingImages.slice(index, index + 1) : [];
  };

  const matchingGroups = parsedQuery.length
    ? parsedQuery.map(andGroup => {
        /** @type {CFOB_Image[] | null} */
        let groupMatches = null;
        for (const term of andGroup) {
          if (groupMatches === null) {
            groupMatches = eligibleImages.filter(img => matchesTerm(img, term));
            if (term.range) groupMatches = applyRange(groupMatches, term.range);
          } else if (term.range) {
            const termMatches = applyRange(eligibleImages.filter(img => matchesTerm(img, term)), term.range);
            const termMatchSet = new Set(termMatches);
            groupMatches = groupMatches.filter(img => termMatchSet.has(img));
          } else {
            groupMatches = groupMatches.filter(img => matchesTerm(img, term));
          }
          if (groupMatches.length === 0) break;
        }
        return groupMatches || eligibleImages;
      })
    : [eligibleImages];
  const matchingImageSet = new Set(matchingGroups.flat());
  return eligibleImages.filter(img => matchingImageSet.has(img));
}

/**
 * @param {string} query
 * @param {{ keyword: string; filter: string }[]} filterShortcuts
 */
function expandFilterShortcuts(query, filterShortcuts) {
  const shortcuts = new Map(filterShortcuts.map(shortcut =>
    [shortcut.keyword.toLowerCase(), shortcut.filter]
  ));
  if (!shortcuts.size) return query;

  const splitOutsideQuotes = (/** @type {string} */ text, /** @type {(character: string) => boolean} */ isSeparator) => {
    const parts = [];
    let start = 0;
    let inQuotes = false;
    for (let index = 0; index < text.length; index++) {
      if (text[index] === '"') inQuotes = !inQuotes;
      else if (!inQuotes && isSeparator(text[index])) {
        parts.push(text.slice(start, index));
        start = index + 1;
      }
    }
    parts.push(text.slice(start));
    return parts;
  };

  return splitOutsideQuotes(query, character => character === ',')
    .flatMap(group => {
      const terms = group.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
      return terms.reduce((/** @type {string[]} */ expansions, /** @type {string} */ term) => {
        const reference = term.match(/^@([\p{L}\p{N}_-]+)$/u);
        const filter = reference ? shortcuts.get(reference[1].toLowerCase()) : undefined;
        if (!filter) return expansions.map(expansion => `${expansion} ${term}`.trim());
        const alternatives = splitOutsideQuotes(filter, character => character === ',')
          .map(alternative => alternative.trim()).filter(Boolean);
        if (!alternatives.length) return expansions.map(expansion => `${expansion} ${term}`.trim());
        return expansions.flatMap(expansion => alternatives.map(alternative =>
          `${expansion} ${alternative}`.trim()
        ));
      }, ['']);
    })
    .join(', ');
}

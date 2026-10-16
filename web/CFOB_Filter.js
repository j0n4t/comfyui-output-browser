/**
 * @typedef {{ kind: 'index'; index: number } | { kind: 'slice'; start?: number; end?: number }} CFOB_SearchRange
 * @typedef {{ isNot: boolean; searchKey: string | null; searchValue: string; fieldIdx: number; fieldMatch: CFOB_CardFieldSettings | null; range: CFOB_SearchRange | null }} CFOB_SearchTerm
 */

/**
 * Split a blacklist entry into the node it targets, the property within it, and which
 * metadata blob it applies to.
 *
 * The inspector spells the two blobs differently, and that spelling is the only thing
 * that tells them apart:
 *   prompt JSON    `Node.inputs.seed` (widget)    `Node.node.class_type` (property)
 *   workflow JSON  `Node.seed` (named widget)     `Node.widget[0]` (positional)
 *
 * So an `inputs.` / `node.` prefix means the prompt blob; a bare property means workflow.
 * They are matched separately because the same widget can hold different values in each.
 *
 * @param {string} entry
 * @returns {{ node: string; prop: string; scope: 'prompt' | 'workflow' | 'any' } | null}
 */
const parseEntry = (entry) => {
  const dot = entry.indexOf('.');
  if (dot === entry.length - 1) return null; // trailing dot is malformed
  const node = (dot < 0 ? entry : entry.slice(0, dot)).trim();
  if (!node) return null;
  const name = node.toLowerCase();
  if (dot < 0) return { node: name, prop: '', scope: 'any' }; // whole node, both blobs

  const prop = entry.slice(dot + 1).trim().toLowerCase();
  if (prop === 'inputs' || prop.startsWith('inputs.')) return { node: name, prop, scope: 'prompt' };
  if (prop === 'node') return { node: name, prop: '', scope: 'prompt' };
  if (prop.startsWith('node.')) return { node: name, prop: prop.slice('node.'.length), scope: 'prompt' };
  return { node: name, prop, scope: 'workflow' };
};

/**
 * Build the exact-path matcher for one metadata blob. A path matches when the entry
 * applies to that blob, names the node, and its property equals the blacklisted one
 * (an empty property matches the whole node).
 * @param {{ node: string; prop: string; scope: string }[]} entries
 * @param {'prompt' | 'workflow'} scope
 * @returns {(nodeNames: string[], props: string[]) => boolean}
 */
const makeIsBlocked = (entries, scope) => (nodeNames, props) => {
  const nodes = nodeNames.filter(name => typeof name === 'string' && name).map(name => name.toLowerCase());
  const properties = props.filter(Boolean).map(prop => prop.toLowerCase());
  return entries.some(entry =>
    (entry.scope === 'any' || entry.scope === scope)
    && nodes.includes(entry.node)
    && (entry.prop === '' || properties.includes(entry.prop))
  );
};

/**
 * Deep-copy a value, dropping any property whose path is blacklisted.
 * @param {any} value
 * @param {string[]} props
 * @param {(paths: string[]) => boolean} isBlocked
 * @returns {any}
 */
const maskValue = (value, props, isBlocked) => {
  // With no path yet (a node root), a property starts a fresh path; otherwise it extends.
  const childProps = (/** @type {string} */ key) =>
    props.length ? props.map(prop => (prop ? `${prop}.${key}` : key)) : [key];

  if (Array.isArray(value)) {
    const masked = [];
    for (let index = 0; index < value.length; index++) {
      const paths = (props.length ? props : ['']).map(prop => `${prop}[${index}]`);
      if (isBlocked(paths)) continue;
      masked.push(maskValue(value[index], paths, isBlocked));
    }
    return masked;
  }
  if (value && typeof value === 'object') {
    /** @type {Record<string, any>} */
    const masked = {};
    for (const [key, child] of Object.entries(value)) {
      const paths = childProps(key);
      if (isBlocked(paths)) continue;
      masked[key] = maskValue(child, paths, isBlocked);
    }
    return masked;
  }
  return value;
};

/**
 * Mask a workflow node. Widget values are stored under `widgets_values_named` (by name)
 * and `widgets_values` (positionally). Both are walked as-is; each is blocked only by a
 * path that names it, e.g. `KSampler.seed` or `KSampler.widget[0]`.
 * @param {Record<string, any>} node
 * @param {string[]} nodeNames
 * @param {(nodeNames: string[], props: string[]) => boolean} isBlocked
 * @returns {Record<string, any>}
 */
const maskWorkflowNode = (node, nodeNames, isBlocked) => {
  /** @type {Record<string, any>} */
  const masked = {};
  for (const [key, value] of Object.entries(node)) {
    if (isBlocked(nodeNames, [key])) continue;
    if (key === 'widgets_values_named' && value && typeof value === 'object') {
      /** @type {Record<string, any>} */
      const kept = {};
      for (const [name, widgetValue] of Object.entries(value)) {
        if (isBlocked(nodeNames, [name])) continue;
        kept[name] = maskValue(widgetValue, [name], props => isBlocked(nodeNames, props));
      }
      masked[key] = kept;
      continue;
    }
    // The inspector labels positional widget values `Node.widget[i]`, so use that name
    // here too — otherwise the path the UI shows would not block anything.
    if (key === 'widgets_values' && Array.isArray(value)) {
      masked[key] = maskValue(value, ['widget'], props => isBlocked(nodeNames, props));
      continue;
    }
    masked[key] = maskValue(value, [key], props => isBlocked(nodeNames, props));
  }
  return masked;
};

/**
 * Node names the inspector can show for a prompt node: id, title, and class type.
 * @param {string | number} id
 * @param {Record<string, any> | null | undefined} node
 * @returns {string[]}
 */
const promptNodeNames = (id, node) =>
  [String(id), node?._meta?.title, node?.class_type].filter(name => typeof name === 'string' && name);

/**
 * Node names the inspector can show for a workflow node: id, title, and type.
 * @param {Record<string, any>} node
 * @returns {string[]}
 */
const workflowNodeNames = (node) =>
  [String(node.id), node.title, node.type].filter(name => typeof name === 'string' && name);

/**
 * @param {Record<string, any>} prompt
 * @param {(nodeNames: string[], props: string[]) => boolean} isBlocked
 * @returns {Record<string, any>}
 */
const maskPrompt = (prompt, isBlocked) => {
  if (!prompt || typeof prompt !== 'object') return prompt;
  /** @type {Record<string, any>} */
  const masked = {};
  for (const [id, node] of Object.entries(prompt)) {
    const names = promptNodeNames(id, node);
    if (isBlocked(names, [])) continue;
    masked[id] = maskValue(node, [], props => isBlocked(names, props));
  }
  return masked;
};

/**
 * @param {Record<string, any>} workflow
 * @param {(nodeNames: string[], props: string[]) => boolean} isBlocked
 * @returns {Record<string, any>}
 */
const maskWorkflow = (workflow, isBlocked) => {
  if (!workflow || typeof workflow !== 'object') return workflow;
  /** @type {Record<string, any>} */
  const masked = {};
  for (const [key, value] of Object.entries(workflow)) {
    if (key === 'nodes' && Array.isArray(value)) {
      masked.nodes = value.map(node => {
        if (!node || typeof node !== 'object') return node;
        const names = workflowNodeNames(node);
        return isBlocked(names, []) ? null : maskWorkflowNode(node, names, isBlocked);
      });
      continue;
    }
    masked[key] = maskValue(value, [key], props => isBlocked(['@workflow'], props));
  }
  return masked;
};

/**
 * Blacklist entries, split into whole built-in keys (`name`, `prompt`, `workflow`, ...)
 * and node paths (`KSampler.inputs.seed`).
 * @param {string[]} [blacklist]
 * @returns {{
 *   entries: string[];
 *   keySet: Set<string>;
 *   pathEntries: { node: string; prop: string; scope: 'prompt' | 'workflow' | 'any' }[];
 *   isFieldBlacklisted: (paths: string) => boolean;
 * }}
 */
const compileBlacklist = (blacklist) => {
  const entries = (blacklist || []).map(entry => entry.trim()).filter(Boolean);
  return {
    entries,
    keySet: new Set(entries.map(entry => entry.toLowerCase())),
    pathEntries: /** @type {{ node: string; prop: string; scope: 'prompt' | 'workflow' | 'any' }[]} */ (entries.map(parseEntry).filter(Boolean)),
    isFieldBlacklisted: (/** @type {string} */ paths) => {
      const lower = paths.toLowerCase();
      return entries.some(entry => lower.includes(entry.toLowerCase()));
    }
  };
};

/**
 * Return the prompt/workflow metadata with blacklisted paths removed, for indexing
 * searchable keywords. Mirrors what `filterImages` can actually match.
 * @param {CFOB_Image} img
 * @param {string[]} [blacklist]
 * @returns {{ name: string; prompt: Record<string, any> | null; workflow: Record<string, any> | null }}
 */
export function maskImageMetadata(img, blacklist) {
  const { keySet, pathEntries } = compileBlacklist(blacklist);
  const nameHidden = keySet.has('name') || keySet.has('path');
  return {
    name: nameHidden ? '' : (img.name || ''),
    prompt: keySet.has('prompt') || !img.prompt ? null : maskPrompt(img.prompt, makeIsBlocked(pathEntries, 'prompt')),
    workflow: keySet.has('workflow') || !img.workflow ? null : maskWorkflow(img.workflow, makeIsBlocked(pathEntries, 'workflow'))
  };
}

/**
 * @param {CFOB_Image[]} images
 * @param {string} query
 * @param {{
 *   fieldConfigs: CFOB_CardFieldSettings[];
 *   filterShortcuts: { keyword: string; filter: string }[];
 *   showHiddenFolders: boolean;
 *   searchBlacklist?: string[];
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
  const blacklist = compileBlacklist(options.searchBlacklist);
  const matchesTerm = (/** @type {CFOB_Image} */ img, /** @type {CFOB_SearchTerm} */ term) => {
    let text = imageTextCache.get(img);
    if (!text) {
      const masked = maskImageMetadata(img, options.searchBlacklist);
      text = {
        name: (masked.name || "").toLowerCase(),
        prompt: masked.prompt ? (JSON.stringify(masked.prompt) || "").toLowerCase() : "",
        workflow: masked.workflow ? (JSON.stringify(masked.workflow) || "").toLowerCase() : "",
        fields: new Map()
      };
      imageTextCache.set(img, text);
    }
    const matchesField = (/** @type {string} */ paths) => {
      if (blacklist.isFieldBlacklisted(paths)) return false;
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
        match = (text.prompt || '').includes(term.searchValue);
      } else if (term.searchKey === 'workflow') {
        match = (text.workflow || '').includes(term.searchValue);
      } else if (!isNaN(term.fieldIdx) && term.fieldIdx > 0 && term.fieldIdx <= options.fieldConfigs.length) {
        match = matchesField(options.fieldConfigs[term.fieldIdx - 1].paths);
      } else if (term.fieldMatch) {
        match = matchesField(term.fieldMatch.paths);
      }
    } else {
      match = text.name.includes(term.searchValue) || (text.prompt || '').includes(term.searchValue) || (text.workflow || '').includes(term.searchValue);
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

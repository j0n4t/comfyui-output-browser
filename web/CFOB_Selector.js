/**
 * Generate a unique CSS selector for a DOM element.
 * Returns null for body or elements without any distinguishing features.
 * @param {HTMLElement} el
 * @returns {string | null}
 */
export function generateSelector(el) {
  if (!el || el.tagName === 'BODY') return null;
  if (el.id) return `#${el.id}`;
  const testId = el.getAttribute?.('data-testid');
  if (testId) return `[data-testid="${testId}"]`;

  const path = [];
  let current = el;
  while (current && current.tagName !== 'BODY' && current.parentElement) {
    let selector = current.tagName.toLowerCase();
    if (current.className && typeof current.className === 'string') {
      const classes = current.className.split(/\s+/).filter(c => c && !c.includes(':') && !c.includes('['));
      if (classes.length > 0) selector += `.${classes.slice(0, 3).join('.')}`;
    }
    path.unshift(selector);
    current = current.parentElement;
    if (path.length >= 5) break;
  }
  return path.length > 0 ? path.join(' > ') : null;
}

/**
 * Splits a stored hook target into its selector and which side of the target the
 * launcher sits on. Older entries are a bare selector and default to "before".
 * @param {string | null} stored
 * @returns {{ selector: string, side: 'before' | 'after' } | null}
 */
export function parseHookTarget(stored) {
  if (!stored) return null;
  const separator = stored.indexOf('|');
  if (separator === -1) return { selector: stored, side: 'before' };
  const selector = stored.slice(0, separator);
  const side = stored.slice(separator + 1) === 'after' ? 'after' : 'before';
  return selector ? { selector, side } : null;
}

/**
 * Packs a selector and side into the stored form.
 * @param {string} selector
 * @param {'before' | 'after'} side
 */
export function formatHookTarget(selector, side) {
  return `${selector}|${side}`;
}

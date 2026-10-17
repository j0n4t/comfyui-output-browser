/**
 * Floating launcher drag handler.
 *
 * Uses pointer events so both mouse and touch work. Returns nothing; the
 * handler attaches its own listeners to the button and window.
 */

/**
 * @param {HTMLElement & { _cfobDragEndedAt?: number }} btn
 */
export function setupFloatingDragFn(btn) {
  /** @type {number} */ let startX;
  /** @type {number} */ let startY;
  /** @type {number} */ let startLeft;
  /** @type {number} */ let startTop;
  let dragging = false, moved = false;

  btn.addEventListener('pointerdown', (/** @type {PointerEvent} */ e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    dragging = true;
    moved = false;
    startX = e.clientX;
    startY = e.clientY;
    // Capture the base position from the inline styles (unaffected by the
    // hover transform), falling back to the measured rect.
    const rect = btn.getBoundingClientRect();
    startLeft = btn.style.left ? parseFloat(btn.style.left) : rect.left;
    startTop = btn.style.top ? parseFloat(btn.style.top) : rect.top;
    // Keep receiving move/up events even when the cursor outruns the button.
    // Without capture a fast flick lands the pointer on whatever is underneath
    // (in ComfyUI, a draggable gallery image), which starts a native HTML5 drag
    // and fires pointercancel — killing the drag after the first move.
    btn.setPointerCapture(e.pointerId);
  });

  window.addEventListener('pointermove', (/** @type {PointerEvent} */ e) => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (!moved && Math.abs(dx) < 3 && Math.abs(dy) < 3) return;
    if (!moved) {
      // First real move: pin the position so it becomes the drag origin.
      moved = true;
      btn.style.left = `${startLeft}px`;
      btn.style.top = `${startTop}px`;
      btn.style.right = '';
      btn.style.bottom = '';
      document.body.style.userSelect = 'none';
    }
    const newLeft = Math.max(0, Math.min(window.innerWidth - btn.offsetWidth, startLeft + dx));
    const newTop = Math.max(0, Math.min(window.innerHeight - btn.offsetHeight, startTop + dy));
    btn.style.left = `${newLeft}px`;
    btn.style.top = `${newTop}px`;
  });

  // While the launcher is being dragged, suppress any native HTML5 drag. A fast
  // flick outruns the button and lands the pointer on whatever is underneath —
  // in ComfyUI a gallery image with draggable="true" — which starts a native drag
  // and fires pointercancel, killing the launcher drag after the first move.
  // Suppressing it here (capture phase) keeps the whole gesture ours.
  window.addEventListener('dragstart', (e) => {
    if (!dragging) return;
    e.preventDefault();
  }, true);

  window.addEventListener('pointerup', () => {
    if (!dragging) return;
    dragging = false;
    document.body.style.userSelect = '';
    if (moved) {
      const rect = btn.getBoundingClientRect();
      localStorage.setItem('cfob_launcher_pos', JSON.stringify({ left: rect.left, top: rect.top }));
      // Suppress the click that follows a drag so it doesn't toggle the panel
      btn._cfobDragEndedAt = Date.now();
    }
  });

  // The browser can cancel a pointer gesture mid-drag (a scroll/zoom being
  // claimed, a touch leaving the screen). Without this the drag state and the
  // userSelect lock survive the cancellation.
  window.addEventListener('pointercancel', () => {
    if (!dragging) return;
    dragging = false;
    document.body.style.userSelect = '';
  });
}

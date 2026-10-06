export const CFOB_STYLES = /*css*/ `
  #cfob-root {
    /* Base Scaling Factor - Adjust to scale entire UI proportionally */
    --cfob-scale: 1;
    font-size: calc(16px * var(--cfob-scale));

    /* User-controlled sizing */
    --grid-size: 380px;
    --compact-offset: 180px;
    --compact-size: max(20px, calc(var(--grid-size) - var(--compact-offset)));

    /* Color Palette: Backgrounds */
    --color-bg-base: #18181b;
    --color-bg-panel: #27272a;
    --color-bg-panel-hover: #3f3f46;
    --color-bg-panel-active: #52525b;
    --color-bg-header: #202023;
    --color-bg-surface: #1e1e21;
    --color-bg-input: #111111;
    --color-bg-popover: #2a2a2e;
    --color-bg-overlay: rgba(0, 0, 0, 0.8);
    --color-bg-full: rgba(0, 0, 0, 0.95);

    /* Color Palette: Borders */
    --color-border: #3f3f46;
    --color-border-hover: #71717a;
    --color-border-light: #2d2d30;
    --color-border-dark: #333333;

    /* Color Palette: Text */
    --color-text-primary: #f4f4f5;
    --color-text-muted: #a1a1aa;
    --color-text-inverse: #ffffff;
    --color-text-disabled: #666666;

    /* Color Palette: Brand & Status */
    --color-accent: #0284c7;
    --color-accent-hover: #0369a1;
    --color-accent-alpha: rgba(2, 132, 199, 0.3);
    --color-link: #38bdf8;
    --color-success: #22c55e;

    --color-danger-bg: #7f1d1d;
    --color-danger-border: #991b1b;
    --color-danger-text: #fca5a5;

    /* Color Palette: Syntax */
    --color-syntax-string: #fde047;
    --color-syntax-key: #38bdf8;

    /* Typography */
    --font-sans: system-ui, -apple-system, sans-serif;
    --font-mono: ui-monospace, monospace;

    /* Border Radius */
    --radius-sm: 0.25em;
    --radius-md: 0.375em;
    --radius-lg: 0.5em;
    --radius-xl: 0.625em;
    --radius-pill: 9999px;

    /* Z-Indexes */
    --z-base: 9999;
    --z-resizer: 10000;
    --z-action-bar: 10005;
    --z-full-view: 10010;
    --z-modal: 10015;
    --z-popover: 10020;
    --z-toast: 10030;

    /* Structural Base */
    position: fixed;
    z-index: var(--z-base);
    box-sizing: border-box;
    max-width: 100vw;
    max-height: 100vh;
    font-family: var(--font-sans);
    background: var(--color-bg-base);
    color: var(--color-text-primary);
    transition: transform 0.25s ease-out, opacity 0.25s ease-out;
    margin: 0;
    padding: 0;
    display: none;
    flex-direction: column;
    overflow: hidden;
    box-shadow: 0 0 1.5em rgba(0,0,0,0.6);

    container: cfob-app / size;
  }

  #cfob-root *, #cfob-root *::before, #cfob-root *::after { box-sizing: border-box; }

  #cfob-root.mode-full { inset: 0; width: 100vw; height: 100vh; border: none; }
  #cfob-root.mode-right { top: 0; right: 0; bottom: 0; height: 100vh; border-left: 1px solid var(--color-border); }
  #cfob-root.mode-left { top: 0; left: 0; bottom: 0; height: 100vh; border-right: 1px solid var(--color-border); }
  #cfob-root.mode-down { left: 0; right: 0; bottom: 0; width: 100vw; border-top: 1px solid var(--color-border); }
  #cfob-root.mode-up { top: 0; left: 0; right: 0; width: 100vw; border-bottom: 1px solid var(--color-border); }

  #cfob-root.cfob-hidden { opacity: 0; pointer-events: none; }
  #cfob-root.mode-full.cfob-hidden { transform: scale(0.95); }
  #cfob-root.mode-right.cfob-hidden { transform: translateX(100%); }
  #cfob-root.mode-left.cfob-hidden { transform: translateX(-100%); }
  #cfob-root.mode-down.cfob-hidden { transform: translateY(100%); }
  #cfob-root.mode-up.cfob-hidden { transform: translateY(-100%); }

  #cfob-resizer { position: absolute; z-index: var(--z-resizer); display: none; background: transparent; transition: background 0.2s; }
  #cfob-resizer:hover, #cfob-resizer.dragging { background: var(--color-accent); }
  #cfob-root.mode-right #cfob-resizer { display: block; top: 0; left: 0; bottom: 0; width: 0.375em; cursor: ew-resize; }
  #cfob-root.mode-left #cfob-resizer { display: block; top: 0; right: 0; bottom: 0; width: 0.375em; cursor: ew-resize; }
  #cfob-root.mode-down #cfob-resizer { display: block; top: 0; left: 0; right: 0; height: 0.375em; cursor: ns-resize; }
  #cfob-root.mode-up #cfob-resizer { display: block; bottom: 0; left: 0; right: 0; height: 0.375em; cursor: ns-resize; }
  #cfob-root.full-view-active.constrain-full-view #cfob-resizer { z-index: var(--z-popover); }

  #cfob-root .top-bar { background: var(--color-bg-panel); border-bottom: 1px solid var(--color-border); padding: 0.3125em; display: flex; justify-content: space-between; align-items: center; gap: 0.9375em; flex-wrap: wrap; }
  #cfob-root .logo-group { display: flex; align-items: center; gap: 0.625em; }
  #cfob-root .logo-group h1 { font-size: 1.125em; margin: 0; color: var(--color-text-inverse); white-space: nowrap; }
  #cfobImageCount { color: var(--color-text-muted); font-size: 0.8125em; font-weight: 600; margin-left: 0.375em; }
  #cfob-root .actions-group { display: flex; align-items: center; gap: 0.625em; flex-wrap: wrap; flex: 1; justify-content: flex-end; }

  #cfob-root .btn { background: var(--color-bg-panel-hover); color: var(--color-text-primary); border: 1px solid var(--color-border); padding: 0.375em 0.625em; border-radius: var(--radius-md); cursor: pointer; font-size: 0.8125em; font-weight: 500; display: inline-flex; align-items: center; gap: 0.375em; transition: all 0.15s; white-space: nowrap; }
  #cfob-root .btn:hover { background: var(--color-bg-panel-active); border-color: var(--color-border-hover); }
  #cfob-root .btn-primary { background: var(--color-accent); border-color: var(--color-accent); color: var(--color-text-inverse); }
  #cfob-root .btn-primary:hover { background: var(--color-accent-hover); border-color: var(--color-accent-hover); }
  #cfob-root .btn-danger { background: var(--color-danger-bg); border-color: var(--color-danger-border); color: var(--color-danger-text); }
  #cfob-root .btn-danger:hover { background: var(--color-danger-border); }
  #cfob-root .btn-xs { padding: 0.1875em 0.375em; font-size: 0.6875em; border-radius: var(--radius-sm); }
  #cfob-root #cfobRefreshBtn.is-fetching svg { animation: cfob-refresh-spin 1s linear infinite; transform-origin: center; }
  @keyframes cfob-refresh-spin { to { transform: rotate(360deg); } }

  #cfob-root .search-wrapper { position: relative; display: flex; align-items: center; flex: 1; min-width: 9.375em; max-width: 21.875em; }
  #cfob-root .search-input { background: var(--color-bg-base); border: 1px solid var(--color-border); color: var(--color-text-primary); padding: 0.5em 1.875em 0.5em 0.75em; border-radius: var(--radius-md); font-size: 0.8125em; width: 100%; }
  #cfob-root .search-input:focus { outline: none; border-color: var(--color-accent); }
  #cfob-root .search-suggestions { position: absolute; top: calc(100% + 0.25em); left: 0; right: 0; max-height: 18em; overflow-y: auto; background: var(--color-bg-popover); border: 1px solid var(--color-border); border-radius: var(--radius-md); box-shadow: 0 0.5em 1.5em rgba(0,0,0,0.5); z-index: var(--z-popover); }
  #cfob-root .search-suggestions[hidden] { display: none; }
  #cfob-root .search-suggestion-group { position: sticky; top: 0; padding: 0.375em 0.75em; background: var(--color-bg-popover); color: var(--color-text-muted); border-bottom: 1px solid var(--color-border); font-size: 0.6875em; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; }
  #cfob-root .search-suggestion { padding: 0.5em 0.75em; color: var(--color-text-primary); font-size: 0.8125em; cursor: pointer; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  #cfob-root .search-suggestion:hover, #cfob-root .search-suggestion[aria-selected="true"] { background: var(--color-bg-panel-hover); }
  #cfob-root .search-clear-btn { position: absolute; right: 0.375em; background: transparent; border: none; color: var(--color-text-muted); cursor: pointer; padding: 0.25em; display: none; align-items: center; justify-content: center; transition: color 0.15s; }
  #cfob-root .search-clear-btn:hover { color: var(--color-text-inverse); }

  #cfob-root .main-container { flex: 1; min-width: 0; min-height: 0; overflow-x: hidden; overflow-y: auto; padding: 0.4em; position: relative; }

  #cfob-root .image-card { position: relative; background: var(--color-bg-panel); border: 1px solid var(--color-border); border-radius: var(--radius-xl); overflow: hidden; display: flex; box-shadow: 0 0.25em 0.75em rgba(0,0,0,0.25); transition: border-color 0.15s, box-shadow 0.15s, transform 0.1 ; }
  #cfob-root .image-card.selected { border-color: var(--color-accent); box-shadow: 0 0 0 2px var(--color-accent), 0 0.5em 1em rgba(0,0,0,0.4); transform: translateY(-2px); }
  #cfob-root .image-card.focused { border-color: var(--color-link); box-shadow: 0 0 0 2px var(--color-bg-base), 0 0 0 4px var(--color-link); }
  #cfob-root .image-card.selected.focused { border-color: var(--color-accent); box-shadow: 0 0 0 2px var(--color-bg-base), 0 0 0 4px var(--color-accent), 0 0.5em 1em rgba(0,0,0,0.4); }
  #cfob-root .image-card.selected .checkbox-wrapper { background: var(--color-accent); }

  #cfob-root .checkbox-wrapper { position: absolute; top: 0.5em; left: 0.5em; z-index: 5; background: rgba(0,0,0,0.6); border-radius: var(--radius-sm); padding: 0.25em; display: flex; }
  #cfob-root .card-checkbox { width: 1em; height: 1em; cursor: pointer; accent-color: var(--color-accent); margin: 0; }
  #cfob-root .card-content-wrapper { flex: 1; display: flex; flex-direction: column; min-width: 0; }
  #cfob-root .card-header { padding: 0.2em; background: var(--color-bg-header); border-bottom: 1px solid var(--color-border); display: flex; justify-content: space-between; align-items: center; cursor: pointer; transition: background 0.15s, color 0.15s; }
  #cfob-root .card-header:hover { background: var(--color-bg-panel-hover); color: var(--color-text-inverse); }
  #cfob-root .card-header .toggle-icon { transition: transform 0.2s ease; }
  #cfob-root .card-filename { font-size: 0.6em; font-weight: 600; color: var(--color-text-inverse); white-space: nowrap; overflow: hidden; }
  #cfob-root .card-body { padding: 0.75em 0.875em; display: flex; flex-direction: column; gap: 0.625em; font-size: 0.75em; }
  #cfob-root .image-card.expanded .card-header .toggle-icon { transform: rotate(180deg); }

  #cfob-root .gallery-container { --gallery-item-size: var(--grid-size); display: grid; gap: 0.4em; align-items: start; padding-bottom: 5em; }
  #cfob-root .gallery-container .image-card .card-body { display: none; }
  #cfob-root .gallery-container .image-card.expanded .card-body { display: flex; }
  #cfob-root .gallery-container.view-grid { grid-template-columns: repeat(auto-fill, minmax(var(--gallery-item-size), 1fr)); }
  #cfob-root .gallery-container.view-compact { --gallery-item-size: var(--compact-size); grid-template-columns: repeat(auto-fill, minmax(var(--gallery-item-size), 1fr)); }
  #cfob-root .gallery-container.view-grid.grid-column-first,
  #cfob-root .gallery-container.view-compact.grid-column-first { grid-auto-flow: column; }
  #cfob-root .gallery-container.view-grid .image-card { flex-direction: column; }
  #cfob-root .gallery-container.view-grid .card-preview { width: 100%; height: calc(var(--grid-size) * 0.63); background: var(--color-bg-input); object-fit: contain; cursor: pointer; border-bottom: 1px solid var(--color-border); }
  #cfob-root .gallery-container.view-compact .image-card { flex-direction: column; border-radius: var(--radius-md); }
  #cfob-root .gallery-container.view-compact .card-preview { width: 100%; height: calc(var(--compact-size) * 0.75); background: var(--color-bg-input); object-fit: contain; cursor: pointer; border-bottom: 1px solid var(--color-border); }
  #cfob-root .gallery-container.masonry.view-grid.grid-column-first,
  #cfob-root .gallery-container.masonry.view-compact.grid-column-first { display: block; column-width: var(--gallery-item-size); column-gap: 0.4em; column-fill: balance; }
  #cfob-root .gallery-container.masonry.view-grid.grid-column-first .image-card,
  #cfob-root .gallery-container.masonry.view-compact.grid-column-first .image-card { display: inline-flex; flex-direction: column; width: 100%; margin: 0 0 0.4em; break-inside: avoid; vertical-align: top; }
  #cfob-root .gallery-container.masonry.view-grid .card-preview,
  #cfob-root .gallery-container.masonry.view-compact .card-preview { display: block; width: 100%; height: auto; background: var(--color-bg-input); object-fit: contain; cursor: pointer; border-bottom: 1px solid var(--color-border); }

  #cfob-root .main-container.scroll-horizontal { overflow-x: auto; overflow-y: hidden; }
  #cfob-root .main-container.scroll-horizontal .gallery-container.grid-column-first:not(.view-list):not(.masonry) { grid-auto-flow: column; grid-template-columns: none; grid-template-rows: repeat(auto-fill, minmax(var(--gallery-item-size), 1fr)); grid-auto-columns: var(--gallery-item-size); width: max-content; min-width: 100%; height: 100%; min-height: 100%; padding: 0 5em 1.25em 0; }
  #cfob-root .main-container.scroll-horizontal .gallery-container:not(.grid-column-first):not(.view-list) { grid-auto-flow: row; grid-template-rows: repeat(var(--cfob-row-count, auto-fill), minmax(var(--gallery-item-size), 1fr)); grid-template-columns: repeat(var(--cfob-col-count, 1), var(--gallery-item-size)); width: max-content; min-width: 100%; height: 100%; min-height: 100%; padding: 0 5em 1.25em 0; }
  #cfob-root .main-container:not(.scroll-horizontal) .gallery-container.grid-column-first:not(.masonry) { display: block; column-width: var(--gallery-item-size); column-gap: 0.4em; column-fill: balance; }
  #cfob-root .main-container:not(.scroll-horizontal) .gallery-container.grid-column-first:not(.masonry) .image-card { display: inline-flex; flex-direction: column; width: 100%; margin: 0 0 0.4em; break-inside: avoid; vertical-align: top; }
  #cfob-root .main-container.scroll-horizontal .gallery-container.masonry.grid-column-first { height: 100%; min-height: 100%; column-fill: auto; padding: 0 5em 1.25em 0; }

  #cfob-root .gallery-container.view-list { grid-template-columns: 1fr; }
  #cfob-root .gallery-container.view-list .image-card { flex-direction: row; max-height: 200px; }
  #cfob-root .gallery-container.view-list .card-preview { width: 10em; background: var(--color-bg-input); object-fit: contain; cursor: pointer; border-right: 1px solid var(--color-border); }
  #cfob-root .gallery-container.view-list .card-body { display: flex; }
  #cfob-root .main-container.scroll-horizontal .gallery-container.view-list { grid-auto-flow: column; grid-template-columns: none; grid-template-rows: 1fr; grid-auto-columns: var(--gallery-item-size); width: max-content; min-width: 100%; height: 100%; min-height: 100%; padding: 0 5em 1.25em 0; }

  #cfob-root .action-bar { position: absolute; bottom: 1.25em; left: 50%; transform: translateX(-50%) translateY(6.25em); background: var(--color-bg-panel); border: 1px solid var(--color-accent); border-radius: var(--radius-lg); padding: 0.625em 1.25em; display: flex; align-items: center; gap: 0.9375em; box-shadow: 0 0.625em 1.875em rgba(0,0,0,0.8); z-index: var(--z-action-bar); opacity: 0; pointer-events: none; transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
  #cfob-root .action-bar.show { transform: translateX(-50%) translateY(0); opacity: 1; pointer-events: auto; }

  #cfob-root .tabs { display: flex; border-bottom: 1px solid var(--color-border); gap: 0.125em; }
  #cfob-root .tab { padding: 0.5em 1em; cursor: pointer; background: var(--color-bg-base); border-radius: var(--radius-md) var(--radius-md) 0 0; font-size: 0.8125em; }
  #cfob-root .tab.active { background: var(--color-accent); color: var(--color-text-inverse); }
  #cfob-root .tab-content { display: none; padding-top: 0.625em; }
  #cfob-root .tab-content.active { display: block; }

  #cfob-root .empty-state { text-align: center; padding: 5em 1.25em; color: var(--color-text-muted); }
  #cfob-root .empty-state svg { width: 4em; height: 4em; margin-bottom: 1em; stroke: var(--color-bg-panel-active); }

  #cfob-root .toast { position: fixed; bottom: 1.25em; right: 1.25em; background: var(--color-accent); color: var(--color-text-inverse); padding: 0.625em 1em; border-radius: var(--radius-md); font-size: 0.8125em; font-weight: 500; box-shadow: 0 0.25em 0.75em rgba(0,0,0,0.3); z-index: var(--z-toast); opacity: 0; transform: translateY(0.625em); transition: all 0.2s ease; pointer-events: none; }
  #cfob-root .toast.show { opacity: 1; transform: translateY(0); }
`;

export const CFOB_QUERY_STYLES = /*css*/ `

  @container cfob-app (max-width: 1024px) {
    #cfob-root .btn span { display: none; }
  }

  @container cfob-app (max-width: 768px) {
    #cfob-root .top-bar { gap: 0.625em; }
    #cfob-root .actions-group { width: 100%; gap: 0.4em; }
    #cfob-root .search-wrapper { max-width: none; width: 100%; order: -1; }
    #cfob-root .action-bar { padding: 0.4em; justify-content: center; gap: 0.2em; }
    #cfob-root .nodes-grid { grid-template-columns: repeat(auto-fill, minmax(12.5em, 1fr)); }
  }

  @media (max-width: 768px) {
    #cfob-root .full-view-layout .btn { padding: 0.4em; }
    #cfob-root .full-view-layout .btn span { display: none; }
    #cfob-root .full-view-layout.sidebar-below .full-view-main { min-height: 15.625em; }
    #cfob-root .full-view-layout.sidebar-below .full-view-sidebar { min-width: 0; min-height: 0; }
    #cfob-root .full-view-layout.sidebar-side .full-view-sidebar { min-width: 0; min-height: 0; }
  }

  @container cfob-app (max-width: 600px) {
    #cfob-root .logo-group h1 { display: none; }
  }
`;
import { app } from "../../scripts/app.js";

const BROWSER_CSS = /*css*/ `
    /* =========================================================
       1. THEME VARIABLES & SCALING
       ========================================================= */
    #cfob-root {
      /* Base Scaling Factor - Adjust to scale entire UI proportionally */
      --cfob-scale: 1;
      font-size: calc(16px * var(--cfob-scale));
      
      /* JS-Controlled Sizing */
      --grid-size: 380px; 
      --compact-size: 200px;

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
      --z-modal: 10010;
      --z-popover: 10020;
      --z-toast: 10030;
      
      /* Structural Base */
      position: fixed; 
      z-index: var(--z-base); 
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
    }

    /* =========================================================
       2. LAYOUT MODES & STRUCTURAL
       ========================================================= */
    #cfob-root *, #cfob-root *::before, #cfob-root *::after { box-sizing: border-box; }
    
    #cfob-root.mode-full { inset: 0; width: 100vw; height: 100vh; border: none; }
    #cfob-root.mode-right { top: 0; right: 0; bottom: 0; height: 100vh; border-left: 1px solid var(--color-border); }
    #cfob-root.mode-left { top: 0; left: 0; bottom: 0; height: 100vh; border-right: 1px solid var(--color-border); }
    #cfob-root.mode-down { left: 0; right: 0; bottom: 0; width: 100vw; border-top: 1px solid var(--color-border); }
    #cfob-root.mode-up { top: 0; left: 0; right: 0; width: 100vw; border-bottom: 1px solid var(--color-border); }
    
    /* Hidden states for smooth sliding */
    #cfob-root.cfob-hidden { opacity: 0; pointer-events: none; }
    #cfob-root.mode-full.cfob-hidden { transform: scale(0.95); }
    #cfob-root.mode-right.cfob-hidden { transform: translateX(100%); }
    #cfob-root.mode-left.cfob-hidden { transform: translateX(-100%); }
    #cfob-root.mode-down.cfob-hidden { transform: translateY(100%); }
    #cfob-root.mode-up.cfob-hidden { transform: translateY(-100%); }

    /* Resizer */
    #cfob-resizer { position: absolute; z-index: var(--z-resizer); display: none; background: transparent; transition: background 0.2s; }
    #cfob-resizer:hover, #cfob-resizer.dragging { background: var(--color-accent); }
    #cfob-root.mode-right #cfob-resizer { display: block; top: 0; left: 0; bottom: 0; width: 0.375em; cursor: ew-resize; }
    #cfob-root.mode-left #cfob-resizer { display: block; top: 0; right: 0; bottom: 0; width: 0.375em; cursor: ew-resize; }
    #cfob-root.mode-down #cfob-resizer { display: block; top: 0; left: 0; right: 0; height: 0.375em; cursor: ns-resize; }
    #cfob-root.mode-up #cfob-resizer { display: block; bottom: 0; left: 0; right: 0; height: 0.375em; cursor: ns-resize; }

    /* =========================================================
       3. TOP BAR & NAVIGATION
       ========================================================= */
    #cfob-root .top-bar { 
      background: var(--color-bg-panel); 
      border-bottom: 1px solid var(--color-border); 
      padding: 0.3125em; 
      display: flex; 
      justify-content: space-between; 
      align-items: center; 
      gap: 0.9375em; 
      flex-wrap: wrap; 
    }
    
    #cfob-root .logo-group { display: flex; align-items: center; gap: 0.625em; }
    #cfob-root .logo-group h1 { font-size: 1.125em; margin: 0; color: var(--color-text-inverse); white-space: nowrap; }
    #cfobImageCount { color: var(--color-text-muted); font-size: 0.8125em; font-weight: 600; margin-left: 0.375em; }
    
    #cfob-root .actions-group { display: flex; align-items: center; gap: 0.625em; flex-wrap: wrap; flex: 1; justify-content: flex-end; }
    
    /* Buttons */
    #cfob-root .btn { 
      background: var(--color-bg-panel-hover); 
      color: var(--color-text-primary); 
      border: 1px solid var(--color-border); 
      padding: 0.375em 0.625em; 
      border-radius: var(--radius-md); 
      cursor: pointer; 
      font-size: 0.8125em; 
      font-weight: 500; 
      display: inline-flex; 
      align-items: center; 
      gap: 0.375em; 
      transition: all 0.15s; 
      white-space: nowrap; 
    }
    #cfob-root .btn:hover { background: var(--color-bg-panel-active); border-color: var(--color-border-hover); }
    #cfob-root .btn-primary { background: var(--color-accent); border-color: var(--color-accent); color: var(--color-text-inverse); }
    #cfob-root .btn-primary:hover { background: var(--color-accent-hover); border-color: var(--color-accent-hover); }
    #cfob-root .btn-danger { background: var(--color-danger-bg); border-color: var(--color-danger-border); color: var(--color-danger-text); }
    #cfob-root .btn-danger:hover { background: var(--color-danger-border); }
    #cfob-root .btn-xs { padding: 0.1875em 0.375em; font-size: 0.6875em; border-radius: var(--radius-sm); }
    
    /* Search */
    #cfob-root .search-wrapper { position: relative; display: flex; align-items: center; flex: 1; min-width: 9.375em; max-width: 21.875em; }
    #cfob-root .search-input { 
      background: var(--color-bg-base); 
      border: 1px solid var(--color-border); 
      color: var(--color-text-primary); 
      padding: 0.5em 1.875em 0.5em 0.75em; 
      border-radius: var(--radius-md); 
      font-size: 0.8125em; 
      width: 100%; 
    }
    #cfob-root .search-input:focus { outline: none; border-color: var(--color-accent); }
    #cfob-root .search-clear-btn { 
      position: absolute; right: 0.375em; 
      background: transparent; border: none; 
      color: var(--color-text-muted); cursor: pointer; 
      padding: 0.25em; display: none; align-items: center; 
      justify-content: center; transition: color 0.15s; 
    }
    #cfob-root .search-clear-btn:hover { color: var(--color-text-inverse); }

    /* =========================================================
       4. GALLERY MAIN & CARDS
       ========================================================= */
    #cfob-root .main-container { flex: 1; overflow-y: auto; padding: 1.25em; position: relative; }
    #cfob-root .drop-overlay { 
      position: absolute; inset: 0.625em; 
      border: 0.125em dashed var(--color-accent); 
      border-radius: var(--radius-xl); 
      background: var(--color-accent-alpha); 
      display: flex; flex-direction: column; justify-content: center; align-items: center; 
      z-index: 10; cursor: pointer; pointer-events: none; opacity: 0; transition: opacity 0.2s ease; 
    }
    #cfob-root .main-container.dragover .drop-overlay { opacity: 1; pointer-events: all; }
    
    #cfob-root .image-card { 
      position: relative; background: var(--color-bg-panel); 
      border: 1px solid var(--color-border); 
      border-radius: var(--radius-xl); 
      overflow: hidden; display: flex; 
      box-shadow: 0 0.25em 0.75em rgba(0,0,0,0.25); 
      transition: border-color 0.15s, box-shadow 0.15s; 
    }
    #cfob-root .image-card.selected { border-color: var(--color-accent); box-shadow: 0 0 0 1px var(--color-accent); }
    
    #cfob-root .checkbox-wrapper { position: absolute; top: 0.5em; left: 0.5em; z-index: 5; background: rgba(0,0,0,0.6); border-radius: var(--radius-sm); padding: 0.25em; display: flex; }
    #cfob-root .card-checkbox { width: 1em; height: 1em; cursor: pointer; accent-color: var(--color-accent); margin: 0; }
    
    #cfob-root .card-content-wrapper { flex: 1; display: flex; flex-direction: column; min-width: 0; }
    #cfob-root .card-header { 
      padding: 0.625em 0.875em; 
      background: var(--color-bg-header); 
      border-bottom: 1px solid var(--color-border); 
      display: flex; justify-content: space-between; align-items: center; 
      cursor: pointer; transition: background 0.15s, color 0.15s; 
    }
    #cfob-root .card-header:hover { background: var(--color-bg-panel-hover); color: var(--color-text-inverse); }
    #cfob-root .card-header .toggle-icon { transition: transform 0.2s ease; }
    #cfob-root .card-filename { font-size: 0.8125em; font-weight: 600; color: var(--color-text-inverse); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 15em; }
    
    #cfob-root .card-body { padding: 0.75em 0.875em; display: flex; flex-direction: column; gap: 0.625em; font-size: 0.75em; }
    #cfob-root .image-card.expanded .card-header .toggle-icon { transform: rotate(180deg); }
    
    /* Layout Configurations */
    #cfob-root .gallery-container { display: grid; gap: 1.25em; align-items: start; padding-bottom: 5em; }
    #cfob-root .gallery-container .image-card .card-body { display: none; }
    #cfob-root .gallery-container .image-card.expanded .card-body { display: flex; }

    #cfob-root .gallery-container.view-grid { grid-template-columns: repeat(auto-fill, minmax(var(--grid-size), 1fr)); }
    #cfob-root .gallery-container.view-grid .image-card { flex-direction: column; }
    #cfob-root .gallery-container.view-grid .card-preview { width: 100%; height: calc(var(--grid-size) * 0.63); background: var(--color-bg-input); object-fit: contain; cursor: pointer; border-bottom: 1px solid var(--color-border); }
    
    #cfob-root .gallery-container.view-compact { grid-template-columns: repeat(auto-fill, minmax(var(--compact-size), 1fr)); gap: 0.75em; }
    #cfob-root .gallery-container.view-compact .image-card { flex-direction: column; border-radius: var(--radius-md); }
    #cfob-root .gallery-container.view-compact .card-preview { width: 100%; height: calc(var(--compact-size) * 0.75); background: var(--color-bg-input); object-fit: contain; cursor: pointer; border-bottom: 1px solid var(--color-border); }

    /* Horizontal Scroll Layout */
    #cfob-root .main-container.scroll-horizontal { overflow-x: auto; overflow-y: hidden; }
    #cfob-root .main-container.scroll-horizontal .gallery-container {
      grid-auto-flow: column;
      grid-template-rows: repeat(auto-fill, minmax(var(--grid-size), 1fr));
      grid-auto-columns: minmax(var(--grid-size), 1fr);
      height: 100%; padding-bottom: 1.25em; padding-right: 5em;
    }
    #cfob-root .main-container.scroll-horizontal .gallery-container.view-compact {
      grid-template-rows: repeat(auto-fill, minmax(var(--compact-size), 1fr));
      grid-auto-columns: minmax(var(--compact-size), 1fr);
    }
    #cfob-root .main-container.scroll-horizontal .gallery-container.view-list { grid-template-rows: 1fr; }
    
    #cfob-root .gallery-container.view-list { grid-template-columns: 1fr; }
    #cfob-root .gallery-container.view-list .image-card { flex-direction: row; }
    #cfob-root .gallery-container.view-list .card-preview { width: 17.5em; height: 100%; min-height: 11.25em; max-height: 17.5em; background: var(--color-bg-input); object-fit: contain; cursor: pointer; border-right: 1px solid var(--color-border); }
    #cfob-root .gallery-container.view-list .card-body { display: grid; grid-template-columns: repeat(auto-fill, minmax(15.625em, 1fr)); gap: 0.75em; }

    /* Floating Action Bar */
    #cfob-root .action-bar { 
      position: fixed; bottom: 1.25em; left: 50%; 
      transform: translateX(-50%) translateY(6.25em); 
      background: var(--color-bg-panel); border: 1px solid var(--color-accent); 
      border-radius: var(--radius-lg); padding: 0.625em 1.25em; 
      display: flex; align-items: center; gap: 0.9375em; 
      box-shadow: 0 0.625em 1.875em rgba(0,0,0,0.8); 
      z-index: var(--z-action-bar); opacity: 0; pointer-events: none; 
      transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); 
    }
    #cfob-root .action-bar.show { transform: translateX(-50%) translateY(0); opacity: 1; pointer-events: auto; }

    /* =========================================================
       5. DATA FIELDS & INSPECTOR
       ========================================================= */
    #cfob-root .field-row { display: flex; flex-direction: column; gap: 0.25em; background: var(--color-bg-surface); border: 1px solid var(--color-border-dark); padding: 0.5em 0.625em; border-radius: var(--radius-md); }
    #cfob-root .field-label { font-size: 0.6875em; font-weight: 700; color: var(--color-syntax-key); text-transform: uppercase; letter-spacing: 0.5px; display: flex; justify-content: space-between; align-items: center; }
    #cfob-root .field-value-container { display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5em; }
    #cfob-root .field-value { color: var(--color-text-primary); word-break: break-word; white-space: pre-wrap; max-height: 7.5em; overflow-y: auto; font-family: var(--font-mono); font-size: 0.75em; flex: 1; }
    #cfob-root .field-value.empty { color: var(--color-text-disabled); font-style: italic; }
    
    #cfob-root .icon-btn { background: transparent; color: var(--color-text-muted); border: none; padding: 0.1875em 0.3125em; border-radius: var(--radius-sm); cursor: pointer; display: inline-flex; align-items: center; justify-content: center; transition: all 0.15s; }
    #cfob-root .icon-btn:hover { background: var(--color-border-dark); color: var(--color-text-inverse); }
    
    #cfob-root .nodes-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(20em, 1fr)); gap: 0.875em; align-items: start; }
    #cfob-root .node-card { background: var(--color-bg-base); border: 1px solid var(--color-border); border-radius: var(--radius-lg); overflow: hidden; }
    #cfob-root .node-header { background: var(--color-bg-panel); padding: 0.625em 0.75em; border-bottom: 1px solid var(--color-border); display: flex; justify-content: space-between; align-items: center; }
    #cfob-root .node-title { font-weight: 600; color: var(--color-text-inverse); font-size: 0.875em; }
    #cfob-root .node-title small { color: var(--color-text-muted); font-weight: 400; font-size: 0.6875em; display: block; }
    #cfob-root .node-id { background: var(--color-bg-panel-hover); padding: 0.125em 0.375em; border-radius: var(--radius-xl); font-size: 0.625em; font-family: var(--font-mono); color: var(--color-text-inverse); }
    #cfob-root .node-body { padding: 0.625em; font-size: 0.75em; display: flex; flex-direction: column; gap: 0.5em; }
    
    #cfob-root .input-row { display: flex; flex-direction: column; gap: 0.25em; border-bottom: 1px solid var(--color-bg-panel); padding-bottom: 0.375em; }
    #cfob-root .input-row:last-child { border-bottom: none; padding-bottom: 0; }
    #cfob-root .input-header { display: flex; justify-content: space-between; align-items: center; }
    #cfob-root .input-name { color: var(--color-syntax-key); font-weight: 600; font-size: 0.6875em; }
    #cfob-root .input-value-wrapper { display: flex; justify-content: space-between; align-items: flex-start; gap: 0.375em; background: var(--color-bg-header); padding: 0.375em; border-radius: var(--radius-sm); border: 1px solid var(--color-border-light); }
    #cfob-root .input-value-text { color: var(--color-syntax-string); font-family: var(--font-mono); font-size: 0.6875em; word-break: break-word; white-space: pre-wrap; max-height: 7.5em; overflow-y: auto; flex: 1; }
    #cfob-root .input-actions { display: flex; gap: 0.25em; align-items: center; }

    /* =========================================================
       6. MODALS & POP-OVERS
       ========================================================= */
    #cfob-root .modal-overlay { position: fixed; inset: 0; background: var(--color-bg-overlay); backdrop-filter: blur(4px); display: none; justify-content: center; align-items: center; z-index: var(--z-action-bar); padding: 1.25em; }
    #cfob-root .modal-overlay.active { display: flex; }
    #cfob-root .modal-content { background: var(--color-bg-panel); border: 1px solid var(--color-border); border-radius: var(--radius-2xl); width: 100%; max-width: 56.25em; max-height: 90vh; display: flex; flex-direction: column; box-shadow: 0 0.625em 1.875em rgba(0,0,0,0.5); overflow: hidden; }
    #cfob-root .modal-header { padding: 1em 1.25em; border-bottom: 1px solid var(--color-border); display: flex; gap: 0.625em; justify-content: space-between; align-items: center; }
    #cfob-root .modal-header h3 { margin: 0; font-size: 1em; color: var(--color-text-inverse); flex: 1; }
    #cfob-root .modal-body { padding: 1.25em; overflow-y: auto; display: flex; flex-direction: column; gap: 1em; flex: 1; }
    #cfob-root .modal-footer { padding: 0.75em 1.25em; border-top: 1px solid var(--color-border); display: flex; justify-content: flex-end; gap: 0.625em; background: var(--color-bg-header); }
    
    #cfob-root .config-field-item { background: var(--color-bg-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: 0.75em; display: flex; flex-direction: column; gap: 0.5em; }
    #cfob-root .config-field-header { display: flex; gap: 0.625em; align-items: center; }
    #cfob-root .config-input, #cfob-root .config-paths-textarea { background: var(--color-bg-base); border: 1px solid var(--color-border); color: var(--color-text-primary); padding: 0.5em; border-radius: var(--radius-sm); font-size: 0.8125em; }
    #cfob-root .config-input:focus { outline: none; border-color: var(--color-accent); }
    #cfob-root .config-paths-textarea { font-family: var(--font-mono); resize: vertical; height: 3.75em; font-size: 0.75em; }
    
    /* Streamlined Options Popover Menu */
    #cfob-root .popover-menu { 
      position: fixed; 
      background: var(--color-bg-popover); 
      border: 1px solid var(--color-border); 
      border-radius: var(--radius-lg); 
      box-shadow: 0 0.625em 1.5625em rgba(0,0,0,0.6); 
      padding: 0.5em; 
      z-index: var(--z-popover); 
      display: flex; 
      flex-direction: column; 
      gap: 0.5em; 
      min-width: 15em; 
      max-width: 20em; 
    }
    #cfob-root .popover-section { 
      display: flex; 
      flex-direction: column; 
      gap: 0.25em; 
      border-bottom: 1px solid var(--color-border-light); 
      padding-bottom: 0.375em; 
    }
    #cfob-root .popover-section:last-child { 
      border-bottom: none; 
      padding-bottom: 0; 
    }
    #cfob-root .popover-header { 
      font-size: 0.625em; 
      font-weight: 700; 
      color: var(--color-text-muted); 
      padding: 0.125em 0.25em; 
      text-transform: uppercase; 
      letter-spacing: 0.5px; 
    }
    #cfob-root .popover-row { 
      display: flex; 
      align-items: center; 
      justify-content: space-between; 
      gap: 0.5em; 
      padding: 0.25em 0.375em; 
      font-size: 0.75em; 
      color: var(--color-text-primary); 
    }
    #cfob-root .popover-item { 
      padding: 0.375em 0.625em; 
      font-size: 0.75em; 
      color: var(--color-text-inverse); 
      background: transparent; 
      border: none; 
      text-align: left; 
      border-radius: var(--radius-sm); 
      cursor: pointer; 
      display: flex; 
      align-items: center; 
      justify-content: space-between; 
      width: 100%; 
      transition: background 0.15s; 
    }
    #cfob-root .popover-item:hover { background: var(--color-bg-panel-hover); color: var(--color-accent); }
    
    #cfob-root .popover-view-toggles { 
      display: flex; 
      background: var(--color-bg-base); 
      border: 1px solid var(--color-border); 
      border-radius: var(--radius-md); 
      overflow: hidden; 
      width: 100%; 
    }
    #cfob-root .popover-view-toggles .view-btn { 
      flex: 1; 
      background: transparent; 
      color: var(--color-text-muted); 
      border: none; 
      padding: 0.375em 0.5em; 
      cursor: pointer; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      gap: 0.375em; 
      font-size: 0.75em; 
      transition: all 0.15s; 
      border-right: 1px solid var(--color-border); 
    }
    #cfob-root .popover-view-toggles .view-btn:last-child { border-right: none; }
    #cfob-root .popover-view-toggles .view-btn:hover, 
    #cfob-root .popover-view-toggles .view-btn.active { 
      background: var(--color-bg-panel-hover); 
      color: var(--color-accent); 
    }

    #cfob-root .popover-slider-container { display: flex; align-items: center; gap: 0.5em; width: 100%; }
    #cfob-root .popover-slider { flex: 1; accent-color: var(--color-accent); cursor: pointer; height: 0.25em; }
    #cfob-root .popover-select { background: var(--color-bg-base); border: 1px solid var(--color-border); color: var(--color-text-primary); border-radius: var(--radius-sm); padding: 0.2em 0.4em; font-size: 0.75em; outline: none; }

    /* Tabs */
    #cfob-root .tabs { display: flex; border-bottom: 1px solid var(--color-border); gap: 0.125em; }
    #cfob-root .tab { padding: 0.5em 1em; cursor: pointer; background: var(--color-bg-base); border-radius: var(--radius-md) var(--radius-md) 0 0; font-size: 0.8125em; }
    #cfob-root .tab.active { background: var(--color-accent); color: var(--color-text-inverse); }
    #cfob-root .tab-content { display: none; padding-top: 0.625em; }
    #cfob-root .tab-content.active { display: block; }
    
    /* Empty State & Toast */
    #cfob-root .empty-state { text-align: center; padding: 5em 1.25em; color: var(--color-text-muted); }
    #cfob-root .empty-state svg { width: 4em; height: 4em; margin-bottom: 1em; stroke: var(--color-bg-panel-active); }
    
    #cfob-root .toast { 
      position: fixed; bottom: 1.25em; right: 1.25em; 
      background: var(--color-accent); color: var(--color-text-inverse); 
      padding: 0.625em 1em; border-radius: var(--radius-md); 
      font-size: 0.8125em; font-weight: 500; 
      box-shadow: 0 0.25em 0.75em rgba(0,0,0,0.3); 
      z-index: var(--z-toast); opacity: 0; transform: translateY(0.625em); 
      transition: all 0.2s ease; pointer-events: none; 
    }
    #cfob-root .toast.show { opacity: 1; transform: translateY(0); }

    /* =========================================================
       7. FULL VIEW LAYOUT
       ========================================================= */
    #cfob-root #fullViewModal { padding: 0; z-index: var(--z-modal); }
    #cfob-root .full-view-layout { display: flex; width: 100vw; height: 100vh; background: var(--color-bg-full); }
    #cfob-root .full-view-layout .field-value { max-height: 100%; resize: vertical; }
    
    #cfob-root .full-view-main { flex: 1; position: relative; display: flex; justify-content: center; align-items: center; overflow: hidden; }
    #cfob-root .full-view-main img { max-width: 100%; max-height: 100%; object-fit: contain; }
    
    #cfob-root .full-view-top-bar { 
      position: absolute; top: 0; left: 0; right: 0; 
      padding: 0.9375em 1.5625em; 
      background: linear-gradient(rgba(0,0,0,0.8), transparent); 
      display: flex; justify-content: space-between; align-items: center; 
      color: var(--color-text-inverse); z-index: 10; 
    }
    
    #cfob-root .full-view-actions { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5em; width: 100%; }
    #cfob-root .full-view-actions .btn { justify-content: center; font-size: 0.6875em; padding: 0.375em 0.5em; }
    
    #cfob-root .nav-btn { position: absolute; top: 50%; transform: translateY(-50%); background: rgba(0,0,0,0.4); color: white; border: none; padding: 1.25em 0.9375em; cursor: pointer; font-size: 1.5em; transition: 0.2s; z-index: 10; }
    #cfob-root .nav-btn:hover { background: rgba(0,0,0,0.9); }
    #cfob-root .prev-btn { left: 0; border-radius: 0 var(--radius-md) var(--radius-md) 0; }
    #cfob-root .next-btn { right: 0; border-radius: var(--radius-md) 0 0 var(--radius-md); }
    
    /* Sidebar size is controlled by external pixels for JS dragging compatibility, but contents scale */
    #cfob-root .full-view-sidebar { width: 360px; min-width: 360px; background: var(--color-bg-panel); border-left: 1px solid var(--color-border); display: flex; flex-direction: column; transition: all 0.3s; overflow: hidden; }
    #cfob-root .full-view-sidebar.collapsed { width: 0; min-width: 0; border-left: none; }
    
    #cfob-root .sidebar-header, #cfob-root .sidebar-footer { padding: 0.9375em 1.25em; background: var(--color-bg-header); }
    #cfob-root .sidebar-header { border-bottom: 1px solid var(--color-border); }
    #cfob-root .sidebar-footer { border-top: 1px solid var(--color-border); }
    #cfob-root .sidebar-body { padding: 1.25em; flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 0.75em; }

    /* Floating Launcher Button */
    #cfob-launcher-btn.floating { position: fixed; top: 0.25em; right: 2.8125em; z-index: 9998; background: var(--color-bg-panel); color: var(--color-text-inverse); border: 1px solid var(--color-border); border-radius: var(--radius-lg); width: 1.5em; height: 1.5em; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 0.25em 0.75em rgba(0,0,0,0.4); }
    #cfob-launcher-btn.floating:hover { background: var(--color-border); }

    /* =========================================================
       8. MEDIA QUERIES
       ========================================================= */
    @media (max-width: 1024px) {
      #cfob-root .btn span { display: none; }
      #cfob-root .full-view-actions { display: flex; justify-content: space-around; }
    }

    @media (max-width: 768px) {
      #cfob-root .top-bar { flex-direction: column; align-items: stretch; gap: 0.625em; }
      #cfob-root .logo-group { width: 100%; justify-content: space-between; }
      #cfob-root .actions-group { width: 100%; justify-content: stretch; gap: 0.5em; }
      #cfob-root .search-wrapper { max-width: none; width: 100%; order: -1; }
      
      #cfob-root .gallery-container { grid-template-columns: repeat(auto-fill, minmax(12.5em, 1fr)); }
      #cfob-root .gallery-container .image-card { flex-direction: column !important; }
      #cfob-root .gallery-container .image-card .card-preview { width: 100% !important; }
      
      #cfob-root .main-container .action-bar { padding: 0.3125em 0.625em; flex-wrap: wrap; justify-content: center; gap: 0.5em; }
      #cfob-root .nodes-grid { grid-template-columns: repeat(auto-fill, minmax(12.5em, 1fr)); }
      
      #cfob-root .full-view-layout { flex-direction: column; }
      #cfob-root .full-view-main { height: 50vh; min-height: 15.625em; }
      #cfob-root .full-view-sidebar { width: 100% !important; min-width: 100% !important; height: 50vh; border-left: none; border-top: 1px solid var(--color-border); }
      #cfob-root .full-view-sidebar.collapsed { height: 0; min-height: 0; border-top: none; }
      #cfob-root #cfobToggleSidebarBtn svg { transform: rotate(90deg); }
    }
`;

const ICONS = {
  close: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,
  config: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>`,
  copy: `<svg width="1em" height="1em" viewBox="0 0 24 24"><path fill="currentColor" d="M20 2H10c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2m0 12H10V4h10z"/><path fill="currentColor" d="M14 20H4V10h2V8H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2v-2h-2z"/></svg>`,
  check: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
  download: `<svg width="1em" height="1em" viewBox="0 0 24 24"><path fill="currentColor" d="M19 9h-4V3H9v6H5l7 7zM5 18v2h14v-2z" /></svg>`,
  drop: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>`,
  gridBig: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>`,
  gridSmall: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1"><rect x="3" y="3" width="4" height="4"></rect><rect x="10" y="3" width="4" height="4"></rect><rect x="17" y="3" width="4" height="4"></rect><rect x="3" y="10" width="4" height="4"></rect><rect x="10" y="10" width="4" height="4"></rect><rect x="17" y="10" width="4" height="4"></rect><rect x="3" y="17" width="4" height="4"></rect><rect x="10" y="17" width="4" height="4"></rect><rect x="17" y="17" width="4" height="4"></rect></svg>`,
  gridList: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>`,
  hidden: `<svg width="1em" height="1em" viewBox="0 0 24 24"><path fill="currentColor" d="M14.33 7.17A16 16 0 0 0 12 7c-4.97 0-9 2.239-9 5c0 1.44 1.096 2.738 2.85 3.65l2.362-2.362a4 4 0 0 1 5.076-5.076zm-3.1 8.756q.375.074.77.074a4 4 0 0 0 3.926-4.77l2.647-2.646C20.078 9.478 21 10.68 21 12c0 2.761-4.03 5-9 5q-.899 0-1.749-.094zm6.563-10.719a1 1 0 1 1 1.414 1.414L6.48 19.35a1 1 0 1 1-1.414-1.414z"/></svg>`,
  inspect: `<svg width="1em" height="1em" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linejoin="round" stroke-width="1.5"><path stroke-linecap="round" d="M17.5 17.5L22 22"/><path d="M20 11a9 9 0 1 0-18 0a9 9 0 0 0 18 0Z"/><path stroke-linecap="round" d="m14.5 9.5l.92.793c.387.333.58.5.58.707s-.193.374-.58.707l-.92.793m-7-3l-.92.793c-.387.333-.58.5-.58.707s.193.374.58.707l.92.793m4.5-4l-2 5"/></g></svg>`,
  logo: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>`,
  more: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="1.5"></circle><circle cx="12" cy="5" r="1.5"></circle><circle cx="12" cy="19" r="1.5"></circle></svg>`,
  move: `<svg width="1em" height="1em" viewBox="0 0 32 32"><path fill="currentColor" d="m18 13l-1.41 1.41L19.17 17H10v2h9.17l-2.58 2.59L18 23l5-5z"/><path fill="currentColor" d="m11.172 6l3.414 3.414l.586.586H28v16H4V6zm0-2H4a2 2 0 0 0-2 2v20a2 2 0 0 0 2 2h24a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2H16l-3.414-3.414A2 2 0 0 0 11.172 4"/></svg>`,
  pane: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="15" y1="3" x2="15" y2="21"></line></svg>`,
  picture: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>`,
  refresh: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>`,
  trash: `<svg width="1em" height="1em" viewBox="0 0 24 24"><path fill="currentColor" d="M5 20a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8h2V6h-4V4a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v2H3v2h2zM9 4h6v2H9zM8 8h9v12H7V8z"/><path fill="currentColor" d="M9 10h2v8H9zm4 0h2v8h-2z"/></svg>`,
  toggle: `<svg class="toggle-icon" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>`,
  workflow: `<svg width="1em" height="1em" viewBox="0 0 24 24"><path fill="currentColor" d="M9 10c.55 0 1-.45 1-1V7h4.14c.45 1.72 2 3 3.86 3c2.21 0 4-1.79 4-4s-1.79-4-4-4c-1.86 0-3.41 1.28-3.86 3H10V3c0-.55-.45-1-1-1H3c-.55 0-1 .45-1 1v6c0 .55.45 1 1 1h2v4.09L1.79 17.3a.996.996 0 0 0 0 1.41l3.5 3.5c.2.2.45.29.71.29s.51-.1.71-.29L9.92 19h4.09v2c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-6c0-.55-.45-1-1-1h-6c-.55 0-1 .45-1 1v2H9.92l-2.91-2.91V10h2Zm9-6c1.1 0 2 .9 2 2s-.9 2-2 2s-2-.9-2-2s.9-2 2-2m-2 12h4v4h-4zM6 20.09L3.91 18L6 15.91L8.09 18zM4 4h4v4H4z"/></svg>`,
};

const BROWSER_HTML = `
<div id="cfob-resizer"></div>
<div class="top-bar">
  <div class="logo-group">${ICONS.logo}<h1>ComfyUI Output Browser</h1>
  <span id="cfobImageCount"></span>
  </div>
  <div class="actions-group">
    <div class="search-wrapper">
      <input type="text" id="cfobSearchInput" class="search-input" placeholder="cat dog, tree !blue (AND / OR / NOT)">
      <button id="cfobClearSearchBtn" class="search-clear-btn" title="Clear search">${ICONS.close}</button>
    </div>
    <button class="btn" id="cfobRefreshBtn" title="Sync outputs from Server">${ICONS.refresh}<span>Refresh</span></button>
    <button class="btn" id="cfobLocalFilesBtn" title="Manually inspect other files">${ICONS.picture}<span>+ PNGs</span></button>
    <button class="btn" id="cfobMenuBtn" title="Options">${ICONS.more}</button>
    <button class="btn btn-danger" id="cfobCloseBrowserBtn">${ICONS.close}<span>Close</span></button>
    <input type="file" id="cfobFilesInput" accept="image/png" multiple style="display: none;">
  </div>
</div>
<div class="main-container" id="cfobMainContainer">
  <div class="drop-overlay">${ICONS.drop}<h3 style="margin: 0.625em 0 0 0; color: var(--color-text-inverse);">Drop PNGs Here</h3></div>
  <div class="gallery-container view-grid" id="cfobGalleryGrid"></div>
  <div class="empty-state" id="cfobEmptyState">
    ${ICONS.picture}
    <h3 id="cfobEmptyStateTitle">No Images Loaded</h3><p id="cfobEmptyStateDesc">Click Refresh to load ComfyUI outputs, or drop PNGs anywhere to inspect.</p>
  </div>
  
  <div id="cfobActionBar" class="action-bar">
    <span id="cfobSelectionCount" style="font-weight: 600; color: var(--color-text-inverse); min-width: 5em;">1 selected</span>
    <div style="width: 1px; height: 1.25em; background: var(--color-border);"></div>
    <button class="btn btn-primary" id="cfobActionOpen">${ICONS.workflow}<span>Load Workflow</span></button>
    <button class="btn" id="cfobActionInspect">${ICONS.inspect}<span>Inspect Nodes</span></button>
    <button class="btn" id="cfobActionDownload">${ICONS.download}<span>Download</span></button>
    <button class="btn" id="cfobActionRename">${ICONS.move}<span>Move/Rename</span></button>
    <button class="btn btn-danger" id="cfobActionDelete">${ICONS.trash}<span>Delete</span></button>
    <div style="width: 1px; height: 1.25em; background: var(--color-border);"></div>
    <button class="icon-btn" id="cfobActionClear" title="Clear Selection">${ICONS.close}</button>
  </div>
</div>
<div class="modal-overlay" id="cfobConfigModal">
  <div class="modal-content">
    <div class="modal-header">${ICONS.pane}<h3>Customize Image Details Card Fields</h3><button class="icon-btn" id="cfobCloseConfigBtn">${ICONS.close}</button></div>
    <div class="modal-body"><p style="font-size: 0.8125em; color: var(--color-text-muted); margin: 0;">Define custom card fields. Enter fallback paths separated by commas or newlines. <br><em>Syntax examples: <code>Positive Prompt.text</code>, <code>KSampler.seed</code>, <code>6.inputs.text</code></em></p>
      <div id="cfobConfigFieldsList" style="display: flex; flex-direction: column; gap: 0.75em;"></div>
      <button class="btn" id="cfobAddFieldBtn" style="align-self: flex-start;">+ Add Custom Field</button>
    </div>
    <div class="modal-footer"><button class="btn btn-danger" id="cfobResetConfigBtn">Reset Defaults</button><button class="btn btn-primary" id="cfobSaveConfigBtn">Save & Apply</button></div>
  </div>
</div>
<div class="modal-overlay" id="cfobInspectorModal">
  <div class="modal-content">
    <div class="modal-header">${ICONS.inspect}<h3 id="cfobInspectorTitle">Image Metadata Inspector</h3><button class="icon-btn" id="cfobCloseInspectorBtn">${ICONS.close}</button></div>
    <div class="modal-body">
      <div class="tabs" id="cfobInspectorTabs">
      <div class="tab active" data-target="cfobInsNodes">Visual Nodes View</div><div class="tab" data-target="cfobInsPrompt">API Prompt (JSON)</div><div class="tab" data-target="cfobInsWorkflow">UI Workflow (JSON)</div>
      </div>
      <div class="tab-content active" id="cfobInsNodes"><div class="nodes-grid" id="cfobInsNodesGrid"></div></div>
      <div class="tab-content" id="cfobInsPrompt"><textarea id="cfobInsPromptText" style="width: 100%; height: 30em; background: var(--color-bg-input); color: var(--color-syntax-string); font-family: var(--font-mono); border: 1px solid var(--color-border); padding: 0.75em; border-radius: var(--radius-md);" readonly></textarea></div>
      <div class="tab-content" id="cfobInsWorkflow"><textarea id="cfobInsWorkflowText" style="width: 100%; height: 30em; background: var(--color-bg-input); color: var(--color-syntax-key); font-family: var(--font-mono); border: 1px solid var(--color-border); padding: 0.75em; border-radius: var(--radius-md);" readonly></textarea></div>
    </div>
  </div>
</div>
<div class="modal-overlay" id="cfobFullViewModal">
  <div class="full-view-layout">
    <div class="full-view-main">
      <div class="full-view-top-bar"><span id="cfobFullViewCount" style="font-weight: 600; font-size: 0.875em;">1 / 10</span><div style="display: flex; gap: 0.5em;"><button class="icon-btn" id="cfobToggleSidebarBtn" title="Toggle Details Pane">${ICONS.pane}</button><button class="icon-btn" id="cfobCloseFullViewBtn" title="Close (Esc)">${ICONS.close}</button></div></div>
      <button class="nav-btn prev-btn" id="cfobPrevImgBtn" title="Previous (Left Arrow)">❮</button>
      <img id="cfobFullViewImg" src="" alt="Full View">
      <button class="nav-btn next-btn" id="cfobNextImgBtn" title="Next (Right Arrow)">❯</button>
    </div>
    <div class="full-view-sidebar" id="cfobFullViewSidebar">
      <div class="sidebar-header"><h4 id="cfobFullViewTitle" style="margin: 0; font-size: 0.875em; color: var(--color-text-inverse); word-break: break-all;">Filename.png</h4></div>
      <div class="sidebar-body" id="cfobFullViewFields"></div>
      <div class="sidebar-footer">
        <div class="full-view-actions" id="cfobFullViewActions">
          <button class="btn btn-primary" id="cfobFVActionOpen">${ICONS.workflow}<span>Workflow</span></button>
          <button class="btn" id="cfobFVActionInspect">${ICONS.inspect}<span>Inspect</span></button>
          <button class="btn" id="cfobFVActionDownload">${ICONS.download}<span>Download</span></button>
          <button class="btn" id="cfobFVActionRename">${ICONS.move}<span>Move/Rename</span></button>
          <button class="btn btn-danger" id="cfobFVActionDelete">${ICONS.trash}<span>Delete</span></button>
        </div>
      </div>
    </div>
  </div>
</div>
<div class="modal-overlay" id="cfobHiddenFoldersModal">
  <div class="modal-content">
    <div class="modal-header">
      ${ICONS.hidden}
      <h3>Configure Hidden Folders</h3>
      <button class="icon-btn" id="cfobCloseHiddenFoldersBtn">${ICONS.close}</button>
    </div>
    <div class="modal-body">
      <p style="font-size: 0.8125em; color: var(--color-text-muted); margin: 0;">
        Specify folder names or path keywords to hide (one per line or comma-separated). Folders starting with <code>.</code> (e.g. <code>.cache</code>) are automatically hidden when hidden folders are toggled off.
      </p>
      <textarea id="cfobHiddenFoldersInput" class="config-paths-textarea" style="height: 8.75em; width: 100%;" placeholder="temp&#10;trash&#10;drafts"></textarea>
    </div>
    <div class="modal-footer">
      <button class="btn btn-danger" id="cfobResetHiddenFoldersBtn">Reset Defaults</button>
      <button class="btn btn-primary" id="cfobSaveHiddenFoldersBtn">Save & Apply</button>
    </div>
  </div>
</div>
<div class="toast" id="cfobToastNotice"></div>
`;

const DEFAULT_FIELDS = [
  { label: "Positive Prompt", paths: "Positive Prompt.text, CLIPTextEncode.text, 6.inputs.text, Preset Gallery.evaluated_preset" },
  { label: "Negative Prompt", paths: "Negative Prompt.text, CLIPTextEncode[1].text, 7.inputs.text" },
  { label: "Seed", paths: "KSampler.seed, KSamplerAdvanced.seed, 3.inputs.seed" },
  { label: "Steps / CFG", paths: "KSampler.steps, KSamplerAdvanced.steps" },
  { label: "Sampler", paths: "KSampler.sampler_name, KSamplerAdvanced.sampler_name" },
  { label: "Model", paths: "CheckpointLoaderSimple.ckpt_name, DualCLIPLoader.ckpt_name, 4.inputs.ckpt_name, UNETLoader.unet_name" }
];

class ComfyOutputBrowser {
  constructor() {
    this.loadedImages = [];
    this.filteredImages = [];
    this.selectedImages = new Set();
    this.lastSelectedIdx = -1;
    this.activePopover = null;
    this.currentImageIndex = 0;
    this.fieldConfigs = this.loadConfig();
    this.currentSort = localStorage.getItem('cfob_sort') || 'default';
    this.serverOrder = [];
    this.hiddenFolders = this.loadHiddenFoldersConfig();
    this.showHiddenFolders = localStorage.getItem('comfy_folder_browser_show_hidden') === 'true';
    this.observer = null;
    this.browserMode = localStorage.getItem('comfy_folder_browser_mode') || 'full';
    this.sidebarWidth = parseInt(localStorage.getItem('comfy_folder_browser_width')) || 450;
    this.sidebarHeight = parseInt(localStorage.getItem('comfy_folder_browser_height')) || 350;
    this.autoHide = localStorage.getItem('comfy_folder_browser_auto_hide') === 'true';
    this.gridSize = parseInt(localStorage.getItem('cfob_grid_size')) || 380;
    this.scrollDir = localStorage.getItem('cfob_scroll_dir') || 'vertical';
    this.uiScale = parseFloat(localStorage.getItem('cfob_ui_scale')) || 1.0;
    this.dbPromise = this.initDB();
    this._idleParsingActive = false;
    this.isUiVisible = false;
  }

  $(id) { return this.root.querySelector(`#${id}`); }

  async initDB() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open('CfobCacheDB', 1);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata');
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async cacheGet(key) {
    try {
      const db = await this.dbPromise;
      return new Promise(resolve => {
        const tx = db.transaction('metadata', 'readonly');
        const req = tx.objectStore('metadata').get(key);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(null);
      });
    } catch (e) { return null; }
  }

  async cacheSet(key, val) {
    try {
      const db = await this.dbPromise;
      return new Promise(resolve => {
        const tx = db.transaction('metadata', 'readwrite');
        tx.objectStore('metadata').put(val, key);
        tx.oncomplete = () => resolve();
      });
    } catch (e) { }
  }

  async cacheDelete(key) {
    try {
      const db = await this.dbPromise;
      return new Promise(resolve => {
        const tx = db.transaction('metadata', 'readwrite');
        tx.objectStore('metadata').delete(key);
        tx.oncomplete = () => resolve();
      });
    } catch (e) { }
  }

  loadConfig() {
    const saved = localStorage.getItem('comfy_folder_browser_fields');
    return saved ? JSON.parse(saved) : JSON.parse(JSON.stringify(DEFAULT_FIELDS));
  }

  saveConfig(cfg) {
    this.fieldConfigs = cfg;
    localStorage.setItem('comfy_folder_browser_fields', JSON.stringify(cfg));
  }

  loadHiddenFoldersConfig() {
    const saved = localStorage.getItem('comfy_folder_browser_hidden_folders');
    return saved ? JSON.parse(saved) : ["temp", "trash"];
  }

  saveHiddenFoldersConfig(folders) {
    this.hiddenFolders = folders;
    localStorage.setItem('comfy_folder_browser_hidden_folders', JSON.stringify(folders));
  }

  setUiScale(scale) {
    this.uiScale = Math.max(0.7, Math.min(1.5, parseFloat(scale) || 1.0));
    localStorage.setItem('cfob_ui_scale', this.uiScale);
    this.root.style.setProperty('--cfob-scale', this.uiScale);
  }

  isImageInHiddenFolder(relPath) {
    const parts = relPath.replace(/\\/g, '/').split('/');
    parts.pop();

    for (const folder of parts) {
      if (!folder) continue;
      if (folder.startsWith('.')) return true;
      for (const pat of this.hiddenFolders) {
        const cleanPat = pat.trim().toLowerCase();
        if (cleanPat && (folder.toLowerCase() === cleanPat || relPath.toLowerCase().includes(cleanPat))) {
          return true;
        }
      }
    }
    return false;
  }

  getImageUrl(relPath) {
    const parts = relPath.replace(/\\/g, '/').split('/');
    const filename = parts.pop();
    const subfolder = parts.join('/');
    let url = `/view?filename=${encodeURIComponent(filename)}&type=output`;
    if (subfolder) {
      url += `&subfolder=${encodeURIComponent(subfolder)}`;
    }
    return url;
  }

  init() {
    const style = document.createElement("style");
    style.innerHTML = BROWSER_CSS;
    document.head.appendChild(style);

    this.root = document.createElement("div");
    this.root.id = "cfob-root";
    this.root.innerHTML = BROWSER_HTML;
    document.body.appendChild(this.root);

    this.setUiScale(this.uiScale);
    this.injectMenuButton();
    this.bindEvents();

    const savedView = localStorage.getItem('comfy_folder_browser_view') || 'grid';
    this.setViewMode(savedView);

    this.setBrowserMode(this.browserMode);
    this.root.style.setProperty('--grid-size', `${this.gridSize}px`);
    this.root.style.setProperty('--compact-size', `${Math.max(120, this.gridSize - 180)}px`);
    if (this.scrollDir === 'horizontal') {
      this.$("cfobMainContainer").classList.add('scroll-horizontal');
    }
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const card = entry.target;
          const idx = card.dataset.index;
          const img = this.loadedImages[idx];
          if (img && !img.isParsed) {
            this.loadMetadata(img).then(() => {
              const cardBody = card.querySelector('.card-body');
              if (cardBody) {
                cardBody.innerHTML = this.getCardFieldsHtml(img);
              }
            });
            this.observer.unobserve(card);
          }
        }
      });
    }, { root: this.$("cfobMainContainer"), rootMargin: "200px" });
  }

  setBrowserMode(mode) {
    this.browserMode = mode;
    localStorage.setItem('comfy_folder_browser_mode', mode);
    this.root.classList.remove('mode-full', 'mode-right', 'mode-left', 'mode-down', 'mode-up');
    this.root.classList.add(`mode-${mode}`);

    this.root.style.width = '';
    this.root.style.height = '';

    if (mode === 'right' || mode === 'left') {
      this.root.style.width = `${this.sidebarWidth}px`;
    } else if (mode === 'up' || mode === 'down') {
      this.root.style.height = `${this.sidebarHeight}px`;
    }
  }

  updateSidebarSize(width, height) {
    if (width !== null) {
      this.sidebarWidth = Math.max(250, Math.min(width, window.innerWidth - 100));
      this.root.style.width = `${this.sidebarWidth}px`;
    }
    if (height !== null) {
      this.sidebarHeight = Math.max(200, Math.min(height, window.innerHeight - 100));
      this.root.style.height = `${this.sidebarHeight}px`;
    }
  }

  showWithTransition() {
    clearTimeout(this.transitionTimer);
    this.root.style.display = 'flex';
    void this.root.offsetWidth;
    this.root.classList.remove('cfob-hidden');
    this.isUiVisible = true;
  }

  hideWithTransition() {
    this.root.classList.add('cfob-hidden');
    clearTimeout(this.transitionTimer);
    this.transitionTimer = setTimeout(() => {
      if (this.root.classList.contains('cfob-hidden')) {
        this.root.style.display = 'none';
        this.isUiVisible = false;
      }
    }, 250);
  }

  injectMenuButton() {
    const updateButtonPlacement = (isAppMode = false) => {
      let menuBtn = document.getElementById("cfob-launcher-btn");
      if (!menuBtn) {
        menuBtn = document.createElement("button");
        menuBtn.id = "cfob-launcher-btn";
        menuBtn.innerHTML = ICONS.logo;
        menuBtn.title = "Browse Outputs";
        menuBtn.onclick = () => {
          if (!this.isUiVisible) {
            this.fetchServerImages();
            this.showWithTransition();
          } else {
            this.hideWithTransition();
          }
        };
      }
      if (isAppMode) {
        menuBtn.className = "floating";
        document.body.appendChild(menuBtn);
      } else {
        const standardMenuTarget = app.menu?.actionsGroup?.element || app.menu?.settingsGroup?.element || document.querySelector(".comfy-menu");
        menuBtn.className = "bg-secondary-background border-none hover:bg-secondary-background-hover inline-flex items-center justify-center size-8";
        menuBtn.style.border = "4px";
        standardMenuTarget?.appendChild(menuBtn);
      }
    };

    updateButtonPlacement();

    const observer = new MutationObserver(() => {
      const isAppMode = document.getElementById('graph-canvas-container')?.style.display === 'none';
      updateButtonPlacement(isAppMode);
    });
    const canvasCont = document.getElementById('graph-canvas-container');
    if (canvasCont) {
      observer.observe(canvasCont, { attributes: true });
    }
  }

  bindEvents() {
    this.$("cfobCloseBrowserBtn").addEventListener('click', () => this.hideWithTransition());
    this.$("cfobRefreshBtn").addEventListener('click', () => this.fetchServerImages());
    this.$("cfobLocalFilesBtn").addEventListener('click', () => this.$("cfobFilesInput").click());
    this.$("cfobMenuBtn").addEventListener('click', (e) => this.toggleOptionsMenu(e));
    this.$("cfobFilesInput").addEventListener('change', (e) => this.handleLocalFiles(e.target.files));
    this.$("cfobSearchInput").addEventListener('input', () => this.filterGallery());

    this.$("cfobClearSearchBtn").addEventListener('click', () => {
      this.$("cfobSearchInput").value = "";
      this.filterGallery();
    });

    this.$("cfobFullViewFields").addEventListener('click', (e) => {
      const btn = e.target.closest('.copy-val-btn');
      if (btn) {
        e.stopPropagation();
        this.copyValue(btn, btn.dataset.val);
      }
    });

    this.$("cfobActionClear").addEventListener('click', () => this.clearSelection());
    this.$("cfobActionDelete").addEventListener('click', () => this.deleteSelected());
    this.$("cfobActionRename").addEventListener('click', () => this.renameSelected());
    this.$("cfobActionDownload").addEventListener('click', () => this.downloadSelected());
    this.$("cfobActionOpen").addEventListener('click', () => this.loadWorkflowSelected());
    this.$("cfobActionInspect").addEventListener('click', () => this.inspectSelected());

    const mainCont = this.$("cfobMainContainer");
    let dragCounter = 0;
    mainCont.addEventListener('dragenter', (e) => {
      e.preventDefault(); dragCounter++;
      mainCont.classList.add('dragover');
    });
    mainCont.addEventListener('dragover', (e) => {
      e.preventDefault();
    });
    mainCont.addEventListener('dragleave', (e) => {
      e.preventDefault();
      dragCounter--;
      if (dragCounter <= 0) {
        dragCounter = 0;
        mainCont.classList.remove('dragover');
      }
    });
    mainCont.addEventListener('drop', (e) => {
      e.preventDefault();
      dragCounter = 0;
      mainCont.classList.remove('dragover');
      if (e.dataTransfer.files.length) this.handleLocalFiles(e.dataTransfer.files);
    });

    document.addEventListener('click', (e) => {
      if (this.activePopover && !this.activePopover.contains(e.target) && !e.target.closest('#cfobMenuBtn')) {
        this.activePopover.remove();
        this.activePopover = null;
      }
    });

    document.addEventListener('keydown', (e) => {
      const fvModal = this.$("cfobFullViewModal");
      const configModal = this.$("cfobConfigModal");
      const inspectorModal = this.$("cfobInspectorModal");
      const hiddenModal = this.$("cfobHiddenFoldersModal");

      if (fvModal.classList.contains('active')) {
        if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); this.closeFullView(); }
        else if (e.key === 'ArrowLeft') { e.preventDefault(); e.stopPropagation(); this.navigateImage(-1); }
        else if (e.key === 'ArrowRight') { e.preventDefault(); e.stopPropagation(); this.navigateImage(1); }
      } else if (this.root.style.display === "flex") {
        const target = e.target;
        const isEditing = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
          const noModalOpen = !configModal.classList.contains('active') &&
            !inspectorModal.classList.contains('active') &&
            !hiddenModal.classList.contains('active');
          if (!isEditing && noModalOpen) {
            e.preventDefault();
            e.stopPropagation();
            this.selectAllFiltered();
          }
        } else if (e.key === 'Escape') {
          e.stopPropagation();
          if (configModal.classList.contains('active')) configModal.classList.remove('active');
          else if (inspectorModal.classList.contains('active')) inspectorModal.classList.remove('active');
          else if (hiddenModal.classList.contains('active')) hiddenModal.classList.remove('active');
          else if (this.selectedImages.size > 0) this.clearSelection();
          else this.root.style.display = "none";
        }
      }
    }, { capture: true });

    this.$("cfobCloseConfigBtn").addEventListener('click', () => this.$("cfobConfigModal").classList.remove('active'));
    this.$("cfobAddFieldBtn").addEventListener('click', () => { this.fieldConfigs.push({ label: "Custom Field", paths: "" }); this.openConfigModal(); });
    this.$("cfobResetConfigBtn").addEventListener('click', () => { this.saveConfig(JSON.parse(JSON.stringify(DEFAULT_FIELDS))); this.openConfigModal(); });
    this.$("cfobSaveConfigBtn").addEventListener('click', () => {
      const newCfgs = [];
      this.$("cfobConfigFieldsList").querySelectorAll('.config-field-item').forEach(item => {
        const l = item.querySelector('.field-label-input').value.trim(), p = item.querySelector('.field-paths-input').value.trim();
        if (l) newCfgs.push({ label: l, paths: p });
      });
      this.saveConfig(newCfgs);
      this.$("cfobConfigModal").classList.remove('active');
      this.renderGallery();
    });

    this.$("cfobCloseInspectorBtn").addEventListener('click', () => this.$("cfobInspectorModal").classList.remove('active'));
    this.root.querySelectorAll('#cfobInspectorTabs .tab').forEach(tab => {
      tab.addEventListener('click', () => {
        this.root.querySelectorAll('#cfobInspectorTabs .tab').forEach(t => t.classList.remove('active'));
        this.root.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        this.$(tab.dataset.target).classList.add('active');
      });
    });

    this.$("cfobCloseHiddenFoldersBtn").addEventListener('click', () => this.$("cfobHiddenFoldersModal").classList.remove('active'));
    this.$("cfobResetHiddenFoldersBtn").addEventListener('click', () => {
      this.saveHiddenFoldersConfig(["temp", "trash"]);
      this.openHiddenFoldersModal();
    });
    this.$("cfobSaveHiddenFoldersBtn").addEventListener('click', () => {
      const val = this.$("cfobHiddenFoldersInput").value;
      const list = val.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
      this.saveHiddenFoldersConfig(list);
      this.$("cfobHiddenFoldersModal").classList.remove('active');
      this.filterGallery();
      this.showToast("Saved hidden folders configuration");
    });

    this.$("cfobCloseFullViewBtn").addEventListener('click', () => this.closeFullView());
    this.$("cfobToggleSidebarBtn").addEventListener('click', () => this.$("cfobFullViewSidebar").classList.toggle('collapsed'));
    this.$("cfobPrevImgBtn").addEventListener('click', () => this.navigateImage(-1));
    this.$("cfobNextImgBtn").addEventListener('click', () => this.navigateImage(1));

    let touchStartX = 0;
    let touchEndX = 0;
    const fvModal = this.$("cfobFullViewModal");
    const fvMain = this.root.querySelector('.full-view-main');

    fvMain.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    fvMain.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;

      if (fvModal.classList.contains('active')) {
        const swipeDistance = touchStartX - touchEndX;
        const minSwipeDistance = 50;

        if (swipeDistance > minSwipeDistance) {
          this.navigateImage(1);
        } else if (swipeDistance < -minSwipeDistance) {
          this.navigateImage(-1);
        }
      }
    }, { passive: true });

    this.$("cfobFVActionOpen").addEventListener('click', () => {
      const img = this.filteredImages[this.currentImageIndex];
      if (img) this.loadWorkflowImage(img);
    });
    this.$("cfobFVActionInspect").addEventListener('click', () => {
      const img = this.filteredImages[this.currentImageIndex];
      if (img) {
        this.closeFullView();
        this.openInspector(this.loadedImages.indexOf(img));
      }
    });
    this.$("cfobFVActionDownload").addEventListener('click', () => {
      const img = this.filteredImages[this.currentImageIndex];
      if (img) {
        const a = document.createElement('a');
        a.href = img.url;
        a.download = img.name.split('/').pop();
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    });
    this.$("cfobFVActionRename").addEventListener('click', () => this.renameFullViewImage());
    this.$("cfobFVActionDelete").addEventListener('click', () => this.deleteFullViewImage());

    const resizer = this.$("cfob-resizer");
    let isResizing = false;
    let startX, startY, startWidth, startHeight;

    resizer.addEventListener('mousedown', (e) => {
      isResizing = true;
      startX = e.clientX;
      startY = e.clientY;
      startWidth = this.sidebarWidth;
      startHeight = this.sidebarHeight;
      resizer.classList.add('dragging');
      document.body.style.userSelect = 'none';
    });

    window.addEventListener('mousemove', (e) => {
      if (!isResizing) return;
      if (this.browserMode === 'right') {
        this.updateSidebarSize(startWidth - (e.clientX - startX), null);
      } else if (this.browserMode === 'left') {
        this.updateSidebarSize(startWidth + (e.clientX - startX), null);
      } else if (this.browserMode === 'down') {
        this.updateSidebarSize(null, startHeight - (e.clientY - startY));
      } else if (this.browserMode === 'up') {
        this.updateSidebarSize(null, startHeight + (e.clientY - startY));
      }
    });

    window.addEventListener('mouseup', () => {
      if (isResizing) {
        isResizing = false;
        resizer.classList.remove('dragging');
        document.body.style.userSelect = '';
        localStorage.setItem('comfy_folder_browser_width', this.sidebarWidth);
        localStorage.setItem('comfy_folder_browser_height', this.sidebarHeight);
      }
    });

    let autoHideTimer = null;
    let autoShowTimer = null;

    document.addEventListener('mousedown', (e) => {
      const isOpen = this.root.style.display === 'flex' && !this.root.classList.contains('cfob-hidden');

      if (this.autoHide && isOpen) {
        const isOutsideRoot = !this.root.contains(e.target);
        const isOutsidePopover = !(this.activePopover && this.activePopover.contains(e.target));

        if (isOutsideRoot && isOutsidePopover) {
          const isToggleButton = e.target.closest('#cfob-launcher-btn') || e.target.closest('button[id*="browser"]');
          if (!isToggleButton) {
            this.hideWithTransition();
          }
        }
      }
    });

    this.root.addEventListener('mouseleave', () => {
      if (this.autoHide && this.browserMode !== 'full') {
        autoHideTimer = setTimeout(() => {
          this.hideWithTransition();
        }, 350);
      }
    });

    this.root.addEventListener('mouseenter', () => {
      clearTimeout(autoHideTimer);
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.autoHide || this.browserMode === 'full') return;

      const isClosed = this.root.style.display === 'none' || this.root.classList.contains('cfob-hidden');
      if (!isClosed) return;

      const edgeThreshold = 15;
      let hitEdge = false;

      if (this.browserMode === 'left' && e.clientX <= edgeThreshold) hitEdge = true;
      else if (this.browserMode === 'right' && e.clientX >= window.innerWidth - edgeThreshold) hitEdge = true;
      else if (this.browserMode === 'up' && e.clientY <= edgeThreshold) hitEdge = true;
      else if (this.browserMode === 'down' && e.clientY >= window.innerHeight - edgeThreshold) hitEdge = true;

      if (hitEdge) {
        if (!autoShowTimer) {
          autoShowTimer = setTimeout(() => {
            this.showWithTransition();
            autoShowTimer = null;
          }, 300);
        }
      } else {
        clearTimeout(autoShowTimer);
        autoShowTimer = null;
      }
    });
  }

  showToast(msg) {
    const t = this.$("cfobToastNotice");
    t.innerText = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2000);
  }

  getViewMode() {
    const grid = this.$("cfobGalleryGrid");
    if (!grid) return 'grid';
    if (grid.classList.contains('view-compact')) return 'compact';
    if (grid.classList.contains('view-list')) return 'list';
    return 'grid';
  }

  setViewMode(mode) {
    const grid = this.$("cfobGalleryGrid");
    if (grid) {
      grid.className = `gallery-container view-${mode}`;
    }
    localStorage.setItem('comfy_folder_browser_view', mode);
  }

  toggleOptionsMenu(e) {
    if (this.activePopover) {
      this.activePopover.remove();
      this.activePopover = null;
      return;
    }

    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const popover = document.createElement('div');
    popover.className = 'popover-menu';

    const currentView = this.getViewMode();

    popover.innerHTML = `
      <div class="popover-section">
        <div class="popover-header">View Mode</div>
        <div class="popover-view-toggles">
          <button class="view-btn ${currentView === 'compact' ? 'active' : ''}" data-view="compact" title="Compact Grid">${ICONS.gridSmall} Compact</button>
          <button class="view-btn ${currentView === 'grid' ? 'active' : ''}" data-view="grid" title="Standard Grid">${ICONS.gridBig} Grid</button>
          <button class="view-btn ${currentView === 'list' ? 'active' : ''}" data-view="list" title="List View">${ICONS.gridList} List</button>
        </div>
      </div>

      <div class="popover-section">
        <div class="popover-header">UI Scale</div>
        <div class="popover-row">
          <div class="popover-slider-container">
            <input type="range" class="popover-slider" id="cfobScaleSlider" min="0.7" max="1.4" step="0.05" value="${this.uiScale}">
            <span id="cfobScaleVal" style="font-size: 0.75em; font-weight: 600; min-width: 3em; text-align: right;">${Math.round(this.uiScale * 100)}%</span>
          </div>
        </div>
      </div>

      <div class="popover-section">
        <div class="popover-header">Layout & Navigation</div>
        <div class="popover-row">
          <span>Position</span>
          <select class="popover-select" id="cfobModeSelect">
            <option value="full" ${this.browserMode === 'full' ? 'selected' : ''}>Full Screen</option>
            <option value="right" ${this.browserMode === 'right' ? 'selected' : ''}>Right Drawer</option>
            <option value="left" ${this.browserMode === 'left' ? 'selected' : ''}>Left Drawer</option>
            <option value="down" ${this.browserMode === 'down' ? 'selected' : ''}>Bottom Drawer</option>
            <option value="up" ${this.browserMode === 'up' ? 'selected' : ''}>Top Drawer</option>
          </select>
        </div>
        <div class="popover-row">
          <span>Scroll Direction</span>
          <select class="popover-select" id="cfobScrollSelect">
            <option value="vertical" ${this.scrollDir === 'vertical' ? 'selected' : ''}>Vertical</option>
            <option value="horizontal" ${this.scrollDir === 'horizontal' ? 'selected' : ''}>Horizontal</option>
          </select>
        </div>
        <div class="popover-row">
          <span>Sort By</span>
          <select class="popover-select" id="cfobSortSelect">
            <option value="default" ${this.currentSort === 'default' ? 'selected' : ''}>Server Order</option>
            <option value="name_asc" ${this.currentSort === 'name_asc' ? 'selected' : ''}>Name (A-Z)</option>
            <option value="name_desc" ${this.currentSort === 'name_desc' ? 'selected' : ''}>Name (Z-A)</option>
          </select>
        </div>
      </div>

      <div class="popover-section">
        <div class="popover-header">Preferences</div>
        <button class="popover-item" id="cfobToggleHiddenBtn">
          <span>Hidden Folders</span>
          <span style="font-weight: 600; color: ${this.showHiddenFolders ? 'var(--color-success)' : 'var(--color-text-muted)'}">${this.showHiddenFolders ? 'Shown' : 'Hidden'}</span>
        </button>
        <button class="popover-item" id="cfobConfigHiddenBtn">
          <span>Configure Hidden Paths...</span>
        </button>
        <button class="popover-item" id="cfobConfigFieldsBtn">
          <span>Customize Card Fields...</span>
        </button>
        <button class="popover-item" id="cfobToggleAutoHideBtn">
          <span>Auto-Hide Panel</span>
          <span style="font-weight: 600; color: ${this.autoHide ? 'var(--color-success)' : 'var(--color-text-muted)'}">${this.autoHide ? 'On' : 'Off'}</span>
        </button>
      </div>
    `;

    popover.querySelectorAll('.view-btn').forEach(vBtn => {
      vBtn.addEventListener('click', (ev) => {
        const mode = ev.currentTarget.dataset.view;
        this.setViewMode(mode);
        popover.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
        ev.currentTarget.classList.add('active');
      });
    });

    const scaleSlider = popover.querySelector('#cfobScaleSlider');
    const scaleValDisplay = popover.querySelector('#cfobScaleVal');
    scaleSlider.addEventListener('input', (ev) => {
      const val = parseFloat(ev.target.value);
      this.setUiScale(val);
      scaleValDisplay.innerText = `${Math.round(val * 100)}%`;
    });

    popover.querySelector('#cfobModeSelect').addEventListener('change', (ev) => {
      this.setBrowserMode(ev.target.value);
    });

    popover.querySelector('#cfobScrollSelect').addEventListener('change', (ev) => {
      this.scrollDir = ev.target.value;
      localStorage.setItem('cfob_scroll_dir', this.scrollDir);
      const mainCont = this.$("cfobMainContainer");
      if (this.scrollDir === 'horizontal') {
        mainCont.classList.add('scroll-horizontal');
      } else {
        mainCont.classList.remove('scroll-horizontal');
      }
    });

    popover.querySelector('#cfobSortSelect').addEventListener('change', (ev) => {
      this.currentSort = ev.target.value;
      localStorage.setItem('cfob_sort', this.currentSort);
      this.applySort();
      this.filterGallery();
    });

    popover.querySelector('#cfobToggleHiddenBtn').addEventListener('click', () => {
      this.showHiddenFolders = !this.showHiddenFolders;
      localStorage.setItem('comfy_folder_browser_show_hidden', this.showHiddenFolders);
      this.filterGallery();
      popover.remove();
      this.activePopover = null;
    });

    popover.querySelector('#cfobConfigHiddenBtn').addEventListener('click', () => {
      this.openHiddenFoldersModal();
      popover.remove();
      this.activePopover = null;
    });

    popover.querySelector('#cfobConfigFieldsBtn').addEventListener('click', () => {
      this.openConfigModal();
      popover.remove();
      this.activePopover = null;
    });

    popover.querySelector('#cfobToggleAutoHideBtn').addEventListener('click', () => {
      this.autoHide = !this.autoHide;
      localStorage.setItem('comfy_folder_browser_auto_hide', this.autoHide);
      this.showToast(`Auto-hide ${this.autoHide ? 'enabled' : 'disabled'}`);
      popover.remove();
      this.activePopover = null;
    });

    this.root.appendChild(popover);
    this.activePopover = popover;

    const popRect = popover.getBoundingClientRect();
    let top = rect.bottom + 6;
    let left = rect.right - popRect.width;

    if (left < 10) left = 10;
    if (top + popRect.height > window.innerHeight - 10) {
      top = rect.top - popRect.height - 6;
    }

    popover.style.top = `${top}px`;
    popover.style.left = `${left}px`;
  }

  sanitizeJson(str) {
    return str.replace(/(?<!["\w])\-?(?:NaN|Infinity)(?!["\w])/g, "null");
  }

  escapeHtml(u) {
    return (u || "").toString().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  async parsePngBuffer(arrayBuffer) {
    const bytes = new Uint8Array(arrayBuffer);
    const view = new DataView(arrayBuffer);

    if (view.getUint32(0) !== 0x89504e47) return null;

    let offset = 8, prompt = null, workflow = null;
    while (offset < bytes.length) {
      const length = view.getUint32(offset);
      offset += 4;
      const type = String.fromCharCode(...bytes.slice(offset, offset + 4));
      offset += 4;

      if (type === 'tEXt') {
        let kw = '', i = offset;
        while (bytes[i] !== 0) kw += String.fromCharCode(bytes[i++]);
        i++;
        const txt = new TextDecoder().decode(bytes.slice(i, offset + length));
        if (kw === 'prompt') try { prompt = JSON.parse(this.sanitizeJson(txt)); } catch (err) { }
        if (kw === 'workflow') try { workflow = JSON.parse(this.sanitizeJson(txt)); } catch (err) { }
      }
      offset += length + 4;
    }
    return { prompt, workflow };
  }

  async fetchServerImages() {
    const isFirstLoad = this.loadedImages.length === 0;

    if (isFirstLoad) {
      this.$("cfobGalleryGrid").innerHTML = "";
      this.$("cfobEmptyStateTitle").innerText = "Loading Outputs...";
      this.$("cfobEmptyStateDesc").innerText = "Fetching image list from server...";
      this.$("cfobEmptyState").style.display = "block";
    }

    try {
      const response = await fetch("/comfyui-output-browser/images");
      const allFiles = await response.json();
      this.serverOrder = allFiles;

      const existingMap = new Map(this.loadedImages.map(img => [img.name, img]));
      const validImages = [];
      const newFilesToFetch = [];

      for (const filename of allFiles) {
        if (existingMap.has(filename)) {
          validImages.push(existingMap.get(filename));
        } else {
          newFilesToFetch.push(filename);
        }
      }

      const newImages = newFilesToFetch.map((filename) => {
        const url = this.getImageUrl(filename);
        return { name: filename, url, prompt: null, workflow: null, isParsed: false, isParsing: false };
      });

      if (newImages.length > 0 || validImages.length !== this.loadedImages.length) {
        this.loadedImages = [...newImages, ...validImages];
        this.applySort();

        const validNames = new Set(this.loadedImages.map(img => img.name));
        for (const sel of this.selectedImages) {
          if (!validNames.has(sel)) this.selectedImages.delete(sel);
        }

        this.updateActionBar();
        this.filterGallery();
      } else if (isFirstLoad) {
        this.applySort();
        this.filterGallery();
      }

      this.startIdleParsing();
    } catch (err) {
      this.$("cfobEmptyStateTitle").innerText = "Connection Error";
      this.$("cfobEmptyStateDesc").innerText = "Failed to load outputs from server.";
      this.$("cfobEmptyState").style.display = "block";
      console.error("Output Browser Error:", err);
    }
  }

  applySort() {
    if (this.currentSort === 'name_asc') {
      this.loadedImages.sort((a, b) => a.name.localeCompare(b.name));
    } else if (this.currentSort === 'name_desc') {
      this.loadedImages.sort((a, b) => b.name.localeCompare(a.name));
    } else if (this.currentSort === 'default') {
      const orderMap = new Map(this.serverOrder.map((name, i) => [name, i]));
      this.loadedImages.sort((a, b) => {
        const idxA = orderMap.has(a.name) ? orderMap.get(a.name) : 999999;
        const idxB = orderMap.has(b.name) ? orderMap.get(b.name) : 999999;
        return idxA - idxB;
      });
    }
  }

  startIdleParsing() {
    if (this._idleParsingActive) return;
    this._idleParsingActive = true;

    const parseNext = async () => {
      const img = this.loadedImages.find(i => !i.isParsed && !i.isParsing);

      if (img) {
        await this.loadMetadata(img);

        const cards = Array.from(this.root.querySelectorAll('.image-card'));
        const card = cards.find(c => c.dataset.name === img.name);
        if (card) {
          const cardBody = card.querySelector('.card-body');
          if (cardBody && cardBody.innerHTML.includes('Loading...')) {
            cardBody.innerHTML = this.getCardFieldsHtml(img);
          }
        }

        if ('requestIdleCallback' in window) {
          requestIdleCallback(parseNext, { timeout: 2000 });
        } else {
          setTimeout(parseNext, 50);
        }
      } else {
        this._idleParsingActive = false;
      }
    };

    if ('requestIdleCallback' in window) requestIdleCallback(parseNext, { timeout: 2000 });
    else setTimeout(parseNext, 50);
  }

  async handleLocalFiles(fileList) {
    const pngs = Array.from(fileList).filter(f => f.type === 'image/png' || f.name.toLowerCase().endsWith('.png'));

    for (const file of pngs) {
      const res = await this.processPngFile(file);
      if (res) {
        this.loadedImages = this.loadedImages.filter(img => img.name !== res.name);
        this.loadedImages.unshift(res);
      }
    }
    this.filterGallery();
  }

  async processPngFile(file, targetSubfolder = "") {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const meta = await this.parsePngBuffer(arrayBuffer);
      if (!meta) return null;

      const base64Data = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
      const filename = targetSubfolder ? `${targetSubfolder}/${file.name}` : file.name;
      const res = await fetch("/comfyui-output-browser/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename, image_data: base64Data })
      });
      const data = await res.json();

      if (data.success) {
        await this.cacheSet(data.name, { prompt: meta.prompt, workflow: meta.workflow });

        return {
          name: data.name,
          url: this.getImageUrl(data.name),
          prompt: meta.prompt,
          workflow: meta.workflow,
          isParsed: true
        };
      } else {
        console.error("Failed to save dropped file to server:", data.error);
        return null;
      }
    } catch (err) {
      console.error(`Failed reading local PNG file ${file.name}`, err);
      return null;
    }
  }

  async loadMetadata(img) {
    if (img.isParsed) return;
    if (img.isParsing) {
      while (img.isParsing) { await new Promise(r => setTimeout(r, 50)); }
      return;
    }

    img.isParsing = true;
    try {
      let meta = await this.cacheGet(img.name);
      if (!meta) {
        const res = await fetch(img.url);
        const buffer = await res.arrayBuffer();
        meta = await this.parsePngBuffer(buffer) || { prompt: null, workflow: null };
        await this.cacheSet(img.name, meta);
      }
      img.prompt = meta.prompt;
      img.workflow = meta.workflow;
      img.isParsed = true;
    } catch (e) {
      console.warn(`Failed to parse file: ${img.name}`, e);
      img.isParsed = true;
    } finally {
      img.isParsing = false;
    }
  }

  resolveFieldValue(imgData, pathString) {
    if (!pathString) return null;
    const candidates = pathString.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
    const { prompt, workflow } = imgData;

    for (const path of candidates) {
      const parts = path.split('.');
      if (parts.length < 2) continue;

      const target = parts[0].trim();
      const prop = parts.slice(1).join('.').trim();
      const match = target.match(/^(.+)\[(\d+)\]$/);
      const targetName = match ? match[1] : target;
      const targetIdx = match ? parseInt(match[2], 10) : 0;

      let matchCount = 0;
      if (prompt) {
        for (const [id, node] of Object.entries(prompt)) {
          const classType = node.class_type || '', title = node._meta?.title || '';
          if (id === targetName || classType.toLowerCase() === targetName.toLowerCase() || title.toLowerCase() === targetName.toLowerCase()) {
            if (matchCount === targetIdx) {
              let val = prop.startsWith('inputs.') ? (node.inputs ? node.inputs[prop.replace('inputs.', '')] : undefined) : node.inputs?.[prop];
              if (val !== undefined && !Array.isArray(val) && val !== null && val !== '') return val;
            }
            matchCount++;
          }
        }
      }

      if (workflow?.nodes) {
        matchCount = 0;
        for (const node of workflow.nodes) {
          const classType = node.type || '', title = node.title || '', id = String(node.id);
          if (id === targetName || classType.toLowerCase() === targetName.toLowerCase() || title.toLowerCase() === targetName.toLowerCase()) {
            if (matchCount === targetIdx) {
              if (node.widgets_values_named?.[prop] !== undefined) return node.widgets_values_named[prop];
              const wMatch = prop.match(/^widget\[(\d+)\]$/);
              if (wMatch && node.widgets_values) return node.widgets_values[parseInt(wMatch[1], 10)];
            }
            matchCount++;
          }
        }
      }
    }
    return null;
  }

  getCardFieldsHtml(img) {
    let fieldsHtml = '';
    this.fieldConfigs.forEach(cfg => {
      const val = this.resolveFieldValue(img, cfg.paths);
      const displayVal = val !== null ? String(val) : (img.isParsed ? '—' : 'Loading...');
      const emptyClass = val === null ? 'empty' : '';

      fieldsHtml += ` <div class="field-row">
                        <div class="field-label">${this.escapeHtml(cfg.label)}</div>
                        <div class="field-value-container">
                          <div class="field-value ${emptyClass}">${this.escapeHtml(displayVal)}</div>
                          ${val !== null ? `<button class="icon-btn copy-val-btn" data-val="${encodeURIComponent(String(val))}" title="Copy">${ICONS.copy}</button>` : ''}
                        </div>
                      </div>`;
    });
    return fieldsHtml;
  }

  handleCheckboxClick(e, filename) {
    e.stopPropagation();
    const fIdx = this.filteredImages.findIndex(img => img.name === filename);
    if (fIdx === -1) return;

    if (e.shiftKey && this.lastSelectedIdx !== -1) {
      const start = Math.min(this.lastSelectedIdx, fIdx);
      const end = Math.max(this.lastSelectedIdx, fIdx);
      const isChecked = e.target.checked;

      for (let i = start; i <= end; i++) {
        const targetImg = this.filteredImages[i];
        if (isChecked) this.selectedImages.add(targetImg.name);
        else this.selectedImages.delete(targetImg.name);
      }

      this.root.querySelectorAll('.card-checkbox').forEach(cb => {
        cb.checked = this.selectedImages.has(cb.value);
      });
    } else {
      if (e.target.checked) this.selectedImages.add(filename);
      else this.selectedImages.delete(filename);
    }

    this.lastSelectedIdx = fIdx;
    this.updateActionBar();
    this.updateCardStyles();
  }

  updateActionBar() {
    const bar = this.$("cfobActionBar");
    const count = this.selectedImages.size;
    if (count > 0) {
      bar.classList.add('show');
      this.$("cfobSelectionCount").innerText = `${count} selected`;

      const isSingle = count === 1;
      this.$("cfobActionInspect").style.display = isSingle ? 'inline-flex' : 'none';
      this.$("cfobActionOpen").style.display = isSingle ? 'inline-flex' : 'none';
      this.$("cfobActionRename").style.display = 'inline-flex';
      this.$("cfobActionRename").querySelector('span').innerText = isSingle ? 'Move/Rename' : 'Move to Folder';
    } else {
      bar.classList.remove('show');
      this.lastSelectedIdx = -1;
    }
  }

  updateCardStyles() {
    this.root.querySelectorAll('.image-card').forEach(card => {
      const name = card.dataset.name;
      if (this.selectedImages.has(name)) card.classList.add('selected');
      else card.classList.remove('selected');
    });
  }

  clearSelection() {
    this.selectedImages.clear();
    this.lastSelectedIdx = -1;
    this.root.querySelectorAll('.card-checkbox').forEach(cb => cb.checked = false);
    this.updateCardStyles();
    this.updateActionBar();
  }

  selectAllFiltered() {
    if (!this.filteredImages.length) return;
    this.filteredImages.forEach(img => this.selectedImages.add(img.name));
    this.root.querySelectorAll('.card-checkbox').forEach(cb => {
      cb.checked = this.selectedImages.has(cb.value);
    });
    this.updateCardStyles();
    this.updateActionBar();
  }

  async downloadSelected() {
    this.showToast(`Downloading ${this.selectedImages.size} image(s)...`);
    for (const filename of this.selectedImages) {
      const img = this.loadedImages.find(i => i.name === filename);
      if (img) {
        const a = document.createElement('a');
        a.href = img.url;
        a.download = img.name.split('/').pop();
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        await new Promise(r => setTimeout(r, 250));
      }
    }
    this.clearSelection();
  }

  async deleteSelected() {
    const files = Array.from(this.selectedImages);
    if (!files.length) return;

    const hasTrashedItems = files.some(f => f.replace(/\\/g, '/').startsWith('.trash/'));
    const confirmMsg = hasTrashedItems
      ? `Permanently delete at least one of ${files.length} selected image(s)? This cannot be undone.`
      : `Move ${files.length} selected image(s) to Trash?`;

    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch("/comfyui-output-browser/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files })
      });
      const data = await res.json();

      const removed = [...(data.deleted || []), ...(data.trashed || [])];

      if (removed.length > 0) {
        this.loadedImages = this.loadedImages.filter(img => !removed.includes(img.name));

        for (const file of removed) {
          await this.cacheDelete(file);
        }

        this.clearSelection();
        this.filterGallery();

        if (data.deleted && data.deleted.length > 0) {
          this.showToast(`Permanently deleted ${data.deleted.length} image(s)`);
        } else if (data.trashed && data.trashed.length > 0) {
          this.showToast(`Moved ${data.trashed.length} image(s) to Trash`);
        }
      }
    } catch (e) {
      console.error(e);
      this.showToast("Failed to delete/trash images.");
    }
  }

  async renameSelected() {
    const count = this.selectedImages.size;
    if (count === 0) return;

    if (count === 1) {
      const oldName = Array.from(this.selectedImages)[0];
      let newName = prompt("Enter new path or filename (e.g. 'etc/thing02.png'):", oldName);

      if (!newName || newName === oldName) return;

      try {
        const res = await fetch("/comfyui-output-browser/rename", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ old_name: oldName, new_name: newName })
        });
        const data = await res.json();

        if (data.success) {
          const img = this.loadedImages.find(i => i.name === oldName);
          if (img) {
            img.name = data.new_name;
            img.url = this.getImageUrl(data.new_name);
            const meta = await this.cacheGet(oldName);
            if (meta) {
              await this.cacheSet(data.new_name, meta);
              await this.cacheDelete(oldName);
            }
          }
          this.clearSelection();
          this.filterGallery();
          this.showToast(`Moved to ${data.new_name}`);
        } else {
          this.showToast(data.error || "Rename failed.");
        }
      } catch (e) {
        console.error(e);
        this.showToast("Rename request failed.");
      }
    } else {
      let destFolder = prompt(`Move ${count} items to folder (e.g., 'Favorites'):`, "");
      if (destFolder === null || destFolder.trim() === "") return;

      try {
        const res = await fetch("/comfyui-output-browser/move", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ files: Array.from(this.selectedImages), dest_folder: destFolder })
        });
        const data = await res.json();

        if (data.success) {
          for (const m of data.moved) {
            const img = this.loadedImages.find(i => i.name === m.old_name);
            if (img) {
              img.name = m.new_name;
              img.url = this.getImageUrl(m.new_name);
              const meta = await this.cacheGet(m.old_name);
              if (meta) {
                await this.cacheSet(m.new_name, meta);
                await this.cacheDelete(m.old_name);
              }
            }
          }
          this.clearSelection();
          this.filterGallery();
          if (data.errors && data.errors.length > 0) {
            this.showToast(`Moved ${data.moved.length}, but ${data.errors.length} failed.`);
            console.warn("Move errors:", data.errors);
          } else {
            this.showToast(`Moved ${data.moved.length} item(s) to ${destFolder}`);
          }
        } else {
          this.showToast(data.error || "Move failed.");
        }
      } catch (e) {
        console.error(e);
        this.showToast("Move request failed.");
      }
    }
  }

  inspectSelected() {
    if (this.selectedImages.size !== 1) return;
    const filename = Array.from(this.selectedImages)[0];
    const idx = this.loadedImages.findIndex(i => i.name === filename);
    if (idx !== -1) {
      this.openInspector(idx);
    }
  }

  async loadWorkflowImage(img) {
    if (!img) return;
    if (!img.isParsed) {
      this.showToast("Loading metadata...");
      await this.loadMetadata(img);
    }
    if (img.workflow) {
      app.loadGraphData(img.workflow);
      this.root.style.display = 'none';
      this.clearSelection();
      this.showToast("Workflow loaded successfully!");
    } else {
      this.showToast("No workflow metadata found in this image.");
    }
  }

  async loadWorkflowSelected() {
    if (this.selectedImages.size !== 1) return;
    const filename = Array.from(this.selectedImages)[0];
    const img = this.loadedImages.find(i => i.name === filename);
    if (img) await this.loadWorkflowImage(img);
  }

  async renameFullViewImage() {
    const img = this.filteredImages[this.currentImageIndex];
    if (!img) return;
    let newName = prompt("Enter new path or filename (e.g. 'etc/thing02.png'):", img.name);
    if (!newName || newName === img.name) return;

    try {
      const res = await fetch("/comfyui-output-browser/rename", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ old_name: img.name, new_name: newName })
      });
      const data = await res.json();
      if (data.success) {
        const oldName = img.name;
        img.name = data.new_name;
        img.url = this.getImageUrl(data.new_name);
        const meta = await this.cacheGet(oldName);
        if (meta) {
          await this.cacheSet(data.new_name, meta);
          await this.cacheDelete(oldName);
        }
        this.filterGallery();
        this.openFullView(img);
        this.showToast(`Moved to ${data.new_name}`);
      } else {
        this.showToast(data.error || "Rename failed.");
      }
    } catch (e) {
      console.error(e);
      this.showToast("Rename request failed.");
    }
  }

  async deleteFullViewImage() {
    const img = this.filteredImages[this.currentImageIndex];
    if (!img) return;
    const isTrash = img.name.replace(/\\/g, '/').startsWith('.trash/');
    const confirmMsg = isTrash
      ? `Permanently delete ${img.name}?`
      : `Move ${img.name} to Trash?`;

    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch("/comfyui-output-browser/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files: [img.name] })
      });
      const data = await res.json();
      const removed = [...(data.deleted || []), ...(data.trashed || [])];

      if (removed.length > 0) {
        const imgName = img.name;
        this.loadedImages = this.loadedImages.filter(i => i.name !== imgName);
        await this.cacheDelete(imgName);
        this.filterGallery();
        this.showToast(data.deleted?.length ? "Permanently deleted image" : "Moved image to Trash");

        if (this.filteredImages.length > 0) {
          this.currentImageIndex = Math.min(this.currentImageIndex, this.filteredImages.length - 1);
          this.openFullView(this.filteredImages[this.currentImageIndex]);
        } else {
          this.closeFullView();
        }
      }
    } catch (e) {
      console.error(e);
      this.showToast("Failed to delete/trash image.");
    }
  }

  openFullView(img) {
    this.currentImageIndex = this.filteredImages.indexOf(img);
    this.updateFullViewUI();
    this.$("cfobFullViewModal").classList.add('active');
  }

  closeFullView() {
    this.$("cfobFullViewModal").classList.remove('active');
    this.$("cfobFullViewImg").src = "";
  }

  navigateImage(dir) {
    if (this.filteredImages.length === 0) return;
    this.currentImageIndex += dir;
    if (this.currentImageIndex < 0) this.currentImageIndex = this.filteredImages.length - 1;
    if (this.currentImageIndex >= this.filteredImages.length) this.currentImageIndex = 0;
    this.updateFullViewUI();
  }

  updateFullViewUI() {
    const img = this.filteredImages[this.currentImageIndex];
    if (!img) return;
    this.$("cfobFullViewImg").src = img.url;
    this.$("cfobFullViewTitle").innerText = img.name;
    this.$("cfobFullViewCount").innerText = `${this.currentImageIndex + 1} / ${this.filteredImages.length}`;

    if (!img.isParsed) {
      this.$("cfobFullViewFields").innerHTML = "<i style='color: var(--color-text-disabled);'>Loading metadata...</i>";
      this.loadMetadata(img).then(() => {
        if (this.filteredImages[this.currentImageIndex] === img) {
          this.$("cfobFullViewFields").innerHTML = this.getCardFieldsHtml(img);
        }
      });
    } else {
      this.$("cfobFullViewFields").innerHTML = this.getCardFieldsHtml(img);
    }
  }

  copyValue(btn, encodedVal) {
    const val = decodeURIComponent(encodedVal || "");
    navigator.clipboard.writeText(val).then(() => {
      const origHtml = btn.innerHTML;
      btn.innerHTML = ICONS.check;
      setTimeout(() => { btn.innerHTML = origHtml; }, 1200);
    });
  }

  openConfigModal() {
    const modal = this.$("cfobConfigModal");
    const list = this.$("cfobConfigFieldsList");
    list.innerHTML = "";

    this.fieldConfigs.forEach((cfg, idx) => {
      const item = document.createElement("div");
      item.className = "config-field-item";
      item.innerHTML = `
        <div class="config-field-header">
          <input type="text" class="config-input field-label-input" value="${this.escapeHtml(cfg.label)}" placeholder="Field Name" style="flex: 1; font-weight: 600;">
          <button class="icon-btn remove-field-btn" title="Remove Field">${ICONS.trash}</button>
        </div>
        <textarea class="config-paths-textarea field-paths-input" placeholder="e.g. Positive Prompt.text, 6.inputs.text">${this.escapeHtml(cfg.paths)}</textarea>
      `;

      item.querySelector('.remove-field-btn').addEventListener('click', () => {
        this.fieldConfigs.splice(idx, 1);
        this.openConfigModal();
      });

      list.appendChild(item);
    });

    modal.classList.add('active');
  }

  openHiddenFoldersModal() {
    const modal = this.$("cfobHiddenFoldersModal");
    const input = this.$("cfobHiddenFoldersInput");
    input.value = this.hiddenFolders.join("\n");
    modal.classList.add('active');
  }

  openInspector(idx) {
    const img = this.loadedImages[idx];
    if (!img) return;

    const modal = this.$("cfobInspectorModal");
    this.$("cfobInspectorTitle").innerText = `Inspector - ${img.name.split('/').pop()}`;

    const promptText = img.prompt ? JSON.stringify(img.prompt, null, 2) : "No API Prompt data available";
    const workflowText = img.workflow ? JSON.stringify(img.workflow, null, 2) : "No UI Workflow data available";

    this.$("cfobInsPromptText").value = promptText;
    this.$("cfobInsWorkflowText").value = workflowText;

    const nodesGrid = this.$("cfobInsNodesGrid");
    nodesGrid.innerHTML = "";

    if (img.prompt) {
      for (const [nodeId, nodeData] of Object.entries(img.prompt)) {
        const nodeCard = document.createElement("div");
        nodeCard.className = "node-card";

        const title = nodeData._meta?.title || nodeData.class_type || `Node ${nodeId}`;
        const classType = nodeData.class_type || "";

        let inputsHtml = "";
        if (nodeData.inputs) {
          for (const [inKey, inVal] of Object.entries(nodeData.inputs)) {
            const valDisplay = Array.isArray(inVal) ? `Link: Node ${inVal[0]}, Output ${inVal[1]}` : String(inVal);
            inputsHtml += `
              <div class="input-row">
                <div class="input-header">
                  <span class="input-name">${this.escapeHtml(inKey)}</span>
                </div>
                <div class="input-value-wrapper">
                  <span class="input-value-text">${this.escapeHtml(valDisplay)}</span>
                  <button class="icon-btn copy-val-btn" data-val="${encodeURIComponent(valDisplay)}" title="Copy">${ICONS.copy}</button>
                </div>
              </div>
            `;
          }
        }

        nodeCard.innerHTML = `
          <div class="node-header">
            <div class="node-title">
              ${this.escapeHtml(title)}
              <small>${this.escapeHtml(classType)}</small>
            </div>
            <span class="node-id">#${nodeId}</span>
          </div>
          <div class="node-body">
            ${inputsHtml || '<i style="color: var(--color-text-disabled);">No inputs</i>'}
          </div>
        `;

        nodesGrid.appendChild(nodeCard);
      }
    } else {
      nodesGrid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--color-text-muted); padding: 2em;">No node structure parsed from image metadata.</div>`;
    }

    modal.classList.add('active');
  }

  filterGallery() {
    const query = (this.$("cfobSearchInput")?.value || "").toLowerCase().trim();

    let images = this.loadedImages;

    if (!this.showHiddenFolders) {
      images = images.filter(img => !this.isImageInHiddenFolder(img.name));
    }

    if (!query) {
      this.filteredImages = images;
    } else {
      const tokens = query.split(/\s+/).filter(Boolean);
      this.filteredImages = images.filter(img => {
        const name = img.name.toLowerCase();
        let promptText = "";
        if (img.prompt) {
          try { promptText = JSON.stringify(img.prompt).toLowerCase(); } catch (e) { }
        }

        return tokens.every(token => {
          if (token.startsWith('!')) {
            const term = token.slice(1);
            if (!term) return true;
            return !name.includes(term) && !promptText.includes(term);
          } else {
            return name.includes(token) || promptText.includes(token);
          }
        });
      });
    }

    this.renderGallery();
  }

  renderGallery() {
    const grid = this.$("cfobGalleryGrid");
    if (!grid) return;

    grid.innerHTML = "";

    const countSpan = this.$("cfobImageCount");
    if (countSpan) {
      countSpan.innerText = `(${this.filteredImages.length})`;
    }

    const emptyState = this.$("cfobEmptyState");
    if (this.filteredImages.length === 0) {
      if (emptyState) {
        emptyState.style.display = "block";
        this.$("cfobEmptyStateTitle").innerText = "No Images Found";
        this.$("cfobEmptyStateDesc").innerText = this.loadedImages.length === 0
          ? "Click Refresh to load ComfyUI outputs, or drop PNGs anywhere to inspect."
          : "No images match the current filter or hidden folder settings.";
      }
      return;
    } else {
      if (emptyState) emptyState.style.display = "none";
    }

    const fragment = document.createDocumentFragment();

    this.filteredImages.forEach((img, idx) => {
      const isSelected = this.selectedImages.has(img.name);
      const card = document.createElement("div");
      card.className = `image-card ${isSelected ? 'selected' : ''}`;
      card.dataset.name = img.name;
      card.dataset.index = this.loadedImages.indexOf(img);

      const filenameOnly = img.name.split('/').pop();

      card.innerHTML = `
        <div class="checkbox-wrapper">
          <input type="checkbox" class="card-checkbox" value="${this.escapeHtml(img.name)}" ${isSelected ? 'checked' : ''}>
        </div>
        <img class="card-preview" src="${this.escapeHtml(img.url)}" alt="${this.escapeHtml(filenameOnly)}" loading="lazy">
        <div class="card-content-wrapper">
          <div class="card-header" title="${this.escapeHtml(img.name)}">
            <span class="card-filename">${this.escapeHtml(filenameOnly)}</span>
            ${ICONS.toggle}
          </div>
          <div class="card-body">
            ${img.isParsed ? this.getCardFieldsHtml(img) : '<i style="color: var(--color-text-disabled);">Loading...</i>'}
          </div>
        </div>
      `;

      const cb = card.querySelector('.card-checkbox');
      cb.addEventListener('click', (e) => this.handleCheckboxClick(e, img.name));

      const previewImg = card.querySelector('.card-preview');
      previewImg.addEventListener('click', () => this.openFullView(img));

      const header = card.querySelector('.card-header');
      header.addEventListener('click', () => {
        card.classList.toggle('expanded');
      });

      card.addEventListener('click', (e) => {
        const copyBtn = e.target.closest('.copy-val-btn');
        if (copyBtn) {
          e.stopPropagation();
          this.copyValue(copyBtn, copyBtn.dataset.val);
        }
      });

      if (this.observer) this.observer.observe(card);

      fragment.appendChild(card);
    });

    grid.appendChild(fragment);
  }
}

app.registerExtension({
  name: "Comfy.OutputBrowser",
  async setup() {
    const browser = new ComfyOutputBrowser();
    browser.init();
  }
});
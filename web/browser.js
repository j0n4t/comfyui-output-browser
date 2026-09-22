import { app } from "../../scripts/app.js";

const BROWSER_CSS = /*css*/ `
    #cfob-root {
      --bg: #18181b; --panel: #27272a; --panel-hover: #3f3f46; --border: #3f3f46; --text: #f4f4f5; --text-muted: #a1a1aa;
      --highlight: #0284c7; --highlight-hover: #0369a1; --link: #38bdf8; --string: #fde047; --key: #38bdf8; --success: #22c55e;
      position: fixed; inset: 0; z-index: 9999; font-family: system-ui, -apple-system, sans-serif; background: var(--bg); color: var(--text);
      margin: 0; padding: 0; display: none; flex-direction: column; height: 100vh; overflow: hidden;
    }
    #cfob-root * { box-sizing: border-box; }
    #cfob-root .top-bar { background: var(--panel); border-bottom: 1px solid var(--border); padding: 5px; display: flex; justify-content: space-between; align-items: center; gap: 15px; flex-wrap: wrap; }
    #cfob-root .logo-group { display: flex; align-items: center; gap: 10px; }
    #cfob-root .logo-group h1 { font-size: 18px; margin: 0; color: #fff; white-space: nowrap; }
    #cfobImageCount { color: var(--text-muted); font-size: 13px; font-weight: 600; margin-left: 6px; }
    #cfob-root .actions-group { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; flex: 1; justify-content: flex-end; }
    #cfob-root .btn { background: var(--panel-hover); color: var(--text); border: 1px solid var(--border); padding: 6px 10px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 500; display: inline-flex; align-items: center; gap: 6px; transition: all 0.15s; }
    #cfob-root .btn:hover { background: #52525b; border-color: #71717a; }
    #cfob-root .btn-primary { background: var(--highlight); border-color: var(--highlight); color: #fff; }
    #cfob-root .btn-primary:hover { background: var(--highlight-hover); border-color: var(--highlight-hover); }
    #cfob-root .btn-danger { background: #7f1d1d; border-color: #991b1b; color: #fca5a5; }
    #cfob-root .btn-danger:hover { background: #991b1b; }
    #cfob-root .btn-xs { padding: 3px 6px; font-size: 11px; border-radius: 4px; }
    #cfob-root .search-wrapper { position: relative; display: flex; align-items: center; flex: 1; min-width: 150px; max-width: 350px; }
    #cfob-root .search-input { background: var(--bg); border: 1px solid var(--border); color: var(--text); padding: 8px 30px 8px 12px; border-radius: 6px; font-size: 13px; width: 100%; }
    #cfob-root .search-clear-btn { position: absolute; right: 6px; background: transparent; border: none; color: var(--text-muted); cursor: pointer; padding: 4px; display: none; align-items: center; justify-content: center; transition: color 0.15s; }
    #cfob-root .search-clear-btn:hover { color: #fff; }
    #cfob-root .search-input:focus { outline: none; border-color: var(--highlight); }
    #cfob-root .view-toggles { display: flex; background: var(--bg); border: 1px solid var(--border); border-radius: 6px; overflow: hidden; }
    #cfob-root .view-btn { background: transparent; color: var(--text-muted); border: none; padding: 6px 10px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s; border-right: 1px solid var(--border); }
    #cfob-root .view-btn:last-child { border-right: none; }
    #cfob-root .view-btn:hover, #cfob-root .view-btn.active { background: var(--panel-hover); color: var(--highlight); }
    #cfob-root .main-container { flex: 1; overflow-y: auto; padding: 20px; position: relative; }
    #cfob-root .drop-overlay { position: absolute; inset: 20px; border: 2px dashed var(--highlight); border-radius: 12px; background: rgba(2, 132, 199, 0.08); display: flex; flex-direction: column; justify-content: center; align-items: center; z-index: 10; cursor: pointer; pointer-events: none; opacity: 0; transition: opacity 0.2s ease; }
    #cfob-root .main-container.dragover .drop-overlay { opacity: 1; pointer-events: all; }
    #cfob-root .image-card { position: relative; background: var(--panel); border: 1px solid var(--border); border-radius: 10px; overflow: hidden; display: flex; box-shadow: 0 4px 12px rgba(0,0,0,0.25); transition: border-color 0.15s, box-shadow 0.15s; }
    #cfob-root .image-card.selected { border-color: var(--highlight); box-shadow: 0 0 0 1px var(--highlight); }
    #cfob-root .checkbox-wrapper { position: absolute; top: 8px; left: 8px; z-index: 5; background: rgba(0,0,0,0.6); border-radius: 4px; padding: 4px; display: flex; }
    #cfob-root .card-checkbox { width: 16px; height: 16px; cursor: pointer; accent-color: var(--highlight); margin: 0; }
    #cfob-root .card-content-wrapper { flex: 1; display: flex; flex-direction: column; min-width: 0; }
    #cfob-root .card-header { padding: 10px 14px; background: #202023; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; }
    #cfob-root .card-filename { font-size: 13px; font-weight: 600; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 240px; }
    #cfob-root .card-body { padding: 12px 14px; display: flex; flex-direction: column; gap: 10px; font-size: 12px; }
    #cfob-root .card-toggle-bar { display: flex; background: #202023; border-top: 1px solid var(--border); padding: 8px 14px; font-size: 11px; font-weight: 600; color: var(--text-muted); justify-content: space-between; align-items: center; cursor: pointer; transition: background 0.15s, color 0.15s; }
    #cfob-root .card-toggle-bar:hover {background: var(--panel-hover);color: #fff; }
    #cfob-root .card-toggle-bar .toggle-icon {transition: transform 0.2s ease; }
    #cfob-root .image-card.expanded .card-toggle-bar .toggle-icon {transform: rotate(180deg);}
    #cfob-root .gallery-container { display: grid; gap: 20px; align-items: start; padding-bottom: 80px; }
    #cfob-root .gallery-container .image-card .card-body { display: none; }
    #cfob-root .gallery-container .image-card.expanded .card-body { display: flex; }
    #cfob-root .gallery-container.view-grid { grid-template-columns: repeat(auto-fill, minmax(380px, 1fr)); }
    #cfob-root .gallery-container.view-grid .image-card { flex-direction: column; }
    #cfob-root .gallery-container.view-grid .card-preview { width: 100%; height: 240px; background: #111; object-fit: contain; cursor: pointer; border-bottom: 1px solid var(--border); }
    #cfob-root .gallery-container.view-compact { grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; }
    #cfob-root .gallery-container.view-compact .image-card { flex-direction: column; border-radius: 6px; }
    #cfob-root .gallery-container.view-compact .card-preview { width: 100%; height: 150px; background: #111; object-fit: contain; cursor: pointer; border-bottom: 1px solid var(--border); }
    #cfob-root .gallery-container.view-compact .card-header { padding: 8px 10px; }
    #cfob-root .gallery-container.view-compact .card-body { display: none; }
    #cfob-root .gallery-container.view-list { grid-template-columns: 1fr; }
    #cfob-root .gallery-container.view-list .card-toggle-bar { display: none; }
    #cfob-root .gallery-container.view-list .image-card { flex-direction: row; }
    #cfob-root .gallery-container.view-list .card-preview { width: 280px; height: 100%; min-height: 180px; max-height: 280px; background: #111; object-fit: contain; cursor: pointer; border-right: 1px solid var(--border); }
    #cfob-root .gallery-container.view-list .card-body { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 12px; }

    #cfob-root .action-bar { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%) translateY(100px); background: var(--panel); border: 1px solid var(--highlight); border-radius: 8px; padding: 10px 20px; display: flex; align-items: center; gap: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.8); z-index: 10005; opacity: 0; pointer-events: none; transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
    #cfob-root .action-bar.show { transform: translateX(-50%) translateY(0); opacity: 1; pointer-events: auto; }

    #cfob-root .field-row { display: flex; flex-direction: column; gap: 4px; background: #1e1e21; border: 1px solid #333; padding: 8px 10px; border-radius: 6px; }
    #cfob-root .field-label { font-size: 11px; font-weight: 700; color: var(--key); text-transform: uppercase; letter-spacing: 0.5px; display: flex; justify-content: space-between; align-items: center; }
    #cfob-root .field-value-container { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; }
    #cfob-root .field-value { color: var(--text); word-break: break-word; white-space: pre-wrap; max-height: 120px; overflow-y: auto; font-family: ui-monospace, monospace; font-size: 12px; flex: 1; }
    #cfob-root .field-value.empty { color: #666; font-style: italic; }
    #cfob-root .icon-btn { background: transparent; color: var(--text-muted); border: none; padding: 3px 5px; border-radius: 4px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; transition: all 0.15s; }
    #cfob-root .icon-btn:hover { background: #333; color: #fff; }
    #cfob-root .nodes-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 14px; align-items: start; }
    #cfob-root .node-card { background: #18181b; border: 1px solid var(--border); border-radius: 8px; overflow: hidden; }
    #cfob-root .node-header { background: #27272a; padding: 10px 12px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; }
    #cfob-root .node-title { font-weight: 600; color: #fff; font-size: 14px; }
    #cfob-root .node-title small { color: var(--text-muted); font-weight: 400; font-size: 11px; display: block; }
    #cfob-root .node-id { background: #3f3f46; padding: 2px 6px; border-radius: 10px; font-size: 10px; font-family: monospace; color: #fff; }
    #cfob-root .node-body { padding: 10px; font-size: 12px; display: flex; flex-direction: column; gap: 8px; }
    #cfob-root .input-row { display: flex; flex-direction: column; gap: 4px; border-bottom: 1px solid #27272a; padding-bottom: 6px; }
    #cfob-root .input-row:last-child { border-bottom: none; padding-bottom: 0; }
    #cfob-root .input-header { display: flex; justify-content: space-between; align-items: center; }
    #cfob-root .input-name { color: var(--key); font-weight: 600; font-size: 11px; }
    #cfob-root .input-value-wrapper { display: flex; justify-content: space-between; align-items: flex-start; gap: 6px; background: #202023; padding: 6px; border-radius: 4px; border: 1px solid #2d2d30; }
    #cfob-root .input-value-text { color: var(--string); font-family: monospace; font-size: 11px; word-break: break-word; white-space: pre-wrap; max-height: 120px; overflow-y: auto; flex: 1; }
    #cfob-root .input-actions { display: flex; gap: 4px; align-items: center; }
    #cfob-root .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(4px); display: none; justify-content: center; align-items: center; z-index: 10005; padding: 20px; }
    #cfob-root .modal-overlay.active { display: flex; }
    #cfob-root .modal-content { background: var(--panel); border: 1px solid var(--border); border-radius: 12px; width: 100%; max-width: 900px; max-height: 90vh; display: flex; flex-direction: column; box-shadow: 0 10px 30px rgba(0,0,0,0.5); overflow: hidden; }
    #cfob-root .modal-header { padding: 16px 20px; border-bottom: 1px solid var(--border); display: flex; gap: 10px; justify-content: space-between; align-items: center; }
    #cfob-root .modal-header h3 { margin: 0; font-size: 16px; color: #fff; flex: 1; }
    #cfob-root .modal-body { padding: 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 16px; flex: 1; }
    #cfob-root .modal-footer { padding: 12px 20px; border-top: 1px solid var(--border); display: flex; justify-content: flex-end; gap: 10px; background: #202023; }
    #cfob-root .config-field-item { background: #1e1e21; border: 1px solid var(--border); border-radius: 8px; padding: 12px; display: flex; flex-direction: column; gap: 8px; }
    #cfob-root .config-field-header { display: flex; gap: 10px; align-items: center; }
    #cfob-root .config-input, #cfob-root .config-paths-textarea { background: var(--bg); border: 1px solid var(--border); color: var(--text); padding: 8px; border-radius: 4px; font-size: 13px; }
    #cfob-root .config-input:focus { outline: none; border-color: var(--highlight); }
    #cfob-root .config-paths-textarea { font-family: monospace; resize: vertical; height: 60px; font-size: 12px; }
    #cfob-root .popover-menu { position: fixed; background: #2a2a2e; border: 1px solid var(--border); border-radius: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.6); padding: 6px; z-index: 10020; display: flex; flex-direction: column; gap: 4px; min-width: 180px; }
    #cfob-root .popover-header { font-size: 10px; font-weight: 700; color: var(--text-muted); padding: 4px 8px; text-transform: uppercase; }
    #cfob-root .popover-item { padding: 6px 10px; font-size: 12px; color: #fff; background: transparent; border: none; text-align: left; border-radius: 4px; cursor: pointer; display: flex; align-items: center; justify-content: space-between; }
    #cfob-root .popover-item:hover { background: var(--highlight); }
    #cfob-root .tabs { display: flex; border-bottom: 1px solid var(--border); gap: 2px; }
    #cfob-root .tab { padding: 8px 16px; cursor: pointer; background: var(--bg); border-radius: 6px 6px 0 0; font-size: 13px; }
    #cfob-root .tab.active { background: var(--highlight); color: #fff; }
    #cfob-root .tab-content { display: none; padding-top: 10px; }
    #cfob-root .tab-content.active { display: block; }
    #cfob-root .empty-state { text-align: center; padding: 80px 20px; color: var(--text-muted); }
    #cfob-root .empty-state svg { width: 64px; height: 64px; margin-bottom: 16px; stroke: #52525b; }
    #cfob-root .toast { position: fixed; bottom: 20px; right: 20px; background: var(--highlight); color: #fff; padding: 10px 16px; border-radius: 6px; font-size: 13px; font-weight: 500; box-shadow: 0 4px 12px rgba(0,0,0,0.3); z-index: 10030; opacity: 0; transform: translateY(10px); transition: all 0.2s ease; pointer-events: none; }
    #cfob-root .toast.show { opacity: 1; transform: translateY(0); }
    #cfob-root #fullViewModal { padding: 0; z-index: 10010; }
    #cfob-root .full-view-layout { display: flex; width: 100vw; height: 100vh; background: rgba(0, 0, 0, 0.95); }
    #cfob-root .full-view-layout .field-value { max-height: 100%; resize: vertical; }
    #cfob-root .full-view-main { flex: 1; position: relative; display: flex; justify-content: center; align-items: center; overflow: hidden; }
    #cfob-root .full-view-main img { max-width: 100%; max-height: 100%; object-fit: contain; }
    #cfob-root .full-view-top-bar { position: absolute; top: 0; left: 0; right: 0; padding: 15px 25px; background: linear-gradient(rgba(0,0,0,0.8), transparent); display: flex; justify-content: space-between; align-items: center; color: #fff; z-index: 10; }
    #cfob-root .full-view-actions { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; width: 100%; }
    #cfob-root .full-view-actions .btn { justify-content: center; font-size: 11px; padding: 6px 8px; }
    #cfob-root .nav-btn { position: absolute; top: 50%; transform: translateY(-50%); background: rgba(0,0,0,0.4); color: white; border: none; padding: 20px 15px; cursor: pointer; font-size: 24px; transition: 0.2s; z-index: 10; }
    #cfob-root .nav-btn:hover { background: rgba(0,0,0,0.9); }
    #cfob-root .prev-btn { left: 0; border-radius: 0 6px 6px 0; }
    #cfob-root .next-btn { right: 0; border-radius: 6px 0 0 6px; }
    #cfob-root .full-view-sidebar { width: 360px; min-width: 360px; background: var(--panel); border-left: 1px solid var(--border); display: flex; flex-direction: column; transition: all 0.3s; overflow: hidden; }
    #cfob-root .full-view-sidebar.collapsed { width: 0; min-width: 0; border-left: none; }
    #cfob-root .sidebar-header, #cfob-root .sidebar-footer { padding: 15px 20px; background: #202023; }
    #cfob-root .sidebar-header { border-bottom: 1px solid var(--border); }
    #cfob-root .sidebar-footer { border-top: 1px solid var(--border); }
    #cfob-root .sidebar-body { padding: 20px; flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; }
    #cfob-launcher-btn.floating { position: fixed; top: 4px; right: 45px; z-index: 9998; background: #27272a; color: #fff; border: 1px solid #3f3f46; border-radius: 8px; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.4); }
    #cfob-launcher-btn.floating:hover { background: #3f3f46; }

    @media (max-width: 768px) {
      #cfob-root .btn span { display: none; }
      #cfob-root .top-bar { flex-direction: column; align-items: stretch; gap: 10px; }
      #cfob-root .logo-group { width: 100%; justify-content: space-between; }
      #cfob-root .actions-group { width: 100%; justify-content: stretch; gap: 8px; }
      #cfob-root .search-wrapper { max-width: none; width: 100%; order: -1; }
      #cfob-root .view-toggles { display: none; }
      #cfob-root .gallery-container { grid-template-columns: 1fr !important; }
      #cfob-root .gallery-container .image-card { flex-direction: column !important; }
      #cfob-root .gallery-container .image-card .card-preview { width: 100% !important; height: 220px !important; }
      #cfob-root .main-container .action-bar { padding: 5px 10px; flex-wrap: wrap; justify-content: center; gap: 8px; }
      #cfob-root .full-view-layout { flex-direction: column; }
      #cfob-root .full-view-main { height: 50vh; min-height: 250px; }
      #cfob-root .full-view-sidebar { width: 100% !important; min-width: 100% !important; height: 50vh; border-left: none; border-top: 1px solid var(--border); }
      #cfob-root .full-view-sidebar.collapsed { height: 0; min-height: 0; border-top: none; }
      #cfob-root .full-view-actions { display: flex; justify-content: space-around; }
      #cfob-root #cfobToggleSidebarBtn svg { transform: rotate(90deg); }
    }
`;

const ICONS = {
  close: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,
  config: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>`,
  copy: `<svg width="1em" height="1em" viewBox="0 0 24 24"><path fill="currentColor" d="M20 2H10c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2m0 12H10V4h10z"/><path fill="currentColor" d="M14 20H4V10h2V8H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2v-2h-2z"/></svg>`,
  check: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
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
<div class="top-bar">
  <div class="logo-group">${ICONS.logo}<h1>ComfyUI Output Browser</h1>
  <span id="cfobImageCount"></span>
  </div>
  <div class="actions-group">
    <div class="search-wrapper">
      <input type="text" id="cfobSearchInput" class="search-input" placeholder="cat dog, tree !blue (AND / OR / NOT)">
      <button id="cfobClearSearchBtn" class="search-clear-btn" title="Clear search">${ICONS.close}</button>
    </div>
    <div class="view-toggles">
      <button class="view-btn" data-view="compact" title="Compact Grid">${ICONS.gridSmall}</button>
      <button class="view-btn" data-view="grid" title="Standard Grid">${ICONS.gridBig}</button>
      <button class="view-btn" data-view="list" title="List View">${ICONS.gridList}</button>
    </div>
    <button class="btn" id="cfobRefreshBtn" title="Sync outputs from Server">${ICONS.refresh}<span>Refresh</span></button>
    <button class="btn" id="cfobLocalFilesBtn" title="Manually inspect other files">${ICONS.picture}<span>+ PNGs</span></button>
      <button class="btn" id="cfobMenuBtn" title="Options">${ICONS.more}</button>
      <button class="btn btn-danger" id="cfobCloseBrowserBtn">${ICONS.close}<span>Close</span></button>
      <input type="file" id="cfobFilesInput" accept="image/png" multiple style="display: none;">
  </div>
</div>
<div class="main-container" id="cfobMainContainer">
  <div class="drop-overlay">${ICONS.drop}<h3 style="margin: 10px 0 0 0; color: #fff;">Drop PNGs Here</h3></div>
  <div class="gallery-container view-grid" id="cfobGalleryGrid"></div>
  <div class="empty-state" id="cfobEmptyState">
    ${ICONS.picture}
    <h3 id="cfobEmptyStateTitle">No Images Loaded</h3><p id="cfobEmptyStateDesc">Click Refresh to load ComfyUI outputs, or drop PNGs anywhere to inspect.</p>
  </div>
  
  <div id="cfobActionBar" class="action-bar">
    <span id="cfobSelectionCount" style="font-weight: 600; color: #fff; min-width: 80px;">1 selected</span>
    <div style="width: 1px; height: 20px; background: var(--border);"></div>
    <button class="btn btn-primary" id="cfobActionOpen">${ICONS.workflow}<span>Load Workflow</span></button>
    <button class="btn" id="cfobActionInspect">${ICONS.inspect}<span>Inspect Nodes</span></button>
    <button class="btn" id="cfobActionDownload">${ICONS.drop}<span>Download</span></button>
    <button class="btn" id="cfobActionRename">${ICONS.move}<span>Move/Rename</span></button>
    <button class="btn btn-danger" id="cfobActionDelete">${ICONS.trash}<span>Delete</span></button>
    <div style="width: 1px; height: 20px; background: var(--border);"></div>
    <button class="icon-btn" id="cfobActionClear" title="Clear Selection">${ICONS.close}</button>
  </div>
</div>
<div class="modal-overlay" id="cfobConfigModal">
  <div class="modal-content">
    <div class="modal-header">${ICONS.pane}<h3>Customize Image Details Card Fields</h3><button class="icon-btn" id="cfobCloseConfigBtn">${ICONS.close}</button></div>
    <div class="modal-body"><p style="font-size: 13px; color: var(--text-muted); margin: 0;">Define custom card fields. Enter fallback paths separated by commas or newlines. <br><em>Syntax examples: <code>Positive Prompt.text</code>, <code>KSampler.seed</code>, <code>6.inputs.text</code></em></p>
      <div id="cfobConfigFieldsList" style="display: flex; flex-direction: column; gap: 12px;"></div>
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
      <div class="tab-content" id="cfobInsPrompt"><textarea id="cfobInsPromptText" style="width: 100%; height: 480px; background: #111; color: var(--string); font-family: monospace; border: 1px solid var(--border); padding: 12px; border-radius: 6px;" readonly></textarea></div>
      <div class="tab-content" id="cfobInsWorkflow"><textarea id="cfobInsWorkflowText" style="width: 100%; height: 480px; background: #111; color: var(--key); font-family: monospace; border: 1px solid var(--border); padding: 12px; border-radius: 6px;" readonly></textarea></div>
    </div>
  </div>
</div>
<div class="modal-overlay" id="cfobFullViewModal">
  <div class="full-view-layout">
    <div class="full-view-main">
      <div class="full-view-top-bar"><span id="cfobFullViewCount" style="font-weight: 600; font-size: 14px;">1 / 10</span><div style="display: flex; gap: 8px;"><button class="icon-btn" id="cfobToggleSidebarBtn" title="Toggle Details Pane">${ICONS.pane}</button><button class="icon-btn" id="cfobCloseFullViewBtn" title="Close (Esc)">${ICONS.close}</button></div></div>
      <button class="nav-btn prev-btn" id="cfobPrevImgBtn" title="Previous (Left Arrow)">❮</button>
      <img id="cfobFullViewImg" src="" alt="Full View">
      <button class="nav-btn next-btn" id="cfobNextImgBtn" title="Next (Right Arrow)">❯</button>
    </div>
    <div class="full-view-sidebar" id="cfobFullViewSidebar">
      <div class="sidebar-header"><h4 id="cfobFullViewTitle" style="margin: 0; font-size: 14px; color: #fff; word-break: break-all;">Filename.png</h4></div>
      <div class="sidebar-body" id="cfobFullViewFields"></div>
      <div class="sidebar-footer">
        <div class="full-view-actions" id="cfobFullViewActions">
          <button class="btn btn-primary" id="cfobFVActionOpen">${ICONS.workflow}<span>Workflow</span></button>
          <button class="btn" id="cfobFVActionInspect">${ICONS.inspect}<span>Inspect</span></button>
          <button class="btn" id="cfobFVActionDownload">${ICONS.drop}<span>Download</span></button>
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
      <p style="font-size: 13px; color: var(--text-muted); margin: 0;">
        Specify folder names or path keywords to hide (one per line or comma-separated). Folders starting with <code>.</code> (e.g. <code>.cache</code>) are automatically hidden when hidden folders are toggled off.
      </p>
      <textarea id="cfobHiddenFoldersInput" class="config-paths-textarea" style="height: 140px; width: 100%;" placeholder="temp&#10;trash&#10;drafts"></textarea>
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
    this.hiddenFolders = this.loadHiddenFoldersConfig();
    this.showHiddenFolders = localStorage.getItem('comfy_folder_browser_show_hidden') === 'true';
    this.observer = null;
  }

  $(id) { return this.root.querySelector(`#${id}`); }

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

  isImageInHiddenFolder(relPath) {
    const parts = relPath.replace(/\\/g, '/').split('/');
    parts.pop(); // Remove filename

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

    this.injectMenuButton();
    this.bindEvents();

    const savedView = localStorage.getItem('comfy_folder_browser_view') || 'grid';
    this.setViewMode(savedView);

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

  injectMenuButton() {
    const updateButtonPlacement = (isAppMode = false) => {
      let menuBtn = document.getElementById("cfob-launcher-btn");
      if (!menuBtn) {
        menuBtn = document.createElement("button");
        menuBtn.id = "cfob-launcher-btn";
        menuBtn.innerHTML = ICONS.logo;
        menuBtn.title = "Browse Outputs";
        menuBtn.onclick = () => {
          this.root.style.display = "flex";
          this.fetchServerImages();
        };
      }
      if (isAppMode) {
        menuBtn.className = "floating";
        document.body.appendChild(menuBtn);
      } else {
        const standardMenuTarget = app.menu?.actionsGroup?.element || app.menu?.settingsGroup?.element || document.querySelector(".comfy-menu");
        menuBtn.className = "bg-secondary-background border-none hover:bg-secondary-background-hover inline-flex items-center justify-center size-8";
        menuBtn.style.border = "4px";
        standardMenuTarget.appendChild(menuBtn);
      }
    };

    updateButtonPlacement();

    const observer = new MutationObserver(() => {
      const isAppMode = document.getElementById('graph-canvas-container')?.style.display === 'none';
      updateButtonPlacement(isAppMode);
    });
    observer.observe(document.getElementById('graph-canvas-container'), { attributes: true });
  }

  bindEvents() {
    this.$("cfobCloseBrowserBtn").addEventListener('click', () => this.root.style.display = "none");
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

    // Action Bar Setup
    this.$("cfobActionClear").addEventListener('click', () => this.clearSelection());
    this.$("cfobActionDelete").addEventListener('click', () => this.deleteSelected());
    this.$("cfobActionRename").addEventListener('click', () => this.renameSelected());
    this.$("cfobActionDownload").addEventListener('click', () => this.downloadSelected());
    this.$("cfobActionOpen").addEventListener('click', () => this.loadWorkflowSelected());
    this.$("cfobActionInspect").addEventListener('click', () => this.inspectSelected());

    // View Toggles
    this.root.querySelectorAll('.view-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.setViewMode(e.currentTarget.dataset.view));
    });

    // Drag & Drop
    const mainCont = this.$("cfobMainContainer");
    ['dragenter', 'dragover'].forEach(evt => mainCont.addEventListener(evt, (e) => { e.preventDefault(); mainCont.classList.add('dragover'); }));
    ['dragleave', 'drop'].forEach(evt => mainCont.addEventListener(evt, (e) => { e.preventDefault(); mainCont.classList.remove('dragover'); }));
    mainCont.addEventListener('drop', (e) => {
      if (e.dataTransfer.files.length) this.handleLocalFiles(e.dataTransfer.files);
    });

    // Global Popover Dismiss
    document.addEventListener('click', (e) => {
      if (this.activePopover && !this.activePopover.contains(e.target)) {
        this.activePopover.remove();
        this.activePopover = null;
      }
    });

    // Global Keydowns
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

    // Config Modal Setup
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

    // Inspector Modal Setup
    this.$("cfobCloseInspectorBtn").addEventListener('click', () => this.$("cfobInspectorModal").classList.remove('active'));
    this.root.querySelectorAll('#cfobInspectorTabs .tab').forEach(tab => {
      tab.addEventListener('click', () => {
        this.root.querySelectorAll('#cfobInspectorTabs .tab').forEach(t => t.classList.remove('active'));
        this.root.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        this.$(tab.dataset.target).classList.add('active');
      });
    });

    // Hidden Folders Modal Bindings
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

    // Full View Controls
    this.$("cfobCloseFullViewBtn").addEventListener('click', () => this.closeFullView());
    this.$("cfobToggleSidebarBtn").addEventListener('click', () => this.$("cfobFullViewSidebar").classList.toggle('collapsed'));
    this.$("cfobPrevImgBtn").addEventListener('click', () => this.navigateImage(-1));
    this.$("cfobNextImgBtn").addEventListener('click', () => this.navigateImage(1));

    // Full View Action Bar Bindings
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
  }

  showToast(msg) {
    const t = this.$("cfobToastNotice");
    t.innerText = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2000);
  }

  setViewMode(mode) {
    this.root.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
    this.root.querySelector(`.view-btn[data-view="${mode}"]`).classList.add('active');
    this.$("cfobGalleryGrid").className = `gallery-container view-${mode}`;
    localStorage.setItem('comfy_folder_browser_view', mode);
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
        this.loadedImages.sort((a, b) => allFiles.indexOf(a.name) - allFiles.indexOf(b.name));

        const validNames = new Set(this.loadedImages.map(img => img.name));
        for (const sel of this.selectedImages) {
          if (!validNames.has(sel)) this.selectedImages.delete(sel);
        }

        this.updateActionBar();
        this.renderGallery();
      } else if (isFirstLoad) {
        this.renderGallery();
      }
    } catch (err) {
      this.$("cfobEmptyStateTitle").innerText = "Connection Error";
      this.$("cfobEmptyStateDesc").innerText = "Failed to load outputs from server.";
      this.$("cfobEmptyState").style.display = "block";
      console.error("Output Browser Error:", err);
    }
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
    this.renderGallery();
  }

  async processPngFile(file) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const meta = await this.parsePngBuffer(arrayBuffer);
      if (!meta) return null;

      return {
        name: file.name,
        url: URL.createObjectURL(file),
        prompt: meta.prompt,
        workflow: meta.workflow,
        isParsed: true
      };
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
      const res = await fetch(img.url);
      const buffer = await res.arrayBuffer();
      const meta = await this.parsePngBuffer(buffer) || { prompt: null, workflow: null };
      img.prompt = meta.prompt;
      img.workflow = meta.workflow;
      img.isParsed = true;
    } catch (e) {
      console.warn(`Failed to parse remote file: ${img.name}`, e);
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

    // Check if any selected items are already in the trash directory
    const hasTrashedItems = files.some(f => f.replace(/\\/g, '/').startsWith('.trash/'));
    const confirmMsg = hasTrashedItems
      ? `Permanently delete ${files.length} selected image(s)? This cannot be undone.`
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
        this.clearSelection();
        this.renderGallery();

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
          }
          this.clearSelection();
          this.renderGallery();
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
          data.moved.forEach(m => {
            const img = this.loadedImages.find(i => i.name === m.old_name);
            if (img) {
              img.name = m.new_name;
              img.url = this.getImageUrl(m.new_name);
            }
          });
          this.clearSelection();
          this.renderGallery();
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

  async loadWorkflowSelected() {
    if (this.selectedImages.size !== 1) return;
    const filename = Array.from(this.selectedImages)[0];
    const img = this.loadedImages.find(i => i.name === filename);
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
        img.name = data.new_name;
        img.url = this.getImageUrl(data.new_name);
        this.renderGallery();
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
        this.loadedImages = this.loadedImages.filter(i => i.name !== img.name);
        this.renderGallery();
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

  renderGallery() {
    const grid = this.$("cfobGalleryGrid");
    grid.innerHTML = '';

    if (this.observer) this.observer.disconnect();

    if (!this.loadedImages.length) {
      this.$("cfobEmptyStateTitle").innerText = "No Images Loaded";
      this.$("cfobEmptyStateDesc").innerText = "Click Refresh to load ComfyUI outputs, or drop PNGs anywhere to inspect.";
      this.$("cfobEmptyState").style.display = 'block';
      this.$("cfobImageCount").innerText = "(0)";
      return;
    }

    this.$("cfobEmptyState").style.display = 'none';

    this.loadedImages.forEach((img, idx) => {
      const card = document.createElement('div');
      card.className = `image-card ${this.selectedImages.has(img.name) ? 'selected' : ''}`;
      card.dataset.index = idx;
      card.dataset.name = img.name;

      card.innerHTML = `<div class="checkbox-wrapper" title="Select (Shift-click for range)">
                          <input type="checkbox" class="card-checkbox" value="${this.escapeHtml(img.name)}">
                        </div>
                        <img class="card-preview" src="${img.url}" loading="lazy" title="Click to view full image">
                        <div class="card-content-wrapper">
                          <div class="card-header">
                            <span class="card-filename" title="${this.escapeHtml(img.name)}">${this.escapeHtml(img.name)}</span>
                          </div>
                          <div class="card-toggle-bar" title="Toggle Details"><span>Metadata Details</span>${ICONS.toggle}</div>
                          <div class="card-body">${this.getCardFieldsHtml(img)}</div>
                        </div>`;

      const cb = card.querySelector('.card-checkbox');
      cb.checked = this.selectedImages.has(img.name);
      cb.addEventListener('click', (e) => this.handleCheckboxClick(e, img.name));

      card.querySelector('.card-preview').addEventListener('click', () => this.openFullView(img));
      card.querySelector('.card-toggle-bar').addEventListener('click', () => {
        if (card.classList.contains('selected') && this.selectedImages.size > 1) {
          this.root.querySelectorAll('.image-card.selected').forEach(c => c.classList.toggle('expanded'));
        } else {
          card.classList.toggle('expanded');
        }
      });

      card.querySelector('.card-body').addEventListener('click', (e) => {
        const btn = e.target.closest('.copy-val-btn');
        if (btn) {
          e.stopPropagation();
          this.copyValue(btn, btn.dataset.val);
        }
      });

      grid.appendChild(card);

      if (!img.isParsed && this.observer) {
        this.observer.observe(card);
      }
    });

    this.filterGallery();
  }

  filterGallery() {
    const rawQ = this.$("cfobSearchInput").value.toLowerCase().trim();
    const clearBtn = this.$("cfobClearSearchBtn");
    if (clearBtn) clearBtn.style.display = rawQ ? "flex" : "none";
    this.filteredImages = [];

    const includeHiddenBySearch = rawQ.startsWith('.');

    const orGroups = rawQ.split(',').map(group =>
      group.trim().split(/\s+/).filter(Boolean)
    ).filter(group => group.length > 0);

    this.root.querySelectorAll('.image-card').forEach(card => {
      const img = this.loadedImages[card.dataset.index];

      if (!this.showHiddenFolders && !includeHiddenBySearch && this.isImageInHiddenFolder(img.name)) {
        card.style.display = 'none';
        return;
      }

      if (orGroups.length === 0) {
        card.style.display = 'flex';
        this.filteredImages.push(img);
        return;
      }

      const textToSearch = (img.name + ' ' + (img.prompt ? JSON.stringify(img.prompt) : '')).toLowerCase();

      const matches = orGroups.some(group => {
        return group.every(term => {
          if (term.startsWith('!')) {
            const excludeWord = term.slice(1);
            return excludeWord ? !textToSearch.includes(excludeWord) : true;
          } else {
            return textToSearch.includes(term);
          }
        });
      });

      card.style.display = matches ? 'flex' : 'none';
      if (matches) this.filteredImages.push(img);
    });

    const countEl = this.$("cfobImageCount");
    if (countEl) {
      if (this.filteredImages.length === this.loadedImages.length) {
        countEl.innerText = `(${this.loadedImages.length})`;
      } else {
        countEl.innerText = `(${this.filteredImages.length} / ${this.loadedImages.length})`;
      }
    }
  }

  copyValue(btn, encText) {
    const temp = document.createElement('textarea');
    temp.value = decodeURIComponent(encText);
    document.body.appendChild(temp);
    temp.select();
    document.execCommand('copy');
    document.body.removeChild(temp);

    btn.innerHTML = ICONS.check;
    setTimeout(() => { btn.innerHTML = ICONS.copy; }, 1500);
  }

  openAddPathMenu(e, safePath) {
    e.stopPropagation();
    if (this.activePopover) this.activePopover.remove();

    const rect = e.currentTarget.getBoundingClientRect();
    const menu = document.createElement('div');
    menu.className = 'popover-menu';
    menu.style.top = `${rect.bottom + 4}px`;
    menu.style.left = `${Math.min(rect.left, window.innerWidth - 220)}px`;

    let html = `<div class="popover-header">Add Path To Field:</div>`;
    this.fieldConfigs.forEach((cfg, i) => html += `<button class="popover-item append-path" data-idx="${i}" data-path="${safePath}"><span>${this.escapeHtml(cfg.label)}</span></button>`);
    html += `<div style="border-top: 1px solid var(--border); margin: 4px 0;"></div><button class="popover-item new-path" data-path="${safePath}"><span style="color: var(--link);">+ Create New Field</span></button>`;

    menu.innerHTML = html;
    this.root.appendChild(menu);
    this.activePopover = menu;

    menu.querySelectorAll('.append-path').forEach(b => {
      b.addEventListener('click', () => {
        const field = this.fieldConfigs[b.dataset.idx];
        const p = b.dataset.path;
        if (!field.paths?.includes(p)) {
          field.paths = field.paths ? `${field.paths}, ${p}` : p;
          this.saveConfig(this.fieldConfigs);
          this.renderGallery();
          this.showToast(`Added to '${field.label}'`);
        }
        this.activePopover.remove(); this.activePopover = null;
      });
    });

    menu.querySelector('.new-path').addEventListener('click', () => {
      const lbl = prompt("Enter a label for the new card field:", "Custom Field");
      if (lbl) {
        this.fieldConfigs.push({ label: lbl, paths: menu.querySelector('.new-path').dataset.path });
        this.saveConfig(this.fieldConfigs);
        this.renderGallery();
        this.showToast(`Created field '${lbl}'`);
      }
      this.activePopover.remove(); this.activePopover = null;
    });
  }

  openConfigModal() {
    const list = this.$("cfobConfigFieldsList");
    list.innerHTML = '';

    this.fieldConfigs.forEach((cfg, idx) => {
      const div = document.createElement('div');
      div.className = 'config-field-item';
      div.innerHTML = ` <div class="config-field-header">
                          <input type="text" class="config-input field-label-input" value="${this.escapeHtml(cfg.label)}" style="flex: 1;">
                          <button class="icon-btn del-cfg-btn">${ICONS.close}</button>
                        </div>
                        <textarea class="config-paths-textarea field-paths-input">${this.escapeHtml(cfg.paths)}</textarea>`;

      div.querySelector('.del-cfg-btn').addEventListener('click', () => {
        this.fieldConfigs.splice(idx, 1);
        this.openConfigModal();
      });
      list.appendChild(div);
    });

    this.$("cfobConfigModal").classList.add('active');
  }

  async openInspector(idx) {
    const img = this.loadedImages[idx];

    if (!img.isParsed) {
      this.$("cfobInspectorTitle").innerText = `Loading Metadata...`;
      await this.loadMetadata(img);
    }

    this.$("cfobInspectorTitle").innerText = `Metadata: ${img.name}`;
    this.$("cfobInsPromptText").value = img.prompt ? JSON.stringify(img.prompt, null, 2) : 'No API Prompt Metadata';
    this.$("cfobInsWorkflowText").value = img.workflow ? JSON.stringify(img.workflow, null, 2) : 'No UI Workflow Metadata';

    const grid = this.$("cfobInsNodesGrid");
    grid.innerHTML = '';

    if (img.workflow?.nodes) {
      img.workflow.nodes.forEach(node => {
        const titleText = node.title || node.type || node.id;
        let html = `<div class="node-card"><div class="node-header"><div class="node-title">${this.escapeHtml(titleText)}</div><span class="node-id">#${node.id}</span></div><div class="node-body">`;

        let w = [];
        if (node.widgets_values_named) Object.entries(node.widgets_values_named).forEach(([key, val]) => w.push({ key, val }));
        else if (node.widgets_values) node.widgets_values.forEach((val, i) => w.push({ key: `widget[${i}]`, val }));

        if (w.length > 0) {
          w.forEach(({ key, val }) => {
            const pPath = this.escapeHtml(`${titleText}.${key}`);
            const sVal = encodeURIComponent(typeof val === 'object' ? JSON.stringify(val) : String(val));
            html += `<div class="input-row"><div class="input-header"><span class="input-name">${this.escapeHtml(key)}</span><div class="input-actions"><button class="btn btn-xs cp-val" data-val="${sVal}">${ICONS.copy}</button><button class="btn btn-xs btn-primary field-add" data-path="${pPath}">+ Field</button></div></div><div class="input-value-wrapper"><div class="input-value-text">${this.escapeHtml(decodeURIComponent(sVal))}</div></div></div>`;
          });
        } else {
          html += `<i style="color:#666">No widgets</i>`;
        }
        grid.innerHTML += html + `</div></div>`;
      });
    } else if (img.prompt) {
      for (const [id, node] of Object.entries(img.prompt)) {
        const titleText = node._meta?.title || node.class_type || 'Unknown Node';
        let html = `<div class="node-card"><div class="node-header"><div class="node-title">${this.escapeHtml(titleText)}<small>${this.escapeHtml(node.class_type)}</small></div><span class="node-id">#${id}</span></div><div class="node-body">`;

        if (node.inputs && Object.keys(node.inputs).length > 0) {
          for (const [key, val] of Object.entries(node.inputs)) {
            const pPath = this.escapeHtml(`${titleText}.${key}`);
            if (Array.isArray(val) && val.length >= 2 && typeof val[0] === 'string' && !isNaN(val[1])) {
              html += `<div class="input-row"><div class="input-header"><span class="input-name">${this.escapeHtml(key)}</span></div><span style="color: var(--link); font-style: italic; font-size: 11px;">➔ Connected to #${val[0]}</span></div>`;
            } else {
              const sVal = encodeURIComponent(typeof val === 'object' ? JSON.stringify(val) : String(val));
              html += `<div class="input-row"><div class="input-header"><span class="input-name">${this.escapeHtml(key)}</span><div class="input-actions"><button class="btn btn-xs cp-val" data-val="${sVal}">${ICONS.copy}</button><button class="btn btn-xs btn-primary field-add" data-path="${pPath}">➕ Field</button></div></div><div class="input-value-wrapper"><div class="input-value-text">${this.escapeHtml(decodeURIComponent(sVal))}</div></div></div>`;
            }
          }
        } else {
          html += `<i style="color:#666">No inputs</i>`;
        }
        grid.innerHTML += html + `</div></div>`;
      }
    }

    grid.querySelectorAll('.cp-val').forEach(b => b.addEventListener('click', (e) => this.copyValue(e.currentTarget, e.currentTarget.dataset.val)));
    grid.querySelectorAll('.field-add').forEach(b => b.addEventListener('click', (e) => this.openAddPathMenu(e, e.currentTarget.dataset.path)));

    this.$("cfobInspectorModal").classList.add('active');
  }

  toggleOptionsMenu(e) {
    e.stopPropagation();
    if (this.activePopover) {
      this.activePopover.remove();
      this.activePopover = null;
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const menu = document.createElement('div');
    menu.className = 'popover-menu';
    menu.style.top = `${rect.bottom + 6}px`;
    menu.style.right = `${window.innerWidth - rect.right}px`;
    menu.style.left = 'auto';

    menu.innerHTML = `
      <button class="popover-item" id="cfobMenuToggleHidden">
        <span>Show Hidden Folders</span>
        <span>${this.showHiddenFolders ? ICONS.check : ''}</span>
      </button>
      <div style="border-top: 1px solid var(--border); margin: 4px 0;"></div>
      <button class="popover-item" id="cfobMenuCardFields">
        <span>${ICONS.pane} Card Fields</span>
      </button>
      <button class="popover-item" id="cfobMenuHiddenFolders">
        <span>${ICONS.hidden} Hidden Folders</span>
      </button>
    `;

    this.root.appendChild(menu);
    this.activePopover = menu;

    menu.querySelector('#cfobMenuToggleHidden').addEventListener('click', () => {
      this.showHiddenFolders = !this.showHiddenFolders;
      localStorage.setItem('comfy_folder_browser_show_hidden', this.showHiddenFolders);
      this.filterGallery();
      this.showToast(this.showHiddenFolders ? "Showing hidden folders" : "Hiding hidden folders");
      this.activePopover.remove();
      this.activePopover = null;
    });

    menu.querySelector('#cfobMenuCardFields').addEventListener('click', () => {
      this.openConfigModal();
      this.activePopover.remove();
      this.activePopover = null;
    });

    menu.querySelector('#cfobMenuHiddenFolders').addEventListener('click', () => {
      this.openHiddenFoldersModal();
      this.activePopover.remove();
      this.activePopover = null;
    });
  }

  openHiddenFoldersModal() {
    this.$("cfobHiddenFoldersInput").value = this.hiddenFolders.join('\n');
    this.$("cfobHiddenFoldersModal").classList.add('active');
  }

  async openFullView(img) {
    if (!img) return;
    this.currentImageIndex = this.filteredImages.indexOf(img);
    if (this.currentImageIndex === -1) this.currentImageIndex = 0;

    this.$("cfobFullViewImg").src = img.url;
    this.$("cfobFullViewTitle").innerText = img.name;
    this.$("cfobFullViewCount").innerText = `${this.currentImageIndex + 1} / ${this.filteredImages.length}`;

    this.$("cfobFullViewModal").classList.add('active');

    const fieldsContainer = this.$("cfobFullViewFields");

    if (!img.isParsed) {
      fieldsContainer.innerHTML = '<div style="padding: 20px; color: #a1a1aa; text-align: center;">Loading metadata...</div>';
      await this.loadMetadata(img);
    }

    fieldsContainer.innerHTML = this.getCardFieldsHtml(img);
  }

  closeFullView() {
    this.$("cfobFullViewModal").classList.remove('active');
    this.$("cfobFullViewImg").src = '';
  }

  navigateImage(dir) {
    if (!this.filteredImages.length) return;
    this.currentImageIndex = (this.currentImageIndex + dir + this.filteredImages.length) % this.filteredImages.length;
    this.openFullView(this.filteredImages[this.currentImageIndex]);
  }
}

app.registerExtension({
  name: "Comfy.OutputBrowser",
  setup() {
    const outputBrowser = new ComfyOutputBrowser();
    outputBrowser.init();
  }
});
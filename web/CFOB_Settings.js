import ICONS from "./assets/icons.js";
import CFOB_Modal from "./CFOB_Modal.js";
export const CFOB_SETTINGS_MODALS_STYLES = /*css*/ `
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

  #cfob-root .modal-overlay { position: fixed; inset: 0; background: var(--color-bg-overlay); backdrop-filter: blur(4px); display: none; justify-content: center; align-items: center; z-index: var(--z-modal); padding: 1.25em; }
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

  #cfob-root .inspector-json-view { width: 100%; height: 30em; box-sizing: border-box; overflow: auto; background: var(--color-bg-input); color: var(--color-syntax-string); border: 1px solid var(--color-border); padding: 0.75em; border-radius: var(--radius-md); }
  #cfob-root .inspector-json-view pre { margin: 0; font-family: var(--font-mono); font-size: 0.8125em; white-space: pre; }
  #cfob-root .inspector-json-key { color: var(--color-syntax-key); background: transparent; border: 0; padding: 0; font: inherit; cursor: pointer; }
  #cfob-root .inspector-json-key:hover, #cfob-root .inspector-json-key.selected { text-decoration: underline; color: var(--color-accent); }
  #cfob-root .inspector-json-key:focus-visible { outline: 1px solid var(--color-accent); }
  #cfob-root .inspector-json-actions { display: none; position: sticky; top: -0.75em; z-index: 1; align-items: center; gap: 0.5em; background: var(--color-bg-input); border-bottom: 1px solid var(--color-border); margin: -0.75em -0.75em 0.5em; padding: 0.5em 0.75em; }
  #cfob-root .inspector-json-actions.active { display: flex; }
  #cfob-root .inspector-json-selected-path { color: var(--color-text-muted); font-family: var(--font-mono); font-size: 0.75em; overflow-wrap: anywhere; }

  #cfob-root .popover-menu { position: fixed; background: var(--color-bg-popover); border: 1px solid var(--color-border); border-radius: var(--radius-lg); box-shadow: 0 0.625em 1.5625em rgba(0,0,0,0.6); padding: 0.5em; z-index: var(--z-popover); display: flex; flex-direction: column; gap: 0.5em; min-width: 15em; max-width: 20em; }
  #cfob-root .popover-header { font-size: 0.625em; font-weight: 700; color: var(--color-text-muted); padding: 0.125em 0.25em; text-transform: uppercase; letter-spacing: 0.5px; }
  #cfob-root .popover-item { padding: 0.3em; font-size: 0.75em; color: var(--color-text-inverse); background: transparent; border: none; text-align: left; border-radius: var(--radius-sm); cursor: pointer; display: flex; align-items: center; justify-content: space-between; width: 100%; transition: background 0.15s; }
  #cfob-root .popover-item:hover { background: var(--color-bg-panel-hover); color: var(--color-accent); }

  #cfob-root .options-modal-content { max-width: 42em; }
  #cfob-root .options-tabs { display: flex; flex-wrap: wrap; gap: 0.25em; padding: 0.75em 1.25em 0; border-bottom: 1px solid var(--color-border); }
  #cfob-root .options-tab { border: 0; border-bottom: 2px solid transparent; border-radius: var(--radius-sm) var(--radius-sm) 0 0; padding: 0.625em 1em; background: transparent; color: var(--color-text-muted); font: inherit; cursor: pointer; }
  #cfob-root .options-tab:hover { background: var(--color-bg-panel-hover); color: var(--color-text-primary); }
  #cfob-root .options-tab.active { border-bottom-color: var(--color-accent); color: var(--color-text-inverse); }
  #cfob-root .options-tab:focus-visible { outline: 2px solid var(--color-accent); outline-offset: -2px; }
  #cfob-root .options-modal-body { padding: 1.25em; }
  #cfob-root .options-tab-panel { display: none; flex-direction: column; gap: 1em; }
  #cfob-root .options-tab-panel.active { display: flex; }
  #cfob-root .options-section { display: flex; flex-direction: column; gap: 0.5em; }
  #cfob-root .options-section-title { margin: 0; color: var(--color-text-muted); font-size: 0.75em; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; }
  #cfob-root .options-setting { display: flex; align-items: center; justify-content: space-between; gap: 1em; padding: 0.625em 0.75em; border: 1px solid var(--color-border); border-radius: var(--radius-md); background: var(--color-bg-surface); font-size: 0.8125em; }
  #cfob-root .options-setting > label:first-child { color: var(--color-text-primary); }
  #cfob-root .options-slider-setting { align-items: stretch; flex-direction: column; gap: 0.5em; }
  #cfob-root .options-slider-heading { display: flex; justify-content: space-between; align-items: center; gap: 0.75em; }
  #cfob-root .options-slider-value { color: var(--color-text-muted); font-variant-numeric: tabular-nums; }
  #cfob-root .options-slider { width: 100%; accent-color: var(--color-accent); cursor: pointer; }
  #cfob-root .options-slider:disabled { cursor: not-allowed; opacity: 0.45; }
  #cfob-root .options-control { max-width: 15em; background: var(--color-bg-base); border: 1px solid var(--color-border); color: var(--color-text-primary); border-radius: var(--radius-sm); padding: 0.375em 0.5em; font: inherit; }
  #cfob-root .options-toggle { justify-content: flex-start; width: 100%; color: var(--color-text-primary); text-align: left; cursor: pointer; }
  #cfob-root .options-toggle:hover { border-color: var(--color-border-hover); background: var(--color-bg-panel-hover); }
  #cfob-root .options-toggle-status { margin-left: auto; color: var(--color-text-muted); font-weight: 600; }
  #cfob-root .options-toggle-status.enabled { color: var(--color-success); }
  #cfob-root .options-view-toggles { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); background: var(--color-bg-base); border: 1px solid var(--color-border); border-radius: var(--radius-md); overflow: hidden; width: 100%; }
  #cfob-root .options-view-toggles .view-btn { display: flex; align-items: center; justify-content: center; gap: 0.375em; padding: 0.625em 0.5em; border: 0; border-right: 1px solid var(--color-border); background: transparent; color: var(--color-text-muted); cursor: pointer; font-size: 0.8125em; }
  #cfob-root .options-view-toggles .view-btn:nth-child(2n) { border-right: 0; }
  #cfob-root .options-view-toggles .view-btn:nth-child(n+3) { border-top: 1px solid var(--color-border); }
  #cfob-root .options-view-toggles .view-btn:hover, #cfob-root .options-view-toggles .view-btn.active { background: var(--color-bg-panel-hover); color: var(--color-accent); }

  #cfob-root .folder-list { display: flex; flex-wrap: wrap; gap: 0.375em; max-height: 10em; overflow-y: auto; margin-top: 0.5em; padding-top: 0.75em; border-top: 1px solid var(--color-border-light); }
  #cfob-root .folder-chip { background: var(--color-bg-panel-hover); border: 1px solid var(--color-border); padding: 0.375em 0.625em; border-radius: var(--radius-xl); font-size: 0.75em; cursor: pointer; color: var(--color-text-primary); transition: all 0.2s; display: inline-flex; align-items: center; gap: 0.25em; }
  #cfob-root .folder-chip:hover, #cfob-root .folder-chip.selected { background: var(--color-accent); color: white; border-color: var(--color-accent); }
  #cfob-root .folder-new-entry { display: flex; flex: 1 0 100%; gap: 0.375em; }
  #cfob-root .folder-new-entry .config-input { flex: 1; min-width: 0; }

  #cfob-root #cfobConfirmModal p { margin: 0; color: var(--color-text-primary); line-height: 1.4; }
  #cfob-root #cfobPromptModal p { margin: 0 0 0.75em 0; color: var(--color-text-primary); font-size: 0.875em; line-height: 1.4; }
  #cfob-root #cfobPromptModal .config-input { width: 100%; box-sizing: border-box; font-size: 1em; }
  #cfob-root #cfobPromptModal #cfobFolderListWrapper { display: none; }
  #cfob-root #cfobPromptModal #cfobFolderListWrapper .folder-header { font-size: 0.75em; font-weight: 600; color: var(--color-text-muted); margin-top: 1.25em; text-transform: uppercase; letter-spacing: 0.5px; }

  #cfob-root #cfobPromptThumbWrapper { display: none; align-items: center; gap: 0.75em; background: var(--color-bg-surface); border: 1px solid var(--color-border); padding: 0.2em; border-radius: var(--radius-md); }
  #cfob-root #cfobPromptThumbWrapper.active { display: flex; justify-content: center; }
  #cfob-root #cfobPromptThumbImg { max-width: 80%; max-height: 10em; border-radius: var(--radius-sm); border: 1px solid var(--color-border); background: var(--color-bg-base); }

  #cfob-root .tab:focus-visible, #cfob-root .folder-chip:focus-visible, #cfob-root .icon-btn:focus-visible { outline: 2px solid var(--color-accent); outline-offset: -2px; }
`;

export const CFOB_SETTINGS_MODALS_HTML = `
  <div class="modal-overlay" id="cfobOptionsModal" data-dialog-modal>
    <div class="modal-content options-modal-content">
      <div class="modal-header">${ICONS.more}<h3>Options</h3><button class="icon-btn" id="cfobCloseOptionsBtn" data-modal-dismiss aria-label="Close options">${ICONS.close}</button></div>
      <div class="options-tabs" id="cfobOptionsTabs" role="tablist" aria-label="Options categories">
        <button class="options-tab active" id="cfobDisplayTab" type="button" role="tab" aria-selected="true" aria-controls="cfobOptionsDisplay" tabindex="0" data-target="cfobOptionsDisplay">Display</button>
        <button class="options-tab" id="cfobLayoutTab" type="button" role="tab" aria-selected="false" aria-controls="cfobOptionsLayout" tabindex="-1" data-target="cfobOptionsLayout">Layout</button>
        <button class="options-tab" id="cfobFoldersTab" type="button" role="tab" aria-selected="false" aria-controls="cfobOptionsFolders" tabindex="-1" data-target="cfobOptionsFolders">Folders & Search</button>
        <button class="options-tab" id="cfobFieldsTab" type="button" role="tab" aria-selected="false" aria-controls="cfobOptionsFields" tabindex="-1" data-target="cfobOptionsFields">Custom Fields</button>
      </div>
      <div class="modal-body options-modal-body">
        <section class="options-tab-panel active" id="cfobOptionsDisplay" role="tabpanel" aria-labelledby="cfobDisplayTab">
          <div class="options-section">
            <h4 class="options-section-title">View Mode</h4>
            <div class="options-view-toggles">
              <button class="view-btn" data-view="compact" title="Compact Grid">${ICONS.gridSmall} Compact</button>
              <button class="view-btn" data-view="grid" title="Standard Grid">${ICONS.gridBig} Grid</button>
              <button class="view-btn" data-view="list" title="List View">${ICONS.gridList} List</button>
              <button class="view-btn" data-view="full" title="Full View">${ICONS.zoomReset} Full View</button>
            </div>
          </div>
          <div class="options-section">
            <h4 class="options-section-title">Appearance</h4>
            <div class="options-setting options-slider-setting">
              <div class="options-slider-heading"><label for="cfobScaleSlider">UI Scale</label><span class="options-slider-value" id="cfobScaleVal"></span></div>
              <input type="range" class="options-slider" id="cfobScaleSlider" min="0.7" max="1.4" step="0.05">
            </div>
            <div class="options-setting options-slider-setting">
              <div class="options-slider-heading"><label for="cfobGridSizeSlider">Image Size</label><span class="options-slider-value" id="cfobGridSizeVal"></span></div>
              <input type="range" class="options-slider" id="cfobGridSizeSlider" min="20" max="800" step="10">
            </div>
            <button class="options-setting options-toggle" id="cfobToggleMasonryBtn" type="button"><span>Masonry Grid</span><span class="options-toggle-status" id="cfobMasonryStatus"></span></button>
            <div class="options-setting"><label for="cfobScrollDirectionSelect">Scroll Direction</label>
              <select class="options-control" id="cfobScrollDirectionSelect"><option value="vertical">Vertical</option><option value="horizontal">Horizontal</option></select>
            </div>
            <div class="options-setting"><label for="cfobGridFillOrderSelect">Grid Fill Order</label>
              <select class="options-control" id="cfobGridFillOrderSelect"><option value="row">Row first</option><option value="column">Column first</option></select>
            </div>
          </div>
        </section>
        <section class="options-tab-panel" id="cfobOptionsLayout" role="tabpanel" aria-labelledby="cfobLayoutTab">
         <div class="options-section">
            <h4 class="options-section-title">Behavior</h4>
            <div class="options-setting"><label for="cfobSortSelect">Sort By</label>
              <select class="options-control" id="cfobSortSelect">
                <option value="default">Server Order</option><option value="name_asc">Name (A-Z)</option><option value="name_desc">Name (Z-A)</option><option value="mtime_asc">Older First</option><option value="mtime_desc">Newer First</option>
              </select>
            </div>
            <button class="options-setting options-toggle" id="cfobToggleHiddenBtn" type="button"><span>Hidden Folders</span><span class="options-toggle-status" id="cfobHiddenStatus"></span></button>
          </div>
          <div class="options-section">
            <h4 class="options-section-title">Panel</h4>
            <div class="options-setting"><label for="cfobModeSelect">Position</label>
              <select class="options-control" id="cfobModeSelect">
                <option value="full">Full Screen</option><option value="right">Right Drawer</option><option value="left">Left Drawer</option><option value="down">Bottom Drawer</option><option value="up">Top Drawer</option>
              </select>
            </div>
            <div class="options-setting options-slider-setting">
              <div class="options-slider-heading"><label for="cfobPanelWidthSlider">Panel Width</label><span class="options-slider-value" id="cfobPanelWidthVal"></span></div>
              <input type="range" class="options-slider" id="cfobPanelWidthSlider" min="300" step="10" aria-describedby="cfobPanelSizeHint">
            </div>
            <div class="options-setting options-slider-setting">
              <div class="options-slider-heading"><label for="cfobPanelHeightSlider">Panel Height</label><span class="options-slider-value" id="cfobPanelHeightVal"></span></div>
              <input type="range" class="options-slider" id="cfobPanelHeightSlider" min="200" step="10" aria-describedby="cfobPanelSizeHint">
            </div>
            <p id="cfobPanelSizeHint" style="margin: 0; color: var(--color-text-muted); font-size: 0.75em;">Width applies to left and right drawers; height applies to top and bottom drawers.</p>
            <button class="options-setting options-toggle" id="cfobToggleAutoHideBtn" type="button"><span>Auto-Hide Panel</span><span class="options-toggle-status" id="cfobAutoHideStatus"></span></button>
            <button class="options-setting options-toggle" id="cfobToggleConstrainFullViewBtn" type="button"><span>Constrain Full View to Panel</span><span class="options-toggle-status" id="cfobConstrainStatus"></span></button>
          </div>
        </section>
        <section class="options-tab-panel" id="cfobOptionsFolders" role="tabpanel" aria-labelledby="cfobFoldersTab">
          <div class="options-section">
            <h4 class="options-section-title">Hidden Paths</h4>
            <p style="font-size: 0.8125em; color: var(--color-text-muted); margin: 0;">Specify folder names or path keywords to hide (one per line or comma-separated). Folders starting with <code>.</code> are automatically hidden when hidden folders are toggled off.</p>
            <textarea id="cfobHiddenFoldersInput" class="config-paths-textarea" style="height: 7em; width: 100%;" placeholder="temp&#10;trash&#10;drafts"></textarea>
            <div style="display: flex; justify-content: flex-end; gap: 0.5em;">
              <button class="btn btn-danger" id="cfobResetHiddenFoldersBtn" type="button">Reset Defaults</button>
              <button class="btn btn-primary" id="cfobSaveHiddenFoldersBtn" type="button">Save Hidden Paths</button>
            </div>
          </div>
          <div class="options-section">
            <h4 class="options-section-title">Filter Shortcuts</h4>
            <p style="font-size: 0.8125em; color: var(--color-text-muted); margin: 0;">Define one shortcut per line as <code>keyword | filter</code>, then use it in search with <code>@keyword</code>. Filters can use commas for alternatives. Example: <code>animals | dog, cat, wolf</code>.</p>
            <textarea id="cfobFilterShortcutsInput" class="config-paths-textarea" style="height: 9em; width: 100%;" placeholder="animals | dog, cat, wolf"></textarea>
            <div style="display: flex; justify-content: flex-end; gap: 0.5em;">
              <button class="btn btn-primary" id="cfobSaveFilterShortcutsBtn" type="button">Save Shortcuts</button>
            </div>
          </div>
          <div class="options-section">
            <h4 class="options-section-title">Autocomplete Keywords to Ignore</h4>
            <p style="font-size: 0.8125em; color: var(--color-text-muted); margin: 0;">Hide exact keywords from search autocomplete (one per line or comma-separated). This does not affect filtering.</p>
            <textarea id="cfobIgnoredKeywordsInput" class="config-paths-textarea" style="height: 7em; width: 100%;" placeholder="No ignored keywords"></textarea>
            <div style="display: flex; justify-content: flex-end; gap: 0.5em;">
              <button class="btn btn-danger" id="cfobResetIgnoredKeywordsBtn" type="button">Clear Keywords</button>
              <button class="btn btn-primary" id="cfobSaveIgnoredKeywordsBtn" type="button">Save Keywords</button>
            </div>
          </div>
        </section>
        <section class="options-tab-panel" id="cfobOptionsFields" role="tabpanel" aria-labelledby="cfobFieldsTab">
          <div class="options-section">
            <h4 class="options-section-title">Customize Image Details Card Fields</h4>
            <p style="font-size: 0.8125em; color: var(--color-text-muted); margin: 0;">Define custom card fields. Enter fallback paths separated by commas or newlines. Examples: <code>Positive Prompt.text</code>, <code>KSampler.seed</code>, <code>6.inputs.text</code>.</p>
            <div id="cfobConfigFieldsList" style="display: flex; flex-direction: column; gap: 0.75em;"></div>
            <div style="display: flex; justify-content: space-between; gap: 0.5em;">
              <button class="btn" id="cfobAddFieldBtn" type="button">+ Add Field</button>
              <div style="display: flex; gap: 0.5em;">
                <button class="btn btn-danger" id="cfobResetConfigBtn" type="button">Reset Defaults</button>
                <button class="btn btn-primary" id="cfobSaveConfigBtn" type="button">Save</button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>

  <div class="modal-overlay" id="cfobInspectorModal" data-dialog-modal>
    <div class="modal-content">
      <div class="modal-header">${ICONS.inspect}<h3 id="cfobInspectorTitle">Image Metadata Inspector</h3><button class="icon-btn" id="cfobCloseInspectorBtn" data-modal-dismiss>${ICONS.close}</button></div>
      <div class="modal-body">
        <div class="tabs" id="cfobInspectorTabs">
          <div class="tab active" data-target="cfobInsNodes" tabindex="0">Visual Nodes View</div>
          <div class="tab" data-target="cfobInsPrompt" tabindex="0">API Prompt (JSON)</div>
          <div class="tab" data-target="cfobInsWorkflow" tabindex="0">UI Workflow (JSON)</div>
        </div>
        <div class="tab-content active" id="cfobInsNodes"><div class="nodes-grid" id="cfobInsNodesGrid"></div></div>
        <div class="tab-content" id="cfobInsPrompt"><div class="inspector-json-view" id="cfobInsPromptView"></div></div>
        <div class="tab-content" id="cfobInsWorkflow"><div class="inspector-json-view" id="cfobInsWorkflowView"></div></div>
      </div>
    </div>
  </div>

  <!-- Custom Confirm Modal -->
  <div class="modal-overlay" id="cfobConfirmModal" data-dialog-modal>
    <div class="modal-content">
      <div class="modal-header">
        <h3 id="cfobConfirmTitle">Confirm</h3>
        <button class="icon-btn" id="cfobConfirmCloseBtn" data-modal-cancel>${ICONS.close}</button>
      </div>
      <div class="modal-body"><p id="cfobConfirmMsg"></p></div>
      <div class="modal-footer">
        <button class="btn" id="cfobConfirmCancelBtn" data-modal-cancel>Cancel</button>
        <button class="btn" id="cfobConfirmOkBtn">Confirm</button>
      </div>
    </div>
  </div>

  <!-- Custom Prompt Modal with Folder List -->
  <div class="modal-overlay" id="cfobPromptModal" data-dialog-modal>
    <div class="modal-content">
      <div class="modal-header"><h3 id="cfobPromptTitle">Input Required</h3><button class="icon-btn" id="cfobPromptCloseBtn" data-modal-cancel>${ICONS.close}</button></div>
      <div class="modal-body">
        <div id="cfobPromptThumbWrapper">
          <img id="cfobPromptThumbImg" src="" alt="Image">
        </div>
        <p id="cfobPromptMsg"></p>
        <input type="text" id="cfobPromptInput" class="config-input" autocomplete="off">
        <div id="cfobFolderListWrapper">
          <div class="folder-header">Select Existing Folder</div>
          <div class="folder-list" id="cfobFolderList"></div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn" id="cfobPromptCancelBtn" data-modal-cancel>Cancel</button>
        <button class="btn btn-primary" id="cfobPromptOkBtn">Save</button>
      </div>
    </div>
  </div>
`;

export const DEFAULT_FIELDS = [
  { label: "Positive Prompt", paths: "Positive Prompt.text, CLIPTextEncode.text, 6.inputs.text, Preset Gallery.evaluated_preset" },
  { label: "Negative Prompt", paths: "Negative Prompt.text, CLIPTextEncode[1].text, 7.inputs.text" },
  { label: "Seed", paths: "KSampler.seed, KSamplerAdvanced.seed, 3.inputs.seed" },
  { label: "Steps / CFG", paths: "KSampler.steps, KSamplerAdvanced.steps" },
  { label: "Sampler", paths: "KSampler.sampler_name, KSamplerAdvanced.sampler_name" },
  { label: "Model", paths: "CheckpointLoaderSimple.ckpt_name, DualCLIPLoader.ckpt_name, 4.inputs.ckpt_name, UNETLoader.unet_name" }
];

export default class COB_Settings {
  /** @param {import("./ComfyOutputBrowser.js").default} app  */
  constructor(app) {
    this.app = app;
    this.modals = new CFOB_Modal(app);
    this.currentSort = localStorage.getItem('cfob_sort') || 'default';
    this.fieldConfigs = this.loadConfig();
    this.hiddenFolders = this.loadHiddenFoldersConfig();
    /** @type {string[]} */
    this.ignoredAutocompleteKeywords = this.loadIgnoredAutocompleteKeywords();
    /** @type {{keyword: string, filter: string}[]} */
    this.filterShortcuts = this.loadFilterShortcuts();
    this.showHiddenFolders = localStorage.getItem('comfy_folder_browser_show_hidden') === 'true';
    this.browserMode = localStorage.getItem('comfy_folder_browser_mode') || 'full';
    this.fullViewMode = localStorage.getItem('comfy_folder_browser_view') === 'full';
    this.constrainFullView = localStorage.getItem('cfob_constrain_full_view') === 'true';
    this.sidebarWidth = Number(localStorage.getItem('comfy_folder_browser_width') || 450);
    this.sidebarHeight = Number(localStorage.getItem('comfy_folder_browser_height') || 350);
    this.autoHide = localStorage.getItem('comfy_folder_browser_auto_hide') === 'true';
    this.gridSize = Number(localStorage.getItem('cfob_grid_size') || 380);
    this.masonryEnabled = localStorage.getItem('cfob_masonry_enabled') !== 'false';
    /** @type {'vertical' | 'horizontal'} */
    this.scrollDir = localStorage.getItem('cfob_scroll_dir') === 'horizontal' ? 'horizontal' : 'vertical';
    const savedGridFillOrder = localStorage.getItem('cfob_grid_fill_order');
    /** @type {'row' | 'column'} */
    this.gridFillOrder = savedGridFillOrder === 'column' ? 'column' : 'row';
    this.uiScale = Number(localStorage.getItem('cfob_ui_scale') || 1.0);

    /** @type {HTMLElement | null} */
    this.activePopover = null;
  }

  loadConfig() {
    const saved = localStorage.getItem('comfy_folder_browser_fields');
    return saved ? JSON.parse(saved) : JSON.parse(JSON.stringify(DEFAULT_FIELDS));
  }

  /**
   * @param {any[]} cfg
   */
  saveConfig(cfg) {
    this.fieldConfigs = cfg;
    localStorage.setItem('comfy_folder_browser_fields', JSON.stringify(cfg));
  }

  resetConfig() {
    this.saveConfig(JSON.parse(JSON.stringify(DEFAULT_FIELDS)));
  }

  loadHiddenFoldersConfig() {
    const saved = localStorage.getItem('comfy_folder_browser_hidden_folders');
    return saved ? JSON.parse(saved) : ["temp", "trash"];
  }

  /**
   * @param {string[]} folders
   */
  saveHiddenFoldersConfig(folders) {
    this.hiddenFolders = folders;
    localStorage.setItem('comfy_folder_browser_hidden_folders', JSON.stringify(folders));
  }

  loadIgnoredAutocompleteKeywords() {
    const saved = localStorage.getItem('cfob_ignored_autocomplete_keywords');
    return saved ? JSON.parse(saved) : [];
  }

  /**
   * @param {string[]} keywords
   */
  saveIgnoredAutocompleteKeywords(keywords) {
    this.ignoredAutocompleteKeywords = keywords;
    localStorage.setItem('cfob_ignored_autocomplete_keywords', JSON.stringify(keywords));
  }

  /** @returns {{keyword: string, filter: string}[]} */
  loadFilterShortcuts() {
    const saved = localStorage.getItem('cfob_filter_shortcuts');
    if (!saved) return [];
    const shortcuts = JSON.parse(saved);
    return Array.isArray(shortcuts) ? shortcuts.filter(shortcut =>
      shortcut && typeof shortcut.keyword === 'string' && typeof shortcut.filter === 'string'
    ) : [];
  }

  /** @param {{keyword: string, filter: string}[]} shortcuts */
  saveFilterShortcuts(shortcuts) {
    this.filterShortcuts = shortcuts;
    localStorage.setItem('cfob_filter_shortcuts', JSON.stringify(shortcuts));
  }

  /**
  * @param {string | number} scale
  */
  setUiScale(scale) {
    this.uiScale = Math.max(0.7, Math.min(1.5, Number(scale) || 1.0));
    localStorage.setItem('cfob_ui_scale', String(this.uiScale));
    this.app.root?.style.setProperty('--cfob-scale', String(this.uiScale));
  }

  /**
   * @param {string | number} size
   */
  setGridSize(size) {
    this.gridSize = Math.max(20, Math.min(800, Number(size) || 380));
    localStorage.setItem('cfob_grid_size', String(this.gridSize));
    this.app.root?.style.setProperty('--grid-size', `${this.gridSize}px`);
    this.app.gallery?.syncGridLayout?.();
  }

  /** @param {boolean} enabled */
  setMasonryEnabled(enabled) {
    this.masonryEnabled = enabled;
    localStorage.setItem('cfob_masonry_enabled', String(enabled));
    this.app.$("cfobGalleryGrid")?.classList.toggle('masonry', enabled);
    this.syncGridFillOrderControl();
    this.app.gallery?.syncGridLayout?.();
  }

  /** @param {'row' | 'column'} order */
  setGridFillOrder(order) {
    this.gridFillOrder = order;
    localStorage.setItem('cfob_grid_fill_order', this.gridFillOrder);
    const grid = this.app.$("cfobGalleryGrid");
    grid?.classList.toggle('grid-column-first', this.gridFillOrder === 'column');
    this.syncGridFillOrderControl();
    this.app.gallery?.syncGridLayout?.();
  }

  syncGridFillOrderControl() {
    const select = /** @type {HTMLSelectElement | null} */ (this.app.$("cfobGridFillOrderSelect"));
    if (!select) return;
    const rowOption = select.querySelector('option[value="row"]');
    if (rowOption) rowOption.disabled = false;
    select.value = this.gridFillOrder;
  }

  /** @param {'vertical' | 'horizontal'} direction */
  setScrollDirection(direction) {
    this.scrollDir = direction;
    localStorage.setItem('cfob_scroll_dir', direction);
    this.app.$("cfobMainContainer")?.classList.toggle('scroll-horizontal', direction === 'horizontal');
    this.syncGridFillOrderControl();
    this.app.gallery?.syncGridLayout?.();
  }

  getGalleryViewMode() {
    const grid = this.app.$("cfobGalleryGrid");
    if (!grid) return 'grid';
    if (grid.classList.contains('view-compact')) return 'compact';
    if (grid.classList.contains('view-list')) return 'list';
    return 'grid';
  }

  getViewMode() {
    return this.fullViewMode ? 'full' : this.getGalleryViewMode();
  }

  activateFullViewMode() {
    this.fullViewMode = true;
    localStorage.setItem('comfy_folder_browser_view', 'full');
  }

  /** @param {string} mode */
  setViewMode(mode = "grid") {
    const grid = this.app.$("cfobGalleryGrid");
    if (mode === 'full') {
      this.activateFullViewMode();
    } else {
      this.fullViewMode = false;
    }
    if (grid && mode !== 'full') {
      const fillClass = this.gridFillOrder === 'column' ? ' grid-column-first' : '';
      grid.className = `gallery-container view-${mode}${this.masonryEnabled ? ' masonry' : ''}${fillClass}`;
      this.app.gallery?.syncGridLayout?.();
    }
    localStorage.setItem('comfy_folder_browser_view', mode);
    if (mode === 'full') {
      const img = this.app.filteredImages[this.app.lastSelectedIdx] || this.app.filteredImages[0];
      if (img) this.app.fullView.openFullView(img);
    } else if (this.app.$("cfobFullViewModal")?.classList.contains('active')) {
      this.app.fullView.closeFullView();
    }
  }

  /**
 * @param {string} mode
 */
  setBrowserMode(mode) {
    if (!this.app.root) return;
    this.browserMode = mode;
    localStorage.setItem('comfy_folder_browser_mode', mode);
    this.app.root.classList.remove('mode-full', 'mode-right', 'mode-left', 'mode-down', 'mode-up');
    this.app.root.classList.add(`mode-${mode}`);

    this.app.root.style.width = '';
    this.app.root.style.height = '';

    if (mode === 'right' || mode === 'left') {
      this.app.root.style.width = `${this.sidebarWidth}px`;
    } else if (mode === 'up' || mode === 'down') {
      this.app.root.style.height = `${this.sidebarHeight}px`;
    }
  }

  /** @param {number | null} width @param {number | null} height */
  setSidebarSize(width, height) {
    this.app.updateSidebarSize(width, height);
    if (width !== null) localStorage.setItem('comfy_folder_browser_width', String(this.sidebarWidth));
    if (height !== null) localStorage.setItem('comfy_folder_browser_height', String(this.sidebarHeight));
  }

  /** @param {boolean} constrain */
  setConstrainFullView(constrain) {
    this.constrainFullView = Boolean(constrain);
    localStorage.setItem('cfob_constrain_full_view', String(this.constrainFullView));
    this.app.root?.classList.toggle('constrain-full-view', this.constrainFullView);
  }

  bindEvents() {
    this.modals.bindEvents();
    this.bindOptionsModal();
    document.addEventListener('click', (e) => {
      const target = /** @type {HTMLElement} */ (e.target);
      if (this.activePopover && !this.activePopover.contains(target) && !target.closest('#cfobMenuBtn')) {
        this.activePopover.remove();
        this.activePopover = null;
      }
    });

    this.app.$("cfobAddFieldBtn").addEventListener('click', () => {
      this.fieldConfigs.push({ label: "Custom Field", paths: "" });
      this.renderConfigFields();
    });
    this.app.$("cfobResetConfigBtn").addEventListener('click', () => {
      this.resetConfig();
      this.renderConfigFields();
    });
    this.app.$("cfobSaveConfigBtn").addEventListener('click', () => {
      /** @type {CFOB_CardFieldSettings[]} */
      const newCfgs = [];
      this.app.$("cfobConfigFieldsList").querySelectorAll('.config-field-item').forEach(item => {
        const label = /** @type {HTMLInputElement} */ (item.querySelector('.field-label-input')).value.trim();
        const paths = /** @type {HTMLInputElement} */ (item.querySelector('.field-paths-input')).value.trim();
        if (label) newCfgs.push({ label, paths });
      });
      this.saveConfig(newCfgs);
      this.app.gallery.renderGallery();
      this.renderConfigFields();
      this.app.showToast("Saved card field configuration");
    });

    // Enhanced Inspector Tabs with Keyboard Navigation
    this.app.root?.querySelectorAll('#cfobInspectorTabs .tab').forEach(tab => {
      const activateTab = () => {
        this.app.root?.querySelectorAll('#cfobInspectorTabs .tab').forEach(t => t.classList.remove('active'));
        this.app.root?.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        const target = /** @type {HTMLElement} */(tab).dataset.target;
        if (target) this.app.$(target).classList.add('active');
      };

      tab.addEventListener('click', activateTab);

      // @ts-ignore
      tab.addEventListener('keydown', (/** @type {KeyboardEvent} */ e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          activateTab();
        }
        else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          e.preventDefault();
          const tabs = Array.from(this.app.root?.querySelectorAll('#cfobInspectorTabs .tab') || []);
          const idx = tabs.indexOf(/** @type {Element} */(tab));
          const nextIdx = e.key === 'ArrowRight' ? (idx + 1) % tabs.length : (idx - 1 + tabs.length) % tabs.length;
          /** @type {HTMLElement} */(tabs[nextIdx]).focus();
        }
      });
    });

    this.app.$("cfobResetHiddenFoldersBtn").addEventListener('click', () => {
      /** @type {HTMLTextAreaElement} */ (this.app.$("cfobHiddenFoldersInput")).value = "temp\ntrash";
    });
    this.app.$("cfobSaveHiddenFoldersBtn").addEventListener('click', () => {
      const val = /** @type {HTMLInputElement} */ (this.app.$("cfobHiddenFoldersInput")).value;
      const list = val.split(/[\n,]+/).map((/** @type {string} */ s) => s.trim()).filter(Boolean);
      this.saveHiddenFoldersConfig(list);
      this.app.gallery.filterGallery();
      this.app.showToast("Saved hidden folders configuration");
    });

    this.app.$("cfobResetIgnoredKeywordsBtn").addEventListener('click', () => {
      /** @type {HTMLTextAreaElement} */ (this.app.$("cfobIgnoredKeywordsInput")).value = "";
    });
    this.app.$("cfobSaveIgnoredKeywordsBtn").addEventListener('click', () => {
      const val = /** @type {HTMLInputElement} */ (this.app.$("cfobIgnoredKeywordsInput")).value;
      const keywords = [...new Set(val.split(/[\n,]+/).map((/** @type {string} */ s) => s.trim().toLowerCase()).filter(Boolean))];
      this.saveIgnoredAutocompleteKeywords(keywords);
      this.app.search.updateSearchSuggestions(true);
      this.app.showToast("Saved ignored autocomplete keywords");
    });
    this.app.$("cfobSaveFilterShortcutsBtn").addEventListener('click', () => {
      const text = /** @type {HTMLTextAreaElement} */ (this.app.$("cfobFilterShortcutsInput")).value;
      /** @type {{keyword: string, filter: string}[]} */
      const shortcuts = [];
      const names = new Set();
      const lines = text.split(/\r?\n/);
      for (let index = 0; index < lines.length; index++) {
        const line = lines[index].trim();
        if (!line) continue;
        const separator = line.indexOf('|');
        const keyword = separator < 0 ? '' : line.slice(0, separator).trim();
        const filter = separator < 0 ? '' : line.slice(separator + 1).trim();
        if (!/^[\p{L}\p{N}_-]+$/u.test(keyword) || !filter) {
          this.app.showToast(`Invalid filter shortcut on line ${index + 1}`);
          return;
        }
        const normalizedKeyword = keyword.toLowerCase();
        if (names.has(normalizedKeyword)) {
          this.app.showToast(`Duplicate filter shortcut: ${keyword}`);
          return;
        }
        names.add(normalizedKeyword);
        shortcuts.push({ keyword, filter });
      }
      this.saveFilterShortcuts(shortcuts);
      this.app.gallery.filterGallery();
      this.app.search.updateSearchSuggestions(true);
      this.app.showToast("Saved filter shortcuts");
    });
  }

  bindOptionsModal() {
    const modal = this.app.$("cfobOptionsModal");
    const tablist = this.app.$("cfobOptionsTabs");
    const tabs = /** @type {HTMLElement[]} */ (Array.from(tablist.querySelectorAll('.options-tab')));
    const activateTab = (/** @type {HTMLElement} */ tab, focus = false) => {
      tabs.forEach(item => {
        const isActive = item === tab;
        item.classList.toggle('active', isActive);
        item.setAttribute('aria-selected', String(isActive));
        item.tabIndex = isActive ? 0 : -1;
      });
      modal.querySelectorAll('.options-tab-panel').forEach(panel => {
        panel.classList.toggle('active', /** @type {HTMLElement} */(panel).id === tab.dataset.target);
      });
      if (focus) tab.focus();
    };

    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => activateTab(/** @type {HTMLElement} */(tab)));
      tab.addEventListener('keydown', (event) => {
        const keyEvent = /** @type {KeyboardEvent} */ (event);
        let nextIndex = index;
        if (keyEvent.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length;
        else if (keyEvent.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length;
        else if (keyEvent.key === 'Home') nextIndex = 0;
        else if (keyEvent.key === 'End') nextIndex = tabs.length - 1;
        else return;
        keyEvent.preventDefault();
        activateTab(/** @type {HTMLElement} */(tabs[nextIndex]), true);
      });
    });

    /** @param {string} id @param {boolean} enabled @param {string} [onText] @param {string} [offText] */
    const setStatus = (id, enabled, onText = 'On', offText = 'Off') => {
      const status = /** @type {HTMLElement} */ (this.app.$(id));
      status.textContent = enabled ? onText : offText;
      status.classList.toggle('enabled', enabled);
    };
    const syncSizeControls = () => {
      const widthSlider = /** @type {HTMLInputElement} */ (this.app.$("cfobPanelWidthSlider"));
      const heightSlider = /** @type {HTMLInputElement} */ (this.app.$("cfobPanelHeightSlider"));
      const maxWidth = Math.max(300, window.innerWidth - 100);
      const maxHeight = Math.max(200, window.innerHeight - 100);
      widthSlider.max = String(maxWidth);
      heightSlider.max = String(maxHeight);
      if ((this.browserMode === 'left' || this.browserMode === 'right') && this.sidebarWidth > maxWidth) {
        this.setSidebarSize(maxWidth, null);
      }
      if ((this.browserMode === 'up' || this.browserMode === 'down') && this.sidebarHeight > maxHeight) {
        this.setSidebarSize(null, maxHeight);
      }
      widthSlider.value = String(Math.min(maxWidth, Math.max(300, this.sidebarWidth)));
      heightSlider.value = String(Math.min(maxHeight, Math.max(200, this.sidebarHeight)));
      this.app.$("cfobPanelWidthVal").textContent = `${widthSlider.value}px`;
      this.app.$("cfobPanelHeightVal").textContent = `${heightSlider.value}px`;
      widthSlider.disabled = this.browserMode !== 'left' && this.browserMode !== 'right';
      heightSlider.disabled = this.browserMode !== 'up' && this.browserMode !== 'down';
    };
    const syncOptions = () => {
      const scaleSlider = /** @type {HTMLInputElement} */ (this.app.$("cfobScaleSlider"));
      scaleSlider.value = String(this.uiScale);
      this.app.$("cfobScaleVal").textContent = `${Math.round(this.uiScale * 100)}%`;
      const gridSlider = /** @type {HTMLInputElement} */ (this.app.$("cfobGridSizeSlider"));
      gridSlider.value = String(this.gridSize);
      this.app.$("cfobGridSizeVal").textContent = `${this.gridSize}px`;
      /** @type {HTMLSelectElement} */ (this.app.$("cfobModeSelect")).value = this.browserMode;
      this.syncGridFillOrderControl();
      /** @type {HTMLSelectElement} */ (this.app.$("cfobScrollDirectionSelect")).value = this.scrollDir;
      /** @type {HTMLSelectElement} */ (this.app.$("cfobSortSelect")).value = this.currentSort;
      setStatus("cfobMasonryStatus", this.masonryEnabled);
      setStatus("cfobAutoHideStatus", this.autoHide);
      setStatus("cfobConstrainStatus", this.constrainFullView);
      setStatus("cfobHiddenStatus", this.showHiddenFolders, 'Shown', 'Hidden');
      /** @type {HTMLTextAreaElement} */ (this.app.$("cfobHiddenFoldersInput")).value = this.hiddenFolders.join("\n");
      /** @type {HTMLTextAreaElement} */ (this.app.$("cfobIgnoredKeywordsInput")).value = this.ignoredAutocompleteKeywords.join("\n");
      /** @type {HTMLTextAreaElement} */ (this.app.$("cfobFilterShortcutsInput")).value = this.filterShortcuts
        .map(shortcut => `${shortcut.keyword} | ${shortcut.filter}`).join("\n");
      this.renderConfigFields();
      modal.querySelectorAll('.view-btn').forEach(button => {
        button.classList.toggle('active', /** @type {HTMLElement} */(button).dataset.view === this.getViewMode());
      });
      syncSizeControls();
    };

    this.app.$("cfobScaleSlider").addEventListener('input', (event) => {
      const value = Number(/** @type {HTMLInputElement} */(event.target).value);
      this.setUiScale(value);
      this.app.$("cfobScaleVal").textContent = `${Math.round(value * 100)}%`;
    });
    this.app.$("cfobGridSizeSlider").addEventListener('input', (event) => {
      const value = Number(/** @type {HTMLInputElement} */(event.target).value);
      this.setGridSize(value);
      this.app.$("cfobGridSizeVal").textContent = `${value}px`;
    });
    modal.querySelectorAll('.view-btn').forEach(button => {
      button.addEventListener('click', () => {
        const mode = /** @type {HTMLElement} */ (button).dataset.view;
        if (!mode) return;
        if (mode === 'full') this.modals.close(modal);
        this.setViewMode(mode);
        modal.querySelectorAll('.view-btn').forEach(item => item.classList.toggle('active', item === button));
      });
    });
    this.app.$("cfobToggleMasonryBtn").addEventListener('click', () => {
      this.setMasonryEnabled(!this.masonryEnabled);
      setStatus("cfobMasonryStatus", this.masonryEnabled);
    });
    this.app.$("cfobModeSelect").addEventListener('change', (event) => {
      this.setBrowserMode(/** @type {HTMLSelectElement} */(event.target).value);
      syncSizeControls();
    });
    this.app.$("cfobPanelWidthSlider").addEventListener('input', (event) => {
      this.setSidebarSize(Number(/** @type {HTMLInputElement} */(event.target).value), null);
      this.app.$("cfobPanelWidthVal").textContent = `${this.sidebarWidth}px`;
    });
    this.app.$("cfobPanelHeightSlider").addEventListener('input', (event) => {
      this.setSidebarSize(null, Number(/** @type {HTMLInputElement} */(event.target).value));
      this.app.$("cfobPanelHeightVal").textContent = `${this.sidebarHeight}px`;
    });
    this.app.$("cfobGridFillOrderSelect").addEventListener('change', (event) => {
      this.setGridFillOrder(/** @type {HTMLSelectElement} */(event.target).value === 'column' ? 'column' : 'row');
    });
    this.app.$("cfobScrollDirectionSelect").addEventListener('change', (event) => {
      this.setScrollDirection(/** @type {HTMLSelectElement} */(event.target).value === 'horizontal' ? 'horizontal' : 'vertical');
    });
    this.app.$("cfobSortSelect").addEventListener('change', (event) => {
      this.currentSort = /** @type {HTMLSelectElement} */ (event.target).value;
      localStorage.setItem('cfob_sort', this.currentSort);
      this.app.applySort();
      this.app.gallery.filterGallery();
    });
    this.app.$("cfobToggleHiddenBtn").addEventListener('click', () => {
      this.showHiddenFolders = !this.showHiddenFolders;
      localStorage.setItem('comfy_folder_browser_show_hidden', String(this.showHiddenFolders));
      this.app.gallery.filterGallery();
      setStatus("cfobHiddenStatus", this.showHiddenFolders, 'Shown', 'Hidden');
    });
    this.app.$("cfobToggleAutoHideBtn").addEventListener('click', () => {
      this.autoHide = !this.autoHide;
      localStorage.setItem('comfy_folder_browser_auto_hide', String(this.autoHide));
      setStatus("cfobAutoHideStatus", this.autoHide);
      this.app.showToast(`Auto-hide ${this.autoHide ? 'enabled' : 'disabled'}`);
    });
    this.app.$("cfobToggleConstrainFullViewBtn").addEventListener('click', () => {
      this.setConstrainFullView(!this.constrainFullView);
      setStatus("cfobConstrainStatus", this.constrainFullView);
    });
    modal.addEventListener('show-options', syncOptions);
  }

  toggleOptionsMenu() {
    const modal = this.app.$("cfobOptionsModal");
    if (modal.classList.contains('active')) {
      this.modals.close(modal);
      return;
    }
    modal.dispatchEvent(new Event('show-options'));
    const selectedTab = /** @type {HTMLElement | null} */ (modal.querySelector('.options-tab[aria-selected="true"]'));
    this.modals.open(modal, selectedTab);
  }

  /**
  * @param {string} message 
  * @param {string} confirmText 
  * @param {boolean} isDanger 
  * @returns {Promise<boolean>}
  */
  async customConfirm(message, confirmText = "Confirm", isDanger = false) {
    return new Promise(resolve => {
      const modal = this.app.$("cfobConfirmModal");
      this.app.$("cfobConfirmMsg").innerText = message;

      const okBtn = this.app.$("cfobConfirmOkBtn");
      okBtn.innerText = confirmText;
      okBtn.className = isDanger ? "btn btn-danger" : "btn btn-primary";

      const cleanup = () => {
        this.modals.close(modal);
        okBtn.removeEventListener("click", onOk);
        this.app.$("cfobConfirmCancelBtn").removeEventListener("click", onCancel);
        this.app.$("cfobConfirmCloseBtn").removeEventListener("click", onCancel);
      };

      const onOk = () => { cleanup(); resolve(true); };
      const onCancel = () => { cleanup(); resolve(false); };

      okBtn.addEventListener("click", onOk);
      this.app.$("cfobConfirmCancelBtn").addEventListener("click", onCancel);
      this.app.$("cfobConfirmCloseBtn").addEventListener("click", onCancel);

      this.modals.open(modal, okBtn);
    });
  }

  /**
   * @param {string} message 
   * @param {string} defaultValue 
   * @param {'none' | 'rename' | 'move'} folderPickerMode
   * @param {string} [imageUrl]
   * @returns {Promise<string | null>}
   */
  async customPrompt(message, defaultValue = "", folderPickerMode = 'none', imageUrl = "") {
    return new Promise(resolve => {
      const modal = this.app.$("cfobPromptModal");
      this.app.$("cfobPromptMsg").innerText = message;
      const input = /** @type {HTMLInputElement} */ (this.app.$("cfobPromptInput"));
      input.value = defaultValue;
      input.style.display = folderPickerMode === 'move' ? 'none' : '';

      const thumbWrapper = this.app.$("cfobPromptThumbWrapper");
      const thumbImg = /** @type {HTMLImageElement} */ (this.app.$("cfobPromptThumbImg"));

      let resolvedImgUrl = imageUrl;
      if (resolvedImgUrl) {
        thumbImg.src = resolvedImgUrl;
        thumbWrapper.classList.add('active');
      } else {
        thumbWrapper.classList.remove('active');
        thumbImg.src = '';
      }

      const folderWrapper = this.app.$("cfobFolderListWrapper");
      const folderList = this.app.$("cfobFolderList");

      /** @type {string | null} */
      let selectedFolder = null;
      /** @type {HTMLElement | null} */
      let newFolderEntry = null;
      if (folderPickerMode === 'move') {
        folderWrapper.style.display = "block";
        this.app.$("cfobPromptOkBtn").setAttribute("disabled", "");
        this.app.$("cfobPromptMsg").innerText = "Choose a destination folder:";
        const folders = new Set();
        this.app.loadedImages.forEach(img => {
          const parts = img.name.split(/\\|\//);
          if (parts.length > 1) folders.add(parts.slice(0, -1).join('/'));
        });

        folderList.innerHTML = "";

        /** 
         * @param {string} html
         * @param {string} folder 
         */
        const createChip = (html, folder) => {
          const chip = document.createElement("div");
          chip.className = "folder-chip";
          chip.innerHTML = html;
          chip.tabIndex = 0; // Make focusable

          chip.onclick = () => {
            if (selectedFolder !== null && selectedFolder === folder) {
              onOk();
              return;
            }
            selectedFolder = folder;
            input.value = folder;
            folderList.querySelectorAll('.folder-chip').forEach(item => item.classList.remove('selected'));
            chip.classList.add('selected');
            if (newFolderEntry) newFolderEntry.style.display = "none";
            this.app.$("cfobPromptOkBtn").removeAttribute("disabled");
          };
          chip.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              e.stopPropagation();
              chip.click();
            }
            else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
              e.preventDefault();
              e.stopPropagation();
              const chips = Array.from(folderList.querySelectorAll('.folder-chip'));
              const idx = chips.indexOf(chip);
              const nextIdx = ['ArrowRight', 'ArrowDown'].includes(e.key)
                ? (idx + 1) % chips.length
                : (idx - 1 + chips.length) % chips.length;
              /** @type {HTMLElement} */(chips[nextIdx]).focus();
            }
          });
          return chip;
        };

        // Add root option
        folderList.appendChild(createChip(`${ICONS.logo} Root (/)`, ""));

        // Add detected folders
        Array.from(folders).sort().forEach(folder => {
          folderList.appendChild(createChip(`${ICONS.logo} ${this.app.escapeHtml(folder)}`, folder));
        });

        const newFolderChip = createChip(`${ICONS.logo} New folder...`, "");
        folderList.appendChild(newFolderChip);

        newFolderEntry = document.createElement("div");
        newFolderEntry.className = "folder-new-entry";
        newFolderEntry.style.display = "none";
        const newFolderInput = document.createElement("input");
        newFolderInput.type = "text";
        newFolderInput.className = "config-input";
        newFolderInput.placeholder = "New folder name (or path)";
        const useNewFolderButton = document.createElement("button");
        useNewFolderButton.type = "button";
        useNewFolderButton.className = "btn";
        useNewFolderButton.innerText = "Use folder";
        newFolderEntry.append(newFolderInput, useNewFolderButton);
        folderList.appendChild(newFolderEntry);

        newFolderChip.onclick = () => {
          selectedFolder = null;
          folderList.querySelectorAll('.folder-chip').forEach(item => item.classList.remove('selected'));
          newFolderChip.classList.add('selected');
          if (newFolderEntry) newFolderEntry.style.display = "flex";
          this.app.$("cfobPromptOkBtn").setAttribute("disabled", "");
          newFolderInput.focus();
        };

        const selectNewFolder = () => {
          const folder = newFolderInput.value.trim();
          if (!folder) return;
          selectedFolder = folder;
          input.value = folder;
          this.app.$("cfobPromptOkBtn").removeAttribute("disabled");
        };
        useNewFolderButton.addEventListener("click", selectNewFolder);
        newFolderInput.addEventListener("input", () => {
          selectedFolder = null;
          this.app.$("cfobPromptOkBtn").setAttribute("disabled", "");
        });
        newFolderInput.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            selectNewFolder();
          }
        });
      } else {
        folderWrapper.style.display = "none";
        this.app.$("cfobPromptOkBtn").removeAttribute("disabled");
      }

      const cleanup = () => {
        this.modals.close(modal);
        thumbWrapper.classList.remove('active');
        this.app.$("cfobPromptOkBtn").removeEventListener("click", onOk);
        this.app.$("cfobPromptCancelBtn").removeEventListener("click", onCancel);
        this.app.$("cfobPromptCloseBtn").removeEventListener("click", onCancel);
        input.removeEventListener("keydown", onKey);
      };

      const onOk = () => {
        if (folderPickerMode === 'move' && selectedFolder === null) return;
        cleanup();
        resolve(folderPickerMode === 'move' ? selectedFolder : input.value);
      };
      const onCancel = () => { cleanup(); resolve(null); };
      const onKey = (/** @type {KeyboardEvent} */ e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          e.stopPropagation();
          onOk();
        }
      };

      this.app.$("cfobPromptOkBtn").addEventListener("click", onOk);
      this.app.$("cfobPromptCancelBtn").addEventListener("click", onCancel);
      this.app.$("cfobPromptCloseBtn").addEventListener("click", onCancel);
      input.addEventListener("keydown", onKey);

      const initialFocus = folderPickerMode === 'move'
        ? /** @type {HTMLElement | null} */ (folderList.querySelector('.folder-chip'))
        : input;
      this.modals.open(modal, initialFocus);
      if (folderPickerMode !== 'move') input.select();
    });
  }

  renderConfigFields() {
    const list = this.app.$("cfobConfigFieldsList");
    list.innerHTML = "";

    this.fieldConfigs.forEach((/** @type {{ label: any; paths: any; }} */ cfg, /** @type {any} */ idx) => {
      const item = document.createElement("div");
      item.className = "config-field-item";
      item.innerHTML = `
        <div class="config-field-header">
          <input type="text" class="config-input field-label-input" value="${this.app.escapeHtml(cfg.label)}" placeholder="Field Name" style="flex: 1; font-weight: 600;">
          <button class="icon-btn remove-field-btn" title="Remove Field">${ICONS.trash}</button>
        </div>
        <textarea class="config-paths-textarea field-paths-input" placeholder="e.g. Positive Prompt.text, 6.inputs.text">${this.app.escapeHtml(cfg.paths)}</textarea>
      `;

      item.querySelector('.remove-field-btn')?.addEventListener('click', () => {
        this.fieldConfigs.splice(idx, 1);
        this.renderConfigFields();
      });

      list.appendChild(item);
    });

  }

  /**
   * @param {Event} e
   * @param {any} safePath
   */
  openAddPathMenu(e, safePath) {
    e.stopPropagation();
    if (this.activePopover) this.activePopover.remove();

    const rect = /** @type {HTMLElement} */ (e.currentTarget)?.getBoundingClientRect();
    const menu = document.createElement('div');
    menu.className = 'popover-menu';
    menu.style.top = `${rect.bottom + 4}px`;
    menu.style.left = `${Math.min(rect.left, window.innerWidth - 220)}px`;

    const encodedPath = encodeURIComponent(String(safePath || ''));
    let html = `<div class="popover-header">Add Path To Field:</div>`;
    this.fieldConfigs.forEach((/** @type {{ label: any; }} */ cfg, /** @type {any} */ i) => html += `<button class="popover-item append-path" data-idx="${i}" data-path="${encodedPath}"><span>${this.app.escapeHtml(cfg.label)}</span></button>`);
    html += `<div style="border-top: 1px solid var(--border); margin: 4px 0;"></div><button class="popover-item new-path" data-path="${encodedPath}"><span style="color: var(--link);">+ Create New Field</span></button>`;

    menu.innerHTML = html;
    this.app.root?.appendChild(menu);
    this.activePopover = menu;

    menu.querySelectorAll('.append-path').forEach(b => {
      b.addEventListener('click', () => {
        const field = this.fieldConfigs[/** @type {HTMLElement} */ (b).dataset.idx || 0];
        const p = decodeURIComponent(/** @type {HTMLElement} */(b).dataset.path || '');
        if (!field.paths?.includes(p)) {
          field.paths = field.paths ? `${field.paths}, ${p}` : p;
          this.saveConfig(this.fieldConfigs);
          this.app.gallery.renderGallery();
          this.app.showToast(`Added to '${field.label}'`);
        }
        this.activePopover?.remove(); this.activePopover = null;
      });
    });

    menu.querySelector('.new-path')?.addEventListener('click', async () => {
      const lbl = await this.customPrompt("Enter a label for the new card field:", "Custom Field");
      if (lbl) {
        this.fieldConfigs.push({ label: lbl, paths: decodeURIComponent(/** @type {HTMLElement} */(menu.querySelector('.new-path'))?.dataset.path || '') });
        this.saveConfig(this.fieldConfigs);
        this.app.gallery.renderGallery();
        this.app.showToast(`Created field '${lbl}'`);
      }
      this.activePopover?.remove(); this.activePopover = null;
    });
  }

  /**
   * @param {HTMLElement} panel
   * @param {any} value
   * @param {'prompt' | 'workflow'} source
   * @param {any} img
   */
  renderInspectorJson(panel, value, source, img) {
    const getPath = (/** @type {string[]} */ parentPath, /** @type {string} */ key, /** @type {any} */ propertyValue) => {
      if (source === 'prompt' && parentPath.length > 0 && img.prompt?.[parentPath[0]]) {
        const node = img.prompt[parentPath[0]];
        const nodeName = node?._meta?.title || node?.class_type || parentPath[0];
        const propertyPath = [...parentPath.slice(1), key]
          .map((part, index) => /^\d+$/.test(part) ? `[${part}]` : `${index && !/^\d+$/.test(part) ? '.' : ''}${part}`)
          .join('');
        const nodePropertyPath = propertyPath.startsWith('inputs.') || propertyPath === 'inputs'
          ? propertyPath
          : `node.${propertyPath || '__self__'}`;
        return `${nodeName}.${nodePropertyPath}`;
      }

      if (source === 'workflow') {
        const nodesIndex = parentPath.indexOf('nodes');
        if (nodesIndex >= 0 && parentPath.length > nodesIndex + 1) {
          const nodeIndex = Number(parentPath[nodesIndex + 1]);
          const node = img.workflow?.nodes?.[nodeIndex];
          if (!node) return `@workflow.${[...parentPath, key].join('.')}`;
          const nodeName = node?.title || node?.type || node?.id;
          const nodePath = [...parentPath.slice(nodesIndex + 2), key];
          if (nodePath[0] === 'widgets_values_named' && nodePath.length === 2) return `${nodeName}.${nodePath[1]}`;
          if (nodePath[0] === 'widgets_values' && nodePath.length === 2 && /^\d+$/.test(nodePath[1])) return `${nodeName}.widget[${nodePath[1]}]`;
          const propertyPath = nodePath
            .map((part, index) => /^\d+$/.test(part) ? `[${part}]` : `${index && !/^\d+$/.test(part) ? '.' : ''}${part}`)
            .join('');
          return `${nodeName}.${propertyPath || '__self__'}`;
        }
        return `@workflow.${[...parentPath, key].join('.')}`;
      }

      return `@prompt.${[...parentPath, key].join('.')}`;
    };

    /** @type {(current: any, depth: number, path: string[]) => string} */
    const renderValue = (/** @type {any} */ current, /** @type {number} */ depth, /** @type {string[]} */ path) => {
      if (Array.isArray(current)) {
        if (!current.length) return '[]';
        const entries = current.map((item, index) => `${'  '.repeat(depth + 1)}${renderValue(item, depth + 1, [...path, String(index)])}`);
        return `[\n${entries.join(',\n')}\n${'  '.repeat(depth)}]`;
      }
      if (current && typeof current === 'object') {
        const entries = Object.entries(current).map(([key, child]) => {
          const nodePath = getPath(path, key, child);
          const escapedKey = this.app.escapeHtml(JSON.stringify(key));
          const renderedKey = nodePath
            ? `<button class="inspector-json-key" type="button" data-path="${encodeURIComponent(nodePath)}" aria-label="Select property">${escapedKey}</button>`
            : escapedKey;
          return `${'  '.repeat(depth + 1)}${renderedKey}: ${renderValue(child, depth + 1, [...path, key])}`;
        });
        if (!entries.length) return '{}';
        return `{\n${entries.join(',\n')}\n${'  '.repeat(depth)}}`;
      }
      return this.app.escapeHtml(JSON.stringify(current) ?? 'null');
    };

    panel.innerHTML = `
      <div class="inspector-json-actions">
        <span class="inspector-json-selected-path"></span>
        <button class="btn btn-primary btn-xs inspector-json-add" type="button">Add node path to fields</button>
      </div>
      <pre>${renderValue(value, 0, [])}</pre>`;

    const actions = /** @type {HTMLElement} */ (panel.querySelector('.inspector-json-actions'));
    const selectedPath = /** @type {HTMLElement} */ (panel.querySelector('.inspector-json-selected-path'));
    const addButton = /** @type {HTMLElement} */ (panel.querySelector('.inspector-json-add'));
    panel.querySelectorAll('.inspector-json-key').forEach(key => {
      const selectProperty = () => {
        panel.querySelectorAll('.inspector-json-key.selected').forEach(selected => selected.classList.remove('selected'));
        key.classList.add('selected');
        const path = decodeURIComponent(/** @type {HTMLElement} */(key).dataset.path || '');
        selectedPath.textContent = path;
        addButton.dataset.path = path;
        actions.classList.add('active');
      };
      key.addEventListener('click', selectProperty);
      // @ts-ignore
      key.addEventListener('keydown', (/** @type {KeyboardEvent} */ event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          selectProperty();
        }
      });
    });
    addButton.addEventListener('click', event => this.openAddPathMenu(event, addButton.dataset.path || ''));
  }

  /** @param {number} idx */
  async openInspector(idx) {
    const img = this.app.loadedImages[idx];
    const inspectorModal = this.app.$("cfobInspectorModal");
    this.modals.captureFocus(inspectorModal);

    if (!img.isParsed) {
      this.app.$("cfobInspectorTitle").innerText = `Loading Metadata...`;
      await this.app.api.loadMetadata(img);
    }

    this.app.$("cfobInspectorTitle").innerText = `Metadata: ${img.name}`;
    this.renderInspectorJson(this.app.$("cfobInsPromptView"), img.prompt || 'No API Prompt Metadata', 'prompt', img);
    this.renderInspectorJson(this.app.$("cfobInsWorkflowView"), img.workflow || 'No UI Workflow Metadata', 'workflow', img);

    const grid = this.app.$("cfobInsNodesGrid");
    grid.innerHTML = '';

    if (img.workflow?.nodes) {
      img.workflow.nodes.forEach((/** @type {any} */ node) => {
        const titleText = node.title || node.type || node.id;
        let html = `<div class="node-card"><div class="node-header"><div class="node-title">${this.app.escapeHtml(titleText)}</div><span class="node-id">#${node.id}</span></div><div class="node-body">`;

        /**
         * @type {{ key: string; val: any; }[]}
         */
        let w = [];
        if (node.widgets_values_named) Object.entries(node.widgets_values_named).forEach(([key, val]) => w.push({ key, val }));
        else if (node.widgets_values) node.widgets_values.forEach((/** @type {any} */ val, /** @type {any} */ i) => w.push({ key: `widget[${i}]`, val }));

        if (w.length > 0) {
          w.forEach(({ key, val }) => {
            const pPath = encodeURIComponent(`${titleText}.${key}`);
            const sVal = encodeURIComponent(typeof val === 'object' ? JSON.stringify(val) : String(val));
            html += `<div class="input-row"><div class="input-header"><span class="input-name">${this.app.escapeHtml(key)}</span><div class="input-actions"><button class="btn btn-xs cp-val" data-val="${sVal}">${ICONS.copy}</button><button class="btn btn-xs btn-primary field-add" data-path="${pPath}">+ Field</button></div></div><div class="input-value-wrapper"><div class="input-value-text">${this.app.escapeHtml(decodeURIComponent(sVal))}</div></div></div>`;
          });
        } else {
          html += `<i style="color:#666">No widgets</i>`;
        }
        grid.innerHTML += html + `</div></div>`;
      });
    } else if (img.prompt) {
      for (const [id, node] of Object.entries(img.prompt)) {
        const titleText = node._meta?.title || node.class_type || 'Unknown Node';
        let html = `<div class="node-card"><div class="node-header"><div class="node-title">${this.app.escapeHtml(titleText)}<small>${this.app.escapeHtml(node.class_type)}</small></div><span class="node-id">#${id}</span></div><div class="node-body">`;

        if (node.inputs && Object.keys(node.inputs).length > 0) {
          for (const [key, val] of Object.entries(node.inputs)) {
            const pPath = encodeURIComponent(`${titleText}.${key}`);
            if (Array.isArray(val) && val.length >= 2 && typeof val[0] === 'string' && !isNaN(val[1])) {
              html += `<div class="input-row"><div class="input-header"><span class="input-name">${this.app.escapeHtml(key)}</span></div><span style="color: var(--link); font-style: italic; font-size: 11px;">➔ Connected to #${val[0]}</span></div>`;
            } else {
              const sVal = encodeURIComponent(typeof val === 'object' ? JSON.stringify(val) : String(val));
              html += `<div class="input-row"><div class="input-header"><span class="input-name">${this.app.escapeHtml(key)}</span><div class="input-actions"><button class="btn btn-xs cp-val" data-val="${sVal}">${ICONS.copy}</button><button class="btn btn-xs btn-primary field-add" data-path="${pPath}">➕ Field</button></div></div><div class="input-value-wrapper"><div class="input-value-text">${this.app.escapeHtml(decodeURIComponent(sVal))}</div></div></div>`;
            }
          }
        } else {
          html += `<i style="color:#666">No inputs</i>`;
        }
        grid.innerHTML += html + `</div></div>`;
      }
    }

    grid.querySelectorAll('.cp-val').forEach(b => b.addEventListener('click', (e) => this.app.actions.copyValue(/** @type {HTMLElement} */(e.currentTarget), /** @type {HTMLElement} */(e.currentTarget).dataset.val)));
    grid.querySelectorAll('.field-add').forEach(b => b.addEventListener('click', (e) => this.openAddPathMenu(e, decodeURIComponent(/** @type {HTMLElement} */(e.currentTarget)?.dataset.path || ''))));

    this.modals.open(inspectorModal, this.app.$("cfobCloseInspectorBtn"));
  }
}
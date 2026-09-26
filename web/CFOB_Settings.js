import ICONS from "./assets/icons.js";
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

  #cfob-root .popover-menu { position: fixed; background: var(--color-bg-popover); border: 1px solid var(--color-border); border-radius: var(--radius-lg); box-shadow: 0 0.625em 1.5625em rgba(0,0,0,0.6); padding: 0.5em; z-index: var(--z-popover); display: flex; flex-direction: column; gap: 0.5em; min-width: 15em; max-width: 20em; }
  #cfob-root .popover-section { display: flex; flex-direction: column; gap: 0.25em; border-bottom: 1px solid var(--color-border-light); padding-bottom: 0.375em; }
  #cfob-root .popover-section:last-child { border-bottom: none; padding-bottom: 0; }
  #cfob-root .popover-header { font-size: 0.625em; font-weight: 700; color: var(--color-text-muted); padding: 0.125em 0.25em; text-transform: uppercase; letter-spacing: 0.5px; }
  #cfob-root .popover-row { display: flex; align-items: center; justify-content: space-between; gap: 0.5em; padding: 0.25em 0.375em; font-size: 0.75em; color: var(--color-text-primary); }
  #cfob-root .popover-item { padding: 0.375em 0.625em; font-size: 0.75em; color: var(--color-text-inverse); background: transparent; border: none; text-align: left; border-radius: var(--radius-sm); cursor: pointer; display: flex; align-items: center; justify-content: space-between; width: 100%; transition: background 0.15s; }
  #cfob-root .popover-item:hover { background: var(--color-bg-panel-hover); color: var(--color-accent); }

  #cfob-root .popover-view-toggles { display: flex; background: var(--color-bg-base); border: 1px solid var(--color-border); border-radius: var(--radius-md); overflow: hidden; width: 100%; }
  #cfob-root .popover-view-toggles .view-btn { flex: 1; background: transparent; color: var(--color-text-muted); border: none; padding: 0.375em 0.5em; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.375em; font-size: 0.75em; transition: all 0.15s; border-right: 1px solid var(--color-border); }
  #cfob-root .popover-view-toggles .view-btn:last-child { border-right: none; }
  #cfob-root .popover-view-toggles .view-btn:hover, #cfob-root .popover-view-toggles .view-btn.active { background: var(--color-bg-panel-hover); color: var(--color-accent); }

  #cfob-root .popover-slider-container { display: flex; align-items: center; gap: 0.5em; width: 100%; }
  #cfob-root .popover-slider { flex: 1; accent-color: var(--color-accent); cursor: pointer; height: 0.25em; }
  #cfob-root .popover-select { background: var(--color-bg-base); border: 1px solid var(--color-border); color: var(--color-text-primary); border-radius: var(--radius-sm); padding: 0.2em 0.4em; font-size: 0.75em; outline: none; }

  #cfob-root .folder-list { display: flex; flex-wrap: wrap; gap: 0.375em; max-height: 10em; overflow-y: auto; margin-top: 0.5em; padding-top: 0.75em; border-top: 1px solid var(--color-border-light); }
  #cfob-root .folder-chip { background: var(--color-bg-panel-hover); border: 1px solid var(--color-border); padding: 0.375em 0.625em; border-radius: var(--radius-xl); font-size: 0.75em; cursor: pointer; color: var(--color-text-primary); transition: all 0.2s; display: inline-flex; align-items: center; gap: 0.25em; }
  #cfob-root .folder-chip:hover { background: var(--color-accent); color: white; border-color: var(--color-accent); }

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

  <div class="modal-overlay" id="cfobInspectorModal">
    <div class="modal-content">
      <div class="modal-header">${ICONS.inspect}<h3 id="cfobInspectorTitle">Image Metadata Inspector</h3><button class="icon-btn" id="cfobCloseInspectorBtn">${ICONS.close}</button></div>
      <div class="modal-body">
        <div class="tabs" id="cfobInspectorTabs">
          <div class="tab active" data-target="cfobInsNodes" tabindex="0">Visual Nodes View</div>
          <div class="tab" data-target="cfobInsPrompt" tabindex="0">API Prompt (JSON)</div>
          <div class="tab" data-target="cfobInsWorkflow" tabindex="0">UI Workflow (JSON)</div>
        </div>
        <div class="tab-content active" id="cfobInsNodes"><div class="nodes-grid" id="cfobInsNodesGrid"></div></div>
        <div class="tab-content" id="cfobInsPrompt"><textarea id="cfobInsPromptText" style="width: 100%; height: 30em; background: var(--color-bg-input); color: var(--color-syntax-string); font-family: var(--font-mono); border: 1px solid var(--color-border); padding: 0.75em; border-radius: var(--radius-md);" readonly></textarea></div>
        <div class="tab-content" id="cfobInsWorkflow"><textarea id="cfobInsWorkflowText" style="width: 100%; height: 30em; background: var(--color-bg-input); color: var(--color-syntax-key); font-family: var(--font-mono); border: 1px solid var(--color-border); padding: 0.75em; border-radius: var(--radius-md);" readonly></textarea></div>
      </div>
    </div>
  </div>

  <!-- Custom Confirm Modal -->
  <div class="modal-overlay" id="cfobConfirmModal">
    <div class="modal-content">
      <div class="modal-header">
        <h3 id="cfobConfirmTitle">Confirm</h3>
        <button class="icon-btn" id="cfobConfirmCloseBtn">${ICONS.close}</button>
      </div>
      <div class="modal-body"><p id="cfobConfirmMsg"></p></div>
      <div class="modal-footer">
        <button class="btn" id="cfobConfirmCancelBtn">Cancel</button>
        <button class="btn" id="cfobConfirmOkBtn">Confirm</button>
      </div>
    </div>
  </div>

  <!-- Custom Prompt Modal with Folder List -->
  <div class="modal-overlay" id="cfobPromptModal">
    <div class="modal-content">
      <div class="modal-header"><h3 id="cfobPromptTitle">Input Required</h3><button class="icon-btn" id="cfobPromptCloseBtn">${ICONS.close}</button></div>
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
        <button class="btn" id="cfobPromptCancelBtn">Cancel</button>
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
    this.currentSort = localStorage.getItem('cfob_sort') || 'default';
    this.fieldConfigs = this.loadConfig();
    this.hiddenFolders = this.loadHiddenFoldersConfig();
    this.showHiddenFolders = localStorage.getItem('comfy_folder_browser_show_hidden') === 'true';
    this.browserMode = localStorage.getItem('comfy_folder_browser_mode') || 'full';
    this.sidebarWidth = Number(localStorage.getItem('comfy_folder_browser_width') || 450);
    this.sidebarHeight = Number(localStorage.getItem('comfy_folder_browser_height') || 350);
    this.autoHide = localStorage.getItem('comfy_folder_browser_auto_hide') === 'true';
    this.gridSize = Number(localStorage.getItem('cfob_grid_size') || 380);
    this.scrollDir = localStorage.getItem('cfob_scroll_dir') || 'vertical';
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
    this.app.root?.style.setProperty('--compact-size', `${Math.max(20, this.gridSize - 180)}px`);
  }

  getViewMode() {
    const grid = this.app.$("cfobGalleryGrid");
    if (!grid) return 'grid';
    if (grid.classList.contains('view-compact')) return 'compact';
    if (grid.classList.contains('view-list')) return 'list';
    return 'grid';
  }

  /** @param {string} mode */
  setViewMode(mode = "grid") {
    const grid = this.app.$("cfobGalleryGrid");
    if (grid) {
      grid.className = `gallery-container view-${mode}`;
    }
    localStorage.setItem('comfy_folder_browser_view', mode);
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

  bindEvents() {
    document.addEventListener('click', (e) => {
      const target = /** @type {HTMLElement} */ (e.target);
      if (this.activePopover && !this.activePopover.contains(target) && !target.closest('#cfobMenuBtn')) {
        this.activePopover.remove();
        this.activePopover = null;
      }
    });

    this.app.$("cfobCloseConfigBtn").addEventListener('click', () => this.app.$("cfobConfigModal").classList.remove('active'));
    this.app.$("cfobAddFieldBtn").addEventListener('click', () => { this.fieldConfigs.push({ label: "Custom Field", paths: "" }); this.openConfigModal(); });
    this.app.$("cfobResetConfigBtn").addEventListener('click', () => { this.resetConfig(); this.openConfigModal(); });
    this.app.$("cfobSaveConfigBtn").addEventListener('click', () => {
      /** @type {CFOB_CardFieldSettings[]} */
      const newCfgs = [];
      this.app.$("cfobConfigFieldsList").querySelectorAll('.config-field-item').forEach(item => {
        const label = /** @type {HTMLInputElement} */ (item.querySelector('.field-label-input')).value.trim();
        const paths = /** @type {HTMLInputElement} */ (item.querySelector('.field-paths-input')).value.trim();
        if (label) newCfgs.push({ label, paths });
      });
      this.saveConfig(newCfgs);
      this.app.$("cfobConfigModal").classList.remove('active');
      this.app.renderGallery();
    });

    this.app.$("cfobCloseInspectorBtn").addEventListener('click', () => this.app.$("cfobInspectorModal").classList.remove('active'));
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

    // Global Modal Focus Trap (Keeps Tab navigation locked inside active modals)
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab') return;
      const activeModal = this.app.root?.querySelector('.modal-overlay.active');
      if (!activeModal) return;

      const focusable = Array.from(activeModal.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]'));
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        /** @type {HTMLElement} */(last).focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        /** @type {HTMLElement} */(first).focus();
      }
    });

    this.app.$("cfobCloseHiddenFoldersBtn").addEventListener('click', () => this.app.$("cfobHiddenFoldersModal").classList.remove('active'));
    this.app.$("cfobResetHiddenFoldersBtn").addEventListener('click', () => {
      this.saveHiddenFoldersConfig(["temp", "trash"]);
      this.openHiddenFoldersModal();
    });
    this.app.$("cfobSaveHiddenFoldersBtn").addEventListener('click', () => {
      const val = /** @type {HTMLInputElement} */ (this.app.$("cfobHiddenFoldersInput")).value;
      const list = val.split(/[\n,]+/).map((/** @type {string} */ s) => s.trim()).filter(Boolean);
      this.saveHiddenFoldersConfig(list);
      this.app.$("cfobHiddenFoldersModal").classList.remove('active');
      this.app.filterGallery();
      this.app.showToast("Saved hidden folders configuration");
    });
  }

  /** @param {Event} e  */
  toggleOptionsMenu(e) {
    if (this.activePopover) {
      this.activePopover.remove();
      this.activePopover = null;
      return;
    }

    const btn = /** @type {HTMLButtonElement} */ (e.currentTarget);
    const rect = btn.getBoundingClientRect();
    const popover = document.createElement('div');
    popover.className = 'popover-menu';

    const currentView = this.app.settings.getViewMode();

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
            <input type="range" class="popover-slider" id="cfobScaleSlider" min="0.7" max="1.4" step="0.05" value="${this.app.settings.uiScale}">
            <span id="cfobScaleVal" style="font-size: 0.75em; font-weight: 600; min-width: 3em; text-align: right;">${Math.round(this.app.settings.uiScale * 100)}%</span>
          </div>
        </div>
      </div>

      <div class="popover-section">
        <div class="popover-header">Image Size</div>
        <div class="popover-row">
          <div class="popover-slider-container">
            <input type="range" class="popover-slider" id="cfobGridSizeSlider" min="20" max="800" step="10" value="${this.app.settings.gridSize}">
            <span id="cfobGridSizeVal" style="font-size: 0.75em; font-weight: 600; min-width: 3em; text-align: right;">${this.app.settings.gridSize}px</span>
          </div>
        </div>
      </div>

      <div class="popover-section">
        <div class="popover-header">Layout & Navigation</div>
        <div class="popover-row">
          <span>Position</span>
          <select class="popover-select" id="cfobModeSelect">
            <option value="full" ${this.app.settings.browserMode === 'full' ? 'selected' : ''}>Full Screen</option>
            <option value="right" ${this.app.settings.browserMode === 'right' ? 'selected' : ''}>Right Drawer</option>
            <option value="left" ${this.app.settings.browserMode === 'left' ? 'selected' : ''}>Left Drawer</option>
            <option value="down" ${this.app.settings.browserMode === 'down' ? 'selected' : ''}>Bottom Drawer</option>
            <option value="up" ${this.app.settings.browserMode === 'up' ? 'selected' : ''}>Top Drawer</option>
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
        const target = /** @type {HTMLElement} */(ev.currentTarget);
        const mode = target.dataset.view;
        this.app.settings.setViewMode(mode);
        popover.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
        target.classList.add('active');
      });
    });

    const scaleSlider = /** @type {HTMLElement} */ (popover.querySelector('#cfobScaleSlider'));
    const scaleValDisplay = /** @type {HTMLElement} */ (popover.querySelector('#cfobScaleVal'));
    scaleSlider.addEventListener('input', (ev) => {
      const val = parseFloat(/** @type {HTMLInputElement} */(ev.target).value);
      this.app.settings.setUiScale(val);
      scaleValDisplay.innerText = `${Math.round(val * 100)}%`;
    });

    const gridSizeSlider = /** @type {HTMLElement} */ (popover.querySelector('#cfobGridSizeSlider')); const gridSizeValDisplay = /** @type {HTMLElement} */ (popover.querySelector('#cfobGridSizeVal'));
    gridSizeSlider.addEventListener('input', (ev) => {
      const val = Number(/** @type {HTMLInputElement} */(ev.target).value);
      this.app.settings.setGridSize(val);
      gridSizeValDisplay.innerText = `${val}px`;
    });

    const modeSelect = /** @type {HTMLElement} */(popover.querySelector('#cfobModeSelect'));
    modeSelect.addEventListener('change', (ev) => {
      this.app.settings.setBrowserMode(/** @type {HTMLInputElement} */(ev.target).value);
    });

    const scrollSelect = /** @type {HTMLElement} */(popover.querySelector('#cfobScrollSelect'));
    scrollSelect.addEventListener('change', (ev) => {
      this.scrollDir = /** @type {HTMLInputElement} */(ev.target).value;
      localStorage.setItem('cfob_scroll_dir', this.scrollDir);
      const mainCont = /** @type {HTMLElement} */ (this.app.$("cfobMainContainer"));
      if (this.scrollDir === 'horizontal') {
        mainCont.classList.add('scroll-horizontal');
      } else {
        mainCont.classList.remove('scroll-horizontal');
      }
    });

    const sortSelect = /** @type {HTMLElement} */ (popover.querySelector('#cfobSortSelect'));
    sortSelect.addEventListener('change', (ev) => {
      this.currentSort = /** @type {HTMLInputElement} */ (ev.target).value;
      localStorage.setItem('cfob_sort', this.currentSort);
      this.app.applySort();
      this.app.filterGallery();
    });

    const toggleHiddenBtn = /** @type {HTMLElement} */ (popover.querySelector('#cfobToggleHiddenBtn'));
    toggleHiddenBtn.addEventListener('click', () => {
      this.showHiddenFolders = !this.showHiddenFolders;
      localStorage.setItem('comfy_folder_browser_show_hidden', String(this.showHiddenFolders));
      this.app.filterGallery();
      popover.remove();
      this.activePopover = null;
    });

    const configHiddenBtn = /** @type {HTMLElement} */ (popover.querySelector('#cfobConfigHiddenBtn'));
    configHiddenBtn.addEventListener('click', () => {
      this.openHiddenFoldersModal();
      popover.remove();
      this.activePopover = null;
    });

    const configFieldsBtn = /** @type {HTMLElement} */ (popover.querySelector('#cfobConfigFieldsBtn'));
    configFieldsBtn.addEventListener('click', () => {
      this.openConfigModal();
      popover.remove();
      this.activePopover = null;
    });

    const sort5 = /** @type {HTMLElement} */ (popover.querySelector('#cfobToggleAutoHideBtn'));
    sort5.addEventListener('click', () => {
      this.autoHide = !this.autoHide;
      localStorage.setItem('comfy_folder_browser_auto_hide', String(this.autoHide));
      this.app.showToast(`Auto-hide ${this.autoHide ? 'enabled' : 'disabled'}`);
      popover.remove();
      this.activePopover = null;
    });

    this.app.root?.appendChild(popover);
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
        modal.classList.remove("active");
        okBtn.removeEventListener("click", onOk);
        this.app.$("cfobConfirmCancelBtn").removeEventListener("click", onCancel);
        this.app.$("cfobConfirmCloseBtn").removeEventListener("click", onCancel);
      };

      const onOk = () => { cleanup(); resolve(true); };
      const onCancel = () => { cleanup(); resolve(false); };

      okBtn.addEventListener("click", onOk);
      this.app.$("cfobConfirmCancelBtn").addEventListener("click", onCancel);
      this.app.$("cfobConfirmCloseBtn").addEventListener("click", onCancel);

      modal.classList.add("active");
      okBtn.focus();
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

      const thumbWrapper = this.app.$("cfobPromptThumbWrapper");
      const thumbImg = /** @type {HTMLImageElement} */ (this.app.$("cfobPromptThumbImg"));

      let resolvedImgUrl = imageUrl;
      if (!resolvedImgUrl && folderPickerMode === 'rename' && defaultValue) {
        const found = this.app.loadedImages?.find(img => img.name === defaultValue || img.name.endsWith('/' + defaultValue) || img.name.endsWith('\\' + defaultValue));
        if (found) {
          resolvedImgUrl = found.url;
        }
      }

      if (resolvedImgUrl) {
        thumbImg.src = resolvedImgUrl;
        thumbWrapper.classList.add('active');
      } else {
        thumbWrapper.classList.remove('active');
        thumbImg.src = '';
      }

      const folderWrapper = this.app.$("cfobFolderListWrapper");
      const folderList = this.app.$("cfobFolderList");

      if (folderPickerMode !== 'none') {
        folderWrapper.style.display = "block";
        const folders = new Set();
        this.app.loadedImages.forEach(img => {
          const parts = img.name.split(/\\|\//);
          if (parts.length > 1) folders.add(parts.slice(0, -1).join('/'));
        });

        folderList.innerHTML = "";

        /** 
         * @param {string} html
         * @param {(this: GlobalEventHandlers, ev: PointerEvent) => any | null} onClick 
         */
        const createChip = (html, onClick) => {
          const chip = document.createElement("div");
          chip.className = "folder-chip";
          chip.innerHTML = html;
          chip.tabIndex = 0; // Make focusable

          chip.onclick = onClick;
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
        const rootOnClick = () => {
          if (folderPickerMode === 'rename') input.value = input.value.split(/\\|\//).pop() || "";
          else input.value = "";
          input.focus();
        };
        folderList.appendChild(createChip(`${ICONS.logo} Root (/)`, rootOnClick));

        // Add detected folders
        Array.from(folders).sort().forEach(folder => {
          const folderOnClick = () => {
            if (folderPickerMode === 'rename') {
              const fileName = input.value.split(/\\|\//).pop();
              input.value = folder + "/" + fileName;
            } else {
              input.value = folder;
            }
            input.focus();
          };
          folderList.appendChild(createChip(`${ICONS.logo} ${this.app.escapeHtml(folder)}`, folderOnClick));
        });
      } else {
        folderWrapper.style.display = "none";
      }

      const cleanup = () => {
        modal.classList.remove("active");
        thumbWrapper.classList.remove('active');
        this.app.$("cfobPromptOkBtn").removeEventListener("click", onOk);
        this.app.$("cfobPromptCancelBtn").removeEventListener("click", onCancel);
        this.app.$("cfobPromptCloseBtn").removeEventListener("click", onCancel);
        input.removeEventListener("keydown", onKey);
      };

      const onOk = () => { cleanup(); resolve(input.value); };
      const onCancel = () => { cleanup(); resolve(null); };
      const onKey = (/** @type {KeyboardEvent} */ e) => { if (e.key === "Enter") onOk(); };

      this.app.$("cfobPromptOkBtn").addEventListener("click", onOk);
      this.app.$("cfobPromptCancelBtn").addEventListener("click", onCancel);
      this.app.$("cfobPromptCloseBtn").addEventListener("click", onCancel);
      input.addEventListener("keydown", onKey);

      modal.classList.add("active");
      setTimeout(() => {
        input.focus();
        if (folderPickerMode === 'rename') {
          // Select only the filename, not the path
          const parts = input.value.split(/\\|\//);
          const fn = parts.pop() || "";
          const dirLen = input.value.length - fn.length;
          input.setSelectionRange(dirLen, input.value.length);
        } else {
          input.select();
        }
      }, 10);
    });
  }

  openConfigModal() {
    const modal = this.app.$("cfobConfigModal");
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
        this.openConfigModal();
      });

      list.appendChild(item);
    });

    modal.classList.add('active');
    setTimeout(() => this.app.$("cfobAddFieldBtn")?.focus(), 10);
  }

  openHiddenFoldersModal() {
    const modal = this.app.$("cfobHiddenFoldersModal");
    const input = /** @type {HTMLInputElement} */ (this.app.$("cfobHiddenFoldersInput"));
    input.value = this.hiddenFolders.join("\n");
    modal.classList.add('active');
    setTimeout(() => input.focus(), 10);
  }

  /** @param {number} idx */
  openInspector(idx) {
    const img = this.app.loadedImages[idx];
    if (!img) return;

    const modal = this.app.$("cfobInspectorModal");
    this.app.$("cfobInspectorTitle").innerText = `Inspector - ${img.name.split('/').pop()}`;

    const promptText = img.prompt ? JSON.stringify(img.prompt, null, 2) : "No API Prompt data available";
    const workflowText = img.workflow ? JSON.stringify(img.workflow, null, 2) : "No UI Workflow data available";

    /** @type {HTMLInputElement} */ (this.app.$("cfobInsPromptText")).value = promptText;
    /** @type {HTMLInputElement} */ (this.app.$("cfobInsWorkflowText")).value = workflowText;

    const nodesGrid = this.app.$("cfobInsNodesGrid");
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
                  <span class="input-name">${this.app.escapeHtml(inKey)}</span>
                </div>
                <div class="input-value-wrapper">
                  <span class="input-value-text">${this.app.escapeHtml(valDisplay)}</span>
                  <button class="icon-btn copy-val-btn" data-val="${encodeURIComponent(valDisplay)}" title="Copy">${ICONS.copy}</button>
                </div>
              </div>
            `;
          }
        }

        nodeCard.innerHTML = `
          <div class="node-header">
            <div class="node-title">
              ${this.app.escapeHtml(title)}
              <small>${this.app.escapeHtml(classType)}</small>
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
    setTimeout(() => {
      /** @type {HTMLElement} */(this.app.root?.querySelector('#cfobInspectorTabs .tab.active'))?.focus();
    }, 10);
  }
}
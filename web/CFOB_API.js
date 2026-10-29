import PngMetadata from "./PngMetadata.js";

export default class COB_API {
  /** @param {import("./ComfyOutputBrowser.js").default} app  */
  constructor(app) {
    this.app = app;
    this.dbPromise = this.initDB();
    this._idleParsingActive = false;

    /** @type {Worker | null} */
    this._metadataWorker = null;
    /** @type {number} */
    this._metadataToken = 0;
    /** @type {Map<number, {resolve: Function, reject: Function, done: boolean}>} */
    this._metadataPending = new Map();
  }

  async initDB() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open('CfobCacheDB', 1);
      req.onupgradeneeded = (e) => {
        // @ts-ignore
        const db = e.target.result;
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata');
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  /** @param {string} key  */
  async cacheGet(key) {
    try {
      const db = await this.dbPromise;
      return new Promise(resolve => {
        const tx = db.transaction('metadata', 'readonly');
        const req = tx.objectStore('metadata').get(key);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(null);
      });
    } catch { return null; }
  }

  /**
   * @param {string} key
   * @param {{ prompt: Record<string,any>; workflow: Record<string,any>; }} val
   * @param {number} [mtime]
   */
  async cacheSet(key, val, mtime = 0) {
    try {
      const db = await this.dbPromise;
      return new Promise(resolve => {
        const tx = db.transaction('metadata', 'readwrite');
        tx.objectStore('metadata').put({ ...val, mtime }, key);
        // @ts-ignore
        tx.oncomplete = () => resolve();
      });
    } catch { /* ignore */ }
  }

  /** @param {string} key */
  async cacheDelete(key) {
    try {
      const db = await this.dbPromise;
      return new Promise(resolve => {
        const tx = db.transaction('metadata', 'readwrite');
        tx.objectStore('metadata').delete(key);
        // @ts-ignore
        tx.oncomplete = () => resolve();
      });
    } catch { /* ignore */ }
  }

  /** @param {string} relPath */
  getImageUrl(relPath) {
    const parts = relPath.replace(/\\/g, '/').split('/');
    const filename = parts.pop();
    if (!filename) return "";
    const subfolder = parts.join('/');
    let url = `/view?filename=${encodeURIComponent(filename)}&type=output`;
    if (subfolder) {
      url += `&subfolder=${encodeURIComponent(subfolder)}`;
    }
    return url;
  }

  /**
 * @param {CFOB_Image} img
 */
  async loadMetadata(img) {
    if (img.isParsed) return;
    if (img.isParsing) {
      // eslint-disable-next-line no-await-in-loop
      while (img.isParsing) { await new Promise(r => setTimeout(r, 50)); }
      return;
    }

    img.isParsing = true;
    try {
      let meta = await this.cacheGet(img.name);
      if (!meta || (img.mtime && meta.mtime !== img.mtime)) {
        const res = await fetch(img.url);
        const buffer = await res.arrayBuffer();
        meta = await this.parsePngBuffer(buffer) || { prompt: null, workflow: null };
        await this.cacheSet(img.name, meta, img.mtime);
      }
      img.prompt = meta.promptJson;
      img.workflow = meta.workflowJson;
      img.isParsed = true;
      this.app.search.indexImageKeywords(img);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn(`Failed to parse file: ${img.name}`, e);
      img.isParsed = true;
      this.app.search.indexImageKeywords(img);
    } finally {
      img.isParsing = false;
      this.app.gallery?.updatePreviewTooltip(img);
    }
  }

  startIdleParsing() {
    if (this._idleParsingActive) return;
    this._idleParsingActive = true;
    this.app.setIdleParsingActive(true);

    const parseNext = async () => {
      const img = this.app.loadedImages.find((/** @type {CFOB_Image} */ i) => !i.isParsed && !i.isParsing);

      if (img) {
        await this.loadMetadata(img);

        const cards = Array.from(this.app.root?.querySelectorAll('.image-card') || []);
        const card = cards.find(c => /** @type {HTMLElement} */(c).dataset.name === img.name);
        if (card) {
          const cardBody = card.querySelector('.card-body');
          if (cardBody && cardBody.innerHTML.includes('Loading...')) {
            cardBody.innerHTML = this.app.getCardFieldsHtml(img);
          }
        }

        if ('requestIdleCallback' in window) {
          requestIdleCallback(parseNext, { timeout: 2000 });
        } else {
          setTimeout(parseNext, 50);
        }
      } else {
        this._idleParsingActive = false;
        this.app.setIdleParsingActive(false);
      }
    };

    if ('requestIdleCallback' in window) requestIdleCallback(parseNext, { timeout: 2000 });
    else setTimeout(parseNext, 50);
  }

  /** @param {string} str */
  sanitizeJson(str) {
    return str.replace(/(?<!["\w])-(?:NaN|Infinity)(?!["\w])/g, "null");
  }

  /** @param {ArrayBuffer} arrayBuffer */
  parsePngBuffer(arrayBuffer) {
    if (!this._metadataWorker) this._metadataWorker = this._initMetadataWorker();
    const worker = this._metadataWorker;
    if (worker && typeof worker.postMessage === "function") {
      return new Promise((resolve, reject) => {
        const token = this._metadataToken++;
        const pending = { resolve, reject, done: false };
        this._metadataPending.set(token, pending);

        /**
         * @param {MessageEvent} e
         */
        const onMessage = (e) => {
          if (e.data && e.data.token === token) {
            worker.removeEventListener("message", onMessage);
            worker.removeEventListener("error", onError);
            this._metadataPending.delete(token);
            if (pending.done) return;
            pending.done = true;
            if (e.data.type === "metadata") {
              resolve(e.data.meta && e.data.meta !== null ? e.data.meta : { prompt: null, workflow: null });
            } else {
              reject(new Error(e.data.error || "PNG metadata parse failed"));
            }
          }
        };
        /**
         * @param {Event} _e
         */
        const onError = (_e) => {
          worker.removeEventListener("message", onMessage);
          worker.removeEventListener("error", onError);
          this._metadataPending.delete(token);
          if (pending.done) return;
          pending.done = true;
          reject(new Error("Metadata worker error"));
        };
        worker.addEventListener("message", onMessage);
        worker.addEventListener("error", onError);

        try {
          // Transfer the buffer so the parser runs on this worker thread with no copy.
          worker.postMessage({ token, type: "parse", bytes: arrayBuffer }, [arrayBuffer]);
        } catch {
          worker.removeEventListener("message", onMessage);
          worker.removeEventListener("error", onError);
          this._metadataPending.delete(token);
          if (!pending.done) pending.done = true;
          // The buffer could not be transferred (e.g. cross-origin response).
          // Parse on the main thread instead of blocking the worker path.
          resolve(PngMetadata.extract(new Uint8Array(arrayBuffer)) || { prompt: null, workflow: null });
        }
      });
    }
    // Workers are unavailable in this environment (e.g. a restricted renderer).
    // Parse on the main thread so the path stays correct.
    return Promise.resolve(PngMetadata.extract(new Uint8Array(arrayBuffer)) || { prompt: null, workflow: null });
  }

  /** @private */
  _initMetadataWorker() {
    if (this._metadataWorker) return this._metadataWorker;
    try {
      // @ts-ignore
      const WorkerCtor = self.Worker || (/** @type {any} */ (self).Worker);
      if (!WorkerCtor) return null;
      // Module workers resolve "./PngMetadata.js" relative to this file's URL.
      const worker = new WorkerCtor(new URL("./CFOB_MetadataWorker.js", import.meta.url), { type: "module" });
      this._metadataWorker = worker;
      return worker;
    } catch {
      // Worker creation failed (e.g. restricted renderer); fall back to main-thread parse.
      return null;
    }
  }
}
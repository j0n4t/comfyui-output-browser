export default class COB_API {
  /** @param {import("./ComfyOutputBrowser.js").default} app  */
  constructor(app) {
    this.app = app;
    this.dbPromise = this.initDB();
    this._idleParsingActive = false;
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
    } catch (e) { return null; }
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
    } catch (e) { }
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
    } catch (e) { }
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
   * @param {File} file 
   * @param {string} targetSubfolder 
   * @returns {Promise<CFOB_Image | null>}
   */
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
        const mtime = data.mtime || 0;
        await this.cacheSet(data.name, { prompt: meta.prompt, workflow: meta.workflow }, mtime);

        return {
          name: data.name,
          mtime: mtime,
          url: this.getImageUrl(data.name) + (mtime ? `&t=${mtime}` : ''),
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

  /**
 * @param {CFOB_Image} img
 */
  async loadMetadata(img) {
    if (img.isParsed) return;
    if (img.isParsing) {
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

  startIdleParsing() {
    if (this._idleParsingActive) return;
    this._idleParsingActive = true;

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
      }
    };

    if ('requestIdleCallback' in window) requestIdleCallback(parseNext, { timeout: 2000 });
    else setTimeout(parseNext, 50);
  }

  /** @param {FileList | null} fileList  */
  async handleLocalFiles(fileList) {
    const pngs = Array.from(fileList || []).filter(f => f.type === 'image/png' || f.name.toLowerCase().endsWith('.png'));

    for (const file of pngs) {
      const res = await this.processPngFile(file);
      if (res) {
        this.app.loadedImages = this.app.loadedImages.filter((/** @type {CFOB_Image} */ img) => img.name !== res.name);
        this.app.loadedImages.unshift(res);
      }
    }
    this.app.filterGallery();
  }

  /** @param {string} str */
  sanitizeJson(str) {
    return str.replace(/(?<!["\w])\-?(?:NaN|Infinity)(?!["\w])/g, "null");
  }

  /** @param {ArrayBuffer} arrayBuffer */
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
}
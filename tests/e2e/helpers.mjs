// E2E-only helpers: the unit suite must stay runnable with zero dependencies,
// so nothing here may be imported from tests/unit.
import { spawn } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { deflateSync } from "node:zlib";

export const REPO_ROOT = resolve(import.meta.dirname, "..", "..");

/** Absolute paths tried in order for a Chromium binary. */
const CHROME_CANDIDATES = [
  join(process.env.LOCALAPPDATA || "", "ms-playwright", "chromium-1223", "chrome-win64", "chrome.exe"),
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
];

export function findChrome() {
  const fromEnv = process.env.CFOB_CHROME;
  const candidates = fromEnv ? [fromEnv, ...CHROME_CANDIDATES] : CHROME_CANDIDATES;
  return candidates.find(p => p && existsSync(p)) || null;
}

/**
 * Minimal PNG encoder, so fixtures need no image tooling. Only a solid colour is
 * ever needed here; the browser just has to decode something real.
 * @param {string} path
 * @param {[number, number, number]} rgb
 */
export function writeSolidPng(path, rgb) {
  const w = 8, h = 8;
  const raw = Buffer.concat(
    Array.from({ length: h }, () => Buffer.concat([Buffer.from([0]), Buffer.from(Array.from({ length: w }, () => rgb).flat())]))
  );
  const chunk = (/** @type {string} */ type, /** @type {Buffer} */ data) => {
    const body = Buffer.concat([Buffer.from(type, "latin1"), data]);
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(body) >>> 0);
    return Buffer.concat([len, body, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 2; // 8-bit truecolour
  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
  writeFileSync(path, png);
}

/** @param {Buffer} buf */
function crc32(buf) {
  let c = ~0;
  for (const byte of buf) {
    c ^= byte;
    for (let i = 0; i < 8; i++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c;
}

/**
 * Builds a throwaway output dir holding `layout` (relative path -> solid RGB).
 * @param {Record<string, [number, number, number]>} layout
 * @returns {{ root: string, outputDir: string }}
 */
export function makeOutputDir(layout) {
  const root = mkdtempSync(join(tmpdir(), "cfob-e2e-"));
  const outputDir = join(root, "output");
  mkdirSync(outputDir, { recursive: true });
  for (const [rel, rgb] of Object.entries(layout)) {
    const full = join(outputDir, rel);
    mkdirSync(join(full, ".."), { recursive: true });
    writeSolidPng(full, rgb);
  }
  return { root, outputDir };
}

/** @param {string} root */
export function removeOutputDir(root) {
  rmSync(root, { recursive: true, force: true, maxRetries: 5 });
}

/**
 * Runs the standalone server (`python __init__.py`) against `outputDir`.
 *
 * COMFYUI_OUTPUT_DIR must be absolute: get_output_dir() resolves it against the
 * process CWD when it is relative.
 *
 * @param {{ outputDir: string, port: number, python: string }} opts
 */
export function startServer({ outputDir, port, python }) {
  const proc = spawn(python, ["__init__.py"], {
    cwd: REPO_ROOT,
    env: { ...process.env, COMFYUI_OUTPUT_DIR: outputDir, PORT: String(port) },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let output = "";
  proc.stdout.on("data", d => { output += d; });
  proc.stderr.on("data", d => { output += d; });
  return {
    proc,
    get output() { return output; },
    async stop() {
      if (proc.exitCode !== null || proc.signalCode !== null) return;
      const ended = new Promise(r => proc.once("exit", r));
      proc.kill();
      await Promise.race([ended, new Promise(r => setTimeout(r, 5000))]);
      if (proc.exitCode === null && proc.signalCode === null) proc.kill("SIGKILL");
    },
  };
}

/** @param {string} url */
export async function waitForServer(url, timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;
  let lastErr = null;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url);
      if (res.ok) return await res.json();
    } catch (e) {
      lastErr = e;
    }
    await delay(200);
  }
  throw new Error(`Server at ${url} never became ready: ${lastErr}`);
}

/** @param {number} ms */
export const delay = ms => new Promise(r => setTimeout(r, ms));

/**
 * Launches headless Chromium and attaches to it over CDP using Node's built-in
 * WebSocket — no puppeteer/playwright dependency required.
 * @param {string} chromePath
 * @param {{ port: number }} opts
 */
export async function launchChrome(chromePath, { port }) {
  const userDataDir = mkdtempSync(join(tmpdir(), "cfob-chrome-"));
  const proc = spawn(chromePath, [
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-extensions",
    `--user-data-dir=${userDataDir}`,
    `--remote-debugging-port=${port}`,
    "about:blank",
  ], { stdio: ["ignore", "pipe", "pipe"] });
  let output = "";
  proc.stdout.on("data", d => { output += d; });
  proc.stderr.on("data", d => { output += d; });

  let wsUrl = null;
  const deadline = Date.now() + 20000;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (res.ok) {
        wsUrl = (await res.json()).webSocketDebuggerUrl;
        break;
      }
    } catch { /* not up yet */ }
    await delay(200);
  }
  if (!wsUrl) throw new Error(`Chromium never exposed CDP on port ${port}.\n${output}`);

  const session = await connectCdp(wsUrl);
  return {
    proc,
    ...session,
    async stop() {
      try { await session.send("Browser.close"); } catch { /* already gone */ }
      await delay(300);
      if (proc.exitCode === null && proc.signalCode === null) proc.kill();
      rmSync(userDataDir, { recursive: true, force: true, maxRetries: 5 });
    },
  };
}

/**
 * Speaks just enough CDP for the test: flat-mode sessions over one page target.
 * @param {string} wsUrl
 */
async function connectCdp(wsUrl) {
  const ws = new WebSocket(wsUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener("open", () => resolve(undefined), { once: true });
    ws.addEventListener("error", e => reject(new Error(`CDP socket error: ${e.message || e.type}`)), { once: true });
  });

  let nextId = 1;
  /** @type {Map<number, {resolve: (v: any) => void, reject: (e: Error) => void}>} */
  const pending = new Map();
  /** @type {Map<string, (params: any) => void>} */
  const listeners = new Map();

  ws.addEventListener("message", ev => {
    const msg = JSON.parse(/** @type {string} */ (ev.data));
    if (msg.id !== undefined) {
      const entry = pending.get(msg.id);
      if (!entry) return;
      pending.delete(msg.id);
      if (msg.error) entry.reject(new Error(`${msg.error.message} (${msg.error.code})`));
      else entry.resolve(msg.result);
      return;
    }
    const handler = listeners.get(msg.method);
    if (handler) handler(msg.params);
  });

  /** @param {string} method @param {any} [params] */
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = nextId++;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });

  /** @param {string} method @param {(params: any) => void} handler */
  const on = (method, handler) => { listeners.set(method, handler); };

  const { targetId } = await send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });

  const sessionSend = (/** @type {string} */ method, /** @type {any} */ params = {}) => new Promise((resolve, reject) => {
    const id = nextId++;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params, sessionId }));
  });
  const sessionOn = (/** @type {string} */ method, /** @type {(params: any) => void} */ handler) => {
    listeners.set(method, params => {
      if (params.sessionId === sessionId) handler(params);
    });
  };

  await sessionSend("Page.enable");
  await sessionSend("Runtime.enable");

  /** @type {{id: number, resolve: (v: any) => void} | null} */
  let loadWaiter = null;
  sessionOn("Page.loadEventFired", () => {
    if (loadWaiter) {
      const { resolve } = loadWaiter;
      loadWaiter = null;
      resolve(undefined);
    }
  });

  /** @param {string} url */
  const goto = async url => {
    const loaded = new Promise(resolve => { loadWaiter = { id: 0, resolve }; });
    await sessionSend("Page.navigate", { url });
    await Promise.race([loaded, delay(20000)]);
  };

  /** @param {string} expression */
  const evaluate = async expression => {
    const res = await sessionSend("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });
    if (res.exceptionDetails) {
      throw new Error(`JS threw: ${res.exceptionDetails.exception?.description || res.exceptionDetails.text}\n${expression}`);
    }
    return res.result.value;
  };

  return { send: sessionSend, on: sessionOn, goto, evaluate, close: () => ws.close() };
}

/**
 * Polls `evaluate(expression)` until it returns a truthy value.
 * @param {(expression: string) => Promise<any>} evaluate
 * @param {string} expression
 * @param {string} label
 * @param {number} timeoutMs
 */
export async function waitUntil(evaluate, expression, label, timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;
  let last;
  while (Date.now() < deadline) {
    last = await evaluate(expression);
    if (last) return last;
    await delay(100);
  }
  throw new Error(`Timed out waiting for ${label} (last value: ${JSON.stringify(last)})`);
}

/**
 * Resolves the Python interpreter used to run the standalone server: the ComfyUI
 * venv when present (it has aiohttp), else CFOB_PYTHON, else `python`.
 */
export function findPython() {
  if (process.env.CFOB_PYTHON) return process.env.CFOB_PYTHON;
  const venv = resolve(REPO_ROOT, "..", "..", ".venv", "Scripts", "python.exe");
  if (existsSync(venv)) return venv;
  return "python";
}

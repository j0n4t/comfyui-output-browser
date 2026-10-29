// E2E-only helpers: the unit suite must stay runnable with zero dependencies,
// so nothing here may be imported from tests/unit.
import { execFileSync, spawn } from "node:child_process";
import { mkdtempSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { createServer } from "node:net";
import { deflateSync } from "node:zlib";

export const REPO_ROOT = resolve(import.meta.dirname, "..", "..");

/**
 * Cleanups to run if the process is killed before its `after` hooks run.
 *
 * A SIGINT/SIGTERM (Ctrl-C, an outer timeout) ends Node immediately, skipping
 * teardown — so the browser tree and its profile directory leak. These run on
 * the way out, then the process exits with the conventional 130.
 * @type {Set<() => Promise<void>>}
 */
const cleanups = new Set();
let signalHandlersInstalled = false;

/** @param {() => Promise<void>} fn @returns {() => void} unregister */
function registerCleanup(fn) {
  if (!signalHandlersInstalled) {
    signalHandlersInstalled = true;
    for (const signal of ["SIGINT", "SIGTERM"]) {
      process.on(signal, () => {
        void (async () => {
          for (const cleanup of cleanups) {
            try {
              // eslint-disable-next-line no-await-in-loop
              await cleanup();
            } catch { /* best effort on the way out */ }
          }
          process.exit(130);
        })();
      });
    }
  }
  cleanups.add(fn);
  return () => { cleanups.delete(fn); };
}

/**
 * Kills a process and everything it spawned.
 *
 * `proc.kill()` only signals the process itself. Chromium forks a whole tree
 * (renderer, gpu, crashpad-handler), and on Windows the children outlive their
 * parent — they keep handles open on the profile directory, so the subsequent
 * `rmSync` fails with EPERM and leaks tens of MB per run. `taskkill /T /F` takes
 * the tree; elsewhere a process-group kill does.
 * @param {import("node:child_process").ChildProcess} proc
 */
export function killTree(proc) {
  if (!proc || proc.pid === undefined || (proc.exitCode !== null || proc.signalCode !== null)) return;
  if (process.platform === "win32") {
    try {
      execFileSync("taskkill", ["/pid", String(proc.pid), "/T", "/F"], { stdio: "ignore" });
      return;
    } catch { /* fall through to the plain kill */ }
  }
  try { proc.kill("SIGKILL"); } catch { /* already gone */ }
}

/**
 * Removes a directory, tolerating the Windows "still held" case.
 *
 * Chromium releases its handles a moment after the process dies, so an
 * immediate delete can fail with EPERM/EBUSY. Retrying beats both a bare throw
 * (which masks a green run) and an instant give-up (which leaks the profile).
 * @param {string} dir
 */
export function removeDirWithRetry(dir) {
  for (let attempt = 0; attempt < 10; attempt++) {
    try {
      rmSync(dir, { recursive: true, force: true });
      return true;
    } catch {
      // Busy-wait briefly; this runs at most a few hundred ms in practice.
      const until = Date.now() + 200;
      while (Date.now() < until) { /* spin */ }
    }
  }
  return false;
}

/**
 * Removes profile/fixture dirs left behind by runs that died abnormally.
 *
 * The signal handler below only covers a catchable SIGINT/SIGTERM. On Windows an
 * external kill (Task Manager, `Stop-Process -Force`, an outer timeout) is
 * `TerminateProcess` — not catchable — so no in-process handler can ever run,
 * and those runs always leak. Sweeping at startup is what makes the leak
 * self-healing regardless of how the previous run died.
 *
 * A dir is stale only if no live process references it, so a concurrent run's
 * dirs are left alone.
 */
export function sweepStaleProfileDirs() {
  if (process.platform !== "win32") return 0;
  const temp = tmpdir();
  /** @type {string[]} */
  let entries;
  try {
    entries = readdirSync(temp).filter(name => name.startsWith("cfob-chrome-") || name.startsWith("cfob-e2e-"));
  } catch {
    return 0;
  }
  if (!entries.length) return 0;

  // One query for every process command line, rather than one per dir.
  let commandLines;
  try {
    commandLines = execFileSync("powershell", [
      "-NoProfile", "-Command",
      "(Get-CimInstance Win32_Process | Select-Object -ExpandProperty CommandLine) -join \"`n\"",
    ], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], timeout: 20000 });
  } catch {
    return 0; // Cannot tell what is live; leave everything alone.
  }

  let removed = 0;
  for (const name of entries) {
    if (commandLines.includes(name)) continue; // A live process owns it.
    if (removeDirWithRetry(join(temp, name))) removed++;
  }
  return removed;
}

/**
 * Writes a solid PNG. The default 8x8 is what a fixture needs to decode; pass `width`
 * and `height` when a test depends on the image's own aspect ratio — the full view
 * fits the picture to its box, so an 8x8 image gives a near-zero box and no meaningful
 * geometry.
 * @param {string} path
 * @param {[number, number, number]} rgb
 * @param {number} [width]
 * @param {number} [height]
 */
export function writeSolidPng(path, rgb, width = 8, height = 8) {
  const raw = Buffer.concat(
    Array.from({ length: height }, () => Buffer.concat([Buffer.from([0]), Buffer.from(Array.from({ length: width }, () => rgb).flat())]))
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
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
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
  removeDirWithRetry(root);
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
  /** @type {(() => void) | null} */
  let unregisterCleanup = registerCleanup(stopServer);
  async function stopServer() {
    unregisterCleanup?.();
    unregisterCleanup = null;
    if (proc.exitCode !== null || proc.signalCode !== null) return;
    const ended = new Promise(r => proc.once("exit", r));
    proc.kill();
    await Promise.race([ended, new Promise(r => setTimeout(r, 5000))]);
    killTree(proc);
  }
  return {
    proc,
    get output() { return output; },
    stop: stopServer,
  };
}

/** @param {string} url */
export async function waitForServer(url, timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;
  let lastErr = null;
  while (Date.now() < deadline) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const res = await fetch(url);
      // eslint-disable-next-line no-await-in-loop
      if (res.ok) return await res.json();
    } catch (e) {
      lastErr = e;
    }
    // eslint-disable-next-line no-await-in-loop
    await delay(200);
  }
  throw new Error(`Server at ${url} never became ready: ${lastErr}`);
}

/** @param {number} ms */
export const delay = ms => new Promise(r => setTimeout(r, ms));

export async function findAvailablePort() {
  const server = createServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Could not allocate a TCP port");
  await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  return address.port;
}

/**
 * Adds the CDP session needed by input tests to Playwright's per-test page.
 * @param {import("playwright").Page} page
 * @param {import("playwright").BrowserContext} context
 */
export async function attachPage(page, context) {
  const cdp = await context.newCDPSession(page);
  page.setDefaultTimeout(10000);
  const evaluate = expression => page.evaluate(expression);
  evaluate.waitForFunction = async (predicate, timeoutMs) => {
    const fn = predicate.trim().startsWith("() =>") ? predicate : `() => (${predicate})`;
    const handle = await page.waitForFunction(fn, undefined, { timeout: timeoutMs });
    try {
      return await handle.jsonValue();
    } finally {
      await handle.dispose();
    }
  };

  /** Detaches the optional CDP session. Playwright owns the page and context. */
  let stopped = false;
  const stop = async () => {
    if (stopped) return;
    stopped = true;
    unregisterCleanup();
    await cdp.detach();
  };
  const unregisterCleanup = registerCleanup(stop);

  return {
    context,
    page,
    cdp,
    evaluate,
    goto: url => page.goto(url),
    stop,
  };
}

/**
 * Polls `evaluate(expression)` until it returns a truthy value.
 * @param {(expression: string) => Promise<any>} evaluate
 * @param {string} expression
 * @param {string} label
 * @param {number} timeoutMs
 */
export async function waitUntil(evaluate, expression, label, timeoutMs = 15000) {
  try {
    return await evaluate.waitForFunction(expression, timeoutMs);
  } catch (error) {
    if (error?.name !== "TimeoutError") throw error;
    throw new Error(`Timed out waiting for ${label}`, { cause: error });
  }
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

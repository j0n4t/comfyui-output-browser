import PngMetadata from "./PngMetadata.js";

/**
 * Metadata worker.
 *
 * Receives { token, type: "parse", bytes } and posts back
 * { token, type: "metadata", meta } or { token, type: "error", error }.
 * The PNG parsing (zlib inflate + JSON parse of the embedded prompt/workflow)
 * runs on this separate thread so the main thread (the browser UI) never blocks
 * on it.
 *
 * Both browser workers and Node worker threads are supported:
 *  - Browser:  globalThis.addEventListener("message") + globalThis.postMessage
 *  - Node:     parentPort (from `node:worker_threads`) + port.postMessage
 *
 * The worker finishes setup, signals "ready", and only then is the caller
 * allowed to post parse messages.
 */

/** @type {any} */
let port = null;

const init = async () => {
  try {
    // @ts-ignore - `node:worker_threads` is only resolvable inside a Node worker.
    const mod = await import("node:worker_threads");
    port = mod.parentPort;
  } catch {
    port = null;
  }
};

init();

const handle = (/** @type {any} */ e) => {
  // In Node the parentPort 'message' listener receives the message value directly;
  // in the browser the globalThis listener receives an Event whose .data is the value.
  const msg = port ? e : e.data;
  const { token, type, bytes } = msg;
  if (type === "__cfob_worker_ready__") return;
  if (type !== "parse" || bytes === undefined || bytes === null) return;

  try {
    // bytes may be an ArrayBuffer or a Uint8Array; both work with Uint8Array().
    const meta = PngMetadata.extract(new Uint8Array(bytes));
    if (port) {
      port.postMessage({ token, type: "metadata", meta });
    } else {
      globalThis.postMessage({ token, type: "metadata", meta });
    }
  } catch (err) {
    const payload = {
      token,
      type: "error",
      error: err instanceof Error ? err.message : String(err),
    };
    if (port) {
      port.postMessage(payload);
    } else {
      globalThis.postMessage(payload);
    }
  }
};

init().then(() => {
  if (port) {
    port.on("message", handle);
    port.postMessage("__cfob_worker_ready__");
  } else {
    globalThis.addEventListener("message", handle);
    globalThis.postMessage("__cfob_worker_ready__");
  }
});

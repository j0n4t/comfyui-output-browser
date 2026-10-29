import assert from "node:assert/strict";
import test from "node:test";
import { Worker } from "node:worker_threads";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const workerPath = join(here, "..", "..", "web", "CFOB_MetadataWorker.js");

function chunk(type, data) {
  const buf = new Uint8Array(12 + data.byteLength);
  const dv = new DataView(buf.buffer);
  dv.setUint32(0, data.byteLength, false);
  for (let i = 0; i < 4; i++) buf[i + 4] = type.charCodeAt(i);
  buf.set(data, 8);
  return buf;
}

function textChunk(keyword, text) {
  const data = new TextEncoder().encode(keyword + "\0" + text);
  return chunk("tEXt", data);
}

function waitForWorkerMessage(worker, predicate, timeoutMessage, timeoutMs = 10_000) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => finish(new Error(timeoutMessage)), timeoutMs);
    const onMessage = (message) => {
      if (predicate(message)) finish(null, message);
      else finish(new Error("Unexpected worker message: " + JSON.stringify(message)));
    };
    const onError = (error) => finish(error);
    const onExit = (code) => finish(new Error("Worker exited before responding with code " + code));

    function finish(error, message) {
      clearTimeout(timeout);
      worker.off("message", onMessage);
      worker.off("error", onError);
      worker.off("exit", onExit);
      if (error) reject(error);
      else resolve(message);
    }

    worker.on("message", onMessage);
    worker.on("error", onError);
    worker.on("exit", onExit);
  });
}

/**
 * A minimal PNG: signature + IHDR + one prompt tEXt chunk + IEND.
 * The parser only validates the signature and walks chunks, so CRC may be zero.
 */
function makePng(promptJson, workflowJson) {
  const ihdrData = new Uint8Array([1, 0, 0, 0, 6, 0, 0, 0, 8, 2, 0, 0, 0]);
  const ihdr = chunk("IHDR", ihdrData);
  const promptChunk = textChunk(
    "prompt",
    JSON.stringify(promptJson || { 1: { class_type: "KSampler", inputs: { prompt: "test" } } })
  );
  const workflowChunk = textChunk(
    "workflow",
    workflowJson ? JSON.stringify(workflowJson) : ""
  );
  const iend = chunk("IEND", new Uint8Array(0));

  const png = new Uint8Array(
    8 + ihdr.byteLength + promptChunk.byteLength + workflowChunk.byteLength + iend.byteLength
  );
  let off = 0;
  png.set(new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])); off += 8;
  png.set(ihdr, off); off += ihdr.byteLength;
  png.set(promptChunk, off); off += promptChunk.byteLength;
  png.set(workflowChunk, off); off += workflowChunk.byteLength;
  png.set(iend, off);
  return png;
}

test("metadata worker extracts prompt/workflow JSON from PNG bytes", async (_t) => {
  const png = makePng(
    { 1: { class_type: "KSampler", inputs: { prompt: "test positive" } } },
    { nodes: [{ id: 1, type: "KSampler", title: "KSampler" }] }
  );

  const worker = new Worker(workerPath, { type: "module" });
  let result;

  // 1) Wait for the worker's ready signal — proves its message listener is live so the
  //    following parse request is not swallowed. Do NOT terminate here: the worker
  //    must stay alive to receive and answer the parse request.
  try {
    await waitForWorkerMessage(
      worker,
      (message) => message === "__cfob_worker_ready__",
      "Timed out waiting for metadata worker ready signal"
    );

    // 2) Send the parse request.
    worker.postMessage({ token: 1, type: "parse", bytes: png.buffer }, [png.buffer]);

    // 3) Wait for the parse result.
    result = await waitForWorkerMessage(
      worker,
      (message) => message && message.token === 1 && message.type === "metadata",
      "Timed out waiting for metadata parse result"
    );

    assert.equal(result.token, 1);
    assert.equal(result.type, "metadata");
    assert.equal(result.meta.promptRaw, JSON.stringify({ 1: { class_type: "KSampler", inputs: { prompt: "test positive" } } }));
    assert.equal(result.meta.promptJson[1].inputs.prompt, "test positive");
    assert.equal(result.meta.workflowJson.nodes[0].type, "KSampler");
  } finally {
    await worker.terminate();
  }
});

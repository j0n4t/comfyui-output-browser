import assert from "node:assert/strict";
import test from "node:test";
import { performance } from "node:perf_hooks";
import { filterImages } from "../../web/CFOB_Filter.js";

globalThis.window = globalThis;
globalThis.CSS = { escape: value => value };
const { default: COB_API } = await import("../../web/CFOB_API.js");

const imageCount = 2500;
const images = Array.from({ length: imageCount }, (_, index) => ({
  name: `output/${String(index).padStart(5, "0")}-landscape.png`,
  prompt: {
    "1": {
      class_type: "CLIPTextEncode",
      inputs: { text: `cinematic landscape number ${index} at golden hour` }
    },
    "2": {
      class_type: "KSampler",
      inputs: { seed: index, steps: 30, cfg: 7 }
    }
  },
  workflow: {
    nodes: [
      { id: index, type: "KSampler", widgets_values: [index, 30, 7] },
      { id: index + imageCount, type: "SaveImage", widgets_values: [`output-${index}`] }
    ]
  },
  textChunks: null
}));

const options = {
  fieldConfigs: [],
  filterShortcuts: [],
  searchBlacklist: [],
  searchWhitelist: [],
  searchContentMode: "blacklist",
  showHiddenFolders: true,
  isImageInHiddenFolder: () => false,
  resolveFieldValue: () => null
};

test("large-library searches report timings and reuse searchable metadata", (t) => {
  const prompt = {};
  let promptReads = 0;
  Object.defineProperty(prompt, "1", {
    enumerable: true,
    get() {
      promptReads++;
      return { inputs: { text: "repeatable metadata" } };
    }
  });
  const probeImage = {
    name: "probe.png",
    prompt,
    workflow: null,
    textChunks: null
  };
  const probeOptions = { ...options, showHiddenFolders: true };

  assert.deepEqual(filterImages([probeImage], "prompt:repeatable", probeOptions), [probeImage]);
  assert.deepEqual(filterImages([probeImage], "prompt:metadata", probeOptions), [probeImage]);
  assert.equal(promptReads, 1, "unchanged metadata should be serialized only once across queries");

  const queries = ["prompt:landscape", "workflow:ksampler", "name:02499"];
  const timings = [];
  for (const query of queries) {
    const start = performance.now();
    const results = filterImages(images, query, options);
    timings.push(`${query}=${(performance.now() - start).toFixed(1)}ms/${results.length} results`);
  }
  t.diagnostic(`${imageCount} images: ${timings.join(", ")}`);
});

test("idle metadata scheduling processes a large queue without rescanning parsed images", async (t) => {
  const idleCallbacks = [];
  globalThis.requestIdleCallback = callback => idleCallbacks.push(callback);
  const images = Array.from({ length: imageCount }, (_, index) => ({
    name: `output/${index}.png`,
    isParsed: false,
    isParsing: false
  }));
  let sourceReads = 0;
  const observedImages = new Proxy(images, {
    get(target, property, receiver) {
      if (typeof property === "string" && /^\d+$/.test(property)) sourceReads++;
      return Reflect.get(target, property, receiver);
    }
  });
  const api = Object.create(COB_API.prototype);
  api.app = {
    loadedImages: observedImages,
    root: null,
    setIdleParsingActive: () => {},
    getCardFieldsHtml: () => ""
  };
  api._idleParsingActive = false;
  api._idleParsingQueue = [];
  api._idleParsingCursor = 0;
  api._idleParsingQueued = new Set();
  api._idleParsingImages = new Set();
  api.loadMetadata = async image => { image.isParsed = true; };

  const start = performance.now();
  api.startIdleParsing();
  while (idleCallbacks.length) {
    idleCallbacks.shift()();
    // eslint-disable-next-line no-await-in-loop
    await Promise.resolve();
  }
  const duration = performance.now() - start;

  assert.ok(images.every(image => image.isParsed));
  assert.equal(api._idleParsingActive, false);
  assert.ok(sourceReads <= imageCount * 3, `expected linear queue setup, got ${sourceReads} image reads`);
  t.diagnostic(`${imageCount} images parsed in ${duration.toFixed(1)}ms (${sourceReads} source reads)`);
});

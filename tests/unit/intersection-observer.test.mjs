import assert from "node:assert/strict";
import test from "node:test";

globalThis.localStorage = { getItem: () => null, setItem: () => {} };
globalThis.window = globalThis;
globalThis.addEventListener = () => {};
globalThis.matchMedia = () => ({ matches: false });
globalThis.innerWidth = 1024;
globalThis.innerHeight = 768;
globalThis.CFOB_STANDALONE = true;
globalThis.indexedDB = { open: () => ({}) };
globalThis.document = {
  createElement: () => ({ style: {}, classList: { add: () => {}, remove: () => {}, toggle: () => {} } }),
  body: { appendChild: () => {}, classList: { add: () => {}, remove: () => {} }, style: {} },
  head: { appendChild: () => {} },
  getElementById: () => null,
};

const { default: ComfyOutputBrowser } = await import("../../web/ComfyOutputBrowser.js");

function makeBrowser(images, idleParsingActive = false) {
  const browser = Object.create(ComfyOutputBrowser.prototype);
  const loads = [];
  const unobserved = [];
  const body = { innerHTML: "Loading..." };
  const card = {
    dataset: { index: "0" },
    querySelector: selector => selector === ".card-body" ? body : null,
  };
  browser.loadedImages = images;
  browser.api = {
    _idleParsingActive: idleParsingActive,
    loadMetadata: async image => {
      loads.push(image);
      image.isParsed = true;
    },
  };
  browser.observer = { unobserve: element => unobserved.push(element) };
  browser.getCardFieldsHtml = () => "metadata";
  return { browser, body, card, loads, unobserved };
}

test("intersection handler parses the first loaded image and updates its card", async () => {
  const image = { name: "first.png", isParsed: false };
  const { browser, body, card, loads, unobserved } = makeBrowser([image]);

  browser.handleImageIntersection({ isIntersecting: true, target: card });
  await new Promise(resolve => setImmediate(resolve));

  assert.deepEqual(loads, [image]);
  assert.equal(body.innerHTML, "metadata");
  assert.deepEqual(unobserved, [card]);
});

test("intersection handler leaves initial metadata parsing to the idle loop", () => {
  const image = { name: "first.png", isParsed: false };
  const { browser, card, loads, unobserved } = makeBrowser([image], true);

  browser.handleImageIntersection({ isIntersecting: true, target: card });

  assert.deepEqual(loads, []);
  assert.deepEqual(unobserved, [card]);
});

test("intersection handler ignores parsed and non-intersecting cards", () => {
  const image = { name: "first.png", isParsed: true };
  const { browser, card, loads, unobserved } = makeBrowser([image]);

  browser.handleImageIntersection({ isIntersecting: true, target: card });
  browser.handleImageIntersection({ isIntersecting: false, target: card });

  assert.deepEqual(loads, []);
  assert.deepEqual(unobserved, []);
});

import assert from "node:assert/strict";
import test from "node:test";
import { filterImages } from "../../web/CFOB_Filter.js";

const images = [
  {
    name: "animals/cat-red.png",
    prompt: { text: "A red fox under a blue sky" },
    workflow: { nodes: [{ type: "KSampler" }] },
    fields: { model: "SDXL", seed: 101 }
  },
  {
    name: "animals/cat-blue.png",
    prompt: { text: "A blue cat" },
    workflow: { nodes: [{ type: "KSampler" }] },
    fields: { model: "SD1.5", seed: 202 }
  },
  {
    name: "animals/dog.png",
    prompt: { text: "A red dog" },
    workflow: { nodes: [{ type: "Upscale" }] },
    fields: { model: "SDXL", seed: 303 }
  },
  {
    name: "temp/cat-hidden.png",
    prompt: { text: "A secret blue sky" },
    workflow: { nodes: [{ type: "KSampler" }] },
    fields: { model: "SDXL", seed: 404 }
  }
];

const options = {
  fieldConfigs: [
    { label: "Model", paths: "model" },
    { label: "Seed", paths: "seed" }
  ],
  filterShortcuts: [{ keyword: "felines", filter: "name:cat-red, name:cat-blue" }],
  showHiddenFolders: false,
  isImageInHiddenFolder: name => name.startsWith("temp/"),
  resolveFieldValue: (image, path) => image.fields[path]
};

const namesFor = (query, overrides = {}) =>
  filterImages(images, query, { ...options, ...overrides }).map(image => image.name);

test("matches all space-separated terms and combines comma groups as OR", () => {
  assert.deepEqual(namesFor("cat red"), ["animals/cat-red.png"]);
  assert.deepEqual(namesFor("cat, dog"), [
    "animals/cat-red.png",
    "animals/cat-blue.png",
    "animals/dog.png"
  ]);
});

test("supports negated terms and quoted phrases", () => {
  assert.deepEqual(namesFor("cat !fox"), ["animals/cat-blue.png"]);
  assert.deepEqual(namesFor('"blue sky"'), ["animals/cat-red.png"]);
});

test("searches name, path, prompt, workflow, custom labels, and field indexes", () => {
  assert.deepEqual(namesFor("name:blue"), ["animals/cat-blue.png"]);
  assert.deepEqual(namesFor("path:animals"), [
    "animals/cat-red.png",
    "animals/cat-blue.png",
    "animals/dog.png"
  ]);
  assert.deepEqual(namesFor('prompt:"blue sky"'), ["animals/cat-red.png"]);
  assert.deepEqual(namesFor("workflow:ksampler"), [
    "animals/cat-red.png",
    "animals/cat-blue.png"
  ]);
  assert.deepEqual(namesFor("model:sdxl"), [
    "animals/cat-red.png",
    "animals/dog.png"
  ]);
  assert.deepEqual(namesFor("2:202"), ["animals/cat-blue.png"]);
});

test("expands saved filter shortcuts, including alternatives combined with other terms", () => {
  assert.deepEqual(namesFor("@FELINES"), [
    "animals/cat-red.png",
    "animals/cat-blue.png"
  ]);
  assert.deepEqual(namesFor("@felines animals"), [
    "animals/cat-red.png",
    "animals/cat-blue.png"
  ]);
});

test("applies zero-based, negative, and slice ranges to term results", () => {
  assert.deepEqual(namesFor("cat[1]"), ["animals/cat-blue.png"]);
  assert.deepEqual(namesFor("cat[-1]"), ["animals/cat-blue.png"]);
  assert.deepEqual(namesFor("cat[0:1]"), ["animals/cat-red.png"]);
  assert.deepEqual(namesFor("cat[1:]"), ["animals/cat-blue.png"]);
  assert.deepEqual(namesFor("cat[1:] blue[0:2]"), ["animals/cat-blue.png"]);
});

test("hides configured folders by default and allows a dot-prefixed override", () => {
  assert.deepEqual(namesFor("cat"), ["animals/cat-red.png", "animals/cat-blue.png"]);
  assert.deepEqual(namesFor(". cat"), [
    "animals/cat-red.png",
    "animals/cat-blue.png",
    "temp/cat-hidden.png"
  ]);
  assert.deepEqual(namesFor("cat", { showHiddenFolders: true }), [
    "animals/cat-red.png",
    "animals/cat-blue.png",
    "temp/cat-hidden.png"
  ]);
});

test("returns all eligible images for an empty filter", () => {
  assert.deepEqual(namesFor(""), [
    "animals/cat-red.png",
    "animals/cat-blue.png",
    "animals/dog.png"
  ]);
});

test("blacklist excludes built-in keys from keyed search", () => {
  assert.deepEqual(namesFor("name:blue", { searchBlacklist: ["name"] }), []);
  assert.deepEqual(namesFor("prompt:\"blue sky\"", { searchBlacklist: ["prompt"] }), []);
  assert.deepEqual(namesFor("workflow:ksampler", { searchBlacklist: ["workflow"] }), []);
  assert.deepEqual(namesFor("path:animals", { searchBlacklist: ["path"] }), []);
});

test("blacklist excludes custom fields by exact path match", () => {
  assert.deepEqual(namesFor("model:sdxl", { searchBlacklist: ["model"] }), []);
  assert.deepEqual(namesFor("2:202", { searchBlacklist: ["seed"] }), []);
});

test("blacklist matching is case-insensitive for both keys and field paths", () => {
  assert.deepEqual(namesFor("name:blue", { searchBlacklist: ["NAME"] }), []);
  assert.deepEqual(namesFor("model:sdxl", { searchBlacklist: ["MODEL"] }), []);
  assert.deepEqual(namesFor("2:202", { searchBlacklist: ["SEED"] }), []);
});

test("blacklist matches field paths as substrings", () => {
  assert.deepEqual(namesFor("model:sdxl", { searchBlacklist: ["mod"] }), []);
  assert.deepEqual(namesFor("2:202", { searchBlacklist: ["see"] }), []);
});

test("bare text search respects blacklist on built-in keys", () => {
  // "blue sky" appears in cat-red's prompt; blacklisting prompt removes that match
  assert.deepEqual(namesFor("blue sky", { searchBlacklist: ["prompt"] }), []);
  // "red" appears in cat-red's name and prompt and dog's prompt; blacklisting both
  // name and prompt leaves no match
  assert.deepEqual(namesFor("red", { searchBlacklist: ["name", "prompt"] }), []);
});

test("blacklist does not affect unblacklisted fields", () => {
  assert.deepEqual(namesFor("2:202", { searchBlacklist: ["model"] }), ["animals/cat-blue.png"]);
  assert.deepEqual(namesFor("prompt:\"blue sky\"", { searchBlacklist: ["name"] }), ["animals/cat-red.png"]);
});

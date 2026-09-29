import assert from "node:assert/strict";
import test from "node:test";
import { filterImages } from "../web/CFOB_Filter.js";

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

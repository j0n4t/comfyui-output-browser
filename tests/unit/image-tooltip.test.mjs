import assert from "node:assert/strict";
import test from "node:test";

import CFOB_Gallery from "../../web/CFOB_Gallery.js";

test("preview tooltip includes the filename and values from the first three fields", () => {
  const app = {
    settings: {
      fieldConfigs: [
        { label: "Prompt", paths: "prompt" },
        { label: "Seed", paths: "seed" },
        { label: "Model", paths: "model" },
        { label: "Sampler", paths: "sampler" },
      ],
    },
    resolveFieldValue: (_img, path) => ({
      prompt: "A red fox",
      seed: 42,
      model: "model.safetensors",
      sampler: "ignored",
    })[path],
  };
  const gallery = { app };
  const image = { name: "fox.png", isParsed: true };

  assert.equal(
    CFOB_Gallery.prototype.getPreviewTitle.call(gallery, image),
    "fox.png\nPrompt: A red fox\nSeed: 42\nModel: model.safetensors"
  );
});

test("preview tooltip starts with the filename and updates after metadata parses", () => {
  const preview = { title: "" };
  const card = { querySelector: () => preview };
  const app = {
    settings: { fieldConfigs: [{ label: "Prompt", paths: "prompt" }] },
    resolveFieldValue: () => "A red fox",
  };
  const gallery = Object.create(CFOB_Gallery.prototype);
  gallery.app = app;
  gallery.cardCache = new Map([["fox.png", card]]);
  const image = { name: "fox.png", isParsed: false };

  assert.equal(gallery.getPreviewTitle(image), "fox.png");
  image.isParsed = true;
  gallery.updatePreviewTooltip(image);
  assert.equal(preview.title, "fox.png\nPrompt: A red fox");
});

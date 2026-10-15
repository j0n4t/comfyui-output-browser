import assert from "node:assert/strict";
import test from "node:test";
import { filterImages, maskImageMetadata } from "../../web/CFOB_Filter.js";

/**
 * Realistic parsed metadata. The prompt and workflow blobs deliberately hold DIFFERENT
 * values for the same widget, because in real files they can — and a blacklist entry for
 * one must not touch the other.
 *
 *   prompt JSON    node "3" KSampler  inputs { seed: 111, text: "alphafox" }
 *                  node "6" CLIPTextEncode inputs { text: "betafox" }
 *   workflow JSON  node  3  KSampler  widgets_values_named { seed: 999, text: "alphawolf" }
 *                                     widgets_values [999, "alphawolf"]
 *                  node  6  CLIPTextEncode widgets_values_named { text: "betawolf" }
 *   filename       animals/cat.png
 */
const image = {
  name: "animals/cat.png",
  prompt: {
    "3": { class_type: "KSampler", _meta: { title: "KSampler" }, inputs: { seed: 111, text: "alphafox" } },
    "6": { class_type: "CLIPTextEncode", inputs: { text: "betafox" } }
  },
  workflow: {
    nodes: [
      { id: 3, type: "KSampler", title: "KSampler", widgets_values_named: { seed: 999, text: "alphawolf" } },
      { id: 6, type: "CLIPTextEncode", widgets_values_named: { text: "betawolf" } }
    ]
  }
};

const options = {
  fieldConfigs: [
    { label: "Prompt", paths: "KSampler.inputs.text" },
    { label: "Seed", paths: "KSampler.inputs.seed" }
  ],
  filterShortcuts: [],
  showHiddenFolders: false,
  isImageInHiddenFolder: () => false,
  resolveFieldValue: (img, path) => {
    if (path === "KSampler.inputs.text") return img.prompt["3"].inputs.text;
    if (path === "KSampler.inputs.seed") return img.prompt["3"].inputs.seed;
    return null;
  }
};

const matches = (query, blacklist) =>
  filterImages([image], query, { ...options, searchBlacklist: blacklist }).length > 0;

test("a prompt path blocks the prompt copy and leaves the workflow copy alone", () => {
  assert.equal(matches("prompt:alphafox", ["KSampler.inputs.text"]), false);
  assert.equal(matches("alphafox", ["KSampler.inputs.text"]), false);
  assert.equal(matches("workflow:alphawolf", ["KSampler.inputs.text"]), true);
  assert.equal(matches("alphawolf", ["KSampler.inputs.text"]), true);
});

test("a workflow path blocks the workflow copy and leaves the prompt copy alone", () => {
  assert.equal(matches("workflow:alphawolf", ["KSampler.text"]), false);
  assert.equal(matches("alphawolf", ["KSampler.text"]), false);
  assert.equal(matches("prompt:alphafox", ["KSampler.text"]), true);
  assert.equal(matches("alphafox", ["KSampler.text"]), true);
});

test("differing prompt/workflow values for one widget are blocked independently", () => {
  // The prompt seed is 111 and the workflow seed is 999.
  assert.equal(matches("111", ["KSampler.inputs.seed"]), false);
  assert.equal(matches("999", ["KSampler.inputs.seed"]), true, "workflow seed must survive a prompt-path block");

  assert.equal(matches("999", ["KSampler.seed"]), false);
  assert.equal(matches("111", ["KSampler.seed"]), true, "prompt seed must survive a workflow-path block");
});

test("blocking both blobs hides the widget everywhere", () => {
  const both = ["KSampler.inputs.seed", "KSampler.seed", "KSampler.widget[0]"];
  assert.equal(matches("111", both), false);
  assert.equal(matches("999", both), false);
});

test("a bare node name blocks that node in both blobs", () => {
  assert.equal(matches("alphafox", ["KSampler"]), false);
  assert.equal(matches("alphawolf", ["KSampler"]), false);
  assert.equal(matches("111", ["KSampler"]), false);
  assert.equal(matches("999", ["KSampler"]), false);
  assert.equal(matches("betafox", ["KSampler"]), true);
  assert.equal(matches("betawolf", ["KSampler"]), true);
});

test("the positional widget path blocks only its index", () => {
  const positional = {
    name: "animals/cat.png",
    prompt: null,
    workflow: { nodes: [{ id: 3, type: "KSampler", widgets_values: [999, "alphawolf"] }] }
  };
  const found = (query, blacklist) =>
    filterImages([positional], query, { ...options, searchBlacklist: blacklist }).length > 0;
  assert.equal(found("999", ["KSampler.widget[0]"]), false);
  assert.equal(found("alphawolf", ["KSampler.widget[0]"]), true, "only the named index is blocked");
  assert.equal(found("alphawolf", ["KSampler.widget[1]"]), false);
});

test("whole built-in keys still blacklist their search target", () => {
  assert.equal(matches("name:cat", ["name"]), false);
  assert.equal(matches("path:animals", ["path"]), false);
  assert.equal(matches("prompt:alphafox", ["prompt"]), false);
  assert.equal(matches("workflow:alphawolf", ["workflow"]), false);
  assert.equal(matches("cat", ["name"]), false);
});

test("plain search covers both blobs, so each key hides only its own", () => {
  assert.equal(matches("alphafox", ["prompt"]), false, "alphafox only exists in prompt");
  assert.equal(matches("alphawolf", ["workflow"]), false, "alphawolf only exists in workflow");
  assert.equal(matches("alphafox", ["workflow"]), true);
  assert.equal(matches("alphawolf", ["prompt"]), true);
});

test("field labels and indexes remain blacklistable", () => {
  assert.equal(matches("prompt:alphafox", ["Prompt"]), false);
  assert.equal(matches("1:alphafox", ["KSampler.inputs.text"]), false);
  assert.equal(matches("1:alphafox", ["Seed"]), true);
});

test("maskImageMetadata keeps the two blobs independent and does not mutate the source", () => {
  const promptOnly = maskImageMetadata(image, ["KSampler.inputs.seed"]);
  assert.equal(promptOnly.prompt["3"].inputs.seed, undefined);
  assert.equal(promptOnly.workflow.nodes[0].widgets_values_named.seed, 999, "workflow seed untouched");

  const workflowOnly = maskImageMetadata(image, ["KSampler.seed"]);
  assert.equal(workflowOnly.workflow.nodes[0].widgets_values_named.seed, undefined);
  assert.equal(workflowOnly.prompt["3"].inputs.seed, 111, "prompt seed untouched");

  assert.equal(image.prompt["3"].inputs.seed, 111, "source metadata must not be mutated");
  assert.equal(image.workflow.nodes[0].widgets_values_named.seed, 999);
});

test("maskImageMetadata maps built-in keys onto their metadata", () => {
  assert.equal(maskImageMetadata(image, ["prompt"]).prompt, null);
  assert.equal(maskImageMetadata(image, ["workflow"]).workflow, null);
  assert.equal(maskImageMetadata(image, ["path"]).name, "");
  assert.equal(maskImageMetadata(image, ["name"]).name, "");
});

test("maskImageMetadata with no blacklist preserves all metadata", () => {
  const masked = maskImageMetadata(image, []);
  assert.deepEqual(masked.prompt, image.prompt);
  assert.deepEqual(masked.workflow, image.workflow);
  assert.equal(masked.name, image.name);
  assert.equal(maskImageMetadata(image, undefined).name, image.name);
});

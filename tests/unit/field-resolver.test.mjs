// Mock localStorage and window before importing ComfyOutputBrowser (static import hoist workaround)
const _storage = new Map();
globalThis.localStorage = {
  getItem: (k) => _storage.has(k) ? _storage.get(k) : null,
  setItem: (k, v) => _storage.set(k, String(v)),
  removeItem: (k) => _storage.delete(k),
  clear: () => _storage.clear(),
};
globalThis.window = globalThis;
globalThis.addEventListener = () => {};
globalThis.matchMedia = () => ({ matches: false });
globalThis.innerWidth = 1024;
globalThis.innerHeight = 768;
globalThis.CFOB_STANDALONE = true;
globalThis.indexedDB = {
  open: () => ({
    onupgradeneeded: null,
    onsuccess: null,
    onerror: null,
    result: {
      createObjectStore: () => ({ createIndex: () => {} }),
      transaction: () => ({ objectStore: () => ({ put: () => {}, get: () => ({ success: true }) }) }),
    },
  }),
};
globalThis.document = {
  createElement: () => ({
    style: {},
    classList: { add: () => {}, remove: () => {}, toggle: () => {} },
    setAttribute: () => {},
    appendChild: () => {},
    dataset: {},
  }),
  body: {
    appendChild: () => {},
    classList: { add: () => {}, remove: () => {} },
    style: {},
  },
  getElementById: () => null,
  head: { appendChild: () => {} },
};

import assert from "node:assert/strict";
import test from "node:test";

const { default: ComfyOutputBrowser } = await import("../../web/ComfyOutputBrowser.js");

// Helper to invoke resolveFieldValue using prototype directly
function resolve(imgData, pathString) {
  return ComfyOutputBrowser.prototype.resolveFieldValue(imgData, pathString);
}

test("resolveFieldValue: returns null for empty, undefined, or malformed path strings", () => {
  const img = { name: "test.png", mtime: 1000, prompt: null, workflow: null, textChunks: null };
  assert.equal(resolve(img, ""), null);
  assert.equal(resolve(img, null), null);
  assert.equal(resolve(img, "invalidPathWithoutDot"), null);
});

test("resolveFieldValue: resolves @file properties", () => {
  const img = {
    name: "subfolder/nested/image_001.png",
    mtime: 1700000000,
    prompt: null,
    workflow: null,
    textChunks: null
  };

  assert.equal(resolve(img, "@file.name"), "subfolder/nested/image_001.png");
  assert.equal(resolve(img, "@file.path"), "subfolder/nested");
  assert.equal(resolve(img, "@file.mtime"), 1700000000);
});

test("resolveFieldValue: resolves @textChunks with JSON and string parsing", () => {
  const img = {
    name: "sample.png",
    mtime: 0,
    prompt: null,
    workflow: null,
    textChunks: {
      parameters: '{"seed": 9999, "sampler": "euler_ancestral", "nested": {"cfg": 7.5}}',
      description: "A beautiful landscape",
      empty_chunk: ""
    }
  };

  assert.equal(resolve(img, "@textChunks.parameters.seed"), 9999);
  assert.equal(resolve(img, "@textChunks.parameters.sampler"), "euler_ancestral");
  assert.equal(resolve(img, "@textChunks.parameters.nested.cfg"), 7.5);
  assert.equal(resolve(img, "@textChunks.description"), "A beautiful landscape");
  assert.equal(resolve(img, "@textChunks.nonexistent.key"), null);
});

test("resolveFieldValue: resolves @prompt and @workflow top-level paths", () => {
  const img = {
    name: "workflow.png",
    mtime: 0,
    prompt: {
      client_id: "test-client-123",
      extra_data: { user: "jonathan" }
    },
    workflow: {
      version: 0.4,
      author: "ComfyUser"
    },
    textChunks: null
  };

  assert.equal(resolve(img, "@prompt.client_id"), "test-client-123");
  assert.equal(resolve(img, "@prompt.extra_data.user"), "jonathan");
  assert.equal(resolve(img, "@workflow.version"), 0.4);
  assert.equal(resolve(img, "@workflow.author"), "ComfyUser");
});

test("resolveFieldValue: resolves prompt nodes by ID, class_type, or title", () => {
  const img = {
    name: "node_lookup.png",
    mtime: 0,
    prompt: {
      "3": {
        class_type: "KSampler",
        _meta: { title: "Main KSampler" },
        inputs: {
          seed: 424242,
          steps: 25,
          cfg: 8.0,
          latent_image: ["5", 0] // connection tuple
        }
      },
      "4": {
        class_type: "CLIPTextEncode",
        _meta: { title: "Positive Prompt" },
        inputs: {
          text: "masterpiece, high quality photo"
        }
      }
    },
    workflow: null,
    textChunks: null
  };

  // Lookup by node ID
  assert.equal(resolve(img, "3.inputs.seed"), 424242);
  assert.equal(resolve(img, "3.seed"), 424242, "inputs. prefix is optional");
  assert.equal(resolve(img, "3.steps"), 25);

  // Lookup by class_type (case-insensitive)
  assert.equal(resolve(img, "ksampler.cfg"), 8.0);
  assert.equal(resolve(img, "CLIPTextEncode.text"), "masterpiece, high quality photo");

  // Lookup by custom title
  assert.equal(resolve(img, "Positive Prompt.text"), "masterpiece, high quality photo");
  assert.equal(resolve(img, "Main KSampler.seed"), 424242);

  // Node connection links [node_id, slot] must be ignored
  assert.equal(resolve(img, "3.latent_image"), null, "connection links should not be returned as scalar field values");
});

test("resolveFieldValue: resolves multiple candidate paths with fallback order", () => {
  const img = {
    name: "fallback.png",
    mtime: 0,
    prompt: {
      "10": {
        class_type: "KSampler",
        inputs: { seed: 777 }
      }
    },
    workflow: null,
    textChunks: {
      generation_data: '{"fallback_seed": 888}'
    }
  };

  // First candidate matches
  assert.equal(
    resolve(img, "KSampler.seed, @textChunks.generation_data.fallback_seed"),
    777
  );

  // First candidate missing, second matches
  assert.equal(
    resolve(img, "NonExistentNode.seed, @textChunks.generation_data.fallback_seed"),
    888
  );

  // All candidates missing
  assert.equal(
    resolve(img, "NonExistentNode.seed, @textChunks.generation_data.missing_key"),
    null
  );
});

test("resolveFieldValue: resolves workflow nodes by ID and widget values", () => {
  const img = {
    name: "workflow_nodes.png",
    mtime: 0,
    prompt: null,
    workflow: {
      nodes: [
        {
          id: 12,
          type: "VAELoader",
          title: "Custom VAE",
          widgets_values: ["vae-ft-mse-840000-ema-pruned.safetensors"],
          widgets_values_named: {
            vae_name: "vae-ft-mse-840000-ema-pruned.safetensors"
          }
        }
      ]
    },
    textChunks: null
  };

  assert.equal(resolve(img, "12.widgets_values_named.vae_name"), "vae-ft-mse-840000-ema-pruned.safetensors");
  assert.equal(resolve(img, "VAELoader.widget[0]"), "vae-ft-mse-840000-ema-pruned.safetensors");
  assert.equal(resolve(img, "Custom VAE.vae_name"), "vae-ft-mse-840000-ema-pruned.safetensors");
});

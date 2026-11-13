import assert from "node:assert/strict";
import test from "node:test";

import PngMetadata from "../../web/PngMetadata.js";

// Helper to construct a PNG chunk with length, 4-char type, data, and 4-byte CRC.
function makeChunk(typeStr, dataBytes = new Uint8Array(0)) {
  const buf = new Uint8Array(12 + dataBytes.length);
  const dv = new DataView(buf.buffer);
  dv.setUint32(0, dataBytes.length, false);
  for (let i = 0; i < 4; i++) buf[4 + i] = typeStr.charCodeAt(i);
  buf.set(dataBytes, 8);
  // CRC can be dummy 0 for these tests since parser only checks lengths/types
  dv.setUint32(8 + dataBytes.length, 0, false);
  return buf;
}

// Assemble a valid PNG byte stream with signature + chunks.
function assemblePng(chunks) {
  const signature = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
  const totalLength = signature.length + chunks.reduce((acc, c) => acc + c.length, 0);
  const out = new Uint8Array(totalLength);
  out.set(signature, 0);
  let offset = signature.length;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.length;
  }
  return out;
}

test("isPng: validates PNG signature correctly", () => {
  assert.equal(PngMetadata.isPng(new Uint8Array([])), false, "empty buffer is not PNG");
  assert.equal(PngMetadata.isPng(new Uint8Array([137, 80, 78])), false, "truncated header is not PNG");
  assert.equal(PngMetadata.isPng(new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7])), false, "arbitrary bytes are not PNG");
  assert.equal(PngMetadata.isPng(new Uint8Array([255, 216, 255, 224, 0, 16, 74, 70])), false, "JPEG header is not PNG");
  assert.equal(PngMetadata.isPng(new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])), true, "valid 8-byte signature is PNG");
});

test("parseTextChunks: returns empty array for non-PNG bytes or corrupted headers", () => {
  assert.deepEqual(PngMetadata.parseTextChunks(new Uint8Array([1, 2, 3])), []);
  assert.deepEqual(PngMetadata.parseTextChunks(new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])), []);
});

test("parseTextChunks: extracts tEXt chunks (Latin-1 encoded)", () => {
  const keyword = "Software";
  const text = "ComfyUI Output Browser";
  const data = new Uint8Array(keyword.length + 1 + text.length);
  for (let i = 0; i < keyword.length; i++) data[i] = keyword.charCodeAt(i);
  data[keyword.length] = 0; // null separator
  for (let i = 0; i < text.length; i++) data[keyword.length + 1 + i] = text.charCodeAt(i);

  const png = assemblePng([makeChunk("tEXt", data), makeChunk("IEND")]);
  const chunks = PngMetadata.parseTextChunks(png);

  assert.equal(chunks.length, 1);
  assert.equal(chunks[0].keyword, "Software");
  assert.equal(chunks[0].text, "ComfyUI Output Browser");
});

test("parseTextChunks: handles missing null terminator in tEXt chunk gracefully", () => {
  const malformedData = new TextEncoder().encode("NoNullSeparatorHere");
  const png = assemblePng([makeChunk("tEXt", malformedData), makeChunk("IEND")]);
  const chunks = PngMetadata.parseTextChunks(png);
  assert.equal(chunks.length, 0, "malformed tEXt without null terminator is ignored");
});

test("parseTextChunks: extracts iTXt uncompressed chunks (UTF-8 encoded)", () => {
  // Format: keyword\0 compression_flag(0)\0 compression_method(0)\0 lang\0 trans_key\0 text
  const keyword = "Title";
  const text = "日本語と絵文字 🎨✨";
  const enc = new TextEncoder();
  const kwBytes = enc.encode(keyword);
  const textBytes = enc.encode(text);

  // keyword + null + flag(0) + method(0) + lang("") + null + trans("") + null + text
  const data = new Uint8Array(kwBytes.length + 1 + 2 + 1 + 1 + textBytes.length);
  let pos = 0;
  data.set(kwBytes, pos); pos += kwBytes.length;
  data[pos++] = 0; // null
  data[pos++] = 0; // compression flag: 0 (uncompressed)
  data[pos++] = 0; // compression method: 0
  data[pos++] = 0; // language tag null terminator (empty lang)
  data[pos++] = 0; // translated keyword null terminator (empty trans)
  data.set(textBytes, pos);

  const png = assemblePng([makeChunk("iTXt", data), makeChunk("IEND")]);
  const chunks = PngMetadata.parseTextChunks(png);

  assert.equal(chunks.length, 1);
  assert.equal(chunks[0].keyword, "Title");
  assert.equal(chunks[0].text, "日本語と絵文字 🎨✨");
});

test("extract: extracts prompt and workflow JSON and handles sanitized NaN values", () => {
  const promptObj = { "3": { class_type: "KSampler", inputs: { seed: 12345, cfg: NaN } } };
  const workflowObj = { nodes: [{ id: 3, type: "KSampler" }] };

  // prompt with raw NaN
  const promptRaw = JSON.stringify(promptObj).replace(/null/g, "NaN");
  const workflowRaw = JSON.stringify(workflowObj);

  const enc = new TextEncoder();
  const mkTxt = (k, v) => {
    const kb = enc.encode(k);
    const vb = enc.encode(v);
    const d = new Uint8Array(kb.length + 1 + vb.length);
    d.set(kb, 0);
    d[kb.length] = 0;
    d.set(vb, kb.length + 1);
    return makeChunk("tEXt", d);
  };

  const png = assemblePng([
    mkTxt("prompt", promptRaw),
    mkTxt("workflow", workflowRaw),
    mkTxt("custom_tag", "hello world"),
    makeChunk("IEND")
  ]);

  const meta = PngMetadata.extract(png);
  assert.ok(meta.textChunks);
  assert.equal(meta.textChunks.custom_tag, "hello world");
  assert.equal(meta.promptRaw, promptRaw);
  assert.equal(meta.promptJson["3"].inputs.seed, 12345);
  assert.equal(meta.promptJson["3"].inputs.cfg, null, "NaN is sanitized to null");
  assert.equal(meta.workflowJson.nodes[0].id, 3);
});

test("parseChunkText: parses valid JSON and returns raw text on invalid JSON", () => {
  assert.deepEqual(PngMetadata.parseChunkText('{"seed": 42, "model": "sd15"}'), { seed: 42, model: "sd15" });
  assert.equal(PngMetadata.parseChunkText("just a plain string"), "just a plain string");
  assert.equal(PngMetadata.parseChunkText("{invalid json"), "{invalid json");
});

test("getPresetGalleryWidgets: extracts widgets from PresetGalleryNode in prompt JSON", () => {
  const metadata = {
    promptJson: {
      "10": {
        class_type: "KSampler",
        inputs: { seed: 111 }
      },
      "25": {
        class_type: "PresetGalleryNode",
        inputs: {
          style_preset: "Cinematic",
          aspect_ratio: "16:9",
          steps: 30,
          active: true,
          ignore_link: ["10", 0] // array inputs (node links) must be excluded
        }
      }
    }
  };

  const widgets = PngMetadata.getPresetGalleryWidgets(metadata);
  assert.ok(widgets);
  assert.equal(widgets.style_preset, "Cinematic");
  assert.equal(widgets.aspect_ratio, "16:9");
  assert.equal(widgets.steps, 30);
  assert.equal(widgets.active, true);
  assert.equal("ignore_link" in widgets, false, "linked inputs (arrays) must be skipped");
});

test("getPresetGalleryWidgets: returns null when no PresetGalleryNode is present", () => {
  assert.equal(PngMetadata.getPresetGalleryWidgets({ promptJson: null }), null);
  assert.equal(PngMetadata.getPresetGalleryWidgets({ promptJson: { "1": { class_type: "EmptyLatentImage" } } }), null);
});

test("getPromptText: extracts primary prompt text from prompt JSON", () => {
  // Case 1: Standard positive/negative or prompt/text keys
  const meta1 = {
    promptRaw: '{"1": ...}',
    promptJson: {
      "5": {
        class_type: "CLIPTextEncode",
        inputs: { text: "photograph of a snowy mountain, 8k resolution" }
      }
    }
  };
  assert.equal(PngMetadata.getPromptText(meta1), "photograph of a snowy mountain, 8k resolution");

  // Case 2: Plain string prompt JSON
  const meta2 = {
    promptRaw: "a cute cat sitting on a rug",
    promptJson: "a cute cat sitting on a rug"
  };
  assert.equal(PngMetadata.getPromptText(meta2), "a cute cat sitting on a rug");

  // Case 3: Fallback when promptJson is missing or unparseable
  const meta3 = {
    promptRaw: "raw prompt string fallback",
    promptJson: null
  };
  assert.equal(PngMetadata.getPromptText(meta3), "raw prompt string fallback");

  // Case 4: Fallback to any string input > 10 chars
  const meta4 = {
    promptRaw: '{"2": ...}',
    promptJson: {
      "2": {
        class_type: "CustomNode",
        inputs: { custom_input: "deep inside an enchanted forest" }
      }
    }
  };
  assert.equal(PngMetadata.getPromptText(meta4), "deep inside an enchanted forest");
});

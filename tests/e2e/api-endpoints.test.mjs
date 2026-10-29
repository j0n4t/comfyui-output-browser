import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "@playwright/test";

import {
  findAvailablePort,
  findPython,
  makeOutputDir,
  removeOutputDir,
  startServer,
  sweepStaleProfileDirs,
  waitForServer,
} from "./helpers.mjs";

const pythonPath = findPython();

sweepStaleProfileDirs();

test("standalone API lists and serves images, uploads, moves, trashes, and permanently deletes files", async () => {
  const { root, outputDir } = makeOutputDir({
    "alpha.png": [200, 40, 40],
    "nested/beta.png": [40, 200, 40],
  });
  const serverPort = await findAvailablePort();
  const baseUrl = `http://127.0.0.1:${serverPort}`;
  const server = startServer({ outputDir, port: serverPort, python: pythonPath });

  try {
    const listing = await waitForServer(`${baseUrl}/comfyui-output-browser/images`)
      .catch(error => { throw new Error(`${error.message}\nServer output:\n${server.output}`); });
    assert.deepEqual(
      new Set(listing.map(file => file.name)),
      new Set(["alpha.png", "nested/beta.png"]),
      "the images endpoint should list PNGs recursively"
    );

    const preview = await fetch(`${baseUrl}/view?filename=alpha.png`);
    assert.equal(preview.status, 200, "the preview endpoint should serve an output image");
    assert.deepEqual(
      Buffer.from(await preview.arrayBuffer()),
      readFileSync(join(outputDir, "alpha.png")),
      "the preview response should contain the requested file"
    );

    const uploadBytes = readFileSync(join(outputDir, "alpha.png"));
    const upload = await fetch(`${baseUrl}/comfyui-output-browser/upload`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: "uploads/new-image",
        image_data: `data:image/png;base64,${uploadBytes.toString("base64")}`,
      }),
    }).then(response => response.json());
    assert.equal(upload.success, true);
    assert.equal(upload.name, "uploads/new-image.png");
    assert.ok(existsSync(join(outputDir, upload.name)), "upload should create a nested PNG");

    const rename = await fetch(`${baseUrl}/comfyui-output-browser/rename`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ old_name: upload.name, new_name: "renamed" }),
    }).then(response => response.json());
    assert.equal(rename.success, true);
    assert.equal(rename.new_name, "uploads/renamed.png", "a bare rename should retain its folder");

    const move = await fetch(`${baseUrl}/comfyui-output-browser/move`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ files: [rename.new_name], dest_folder: "archive" }),
    }).then(response => response.json());
    assert.deepEqual(move.moved.map(file => file.new_name), ["archive/renamed.png"]);
    assert.deepEqual(move.errors, []);

    const trash = await fetch(`${baseUrl}/comfyui-output-browser/delete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ files: ["archive/renamed.png"] }),
    }).then(response => response.json());
    assert.deepEqual(trash.trashed, ["archive/renamed.png"]);
    assert.ok(existsSync(join(outputDir, ".trash", "renamed.png")), "delete should move the file to trash");

    const permanentDelete = await fetch(`${baseUrl}/comfyui-output-browser/delete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ files: [".trash/renamed.png"] }),
    }).then(response => response.json());
    assert.deepEqual(permanentDelete.deleted, [".trash/renamed.png"]);
    assert.equal(existsSync(join(outputDir, ".trash", "renamed.png")), false);
  } finally {
    await server.stop();
    removeOutputDir(root);
  }
});

test("standalone API rejects upload and move paths outside the output directory", async () => {
  const { root, outputDir } = makeOutputDir({ "alpha.png": [200, 40, 40] });
  const serverPort = await findAvailablePort();
  const baseUrl = `http://127.0.0.1:${serverPort}`;
  const server = startServer({ outputDir, port: serverPort, python: pythonPath });

  try {
    await waitForServer(`${baseUrl}/comfyui-output-browser/images`)
      .catch(error => { throw new Error(`${error.message}\nServer output:\n${server.output}`); });

    const upload = await fetch(`${baseUrl}/comfyui-output-browser/upload`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename: "../escape.png", image_data: "aGVsbG8=" }),
    }).then(response => response.json());
    assert.equal(upload.success, false);
    assert.match(upload.error, /outside output directory/i);
    assert.equal(existsSync(join(root, "escape.png")), false, "upload must not write outside output");

    const move = await fetch(`${baseUrl}/comfyui-output-browser/move`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ files: ["alpha.png"], dest_folder: "../escape" }),
    }).then(response => response.json());
    assert.match(move.error, /outside output directory/i);
    assert.equal(existsSync(join(root, "escape")), false, "move must not create a directory outside output");
  } finally {
    await server.stop();
    removeOutputDir(root);
  }
});

/**
 * End-to-end coverage for the inspector's Other Metadata tab.
 *
 * The tab must show the file info and every PNG text chunk — with the same clickable
 * key paths the other inspector tabs use — while the raw prompt/workflow chunks link
 * to their own tabs instead of repeating the parsed JSON.
 *
 * Requires Chromium installed by Playwright or a system browser.
 */
import assert from "node:assert/strict";
import { join } from "node:path";
import { test } from "./fixtures.mjs";

import {
  attachPage,
  findAvailablePort,
  findPython,
  makeOutputDir,
  removeOutputDir,
  startServer,
  sweepStaleProfileDirs,
  waitForServer,
  waitUntil,
  writeSolidPng,
} from "./helpers.mjs";

const PROMPT = { 1: { class_type: "KSampler", inputs: { seed: 1234, prompt: "a cat" } } };
const WORKFLOW = { nodes: [{ id: 1, type: "KSampler", title: "KSampler" }] };

const pythonPath = findPython();

// Sweep profile/fixture dirs from any run that died uncatchably before this one.
sweepStaleProfileDirs();

test("inspector Other Metadata tab lists file info and text chunks", async ({ cleanup, page: testPage, context }) => {
  const { root, outputDir } = makeOutputDir({ "meta.png": [40, 40, 200] });
  writeSolidPng(join(outputDir, "meta.png"), [40, 40, 200], 8, 8, [
    ["prompt", JSON.stringify(PROMPT)],
    ["workflow", JSON.stringify(WORKFLOW)],
    ["parameters", JSON.stringify({ seed: 1234, steps: 20 })],
    ["Dream", "aurora borealis"],
  ]);

  const serverPort = await findAvailablePort();
  const baseUrl = `http://127.0.0.1:${serverPort}`;
  const server = startServer({ outputDir, port: serverPort, python: pythonPath });
  /** @type {Awaited<ReturnType<typeof attachPage>> | null} */
  let browser = null;

  cleanup(async () => {
    if (browser) await browser.stop();
    await server.stop();
    removeOutputDir(root);
  });

  await waitForServer(`${baseUrl}/comfyui-output-browser/images`)
    .catch(error => { throw new Error(`${error.message}\nServer output:\n${server.output}`); });

  browser = await attachPage(testPage, context);
  const { evaluate, goto, page } = browser;

  await goto(`${baseUrl}/`);
  await waitUntil(evaluate, "document.querySelectorAll('.image-card').length === 1", "the fixture card to render");
  await waitUntil(evaluate, "window.__cfob.serverImageFetchCount === 0", "initial image sync to finish");
  await waitUntil(evaluate, "!window.__cfob.isIdleParsing", "initial metadata parsing to finish");

  // The new paths resolve for card fields: text chunks parse as JSON when possible.
  assert.equal(
    await evaluate("window.__cfob.resolveFieldValue(window.__cfob.loadedImages[0], '@textChunks.parameters.seed')"),
    1234
  );
  assert.equal(
    await evaluate("window.__cfob.resolveFieldValue(window.__cfob.loadedImages[0], '@textChunks.Dream')"),
    "aurora borealis"
  );
  assert.equal(
    await evaluate("window.__cfob.resolveFieldValue(window.__cfob.loadedImages[0], '@file.name')"),
    "meta.png"
  );

  // Open the inspector for the selected image.
  await page.locator('.image-card[data-name="meta.png"] .card-checkbox').click();
  await page.locator("#cfobActionInspect").click();
  await waitUntil(evaluate, "document.querySelector('#cfobInspectorModal').classList.contains('active')", "inspector to open");

  const fullTab = page.locator('#cfobInspectorTabs .tab[data-target="cfobInsOther"]');
  assert.equal(await fullTab.getAttribute("class"), "tab", "Other Metadata tab should not start active");
  await fullTab.click();
  await waitUntil(evaluate, "document.querySelector('#cfobInsOther').classList.contains('active')", "other metadata tab to activate");

  const view = page.locator("#cfobInsOtherView");
  const text = await view.innerText();
  assert.match(text, /"file"/, "file section");
  assert.match(text, /"name": "meta\.png"/, "file name");
  assert.match(text, /"mtime"/, "file mtime");
  assert.match(text, /"textChunks"/, "text chunks section");
  assert.match(text, /"parameters"/, "parameters chunk");
  assert.match(text, /"seed": 1234/, "parameters parsed as JSON");
  assert.match(text, /"Dream": "aurora borealis"/, "raw text chunk");
  assert.match(text, /"prompt"/, "prompt chunk link");
  assert.match(text, /"workflow"/, "workflow chunk link");
  assert.doesNotMatch(text, /"class_type"/, "parsed prompt JSON belongs to the API Prompt tab");
  assert.doesNotMatch(text, /"nodes"/, "parsed workflow JSON belongs to the UI Workflow tab");

  // The raw prompt/workflow chunks link to their tabs instead of repeating the JSON.
  const promptLink = view.locator('a.inspector-tab-link[data-tab="cfobInsPrompt"]');
  assert.equal(await promptLink.count(), 1, "one prompt tab link");
  await promptLink.click();
  await waitUntil(evaluate, "document.querySelector('#cfobInsPrompt').classList.contains('active')", "prompt link to open the API Prompt tab");

  // Keys expose the same path spelling the field and blacklist features use.
  await fullTab.click();
  await waitUntil(evaluate, "document.querySelectorAll('#cfobInsOtherView button.inspector-json-key').length > 0", "other metadata keys to render");
  const seedKey = view.locator(`button.inspector-json-key[data-path="${encodeURIComponent("@textChunks.parameters.seed")}"]`);
  await seedKey.click();
  assert.equal(
    await page.locator("#cfobInsOtherView .inspector-json-selected-path").innerText(),
    "@textChunks.parameters.seed"
  );
});

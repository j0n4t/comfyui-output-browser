import assert from "node:assert/strict";
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
} from "./helpers.mjs";

const pythonPath = findPython();

sweepStaleProfileDirs();

test("search autocomplete completes filename suggestions and restores search history", async ({ cleanup, page, context }) => {
  const { root, outputDir } = makeOutputDir({
    "cat.png": [200, 40, 40],
    "catalog.png": [40, 200, 40],
    "dog.png": [40, 40, 200],
  });
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

  browser = await attachPage(page, context);
  const { evaluate, goto } = browser;
  await goto(`${baseUrl}/`);
  await waitUntil(evaluate, "document.querySelectorAll('.image-card').length === 3", "all fixture images to render");
  await waitUntil(evaluate, "window.__cfob.serverImageFetchCount === 0", "initial image sync to finish");
  await waitUntil(evaluate, "!window.__cfob.isIdleParsing", "initial metadata parsing to finish");

  const search = page.locator("#cfobSearchInput");
  await search.fill("name:ca");
  await search.click();
  const catSuggestion = page.locator('#cfobSearchSuggestions [role="option"][data-value="name:cat.png"]');
  await catSuggestion.waitFor();
  assert.equal(await page.locator("#cfobSearchInput").getAttribute("aria-expanded"), "true");
  await catSuggestion.click();

  await waitUntil(evaluate, `document.querySelector('#cfobSearchInput').value === 'name:cat.png ' &&
    document.querySelectorAll('.image-card').length === 1 &&
    document.querySelector('.image-card')?.dataset.name === 'cat.png'`,
  "the selected filename suggestion to complete and filter the gallery");

  await search.fill("name:dog.png");
  await waitUntil(evaluate, `window.__cfob.filteredImages.length === 1 &&
    window.__cfob.filteredImages[0].name === 'dog.png'`,
  "the exact filename query to filter the gallery");
  await search.evaluate(input => input.blur());
  await waitUntil(evaluate, `JSON.parse(localStorage.getItem('cfob_search_history') || '[]').includes('name:dog.png')`,
    "blur to save the query in search history");

  await search.fill("");
  await search.press("Control+Space");
  const historySuggestion = page.locator('#cfobSearchSuggestions [role="option"][data-value="name:dog.png"][data-kind="history"]');
  await historySuggestion.waitFor();
  await historySuggestion.click();
  await waitUntil(evaluate, `document.querySelector('#cfobSearchInput').value === 'name:dog.png' &&
    document.querySelectorAll('.image-card').length === 1 &&
    document.querySelector('.image-card')?.dataset.name === 'dog.png'`,
  "the history suggestion to restore its query and matching result");
});

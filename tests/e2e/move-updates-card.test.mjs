/**
 * End-to-end regression test for the stale card name after a move/rename.
 *
 * The bug this pins down: moving or renaming an image mutates `img.name` in place
 * on the same CFOB_Image object. filterGallery() used to decide whether to re-render
 * by comparing object references only, which are unchanged by an in-place mutation,
 * so the card kept showing the old filename until a reload or a filter change
 * rebuilt the grid.
 *
 * It drives the real UI in a real browser against the real standalone server, so a
 * regression fails here rather than needing a manual click-through.
 *
 * Requires Chromium installed by Playwright or a system browser.
 */
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { test } from "./fixtures.mjs";

import {
  delay,
  findAvailablePort,
  findPython,
  attachPage,
  makeOutputDir,
  removeOutputDir,
  startServer,
  sweepStaleProfileDirs,
  waitForServer,
  waitUntil,
} from "./helpers.mjs";

const FIXTURE = {
  "alpha.png": [200, 40, 40],
  "beta.png": [40, 200, 40],
  "dest/gamma.png": [40, 40, 200],
};

/** Reads the state of every card in the grid. */
const CARDS_JS = `(() => Array.from(document.querySelectorAll('.image-card')).map(c => ({
  name: c.dataset.name,
  file: c.querySelector('.card-filename').textContent,
  alt: c.querySelector('.card-preview').alt,
  src: c.querySelector('.card-preview').src,
  checkbox: c.querySelector('.card-checkbox').value
})))()`;

const pythonPath = findPython();

// Sweep profile/fixture dirs from any run that died uncatchably before this one.
sweepStaleProfileDirs();

test("moving and renaming an image updates its card in place, with no reload", async ({ cleanup, page: testPage, context }) => {
  const serverPort = await findAvailablePort();
  const baseUrl = `http://127.0.0.1:${serverPort}`;

  const { root, outputDir } = makeOutputDir(FIXTURE);
  const server = startServer({ outputDir, port: serverPort, python: pythonPath });
  /** @type {Awaited<ReturnType<typeof attachPage>> | null} */
  let browser = null;

  cleanup(async () => {
    if (browser) await browser.stop();
    await server.stop();
    removeOutputDir(root);
  });

  const listed = await waitForServer(`${baseUrl}/comfyui-output-browser/images`)
    .catch(err => { throw new Error(`${err.message}\nServer output:\n${server.output}`); });
  assert.deepEqual(
    listed.map(f => f.name).sort(),
    ["alpha.png", "beta.png", "dest/gamma.png"],
    "fixture not served"
  );

  browser = await attachPage(testPage, context);
  const { evaluate, goto, page } = browser;

  await goto(`${baseUrl}/`);
  await waitUntil(evaluate, "document.querySelectorAll('.image-card').length === 3", "3 cards to render");
  await waitUntil(evaluate, "!!document.querySelector('#cfobImageCount')?.innerText", "image count to populate");

  const assertCard = async (name, expected) => {
    const cards = await evaluate(CARDS_JS);
    const card = cards.find(c => c.name === name);
    assert.ok(card, `no card named ${name}; saw ${JSON.stringify(cards.map(c => c.name))}`);
    for (const [key, value] of Object.entries(expected)) {
      assert.equal(card[key], value, `card ${name} .${key}`);
    }
    return card;
  };
  const selectCard = name => page.locator(`.image-card[data-name="${name}"] .card-checkbox`).click();
  const pickFolder = async label => {
    const chips = page.locator("#cfobFolderList .folder-chip");
    const index = await chips.evaluateAll(
      (elements, expected) => elements.findIndex(chip => chip.textContent.replace(/\s+/g, " ").trim() === expected),
      label
    );
    assert.notEqual(index, -1, `no folder chip named ${label}`);
    const chip = chips.nth(index);
    await chip.click();
    assert.ok((await chip.getAttribute("class")).split(/\s+/).includes("selected"), `folder ${label} should be selected`);
  };

  // ---------------------------------------------------------------- move (selection bar)
  await selectCard("alpha.png");
  await waitUntil(evaluate, "document.querySelector('#cfobActionBar').classList.contains('show')", "action bar");
  await page.locator("#cfobActionMove").click();
  await waitUntil(evaluate, "document.querySelector('#cfobPromptModal').classList.contains('active')", "move dialog");
  await pickFolder("dest");
  await page.locator("#cfobPromptOkBtn").click();

  await page.locator('.image-card[data-name="dest/alpha.png"]').waitFor();
  await page.locator('.image-card[data-name="alpha.png"]').waitFor({ state: "detached" });
  // A stale card would still be sitting there under the old name.
  assert.equal(
    await evaluate("Array.from(document.querySelectorAll('.image-card')).filter(c => c.dataset.name === 'alpha.png').length"),
    0,
    "the old card should be gone, not left behind"
  );
  const movedCard = await assertCard("dest/alpha.png", {
    file: "dest/alpha.png",
    alt: "dest/alpha.png",
    checkbox: "dest/alpha.png",
  });
  assert.match(movedCard.src, /filename=alpha\.png/, "preview src filename");
  assert.match(movedCard.src, /subfolder=dest/, "preview src subfolder");
  assert.ok(existsSync(join(outputDir, "dest", "alpha.png")), "file should be on disk at the new path");

  // ------------------------------------------------------------------------- rename
  await selectCard("dest/alpha.png");
  await page.locator("#cfobActionRename").click();
  await waitUntil(evaluate, "document.querySelector('#cfobPromptModal').classList.contains('active')", "rename dialog");
  await page.locator("#cfobPromptInput").fill("omega.png");
  await page.locator("#cfobPromptOkBtn").click();

  await page.locator('.image-card[data-name="dest/omega.png"]').waitFor();
  await page.locator('.image-card[data-name="dest/alpha.png"]').waitFor({ state: "detached" });
  const renamedCard = await assertCard("dest/omega.png", {
    file: "dest/omega.png",
    alt: "dest/omega.png",
    checkbox: "dest/omega.png",
  });
  assert.match(renamedCard.src, /filename=omega\.png/, "renamed preview src");
  assert.ok(existsSync(join(outputDir, "dest", "omega.png")), "renamed file should be on disk");
  assert.ok(!existsSync(join(outputDir, "dest", "alpha.png")), "old filename should be gone from disk");

  // --------------------------------------------------------------- move (full view)
  await page.locator('.image-card[data-name="dest/omega.png"] .card-preview').click();
  await waitUntil(evaluate, "document.querySelector('#cfobFullViewModal').classList.contains('active')", "full view to open");
  await page.locator("#cfobFVActionMove").click();
  await waitUntil(evaluate, "document.querySelector('#cfobPromptModal').classList.contains('active')", "full-view move dialog");
  await pickFolder("Root (/)");
  await page.locator("#cfobPromptOkBtn").click();

  await page.locator('.image-card[data-name="omega.png"]').waitFor();
  await assertCard("omega.png", { file: "omega.png", alt: "omega.png", checkbox: "omega.png" });
  const fvSrc = await evaluate("document.querySelector('#cfobFullViewImg')?.src || ''");
  assert.match(fvSrc, /filename=omega\.png/, "full view image should follow the move");
  assert.ok(!/subfolder=dest/.test(fvSrc), "full view image should no longer be in dest");
  assert.ok(existsSync(join(outputDir, "omega.png")), "moved-back file should be on disk at the root");

  // The whole scenario must hold without ever reloading the page.
  assert.equal(
    await evaluate("Array.from(document.querySelectorAll('.image-card')).length"),
    3,
    "grid should still show exactly the three fixture images"
  );
  await delay(50);
});

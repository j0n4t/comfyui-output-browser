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
 * Skips itself (rather than failing) when the toolchain is absent, so `npm test`
 * stays green on a machine without Chromium.
 */
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import {
  delay,
  findChrome,
  findPython,
  launchChrome,
  makeOutputDir,
  removeOutputDir,
  startServer,
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

/** Clicks the folder chip with exactly this label in the move dialog. */
const pickFolderJs = label => `(() => {
  const chips = Array.from(document.querySelectorAll('#cfobFolderList .folder-chip'));
  const chip = chips.find(c => c.textContent.replace(/\\s+/g, ' ').trim() === ${JSON.stringify(label)});
  if (!chip) throw new Error('no folder chip ${label}; saw ' + JSON.stringify(chips.map(c => c.textContent.replace(/\\s+/g, ' ').trim())));
  chip.click();
  return chip.textContent.replace(/\\s+/g, ' ').trim();
})()`;

/** Selects a card by its current name via its checkbox. */
const selectCardJs = name => `(() => {
  const card = Array.from(document.querySelectorAll('.image-card')).find(c => c.dataset.name === ${JSON.stringify(name)});
  if (!card) throw new Error('no card named ${name}; saw ' + JSON.stringify(Array.from(document.querySelectorAll('.image-card')).map(c => c.dataset.name)));
  card.querySelector('.card-checkbox').click();
  return card.dataset.name;
})()`;

const chromePath = findChrome();
const pythonPath = findPython();

test("moving and renaming an image updates its card in place, with no reload", { skip: chromePath ? false : "no Chromium found (set CFOB_CHROME)" }, async t => {
  // Ports derived from the pid so concurrent runs do not collide.
  const serverPort = 8200 + (process.pid % 300);
  const cdpPort = 9400 + (process.pid % 300);
  const baseUrl = `http://127.0.0.1:${serverPort}`;

  const { root, outputDir } = makeOutputDir(FIXTURE);
  const server = startServer({ outputDir, port: serverPort, python: pythonPath });
  /** @type {Awaited<ReturnType<typeof launchChrome>> | null} */
  let browser = null;

  t.after(async () => {
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

  browser = await launchChrome(chromePath, { port: cdpPort });
  const { evaluate, goto } = browser;

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

  // ---------------------------------------------------------------- move (selection bar)
  await evaluate(selectCardJs("alpha.png"));
  await waitUntil(evaluate, "document.querySelector('#cfobActionBar').classList.contains('show')", "action bar");
  await evaluate("document.querySelector('#cfobActionMove').click()");
  await waitUntil(evaluate, "document.querySelector('#cfobPromptModal').classList.contains('active')", "move dialog");
  await evaluate(pickFolderJs("dest"));
  await evaluate("document.querySelector('#cfobPromptOkBtn').click()");

  await waitUntil(
    evaluate,
    "Array.from(document.querySelectorAll('.image-card')).some(c => c.dataset.name === 'dest/alpha.png')",
    "the moved card to be renamed to dest/alpha.png"
  );
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
  await evaluate(selectCardJs("dest/alpha.png"));
  await evaluate("document.querySelector('#cfobActionRename').click()");
  await waitUntil(evaluate, "document.querySelector('#cfobPromptModal').classList.contains('active')", "rename dialog");
  await evaluate("(() => { document.querySelector('#cfobPromptInput').value = 'omega.png'; })()");
  await evaluate("document.querySelector('#cfobPromptOkBtn').click()");

  await waitUntil(
    evaluate,
    "Array.from(document.querySelectorAll('.image-card')).some(c => c.dataset.name === 'dest/omega.png')",
    "the renamed card"
  );
  const renamedCard = await assertCard("dest/omega.png", {
    file: "dest/omega.png",
    alt: "dest/omega.png",
    checkbox: "dest/omega.png",
  });
  assert.match(renamedCard.src, /filename=omega\.png/, "renamed preview src");
  assert.ok(existsSync(join(outputDir, "dest", "omega.png")), "renamed file should be on disk");
  assert.ok(!existsSync(join(outputDir, "dest", "alpha.png")), "old filename should be gone from disk");

  // --------------------------------------------------------------- move (full view)
  await evaluate(`(() => {
    const card = Array.from(document.querySelectorAll('.image-card')).find(c => c.dataset.name === 'dest/omega.png');
    card.querySelector('.card-preview').click();
  })()`);
  await waitUntil(evaluate, "document.querySelector('#cfobFullViewModal').classList.contains('active')", "full view to open");
  await evaluate("document.querySelector('#cfobFVActionMove').click()");
  await waitUntil(evaluate, "document.querySelector('#cfobPromptModal').classList.contains('active')", "full-view move dialog");
  await evaluate(pickFolderJs("Root (/)"));
  await evaluate("document.querySelector('#cfobPromptOkBtn').click()");

  await waitUntil(
    evaluate,
    "Array.from(document.querySelectorAll('.image-card')).some(c => c.dataset.name === 'omega.png')",
    "the full-view-moved card to update"
  );
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

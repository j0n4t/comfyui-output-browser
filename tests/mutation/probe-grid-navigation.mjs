#!/usr/bin/env node
/**
 * Mutation-proves a test file: break the feature, confirm the test goes red, restore.
 *
 * A test that cannot fail is not evidence. This script applies each mutation in turn,
 * runs the matching test, and requires a non-zero exit. It exits non-zero itself if any
 * mutation leaves its test green — that means the test is asserting the wrong thing.
 *
 * The source file is always restored, including on a crash (try/finally).
 *
 * Usage:
 *   node tests/mutation/probe-grid-navigation.mjs
 *   npm run test:mutation -- grid-navigation
 *
 * To prove a different module, add its mutation table to MUTATIONS and a branch below.
 */
/* eslint-disable no-console -- this file's whole job is printing a report */
import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..", "..");

/** @type {Record<string, {file: string, test: string, mutations: {label: string, from: string, to: string, testName: string}[]}>} */
const MUTATIONS = {
  "grid-navigation": {
    file: "web/CFOB_Selection.js",
    test: "tests/unit/grid-navigation.test.mjs",
    mutations: [
      {
        label: "page stride ignored (always 1 card)",
        from: "const pageItems = (isColumnFlow ? 1 : cols) * pageRows;",
        to: "const pageItems = 1;",
        testName: "PageDown moves forward by one page of rows"
      },
      {
        label: "page stride ignored (always 1 card)",
        from: "const pageItems = (isColumnFlow ? 1 : cols) * pageRows;",
        to: "const pageItems = 1;",
        testName: "PageUp moves back by one page of rows"
      },
      {
        label: "column-first pages by columns instead of rows",
        from: "const pageItems = (isColumnFlow ? 1 : cols) * pageRows;",
        to: "const pageItems = cols * pageRows;",
        testName: "PageDown in a column-first grid pages by rows, not by columns"
      },
      {
        label: "Home branch dead",
        from: "else if (direction === 'Home') nextIdx = 0;",
        to: "else if (false) nextIdx = 0;",
        testName: "Home focuses the first card"
      },
      {
        label: "End branch dead",
        from: "else if (direction === 'End') nextIdx = app.filteredImages.length - 1;",
        to: "else if (false) nextIdx = app.filteredImages.length - 1;",
        testName: "Home focuses the first card and End focuses the last"
      },
      {
        label: "clamping removed",
        from: "nextIdx = Math.max(0, Math.min(nextIdx, app.filteredImages.length - 1));",
        to: "nextIdx = nextIdx;",
        testName: "paging clamps at both ends"
      },
      {
        label: "masonry PageDown targets the current row, not one viewport down",
        from: "const targetY = currentY + (direction === 'PageUp' ? -1 : 1) * app.$(\"cfobMainContainer\").clientHeight;",
        to: "const targetY = currentY;",
        testName: "masonry PageDown jumps a page, not just to the next row"
      },
      {
        label: "masonry PageUp targets the current row, not one viewport up",
        from: "const targetY = currentY + (direction === 'PageUp' ? -1 : 1) * app.$(\"cfobMainContainer\").clientHeight;",
        to: "const targetY = currentY;",
        testName: "masonry PageUp jumps a page, not just to the previous row"
      },
      {
        label: "previous card keeps its focus class",
        from: "el.classList.toggle('focused', i === nextIdx);",
        to: "el.classList.toggle('focused', false);",
        testName: "only the destination card is focused"
      },
      {
        label: "masonry page direction guard removed",
        from: "if (direction === 'PageUp' ? candidateY >= currentY : candidateY <= currentY) continue;",
        to: "",
        testName: "masonry PageUp on the top row does not move sideways"
      },
      {
        label: "masonry page direction guard inverted",
        from: "if (direction === 'PageUp' ? candidateY >= currentY : candidateY <= currentY) continue;",
        to: "if (direction === 'PageUp' ? candidateY <= currentY : candidateY >= currentY) continue;",
        testName: "masonry PageUp on the top row does not move sideways"
      },
      {
        label: "masonry page target ignores the page height",
        from: "const targetY = currentY + (direction === 'PageUp' ? -1 : 1) * app.$(\"cfobMainContainer\").clientHeight;",
        to: "const targetY = currentY;",
        testName: "masonry PageDown still jumps about a page when there is room"
      }
    ]
  }
};

const target = process.argv[2] ?? "grid-navigation";
const entry = MUTATIONS[target];
if (!entry) {
  console.error(`Unknown probe "${target}". Available: ${Object.keys(MUTATIONS).join(", ")}`);
  process.exit(2);
}

const absFile = resolve(ROOT, entry.file);
const original = readFileSync(absFile);
const text = original.toString("utf-8");
const problems = [];

try {
  for (const m of entry.mutations) {
    if (!text.includes(m.from)) {
      problems.push(`pattern not found: ${m.label}`);
      console.log(`!! pattern missing      <- ${m.label}`);
      continue;
    }
    writeFileSync(absFile, text.replace(m.from, m.to));
    let red = false;
    try {
      execFileSync(
        process.execPath,
        ["--test", "--test-name-pattern", m.testName, entry.test],
        { cwd: ROOT, stdio: "pipe" }
      );
    } catch {
      red = true;
    }
    console.log(`${red ? "RED (good)" : "STILL GREEN (bad)"} <- ${m.label}`);
    if (!red) problems.push(`mutation did not turn the test red: ${m.label}`);
  }
} finally {
  writeFileSync(absFile, original);
}

console.log();
if (problems.length) {
  console.log("PROBE INCOMPLETE:");
  for (const p of problems) console.log(`  - ${p}`);
  process.exit(1);
}
console.log(`All ${entry.mutations.length} mutations turned their test red; ${entry.file} restored.`);

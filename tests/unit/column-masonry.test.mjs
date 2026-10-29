import assert from "node:assert/strict";
import test from "node:test";

import CFOB_Gallery from "../../web/CFOB_Gallery.js";

test("column-first masonry avoids singleton columns when pairs fit", () => {
  const breaks = CFOB_Gallery.prototype._getBalancedColumnBreaks([6, 6, 6, 6], 12);

  assert.deepEqual([...breaks], [2]);
});

test("column-first masonry minimizes unavoidable singleton columns", () => {
  const breaks = CFOB_Gallery.prototype._getBalancedColumnBreaks([8, 8, 4, 4, 8], 12);

  assert.deepEqual([...breaks], [1, 3]);
});

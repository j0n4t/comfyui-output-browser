import { test as base } from "@playwright/test";

export const test = base.extend({
  cleanup: async ({ page }, use) => {
    void page;
    /** @type {Array<() => Promise<void>>} */
    const callbacks = [];
    await use(callback => callbacks.push(callback));
    const errors = [];
    for (const callback of callbacks.reverse()) {
      try {
        // eslint-disable-next-line no-await-in-loop
        await callback();
      } catch (error) {
        errors.push(error);
      }
    }
    if (errors.length) throw new AggregateError(errors, "End-to-end test cleanup failed");
  },
});

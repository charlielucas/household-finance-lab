import assert from "node:assert/strict";
import test from "node:test";

import { createDashboardBundle } from "../lib/model.ts";

function collectKeys(value, keys = []) {
  if (Array.isArray(value)) {
    value.forEach((item) => collectKeys(item, keys));
  } else if (value && typeof value === "object") {
    Object.entries(value).forEach(([key, child]) => {
      keys.push(key);
      collectKeys(child, keys);
    });
  }
  return keys;
}

test("generated dashboard data contains no raw-finance or credential fields", () => {
  const bundle = createDashboardBundle();
  const keys = collectKeys(bundle);
  const bannedKey = /payee|merchant|memo|transaction(?:_?row)?|account(?:_?number|_?id)|routing|token|credential|statement|receipt/i;
  assert.deepEqual(keys.filter((key) => bannedKey.test(key)), []);
});

test("generated content exposes no identifying source dimensions", () => {
  const bundle = createDashboardBundle();
  const keys = collectKeys(bundle);
  const identifyingDimension = /institution|employer|address|postal|zip|accountHolder|legalName/i;
  assert.deepEqual(keys.filter((key) => identifyingDimension.test(key)), []);
  assert.equal(bundle.ledger.householdLabel, "Sample household");
});

test("the API bundle is deterministic across calls", () => {
  assert.equal(JSON.stringify(createDashboardBundle()), JSON.stringify(createDashboardBundle()));
});

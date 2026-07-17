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

function collectStrings(value, strings = []) {
  if (Array.isArray(value)) {
    value.forEach((item) => collectStrings(item, strings));
  } else if (value && typeof value === "object") {
    Object.values(value).forEach((child) => collectStrings(child, strings));
  } else if (typeof value === "string") {
    strings.push(value);
  }
  return strings;
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

test("generated content contains no direct personal identifier-shaped values", () => {
  const strings = collectStrings(createDashboardBundle());
  const identifyingValue = /(?:\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b)|(?:\/Users\/|[A-Za-z]:\\Users\\)|(?:\b\d{1,5}\s+[A-Za-z][A-Za-z.'-]*(?:\s+[A-Za-z][A-Za-z.'-]*){0,4}\s+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Court|Ct|Boulevard|Blvd|Way|Parkway|Pkwy)\b)|(?:\b(?:\d[ -]?){9,}\d\b)/i;
  assert.deepEqual(strings.filter((value) => identifyingValue.test(value)), []);
});

test("the API bundle is deterministic across calls", () => {
  assert.equal(JSON.stringify(createDashboardBundle()), JSON.stringify(createDashboardBundle()));
});

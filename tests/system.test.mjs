import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

async function source(path) {
  return readFile(new URL(path, root), "utf8");
}

test("the public system route remains documented, synthetic, and separate from the primary demo", async () => {
  const [page, showcase, primitives, docs] = await Promise.all([
    source("app/system/page.tsx"),
    source("app/system/system-showcase.tsx"),
    source("app/ui/primitives.tsx"),
    source("docs/DESIGN_SYSTEM.md"),
  ]);

  assert.match(page, /alternates: \{ canonical: "\/system" \}/);
  assert.match(showcase, /Synthetic examples only/);
  assert.match(showcase, /href="\/"/);
  assert.match(showcase, /accessible data table/);
  assert.match(showcase, /aria-live="polite"/);
  assert.match(showcase, /id="system-main" tabIndex=\{-1\}/);
  assert.match(showcase, /Synthetic pacing index data; scroll horizontally/);
  assert.match(showcase, /titleId="foundations-title"/);
  assert.match(showcase, /titleId="components-title"/);
  assert.match(showcase, /titleId="patterns-title"/);
  assert.match(showcase, /titleId="states-title"/);
  assert.match(primitives, /titleId\?: string/);
  assert.match(primitives, /export function StatusBadge/);
  assert.match(primitives, /export function ScenarioRange/);
  assert.match(primitives, /export function ActionButton/);
  assert.match(docs, /Every example below is deterministic and fictional|deterministic and fictional/);
  assert.doesNotMatch(`${page}\n${showcase}\n${primitives}\n${docs}`, /household-financial-dashboard|chatgpt-auth|YNAB|Plaid/i);
});

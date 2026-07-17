import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("renders the complete household overview instead of the starter", async () => {
  const [page, dashboard, layout] = await Promise.all([
    readFile(new URL("app/page.tsx", root), "utf8"),
    readFile(new URL("app/dashboard.tsx", root), "utf8"),
    readFile(new URL("app/layout.tsx", root), "utf8"),
  ]);
  assert.match(page, /createDashboardBundle/);
  assert.match(dashboard, /Weekly cockpit/);
  assert.match(dashboard, /Exception inbox/);
  assert.match(dashboard, /Income \+ tax waterfall/);
  assert.match(dashboard, /Financing quality gate/);
  assert.match(dashboard, /Fixed-cost calendar/);
  assert.match(dashboard, /\{confidenceLabel\(item\.confidence\)\} confidence/);
  assert.doesNotMatch(dashboard, /confidence-dot|title=\{`\$\{confidenceLabel\(item\.confidence\)\} confidence`\}/);
  assert.match(dashboard, /Provenance \+ confidence/);
  assert.match(layout, /Weekmark Household Lab/);
  assert.match(layout, /metadataBase: new URL\(canonicalOrigin\)/);
  assert.match(layout, /weekmark-household-lab\.charlielucas95\.chatgpt\.site/);
  assert.doesNotMatch(layout, /next\/headers|x-forwarded-host|x-forwarded-proto/);
  assert.doesNotMatch(layout, /template:/);
  assert.doesNotMatch(`${page}${dashboard}${layout}`, /SkeletonPreview|codex-preview|Starter Project/);
});

test("public route metadata keeps each browser title authoritative and non-duplicated", async () => {
  const [home, system] = await Promise.all([
    readFile(new URL("app/page.tsx", root), "utf8"),
    readFile(new URL("app/system/page.tsx", root), "utf8"),
  ]);
  assert.match(home, /title: "Weekmark Household Lab"/);
  assert.doesNotMatch(home, /absolute:/);
  assert.match(system, /title: "System reference \| Weekmark Household Lab"/);
});

test("scenario API recalculates through the shared model and disables caching", async () => {
  const route = await readFile(new URL("app/api/scenario/route.ts", root), "utf8");
  assert.match(route, /createDashboardBundle/);
  assert.match(route, /Cache-Control/);
  assert.match(route, /no-store/);
  assert.match(route, /\b400\b/);
  assert.match(route, /\b413\b/);
  assert.match(route, /\b415\b/);
  assert.match(route, /Array\.isArray/);
});

test("portfolio README leads with the public demo, boundaries, and supporting evidence", async () => {
  const readme = await readFile(new URL("README.md", root), "utf8");
  assert.match(readme, /Live demo:\*\* \[weekmark-household-lab\.charlielucas95\.chatgpt\.site\]/);
  assert.match(readme, /Quick start \(under five minutes\)/);
  assert.match(readme, /Feature tour/);
  assert.match(readme, /```mermaid/);
  assert.match(readme, /Deterministic synthetic dataset and privacy boundary/);
  assert.match(readme, /Key model formulas/);
  assert.match(readme, /Tests and accessibility/);
  assert.match(readme, /No live financial data is used/);
});

test("documentation covers privacy, formulas, architecture, and accessibility", async () => {
  const [architecture, metrics, privacy, accessibility] = await Promise.all([
    readFile(new URL("docs/ARCHITECTURE.md", root), "utf8"),
    readFile(new URL("docs/METRICS.md", root), "utf8"),
    readFile(new URL("docs/PRIVACY_THREAT_MODEL.md", root), "utf8"),
    readFile(new URL("docs/ACCESSIBILITY.md", root), "utf8"),
  ]);
  assert.match(architecture, /Clean-room constraints/);
  assert.match(metrics, /Thirteen-week runway/);
  assert.match(privacy, /Threats and mitigations/);
  assert.match(accessibility, /Manual QA checklist/);
  assert.match(accessibility, /No claim of full WCAG conformance/);
});

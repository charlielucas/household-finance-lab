import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(fileURLToPath(new URL("..", import.meta.url)));

function sourceFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(fullPath);
    return /\.(?:ts|tsx)$/.test(entry.name) ? [fullPath] : [];
  });
}

function publishableFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return publishableFiles(fullPath);
    return /\.(?:ts|tsx|css|md)$/.test(entry.name) ? [fullPath] : [];
  });
}

test("public application source has no live-data connector, secret runtime, or personal-path dependency", () => {
  const sources = [
    ...sourceFiles(path.join(root, "app")),
    ...sourceFiles(path.join(root, "lib")),
  ].map((file) => ({ file: path.relative(root, file), text: readFileSync(file, "utf8") }));

  const prohibited = [
    ["personal filesystem path", /(?:\/Users\/|[A-Za-z]:\\Users\\)/],
    ["runtime secret lookup", /\b(?:process\.env|import\.meta\.env)\b/],
    ["live finance connector vocabulary", /\b(?:ynab|plaid)\b/i],
    ["direct remote data request", /\bfetch\s*\(\s*["'`]https?:\/\//],
  ];

  for (const [label, pattern] of prohibited) {
    const matches = sources.filter(({ text }) => pattern.test(text)).map(({ file }) => file);
    assert.deepEqual(matches, [], `${label} found in: ${matches.join(", ")}`);
  }
});

test("publishable public text contains no personal-identifier-shaped values", () => {
  const files = [
    ...publishableFiles(path.join(root, "app")),
    ...publishableFiles(path.join(root, "lib")),
    ...publishableFiles(path.join(root, "worker")),
    ...publishableFiles(path.join(root, "docs")),
    path.join(root, "README.md"),
  ];
  const identifyingValue = /(?:\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b)|(?:\/Users\/|[A-Za-z]:\\Users\\)|(?:\b\d{1,5}\s+[A-Za-z][A-Za-z.'-]*(?:\s+[A-Za-z][A-Za-z.'-]*){0,4}\s+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Court|Ct|Boulevard|Blvd|Way|Parkway|Pkwy)\b)|(?:\b(?:\d[ -]?){9,}\d\b)/i;
  const matches = files
    .map((file) => ({ file: path.relative(root, file), text: readFileSync(file, "utf8") }))
    .filter(({ text }) => identifyingValue.test(text))
    .map(({ file }) => file);

  assert.deepEqual(matches, [], `personal-identifier-shaped publishable text found in: ${matches.join(", ")}`);
});

test("public static assets stay on a reviewed privacy allowlist", () => {
  const publicDirectory = path.join(root, "public");
  const assets = readdirSync(publicDirectory, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .sort();

  // New public assets are a deliberate review point: a screenshot or document
  // can leak private information even when app source and copy remain clean.
  assert.deepEqual(assets, ["og.png"]);

  const image = readFileSync(path.join(publicDirectory, "og.png"));
  assert.deepEqual([...image.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10], "og.png must remain a PNG");
  assert.equal(
    createHash("sha256").update(image).digest("hex"),
    "ae511d607a5999c4352c4ae696ed5d11009d4acf6fb17677daee04784ddceef9",
    "changing the published social image requires an explicit privacy review",
  );

  // The reviewed image carries only color-space/dimension metadata. If that
  // metadata ever changes, the digest gate above forces an explicit review.
  const identifyingValue = /(?:\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b)|(?:\/Users\/|[A-Za-z]:\\Users\\)|(?:\b\d{1,5}\s+[A-Za-z][A-Za-z.'-]*(?:\s+[A-Za-z][A-Za-z.'-]*){0,4}\s+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Court|Ct|Boulevard|Blvd|Way|Parkway|Pkwy)\b)|(?:\b(?:\d[ -]?){9,}\d\b)/i;
  assert.equal(identifyingValue.test(image.toString("latin1")), false, "og.png metadata must not contain identifier-shaped text");
});

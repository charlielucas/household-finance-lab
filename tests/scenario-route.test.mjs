import assert from "node:assert/strict";
import test from "node:test";

import {
  MAX_SCENARIO_REQUEST_BYTES,
  POST,
} from "../app/api/scenario/route.ts";

function scenarioRequest(body, headers = {}) {
  return new Request("https://example.test/api/scenario", {
    method: "POST",
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...headers,
    },
    body,
  });
}

test("scenario POST accepts JSON objects and preserves model normalization", async () => {
  const response = await POST(scenarioRequest(JSON.stringify({
    reliableNetMonthly: 1,
    variableGrossMonthly: 900,
    financing: { annualRate: 99 },
  })));

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  const bundle = await response.json();
  assert.equal(bundle.scenario.reliableNetMonthly, 2_000);
  assert.equal(bundle.scenario.variableGrossMonthly, 900);
  assert.equal(bundle.scenario.financing.annualRate, 36);
});

test("scenario POST requires application/json before reading the body", async () => {
  const response = await POST(scenarioRequest("{}", { "content-type": "text/plain" }));
  assert.equal(response.status, 415);
  assert.equal(response.headers.get("cache-control"), "no-store");
});

test("scenario POST rejects arrays and other non-object JSON values", async () => {
  for (const body of ["[]", "null", "true", "42", "\"scenario\""]) {
    const response = await POST(scenarioRequest(body));
    assert.equal(response.status, 400);
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.deepEqual(await response.json(), { error: "Scenario must be an object." });
  }
});

test("scenario POST rejects declared and streamed bodies over the request ceiling", async () => {
  const exactLimitBody = JSON.stringify({
    padding: "x".repeat(MAX_SCENARIO_REQUEST_BYTES - '{"padding":""}'.length),
  });
  assert.equal(Buffer.byteLength(exactLimitBody), MAX_SCENARIO_REQUEST_BYTES);
  const exactLimitResponse = await POST(scenarioRequest(exactLimitBody));
  assert.equal(exactLimitResponse.status, 200);
  assert.equal(exactLimitResponse.headers.get("cache-control"), "no-store");

  const declaredResponse = await POST(scenarioRequest("{}", {
    "content-length": String(MAX_SCENARIO_REQUEST_BYTES + 1),
  }));
  assert.equal(declaredResponse.status, 413);
  assert.equal(declaredResponse.headers.get("cache-control"), "no-store");

  const streamedResponse = await POST(scenarioRequest(
    JSON.stringify({ padding: "x".repeat(MAX_SCENARIO_REQUEST_BYTES) }),
  ));
  assert.equal(streamedResponse.status, 413);
  assert.equal(streamedResponse.headers.get("cache-control"), "no-store");
});

test("scenario POST returns a stable client error for malformed JSON", async () => {
  const response = await POST(scenarioRequest("{"));
  assert.equal(response.status, 400);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.deepEqual(await response.json(), { error: "Scenario must be valid JSON." });
});

import { createDashboardBundle } from "../../../lib/model.ts";

export const MAX_SCENARIO_REQUEST_BYTES = 4_096;
const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

type BodyReadResult =
  | { status: "ok"; text: string }
  | { status: "invalid" }
  | { status: "too-large" };

function hasJsonContentType(request: Request): boolean {
  const mediaType = request.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase();
  return mediaType === "application/json";
}

function scenarioResponse(body: unknown, status = 200) {
  return Response.json(body, { status, headers: NO_STORE_HEADERS });
}

async function readBodyWithinLimit(request: Request): Promise<BodyReadResult> {
  const declaredLength = request.headers.get("content-length");
  if (declaredLength !== null) {
    const bytes = Number(declaredLength);
    if (!Number.isFinite(bytes) || bytes < 0) return { status: "invalid" };
    if (bytes > MAX_SCENARIO_REQUEST_BYTES) return { status: "too-large" };
  }

  if (!request.body) return { status: "ok", text: "" };

  const reader = request.body.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let bytesRead = 0;
  let text = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      bytesRead += value.byteLength;
      if (bytesRead > MAX_SCENARIO_REQUEST_BYTES) {
        await reader.cancel();
        return { status: "too-large" };
      }

      text += decoder.decode(value, { stream: true });
    }

    text += decoder.decode();
    return { status: "ok", text };
  } catch {
    return { status: "invalid" };
  } finally {
    reader.releaseLock();
  }
}

export async function GET() {
  return scenarioResponse(createDashboardBundle());
}

export async function POST(request: Request) {
  if (!hasJsonContentType(request)) {
    return scenarioResponse({ error: "Scenario requests must use application/json." }, 415);
  }

  const bodyResult = await readBodyWithinLimit(request);
  if (bodyResult.status === "too-large") {
    return scenarioResponse(
      { error: `Scenario request body must be ${MAX_SCENARIO_REQUEST_BYTES} bytes or fewer.` },
      413,
    );
  }

  if (bodyResult.status === "invalid") {
    return scenarioResponse({ error: "Scenario must be valid JSON." }, 400);
  }

  let body: unknown;
  try {
    body = JSON.parse(bodyResult.text);
  } catch {
    return scenarioResponse({ error: "Scenario must be valid JSON." }, 400);
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return scenarioResponse({ error: "Scenario must be an object." }, 400);
  }

  return scenarioResponse(createDashboardBundle(body));
}

import { createDashboardBundle } from "../../../lib/model.ts";

export async function GET() {
  return Response.json(createDashboardBundle(), {
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Scenario must be valid JSON." }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return Response.json({ error: "Scenario must be an object." }, { status: 400 });
  }

  return Response.json(createDashboardBundle(body), {
    headers: { "Cache-Control": "no-store" },
  });
}

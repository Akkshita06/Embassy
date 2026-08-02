import { NextRequest, NextResponse } from "next/server";
import { resolveAgent, NandaRegistryError } from "@/lib/nanda/client";

/*
 * ⚠️ STUBBED — see src/lib/nanda/client.ts for details. This route's
 * request/response shape is invented for this demo.
 * TODO(real-nanda-integration): confirm against real Nanda docs before
 * treating this as a stable contract.
 *
 * This is the endpoint the Nanda Agent Orchestration pipeline step and
 * Embassy's originating-agent / delegation check should call to find
 * out whether the requesting agent's identity is actually verified —
 * that check should read the `verified` field this route returns
 * instead of assuming `true`.
 *
 * Same pattern as src/app/api/prava/session/route.ts — secrets
 * (NANDA_API_KEY) never leave the server.
 */

interface ResolveRequestBody {
  identifier?: unknown;
}

export async function POST(req: NextRequest) {
  let body: ResolveRequestBody;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 }
    );
  }

  const { identifier } = body;

  if (typeof identifier !== "string" || !identifier.trim()) {
    return NextResponse.json(
      { error: "Missing or invalid required field: identifier." },
      { status: 400 }
    );
  }

  try {
    const identity = await resolveAgent(identifier.trim());

    return NextResponse.json(
      { ...identity, stubbed: identity.source === "stub" },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof NandaRegistryError) {
      const status =
        error.status >= 400 && error.status < 600 ? error.status : 500;

      return NextResponse.json(
        { error: error.message, detail: error.body ?? null },
        { status }
      );
    }

    console.error("[Embassy] Unexpected error resolving agent with Nanda:", error);

    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}

// Convenience GET for quick manual checks: /api/nanda/resolve?identifier=Nova%20AI
export async function GET(req: NextRequest) {
  const identifier = req.nextUrl.searchParams.get("identifier");

  if (!identifier || !identifier.trim()) {
    return NextResponse.json(
      { error: "Missing required query param: identifier." },
      { status: 400 }
    );
  }

  try {
    const identity = await resolveAgent(identifier.trim());
    return NextResponse.json(
      { ...identity, stubbed: identity.source === "stub" },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof NandaRegistryError) {
      const status =
        error.status >= 400 && error.status < 600 ? error.status : 500;
      return NextResponse.json(
        { error: error.message, detail: error.body ?? null },
        { status }
      );
    }

    console.error("[Embassy] Unexpected error resolving agent with Nanda:", error);

    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}

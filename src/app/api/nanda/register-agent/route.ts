import { NextRequest, NextResponse } from "next/server";
import { registerAgent, NandaRegistryError } from "@/lib/nanda/client";

/*
 * ⚠️ STUBBED — see src/lib/nanda/client.ts for details. This route's
 * request/response shape is invented for this demo.
 * TODO(real-nanda-integration): confirm against real Nanda docs before
 * treating this as a stable contract.
 *
 * Same pattern as src/app/api/prava/session/route.ts — secrets
 * (NANDA_API_KEY) never leave the server, only the resulting
 * registration record is returned to the client.
 */

interface RegisterAgentRequestBody {
  name?: unknown;
  role?: unknown;
}

export async function POST(req: NextRequest) {
  let body: RegisterAgentRequestBody;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 }
    );
  }

  const { name, role } = body;

  if (typeof name !== "string" || !name.trim()) {
    return NextResponse.json(
      { error: "Missing or invalid required field: name." },
      { status: 400 }
    );
  }

  if (role !== undefined && typeof role !== "string") {
    return NextResponse.json(
      { error: "role must be a string when provided." },
      { status: 400 }
    );
  }

  try {
    const registration = await registerAgent({
      name: name.trim(),
      role: role?.trim(),
    });

    console.log("[Embassy] Nanda agent registered:", {
      nandaAgentId: registration.nandaAgentId,
      status: registration.status,
      source: registration.source,
    });

    return NextResponse.json(
      { ...registration, stubbed: registration.source === "stub" },
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

    console.error(
      "[Embassy] Unexpected error registering agent with Nanda:",
      error
    );

    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}

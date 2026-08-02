import { NextRequest, NextResponse } from "next/server";
import { extractIntent, IntentExtractionError, type ExtractedIntent } from "@/lib/agent/reason";

/**
 * Extracts structured purchase intent from free text using gpt-4o-mini.
 *
 * IMPORTANT: this route only extracts and structures what the requester
 * said — it never decides allow/escalate/deny. That decision stays
 * entirely inside the deterministic policy engine downstream. Nothing
 * returned from here should be treated as, or feed into, a policy
 * decision; it's structured input for that engine, not an output of it.
 *
 * Thin wrapper over src/lib/agent/reason.ts, which src/app/api/requests/
 * evaluate/route.ts also calls directly (no internal HTTP round-trip).
 */

export type { ExtractedIntent };

export async function POST(req: NextRequest) {
  let body: { intent?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 }
    );
  }

  try {
    const result = await extractIntent(body.intent ?? "");
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    if (err instanceof IntentExtractionError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("Unexpected error extracting intent:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

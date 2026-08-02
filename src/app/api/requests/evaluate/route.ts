import { NextRequest, NextResponse } from "next/server";
import { extractIntent, IntentExtractionError, type ExtractedIntent } from "@/lib/agent/reason";
import { resolveAgent, NandaRegistryError, type NandaResolvedIdentity } from "@/lib/nanda/client";
import { runPolicyEvaluation } from "@/lib/policy/engine";
import { sensoSearch } from "@/lib/senso/client";
import type { Mandate, PurchaseRequest } from "@/lib/mock-data";

/**
 * Live purchase-request orchestrator:
 *   Agent Reasoning (OpenAI, informational only)
 *     → Nanda (agent identity)
 *     → runPolicyEvaluation (the actual, deterministic allow/escalate/deny)
 *
 * Server-only — mirrors the existing Prava routes: no secret ever leaves
 * this route. Nothing OpenAI extracts is passed into the policy decision;
 * item/merchant/category/amount/mandate come from the request body
 * (i.e. what the person actually typed into the form), not the model.
 *
 * NOTE ON STATE: this app has no database. The `mandate` in the request
 * body is the client's current, possibly-already-incremented copy (see
 * the requests page, which owns spentToday in React state) — this route
 * evaluates against whatever mandate snapshot it's given rather than
 * re-reading the static seed data, so the daily-limit check reflects
 * requests submitted earlier in the same session.
 */

interface EvaluateRequestBody {
  agentName?: string;
  mandate?: Mandate;
  merchant?: string;
  item?: string;
  category?: string;
  amount?: number;
  intent?: string;
}

export async function POST(req: NextRequest) {
  let body: EvaluateRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const { agentName, mandate, merchant, item, category, amount, intent } = body;

  if (!agentName?.trim()) {
    return NextResponse.json({ error: "Missing or invalid required field: agentName." }, { status: 400 });
  }
  if (!merchant?.trim()) {
    return NextResponse.json({ error: "Missing or invalid required field: merchant." }, { status: 400 });
  }
  if (!item?.trim()) {
    return NextResponse.json({ error: "Missing or invalid required field: item." }, { status: 400 });
  }
  if (!category?.trim()) {
    return NextResponse.json({ error: "Missing or invalid required field: category." }, { status: 400 });
  }
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "Missing or invalid required field: amount (must be > 0)." }, { status: 400 });
  }

  // 1. OpenAI reasoning — best-effort, informational only. A missing key
  // or a failed call must never block the request; it only means the
  // Agent Request step's detail text is a little less descriptive.
  let extracted: ExtractedIntent | null = null;
  let extractionNote: string | null = null;
  if (intent?.trim()) {
    try {
      extracted = await extractIntent(intent);
    } catch (err) {
      extractionNote =
        err instanceof IntentExtractionError ? err.message : "Reasoning extraction failed unexpectedly.";
      console.warn("[Embassy] OpenAI reasoning extraction unavailable, continuing without it:", extractionNote);
    }
  }

  // 2. Nanda — resolve the originating agent's identity.
  let nandaResult: NandaResolvedIdentity;
  try {
    nandaResult = await resolveAgent(agentName);
  } catch (err) {
    if (err instanceof NandaRegistryError) {
      return NextResponse.json({ error: `Nanda resolution failed: ${err.message}` }, { status: 502 });
    }
    console.error("[Embassy] Unexpected error resolving agent with Nanda:", err);
    return NextResponse.json({ error: "Internal server error resolving agent identity." }, { status: 500 });
  }

  // 3. Senso — best-effort, advisory-only policy context lookup. Never
  // throws, never blocks the request; on any failure (missing key,
  // network error, empty KB, whatever) we just fall back to `null` and
  // log a warning. runPolicyEvaluation treats this purely as informational
  // text — it can never gate the decision.
  let sensoContext: string | null = null;
  try {
    const sensoResult = await sensoSearch(
      `What is our policy on purchasing "${item}" from ${merchant} in category ${category}?`
    );
    sensoContext = sensoResult.answer?.trim() ? sensoResult.answer.trim() : null;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn("[Embassy] Senso policy context unavailable, continuing without it:", message);
  }

  // 4. The actual decision — Embassy's own deterministic logic.
  const evaluation = runPolicyEvaluation(
    { agent: agentName, item, merchant, category, amount },
    mandate,
    nandaResult,
    extracted,
    sensoContext
  );

  const now = new Date().toISOString();
  const request: PurchaseRequest = {
    id: `req_live_${Date.now()}`,
    item,
    merchant,
    category,
    amount,
    agent: agentName,
    mandate: mandate?.name ?? "Unassigned",
    status: evaluation.status,
    timestamp: now,
    reason: evaluation.reason,
    decisionPath: evaluation.decisionPath,
  };

  return NextResponse.json(
    { request, extracted, extractionNote, nanda: nandaResult },
    { status: 200 }
  );
}
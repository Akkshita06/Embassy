import { NextRequest, NextResponse } from "next/server";
import { resolveAgent, NandaRegistryError, type NandaResolvedIdentity } from "@/lib/nanda/client";
import { runPolicyEvaluation } from "@/lib/policy/engine";
import { executeCheckout, CheckoutAgentError } from "@/lib/browser/checkout-agent";
import { logBrowserAction } from "@/lib/browser/audit-log";
import type { Mandate } from "@/lib/mock-data";

/**
 * Gate + drive the browser-automation checkout.
 *
 * This route NEVER trusts a client-supplied "this was approved" flag.
 * Exactly like src/app/api/requests/evaluate/route.ts, it re-runs
 * Nanda resolution + runPolicyEvaluation itself, from the same
 * request/mandate fields the client sends, and only proceeds to
 * Stagehand if that fresh evaluation lands on "approved" AND the
 * "Prava Mandate Check" step in the resulting decisionPath passed
 * (i.e. a card is actually linked to the mandate). An "escalated"
 * request that a human later approves through the ApprovalDrawer/Prava
 * flow does not come back through here with a forged status — this
 * route only ever green-lights requests the deterministic policy
 * engine itself, right now, calls "approved".
 *
 * CARD DATA: nothing here ever reads a PAN/CVV. `mandate.card` only
 * ever contains { enrollmentId, last4, brand } (see mock-data.ts /
 * prava/collect-pan.ts) — a masked display string built from that is
 * all that ever reaches the browser-automation layer, purely for
 * audit-log narration, never typed into any page.
 */

interface ExecuteRequestBody {
  requestId?: string;
  agentName?: string;
  mandate?: Mandate;
  merchant?: string;
  item?: string;
  category?: string;
  amount?: number;
}

export async function POST(req: NextRequest) {
  let body: ExecuteRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const { requestId, agentName, mandate, merchant, item, category, amount } = body;

  if (!requestId?.trim()) {
    return NextResponse.json({ error: "Missing or invalid required field: requestId." }, { status: 400 });
  }
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

  // 1. Nanda — resolve the originating agent's identity, fresh.
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

  // 2. The real, deterministic policy decision — re-derived here, not
  // trusted from the client. `extracted`/`sensoContext` are omitted:
  // they only ever affect descriptive text, never the status, so
  // skipping them here doesn't change the actual decision.
  const evaluation = runPolicyEvaluation({ agent: agentName, item, merchant, category, amount }, mandate, nandaResult, null, null);

  const pravaStep = evaluation.decisionPath.find((s) => s.label === "Prava Mandate Check");
  const policyDecisionSummary = `${evaluation.status} — ${evaluation.reason}`;

  if (evaluation.status !== "approved" || pravaStep?.status !== "passed") {
    await logBrowserAction({
      requestId,
      action: "policy_gate",
      targetUrl: merchant,
      policyDecision: policyDecisionSummary,
      result: "blocked",
      detail: "Browser execution denied — policy engine did not return approved + passed Prava Mandate Check.",
    });
    return NextResponse.json(
      {
        error: "Request is not authorized for browser execution.",
        status: evaluation.status,
        decisionPath: evaluation.decisionPath,
      },
      { status: 403 }
    );
  }

  const cardDisplay = mandate?.card ? `${mandate.card.brand.toUpperCase()} ••••${mandate.card.last4}` : "no card";
  const fullPolicyDecision = `${policyDecisionSummary} (mandate "${mandate?.name}", ${cardDisplay})`;

  // 3. Only now — after the policy engine and the Prava mandate check
  // have both passed — hand off to the browser-automation service.
  try {
    const result = await executeCheckout({
      requestId,
      merchant,
      item,
      maxAmount: amount,
      policyDecision: fullPolicyDecision,
    });

    return NextResponse.json(
      { requestId, status: result.status, finalUrl: result.finalUrl, selectedItem: result.selectedItem, auditLog: result.auditLog, error: result.error },
      { status: result.status === "reached_checkout" ? 200 : 502 }
    );
  } catch (err) {
    const message =
      err instanceof CheckoutAgentError ? `${err.step}: ${err.message}` : "Unexpected browser automation error.";
    console.error("[Embassy] Browser checkout execution failed:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
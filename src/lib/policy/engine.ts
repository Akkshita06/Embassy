import "server-only";
import type { DecisionStep, Mandate, RequestStatus } from "@/lib/mock-data";
import type { NandaResolvedIdentity } from "@/lib/nanda/client";
import type { ExtractedIntent } from "@/lib/agent/reason";
import { formatINR } from "@/lib/utils";

/**
 * ActivityTimeline renders DecisionStep.detail as plain text, but Senso's
 * grounded-search answers often come back with markdown formatting
 * (**bold**, headers, bullet lists) intended for a markdown renderer.
 * Strip that formatting down to clean plain-text sentences so it reads
 * naturally in a UI that has no markdown support, without touching the
 * timeline component itself.
 */
function stripMarkdown(text: string): string {
  return text
    .replace(/^#{1,6}\s+/gm, "") // headers
    .replace(/\*\*(.+?)\*\*/g, "$1") // bold
    .replace(/\*(.+?)\*/g, "$1") // italics
    .replace(/`(.+?)`/g, "$1") // inline code
    .replace(/^[-*]\s+/gm, "") // bullet markers
    .replace(/\n{2,}/g, " ") // blank lines -> space
    .replace(/\n/g, " ") // remaining newlines -> space
    .replace(/\s{2,}/g, " ") // collapse extra whitespace
    .trim();
}

/**
 * The live policy engine.
 *
 * This is Embassy's own deterministic logic — it is the ONLY thing that
 * decides allow/escalate/deny. Nanda is consulted as an input
 * (verifiedIdentity can push a decision from approved to escalated),
 * never as a decision-maker itself. The LLM-extracted
 * intent (`extracted`) is even further downstream of the decision —
 * it's only ever used for the Agent Request step's descriptive detail
 * text, never read by any branch below that determines status.
 */

export interface PolicyEvaluationInput {
  agent: string;
  item: string;
  merchant: string;
  category: string;
  amount: number;
}

export interface PolicyEvaluationResult {
  status: RequestStatus;
  decisionPath: DecisionStep[];
  reason: string;
}

export function runPolicyEvaluation(
  request: PolicyEvaluationInput,
  mandate: Mandate | undefined,
  nandaResult: NandaResolvedIdentity,
  extracted: ExtractedIntent | null,
  sensoContext: string | null = null
): PolicyEvaluationResult {
  const decisionPath: DecisionStep[] = [];
  const escalationTriggers: string[] = [];

  // --- 1. Agent Request — reasoning only, no verdict --------------------
  // Only surface the LLM's output when it adds real signal beyond what's
  // already shown (agent/item/merchant/amount) — a plain restatement of
  // a routine, well-justified request isn't worth displaying. Show it
  // when there are risk flags, or when the requester's stated budget
  // ceiling doesn't match the actual amount being requested.
  const budgetMismatch =
    extracted?.budget_ceiling != null && Math.abs(extracted.budget_ceiling - request.amount) > 0.01;
  const hasSignal = extracted && (extracted.riskFlags.length > 0 || budgetMismatch);

  const reasoningNote = hasSignal
    ? ` Agent reasoning: ${extracted!.reason}.` +
      (extracted!.riskFlags.length > 0 ? ` Flags: ${extracted!.riskFlags.join(", ")}.` : "") +
      (budgetMismatch
        ? ` Note: requester mentioned ${formatINR(extracted!.budget_ceiling!)} but request is for ${formatINR(
            request.amount
          )}.`
        : "")
    : "";
  decisionPath.push({
    label: "Agent Request",
    status: "passed",
    detail: `${request.agent} requested "${request.item}" from ${request.merchant} for ${formatINR(
      request.amount
    )}.${reasoningNote}`,
  });

  // --- 2. Nanda Agent Orchestration --------------------------------------
  decisionPath.push({
    label: "Nanda Agent Orchestration",
    status: nandaResult.verified ? "passed" : "failed",
    detail: nandaResult.verified
      ? `Originating agent identity resolved via Nanda (${nandaResult.source}) — verified.`
      : `Originating agent identity could not be verified via Nanda (${nandaResult.source}) — cannot auto-approve.`,
  });
  if (!nandaResult.verified) {
    escalationTriggers.push("unverified agent identity (Nanda)");
  }

  // --- 3. Embassy Policy Evaluation — the actual mandate rules ----------
  if (!mandate) {
    decisionPath.push({
      label: "Embassy Policy Evaluation",
      status: "failed",
      detail: `No mandate was supplied or found for this request.`,
    });
    decisionPath.push({ label: "Prava Mandate Check", status: "skipped", detail: "Not reached — no mandate." });
    decisionPath.push({
      label: "Senso Policy Context",
      status: "skipped",
      detail: "Not reached — request blocked upstream.",
    });
    decisionPath.push({
      label: "Payment / Human Approval",
      status: "skipped",
      detail: "Not reached — request blocked upstream.",
    });
    return {
      status: "blocked",
      decisionPath,
      reason: "Blocked: no matching mandate found.",
    };
  }

  if (mandate.status === "paused") {
    decisionPath.push({
      label: "Embassy Policy Evaluation",
      status: "failed",
      detail: `Mandate "${mandate.name}" is paused — no purchases can be evaluated against it right now.`,
    });
    decisionPath.push({ label: "Prava Mandate Check", status: "skipped", detail: "Not reached — mandate paused." });
    decisionPath.push({
      label: "Senso Policy Context",
      status: "skipped",
      detail: "Not reached — request blocked upstream.",
    });
    decisionPath.push({
      label: "Payment / Human Approval",
      status: "skipped",
      detail: "Not reached — request blocked upstream.",
    });
    return {
      status: "blocked",
      decisionPath,
      reason: `Blocked: mandate "${mandate.name}" is paused.`,
    };
  }

  const merchantListed = mandate.merchants.some(
    (m) => m.name.trim().toLowerCase() === request.merchant.trim().toLowerCase()
  );
  const categoryMatches = mandate.category.trim().toLowerCase() === request.category.trim().toLowerCase();

  // Merchant-listed OR category-matches is enough to be in scope — a
  // category-scoped mandate (e.g. "SaaS & Tools") should cover new
  // merchants in that category, not only ones already on the list.
  if (!merchantListed && !categoryMatches) {
    decisionPath.push({
      label: "Embassy Policy Evaluation",
      status: "failed",
      detail: `"${request.merchant}" is not allow-listed on "${mandate.name}" and "${request.category}" does not match its scoped category (${mandate.category}).`,
    });
    decisionPath.push({ label: "Prava Mandate Check", status: "skipped", detail: "Not reached — out of scope." });
    decisionPath.push({
      label: "Senso Policy Context",
      status: "skipped",
      detail: "Not reached — request blocked upstream.",
    });
    decisionPath.push({
      label: "Payment / Human Approval",
      status: "skipped",
      detail: "Not reached — request blocked upstream.",
    });
    return {
      status: "blocked",
      decisionPath,
      reason: `Blocked: out of mandate scope (merchant not listed, category mismatch).`,
    };
  }

  const overPerCharge = request.amount > mandate.perChargeLimit;
  const overDailyLimit = mandate.spentToday + request.amount > mandate.dailyLimit;
  if (overPerCharge) {
    escalationTriggers.push(
      `over per-charge limit (${formatINR(request.amount)} > ${formatINR(mandate.perChargeLimit)})`
    );
  }
  if (overDailyLimit) {
    escalationTriggers.push(
      `over remaining daily limit (${formatINR(mandate.spentToday)} spent + ${formatINR(
        request.amount
      )} > ${formatINR(mandate.dailyLimit)} cap)`
    );
  }

  decisionPath.push({
    label: "Embassy Policy Evaluation",
    status: "passed",
    detail:
      `In scope of "${mandate.name}" (${merchantListed ? "merchant allow-listed" : "category match"}).` +
      (overPerCharge || overDailyLimit
        ? " Spend cap exceeded — routing to human approval rather than auto-approving."
        : " Within spend caps."),
  });

  // --- 4. Prava Mandate Check --------------------------------------------
  const cardLinked = mandate.card !== null;
  decisionPath.push({
    label: "Prava Mandate Check",
    status: cardLinked ? "passed" : "failed",
    detail: cardLinked
      ? `Signed mandate verified, card on file (${mandate.card!.brand.toUpperCase()} ••••${mandate.card!.last4}).`
      : `No card linked to "${mandate.name}" yet — a human needs to complete card link before this can execute.`,
  });
  if (!cardLinked) {
    escalationTriggers.push("no card linked to mandate");
  }

  // --- 4b. Senso Policy Context — advisory only ---------------------------
  // Purely informational: surfaces any grounded policy context Senso
  // returned for this request, for a human reviewer's benefit. This step
  // can NEVER be "failed", can NEVER push anything into
  // escalationTriggers, and can NEVER affect the final status below —
  // it's either "passed" (context was available) or "skipped" (none was
  // available / the Senso call failed upstream).
  decisionPath.push({
    label: "Senso Policy Context",
    status: sensoContext && sensoContext.trim() ? "passed" : "skipped",
    detail:
      sensoContext && sensoContext.trim()
        ? stripMarkdown(sensoContext.trim())
        : "No relevant policy context found.",
  });

  // --- 5. Payment / Human Approval ---------------------------------------
  const mustEscalate = escalationTriggers.length > 0;
  decisionPath.push({
    label: "Payment / Human Approval",
    status: mustEscalate ? "waiting" : "passed",
    detail: mustEscalate
      ? `Escalated to the mandate holder — ${escalationTriggers.join("; ")}.`
      : "Executed automatically, no human step needed.",
  });

  return {
    status: mustEscalate ? "escalated" : "approved",
    decisionPath,
    reason: mustEscalate
      ? `Escalated: ${escalationTriggers.join("; ")}.`
      : "Approved: within mandate scope, merchant allow-listed or category matched, spend cap not exceeded.",
  };
}
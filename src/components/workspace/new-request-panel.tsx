"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { X, Send, Loader2, AlertTriangle, ArrowRight } from "lucide-react";
import { agents, Mandate, PurchaseRequest } from "@/lib/mock-data";
import { ActivityTimeline } from "./activity-timeline";
import { StatusBadge } from "./status-badge";
import { formatINR } from "@/lib/utils";

type Stage = "form" | "evaluating" | "result" | "error";

/**
 * Real submission flow: Agent Reasoning (OpenAI) → Nanda → Senso → the
 * live policy engine (src/lib/policy/engine.ts), via a single call to
 * POST /api/requests/evaluate. Nothing here is scripted/simulated —
 * whatever decisionPath comes back is what the engine actually decided.
 *
 * `mandates` is passed in (rather than imported fresh) because the
 * requests page owns the live, session-mutated copy — spentToday only
 * reflects earlier approvals if this panel evaluates against that same
 * copy instead of the static seed data.
 */
export function NewRequestPanel({
  open,
  onClose,
  mandates,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  mandates: Mandate[];
  onCreated: (request: PurchaseRequest) => void;
}) {
  const [stage, setStage] = useState<Stage>("form");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<PurchaseRequest | null>(null);
  const [extractionNote, setExtractionNote] = useState<string | null>(null);

  const [agentName, setAgentName] = useState(agents[0]?.name ?? "");
  const [mandateId, setMandateId] = useState(mandates[0]?.id ?? "");
  const [merchant, setMerchant] = useState("");
  const [item, setItem] = useState("");
  const [category, setCategory] = useState(mandates[0]?.category ?? "");
  const [amount, setAmount] = useState<number>(0);
  const [intent, setIntent] = useState("");

  const selectedMandate = mandates.find((m) => m.id === mandateId);

  function reset() {
    setStage("form");
    setErrorMessage(null);
    setResult(null);
    setExtractionNote(null);
    setMerchant("");
    setItem("");
    setAmount(0);
    setIntent("");
  }

  function doClose() {
    onClose();
    setTimeout(reset, 200);
  }

  function handleMandateChange(id: string) {
    setMandateId(id);
    const m = mandates.find((mm) => mm.id === id);
    if (m) setCategory(m.category);
  }

  async function handleSubmit() {
    setErrorMessage(null);
    setStage("evaluating");
    try {
      const res = await fetch("/api/requests/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentName,
          mandate: selectedMandate,
          merchant,
          item,
          category,
          amount,
          intent,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error ?? "Evaluation failed.");
      }
      setResult(data.request as PurchaseRequest);
      setExtractionNote(data.extractionNote ?? null);
      setStage("result");
      onCreated(data.request as PurchaseRequest);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong.");
      setStage("error");
    }
  }

  const canSubmit =
    agentName.trim() && selectedMandate && merchant.trim() && item.trim() && category.trim() && amount > 0;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={stage === "evaluating" ? undefined : doClose}
            className="fixed inset-0 z-40 bg-ink/20 backdrop-blur-[2px]"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
            className="fixed right-0 top-0 z-50 h-screen w-full max-w-md overflow-y-auto border-l border-border bg-surface p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-soft">New purchase request</p>
                <h2 className="mt-1 font-display text-xl text-ink">
                  {stage === "form" && "Request details"}
                  {stage === "evaluating" && "Running the pipeline…"}
                  {stage === "result" && "Decision"}
                  {stage === "error" && "Evaluation failed"}
                </h2>
              </div>
              {stage !== "evaluating" && (
                <button
                  onClick={doClose}
                  className="rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              )}
            </div>

            {stage === "form" && (
              <div className="mt-5 space-y-4">
                <div>
                  <label className="text-xs font-medium uppercase tracking-wide text-muted-soft">Agent</label>
                  <select
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
                    className="mt-2 w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent-ring"
                  >
                    {agents.map((a) => (
                      <option key={a.id} value={a.name}>
                        {a.name} {!a.verifiedIdentity && "— unverified (Nanda)"}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium uppercase tracking-wide text-muted-soft">Mandate</label>
                  <select
                    value={mandateId}
                    onChange={(e) => handleMandateChange(e.target.value)}
                    className="mt-2 w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent-ring"
                  >
                    {mandates.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} {m.status === "paused" && "(paused)"}
                      </option>
                    ))}
                  </select>
                  {selectedMandate && (
                    <p className="mt-1.5 text-xs text-muted-soft">
                      {formatINR(selectedMandate.spentToday)} / {formatINR(selectedMandate.dailyLimit)} spent today ·
                      per-charge cap {formatINR(selectedMandate.perChargeLimit)}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-medium uppercase tracking-wide text-muted-soft">Item</label>
                  <input
                    value={item}
                    onChange={(e) => setItem(e.target.value)}
                    placeholder="e.g. Figma Team Seat"
                    className="mt-2 w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-ink placeholder:text-muted-soft focus:outline-none focus:ring-2 focus:ring-accent-ring"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium uppercase tracking-wide text-muted-soft">Merchant</label>
                    <input
                      value={merchant}
                      onChange={(e) => setMerchant(e.target.value)}
                      placeholder="e.g. Figma"
                      list="merchant-suggestions"
                      className="mt-2 w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-ink placeholder:text-muted-soft focus:outline-none focus:ring-2 focus:ring-accent-ring"
                    />
                    <datalist id="merchant-suggestions">
                      {selectedMandate?.merchants.map((m) => <option key={m.name} value={m.name} />)}
                    </datalist>
                  </div>
                  <div>
                    <label className="text-xs font-medium uppercase tracking-wide text-muted-soft">Category</label>
                    <input
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="mt-2 w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-ink placeholder:text-muted-soft focus:outline-none focus:ring-2 focus:ring-accent-ring"
                    />
                  </div>
                </div>
                <p className="-mt-2 flex items-center gap-1.5 text-xs text-muted-soft">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  Pre-filled from the mandate — change either to test an out-of-scope request.
                </p>

                <div>
                  <label className="text-xs font-medium uppercase tracking-wide text-muted-soft">Amount</label>
                  <div className="relative mt-2">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-soft">
                      ₹
                    </span>
                    <input
                      type="number"
                      min={0}
                      value={amount || ""}
                      onChange={(e) => setAmount(Number(e.target.value))}
                      className="mono-tabular w-full rounded-lg border border-border bg-bg py-2 pl-6 pr-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent-ring"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium uppercase tracking-wide text-muted-soft">
                    Intent (free text, optional)
                  </label>
                  <textarea
                    value={intent}
                    onChange={(e) => setIntent(e.target.value)}
                    rows={3}
                    placeholder="Why is this agent asking to buy this? Goes through OpenAI for reasoning/risk-flag detail only — it never affects the decision."
                    className="mt-2 w-full resize-none rounded-lg border border-border bg-bg px-3 py-2 text-sm text-ink placeholder:text-muted-soft focus:outline-none focus:ring-2 focus:ring-accent-ring"
                  />
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-ink px-3 py-2.5 text-sm font-medium text-surface transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Send className="h-4 w-4" /> Run through the pipeline
                </button>
              </div>
            )}

            {stage === "evaluating" && (
              <div className="mt-8 flex flex-col items-center gap-3 py-10 text-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted" />
                <p className="text-sm text-muted">
                  Agent reasoning → Nanda → Senso → Embassy policy evaluation…
                </p>
              </div>
            )}

            {stage === "result" && result && (
              <div className="mt-5 space-y-4">
                <div className="flex items-center justify-between rounded-lg border border-border-soft bg-surface-2/60 p-3">
                  <div>
                    <p className="text-sm font-medium text-ink">{result.item}</p>
                    <p className="text-xs text-muted-soft">
                      {result.merchant} · {formatINR(result.amount)}
                    </p>
                  </div>
                  <StatusBadge status={result.status} />
                </div>
                {extractionNote && (
                  <p className="flex items-center gap-1.5 text-xs text-muted-soft">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    OpenAI reasoning unavailable ({extractionNote}) — decision made without it.
                  </p>
                )}
                <ActivityTimeline steps={result.decisionPath} />
                {result.status === "escalated" && (
                  <p className="flex items-center gap-1.5 text-xs text-warning">
                    <ArrowRight className="h-3.5 w-3.5 shrink-0" />
                    Open this request from the list to continue via the approval drawer (Prava / Linq).
                  </p>
                )}
                <button
                  onClick={doClose}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-ink px-3 py-2.5 text-sm font-medium text-surface transition-opacity hover:opacity-90"
                >
                  Done
                </button>
              </div>
            )}

            {stage === "error" && (
              <div className="mt-6 space-y-3">
                <div className="flex items-start gap-2 rounded-lg border border-error/30 bg-error/10 p-3 text-sm text-error">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
                <button
                  onClick={() => setStage("form")}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-border px-3 py-2.5 text-sm font-medium text-ink hover:bg-surface-2"
                >
                  Back to form
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X, KeyRound, ThumbsDown, Loader2, AlertTriangle, ShieldCheck, CheckCircle2, XCircle, MessageCircle, Globe, ExternalLink } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { PurchaseRequest, mandates } from "@/lib/mock-data";
import { StatusBadge } from "./status-badge";
import { ActivityTimeline } from "./activity-timeline";
import { AuditReceipt } from "./audit-receipt";
import { formatINR, formatTimestamp } from "@/lib/utils";
import { mountCollectPAN } from "@/lib/prava/collect-pan";
import type { BrowserAuditEntry } from "@/lib/browser/audit-log";

type ApprovalStage = "idle" | "creating-session" | "collecting" | "error";

function cnResultDot(result: "success" | "failure" | "blocked"): string {
  const color = result === "success" ? "bg-success" : result === "blocked" ? "bg-warning" : "bg-error";
  return `mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${color}`;
}

// Client-side mirror of src/lib/browser/merchants.ts, for gating which
// requests show the "Execute in browser" action at all. This is a UX
// convenience only — the server route re-checks the real allow-list
// (and the policy engine + Prava mandate check) itself regardless of
// what this component shows or hides.
const BROWSER_SUPPORTED_MERCHANTS = ["amazon"];

type BrowserExecutionStage = "idle" | "running" | "done" | "error";

interface BrowserExecutionState {
  stage: BrowserExecutionStage;
  auditLog: BrowserAuditEntry[];
  status?: "reached_checkout" | "failed" | "no_match";
  finalUrl?: string | null;
  selectedItem?: { title: string; price: string | null } | null;
  error?: string | null;
}

export function ApprovalDrawer({
  request,
  onClose,
  showApprovalActions = false,
}: {
  request: PurchaseRequest | null;
  onClose: () => void;
  showApprovalActions?: boolean;
}) {
  const [note, setNote] = useState("");
  const [resolved, setResolved] = useState<"approved" | "denied" | null>(null);
  const [stage, setStage] = useState<ApprovalStage>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [iframeReady, setIframeReady] = useState(false);
  const [denyConfirm, setDenyConfirm] = useState(false);
  const collectContainerRef = useRef<HTMLDivElement>(null);

  // Linq (real integration — src/lib/linq/client.ts): tracks the
  // "Send via Linq" action independently of the in-app Prava approval
  // flow above, since a request can be sent to the mandate holder's
  // phone alongside (not instead of) the in-drawer approve/deny UI.
  const [linqStatus, setLinqStatus] = useState<PurchaseRequest["linqStatus"] | null>(
    request?.linqStatus ?? null
  );
  const [linqSending, setLinqSending] = useState(false);
  const [linqError, setLinqError] = useState<string | null>(null);

  // Network-level transaction metadata Prava's real session response +
  // card re-verification already return (session_id/order_id/status/
  // expires_at, then brand/last4/enrollmentId from collectPAN's
  // onSuccess) — captured here so the drawer's approved state can show
  // a fuller audit record instead of a plain confirmation line.
  const [pravaTransaction, setPravaTransaction] = useState<PurchaseRequest["pravaTransaction"] | null>(
    request?.pravaTransaction ?? null
  );
  // Holds session_id/order_id/status/expires_at from the initial
  // over-cap-session response until collectPAN's onSuccess supplies the
  // card brand/last4 to complete the record.
  const pendingSessionMetaRef = useRef<{
    sessionId: string;
    orderId?: string;
    status: string;
    expiresAt?: string;
  } | null>(null);

  // Tracks a created-but-not-yet-resolved Prava session so we can
  // revoke it if the approval is abandoned (declined, closed, or the
  // drawer unmounts before the passkey/collectPAN flow finishes).
  const pendingSessionIdRef = useRef<string | null>(null);

  // Cleanup returned by mountCollectPAN — destroys the SDK instance
  // and unmounts its iframe. Must be called on close/unmount or the
  // iframe and its listeners leak.
  const collectCleanupRef = useRef<(() => void) | null>(null);

  // Server-side Stagehand/Browserbase checkout run (POST /api/agent/execute).
  // Only ever offered for requests already at status "approved" — the
  // server independently re-verifies that against the policy engine
  // and the Prava mandate check before it lets Stagehand touch a page.
  const [browserExecution, setBrowserExecution] = useState<BrowserExecutionState>({
    stage: "idle",
    auditLog: [],
  });

  function cleanupCollect() {
    collectCleanupRef.current?.();
    collectCleanupRef.current = null;
  }

  // Reset local state whenever a new request is shown in the drawer.
  // NOTE: keyed only on request.id (not linqStatus) so that an
  // in-flight approval/deny flow isn't wiped out just because the
  // parent's copy of `request.linqStatus` changes for the same request.
  useEffect(() => {
    setNote("");
    setResolved(null);
    setStage("idle");
    setErrorMessage(null);
    setIframeReady(false);
    setDenyConfirm(false);
    setLinqStatus(request?.linqStatus ?? null);
    setLinqSending(false);
    setLinqError(null);
    setPravaTransaction(request?.pravaTransaction ?? null);
    setBrowserExecution({ stage: "idle", auditLog: [] });
    pendingSessionMetaRef.current = null;
    pendingSessionIdRef.current = null;
    cleanupCollect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request?.id]);

  async function handleSendViaLinq() {
    if (!request) return;
    setLinqError(null);
    setLinqSending(true);
    try {
      const res = await fetch("/api/linq/send-approval", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: request.id,
          item: request.item,
          merchant: request.merchant,
          amount: request.amount,
          reason: request.reason,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error ?? "Failed to send approval card via Linq.");
      }
      setLinqStatus("sent");
    } catch (err) {
      setLinqError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLinqSending(false);
    }
  }

  function revokePendingSession() {
    const id = pendingSessionIdRef.current;
    if (!id) return;
    pendingSessionIdRef.current = null;
    // Best-effort — an abandoned session cleaning up isn't worth
    // surfacing an error to the user over.
    fetch(`/api/prava/session/${id}/revoke`, { method: "POST" }).catch(() => {});
  }

  // Revoke on unmount if an approval was left in-flight (drawer closed
  // mid-flow, user navigated away, etc.)
  useEffect(() => {
    return () => {
      revokePendingSession();
      cleanupCollect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request?.id]);

  function handleClose() {
    revokePendingSession();
    cleanupCollect();
    onClose();
  }

  async function handleExecuteInBrowser() {
    if (!request) return;
    const mandate = mandates.find((m) => m.name === request.mandate);

    setBrowserExecution({ stage: "running", auditLog: [] });
    try {
      const res = await fetch("/api/agent/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: request.id,
          agentName: request.agent,
          mandate,
          merchant: request.merchant,
          item: request.item,
          category: request.category,
          amount: request.amount,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setBrowserExecution({
          stage: "error",
          auditLog: data?.auditLog ?? [],
          error: data?.error ?? "Browser execution failed.",
        });
        return;
      }
      setBrowserExecution({
        stage: data.status === "reached_checkout" ? "done" : "error",
        auditLog: data.auditLog ?? [],
        status: data.status,
        finalUrl: data.finalUrl ?? null,
        selectedItem: data.selectedItem ?? null,
        error: data.error ?? null,
      });
    } catch (err) {
      setBrowserExecution({
        stage: "error",
        auditLog: [],
        error: err instanceof Error ? err.message : "Something went wrong.",
      });
    }
  }

  async function handleApprove() {
    if (!request) return;
    setErrorMessage(null);

    const mandate = mandates.find((m) => m.name === request.mandate);
    if (!mandate?.card) {
      setErrorMessage(
        `No linked card found for "${request.mandate}". Link a card on this mandate first.`
      );
      setStage("error");
      return;
    }

    setStage("creating-session");
    setIframeReady(false);
    cleanupCollect();
    try {
      const res = await fetch("/api/prava/over-cap-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // TODO: replace with the real authenticated workspace user.
          userId: "workspace-owner",
          userEmail: "owner@embassy.app",
          totalAmount: request.amount,
          currency: "inr",
          purchaseContext: {
            reference_id: request.id,
            description: request.item,
            amount: request.amount,
          },
          cardEnrollmentId: mandate.card.enrollmentId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data?.detail) console.error("Prava over-cap session error detail:", data.detail);
        throw new Error(data?.error ?? "Failed to create over-cap session.");
      }

      pendingSessionIdRef.current = data.sessionId;
      pendingSessionMetaRef.current = {
        sessionId: data.sessionId,
        orderId: data.orderId ?? undefined,
        status: data.status ?? "created",
        expiresAt: data.expiresAt ?? undefined,
      };
      setStage("collecting");

      requestAnimationFrame(() => {
        if (!collectContainerRef.current) {
          setErrorMessage("Approval container failed to mount.");
          setStage("error");
          return;
        }
        collectCleanupRef.current = mountCollectPAN({
          sessionToken: data.sessionToken,
          iframeUrl: data.iframeUrl,
          container: collectContainerRef.current,
          onReady: () => setIframeReady(true),
          onSuccess: (result) => {
            // Session is consumed — nothing left to revoke.
            pendingSessionIdRef.current = null;
            const sessionMeta = pendingSessionMetaRef.current;
            if (sessionMeta) {
              setPravaTransaction({
                sessionId: sessionMeta.sessionId,
                orderId: sessionMeta.orderId,
                // The session response's own status can lag the actual
                // collection outcome — a completed collectPAN call means
                // the credential was issued and used, so reflect that
                // here even if the session payload still said "created".
                status: "completed",
                expiresAt: sessionMeta.expiresAt,
                cardBrand: result.brand,
                cardLast4: result.last4,
                cardEnrollmentId: result.enrollmentId,
              });
            }
            setResolved("approved");
          },
          onError: (message) => {
            setErrorMessage(message);
            setStage("error");
          },
        });
      });
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Something went wrong."
      );
      setStage("error");
    }
  }

  function handleDecline() {
    if (!denyConfirm) {
      setDenyConfirm(true);
      return;
    }
    revokePendingSession();
    setResolved("denied");
  }

  return (
    <AnimatePresence>
      {request && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
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
                <p className="text-xs uppercase tracking-wide text-muted-soft">{request.id}</p>
                <h2 className="mt-1 font-display text-xl text-ink">{request.item}</h2>
              </div>
              <button onClick={handleClose} className="rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring">
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <StatusBadge status={resolved ?? request.status} />
              {linqStatus && (
                <span
                  title="Pushed to the mandate holder as an interactive iMessage approval card via Linq"
                  className="inline-flex items-center gap-1.5 rounded-full border border-accent-ring/40 bg-accent-ring/10 px-2.5 py-1 text-xs font-medium text-ink"
                >
                  <MessageCircle className="h-3.5 w-3.5" strokeWidth={2.25} />
                  Sent via Linq
                </span>
              )}
            </div>

            <dl className="mt-5 grid grid-cols-2 gap-4 rounded-xl border border-border-soft bg-surface-2 p-4 text-sm">
              <div>
                <dt className="text-xs text-muted-soft">Merchant</dt>
                <dd className="mt-0.5 flex flex-wrap items-center gap-1.5 text-ink">
                  {request.merchant}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-soft">Category</dt>
                <dd className="mt-0.5 text-ink">{request.category}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-soft">Amount</dt>
                <dd className="mono-tabular mt-0.5 text-ink">{formatINR(request.amount)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-soft">Agent</dt>
                <dd className="mt-0.5 text-ink">{request.agent}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-soft">Mandate</dt>
                <dd className="mt-0.5 text-ink">{request.mandate}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-soft">Timestamp</dt>
                <dd className="mt-0.5 text-ink">{formatTimestamp(request.timestamp)}</dd>
              </div>
            </dl>

            <div className="mt-5 rounded-xl border border-border-soft p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-soft">Why this request was flagged</p>
              <p className="mt-2 text-sm text-ink">{request.reason}</p>
            </div>

            <div className="mt-6">
              <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-soft">Decision path</p>
              <ActivityTimeline steps={request.decisionPath} />
            </div>

            {request.status === "approved" &&
              BROWSER_SUPPORTED_MERCHANTS.includes(request.merchant.trim().toLowerCase()) && (
                <div className="mt-6 border-t border-border-soft pt-5">
                  <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-soft">
                    Browser execution
                  </p>

                  {browserExecution.stage === "idle" && (
                    <button
                      onClick={handleExecuteInBrowser}
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-ink px-3 py-2.5 text-sm font-medium text-surface transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring"
                    >
                      <Globe className="h-4 w-4" /> Execute in browser ({request.merchant})
                    </button>
                  )}

                  {browserExecution.stage === "running" && (
                    <div className="flex items-center justify-center gap-2 rounded-lg border border-border-soft bg-surface-2 py-6 text-sm text-muted">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Opening {request.merchant}, searching, and building the cart…
                    </div>
                  )}

                  {(browserExecution.stage === "done" || browserExecution.stage === "error") && (
                    <div className="space-y-3">
                      {browserExecution.stage === "done" && (
                        <div className="flex items-start gap-2 rounded-lg border border-success/25 bg-success/10 p-3 text-sm text-success">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                          <span>
                            Reached checkout for{" "}
                            <span className="font-medium">
                              {browserExecution.selectedItem?.title ?? request.item}
                            </span>
                            {browserExecution.selectedItem?.price && ` (${browserExecution.selectedItem.price})`}.
                            No payment information was entered.
                          </span>
                        </div>
                      )}
                      {browserExecution.stage === "error" && (
                        <div className="flex items-start gap-2 rounded-lg border border-error/30 bg-error/10 p-3 text-sm text-error">
                          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                          <span>{browserExecution.error ?? "Browser execution did not complete."}</span>
                        </div>
                      )}
                      {browserExecution.finalUrl && (
                        <a
                          href={browserExecution.finalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs text-muted underline decoration-border-soft underline-offset-2 hover:text-ink"
                        >
                          <ExternalLink className="h-3.5 w-3.5" /> View checkout page
                        </a>
                      )}
                      {browserExecution.auditLog.length > 0 && (
                        <div className="rounded-lg border border-border-soft bg-surface-2/60 p-3">
                          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-soft">
                            Audit log
                          </p>
                          <ul className="space-y-1.5">
                            {browserExecution.auditLog.map((entry, i) => (
                              <li key={i} className="flex items-start gap-2 text-xs">
                                <span
                                  className={cnResultDot(entry.result)}
                                />
                                <span className="text-ink">{entry.action}</span>
                                <span className="text-muted-soft">— {entry.result}</span>
                                {entry.detail && <span className="text-muted-soft">({entry.detail})</span>}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <button
                        onClick={() => setBrowserExecution({ stage: "idle", auditLog: [] })}
                        className="flex w-full items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-medium text-ink hover:bg-surface-2"
                      >
                        Run again
                      </button>
                    </div>
                  )}
                </div>
              )}

            {showApprovalActions && !resolved && stage === "idle" && (
              <div className="mt-6 border-t border-border-soft pt-5">
                <label className="text-xs font-medium uppercase tracking-wide text-muted-soft">
                  Note (optional)
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add a reason for this decision…"
                  rows={3}
                  className="mt-2 w-full resize-none rounded-lg border border-border bg-bg px-3 py-2 text-sm text-ink placeholder:text-muted-soft focus:outline-none focus:ring-2 focus:ring-accent-ring"
                />
                {denyConfirm ? (
                  <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-error/30 bg-error/10 p-3 text-xs text-error">
                    <span>Deny this request?</span>
                    <div className="flex shrink-0 gap-2">
                      <button
                        onClick={() => setDenyConfirm(false)}
                        className="rounded-md px-2 py-1 font-medium text-ink hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleDecline}
                        className="rounded-md bg-error px-2 py-1 font-medium text-surface hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring"
                      >
                        Confirm deny
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={handleApprove}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-ink px-3 py-2.5 text-sm font-medium text-surface transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring"
                    >
                      <KeyRound className="h-4 w-4" /> Approve with Prava passkey
                    </button>
                    <button
                      onClick={handleDecline}
                      className="flex items-center justify-center gap-2 rounded-lg border border-error/30 px-3 py-2.5 text-sm font-medium text-error transition-colors hover:bg-error/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring"
                    >
                      <ThumbsDown className="h-4 w-4" /> Deny
                    </button>
                  </div>
                )}

                {!linqStatus && (
                  <div className="mt-3">
                    <button
                      onClick={handleSendViaLinq}
                      disabled={linqSending}
                      className="flex w-full items-center justify-center gap-2 rounded-lg border border-border px-3 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring"
                    >
                      {linqSending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <MessageCircle className="h-4 w-4" />
                      )}
                      {linqSending ? "Sending…" : "Also send via Linq (iMessage)"}
                    </button>
                    {linqError && (
                      <p className="mt-2 text-xs text-error">{linqError}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {!resolved && stage === "creating-session" && (
              <div className="mt-6 flex flex-col items-center gap-3 border-t border-border-soft py-8 text-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted" />
                <p className="text-sm text-muted">Starting a secure session…</p>
              </div>
            )}

            {!resolved && stage === "collecting" && (
              <div className="mt-6 border-t border-border-soft pt-5">
                <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-soft">
                  Verify with Prava
                </p>
                <div className="relative min-h-[200px] rounded-xl border border-border-soft bg-surface-2 p-3">
                  {!iframeReady && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin text-muted" />
                      <p className="text-xs text-muted">Loading secure verification…</p>
                    </div>
                  )}
                  <div ref={collectContainerRef} className="h-full" />
                </div>
                <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-soft">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Re-verifying the linked card — no need to re-enter card details.
                </p>
              </div>
            )}

            {!resolved && stage === "error" && (
              <div className="mt-6 space-y-3 border-t border-border-soft pt-5">
                <div className="flex items-start gap-2 rounded-lg border border-error/30 bg-error/10 p-3 text-sm text-error">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleApprove}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-border px-3 py-2.5 text-sm font-medium text-ink hover:bg-surface-2"
                  >
                    Try again
                  </button>
                  <button
                    onClick={() => {
                      revokePendingSession();
                      setResolved("denied");
                    }}
                    className="flex items-center justify-center gap-2 rounded-lg border border-error/30 px-3 py-2.5 text-sm font-medium text-error transition-colors hover:bg-error/10"
                  >
                    <ThumbsDown className="h-4 w-4" /> Decline
                  </button>
                </div>
              </div>
            )}

            {resolved === "approved" && (
              <div className="mt-6 space-y-3">
                <div className="flex items-start gap-2 rounded-lg border border-success/25 bg-success/10 p-3 text-sm text-success">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    Approved — <span className="font-medium">{formatINR(request.amount)}</span> at{" "}
                    {request.merchant}. An audit receipt has been created.
                  </span>
                </div>
                <AuditReceipt
                  request={{
                    ...request,
                    status: "approved",
                    pravaTransaction: pravaTransaction ?? request.pravaTransaction,
                  }}
                />
              </div>
            )}

            {resolved === "denied" && (
              <div className="mt-6 flex items-start gap-2 rounded-lg border border-border-soft bg-surface-2 p-3 text-sm text-muted">
                <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-muted-soft" />
                <span>
                  Denied — <span className="font-medium text-ink">{formatINR(request.amount)}</span> at{" "}
                  {request.merchant}. An audit receipt has been created.
                </span>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
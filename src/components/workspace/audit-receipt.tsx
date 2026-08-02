import { FileCheck2, CreditCard, Network, BadgeCheck, ShieldQuestion } from "lucide-react";
import { agents, PurchaseRequest } from "@/lib/mock-data";
import { StatusBadge } from "./status-badge";
import { formatINR, formatTimestamp } from "@/lib/utils";

function truncateId(id: string, keep = 6) {
  return id.length > keep + 3 ? `${id.slice(0, keep)}…` : id;
}

/*
 * Nanda agent-id lookup for this receipt's requesting agent.
 * ⚠️ STUBBED — nandaAgentId/verifiedIdentity come from the (stubbed)
 * Nanda registry resolve step in src/lib/nanda/client.ts, surfaced here
 * on the AppAgent record (src/lib/mock-data.ts) rather than re-fetched
 * per receipt.
 */
function NandaIdentityBadge({ verified, nandaAgentId }: { verified: boolean; nandaAgentId?: string }) {
  if (verified) {
    return (
      <span
        title={`Resolved via Nanda (stubbed)${nandaAgentId ? `: ${nandaAgentId}` : ""}`}
        className="inline-flex items-center gap-1 rounded-full border border-success/25 bg-success/10 px-2 py-0.5 text-[11px] font-medium text-success"
      >
        <BadgeCheck className="h-3 w-3" strokeWidth={2.25} />
        Nanda-verified
      </span>
    );
  }

  return (
    <span
      title="Not resolved against the (stubbed) Nanda registry"
      className="inline-flex items-center gap-1 rounded-full border border-border bg-surface-2 px-2 py-0.5 text-[11px] font-medium text-muted-soft"
    >
      <ShieldQuestion className="h-3 w-3" strokeWidth={2.25} />
      Nanda unverified
    </span>
  );
}

export function AuditReceipt({ request }: { request: PurchaseRequest }) {
  const reachedPrava = request.decisionPath.some(
    (s) => s.label === "Prava Mandate Check" && s.status !== "skipped"
  );
  const prava = request.pravaTransaction;

  // Nanda resolves the *originating agent's* identity, not the purchase
  // itself — so this receipt looks it up off the AppAgent record by name
  // rather than duplicating a per-request copy of the same id.
  const agentRecord = agents.find((a) => a.name === request.agent);
  const nandaVerified = agentRecord?.verifiedIdentity ?? false;
  const nandaAgentId = agentRecord?.nandaAgentId;

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-muted-soft">
            <FileCheck2 className="h-4 w-4" />
          </div>
          <div>
            <p className="font-mono text-xs text-muted-soft">{request.id}</p>
            <p className="mt-0.5 font-medium text-ink">{request.item}</p>
            <p className="mt-0.5 text-xs text-muted">
              {request.agent} · {request.merchant} · {request.category}
            </p>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="mono-tabular font-medium text-ink">{formatINR(request.amount)}</p>
          <p className="mt-1 text-xs text-muted-soft">{formatTimestamp(request.timestamp)}</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <StatusBadge status={request.status} />
        <span className="rounded-full border border-border-soft bg-surface-2 px-2 py-0.5 text-[11px] text-muted">
          Mandate: {request.mandate}
        </span>
        <NandaIdentityBadge verified={nandaVerified} nandaAgentId={nandaAgentId} />
        {!reachedPrava && (
          <span className="rounded-full border border-border-soft bg-surface-2 px-2 py-0.5 text-[11px] text-muted-soft">
            Never reached Prava or the card network
          </span>
        )}
      </div>

      <p className="mt-3 text-xs text-muted">{request.reason}</p>

      {agentRecord && (
        <div className="mt-3 rounded-lg border border-border-soft bg-surface-2/60 p-3">
          <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-soft">
            <Network className="h-3.5 w-3.5" />
            Agent identity
            <span className="normal-case tracking-normal text-muted-soft/70">(Nanda, stubbed)</span>
          </p>
          <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs sm:grid-cols-3">
            <div>
              <dt className="text-muted-soft">Requesting agent</dt>
              <dd className="mt-0.5 text-ink">{request.agent}</dd>
            </div>
            <div>
              <dt className="text-muted-soft">Nanda agent ID</dt>
              <dd className="mono-tabular mt-0.5 text-ink" title={nandaAgentId}>
                {nandaAgentId ? truncateId(nandaAgentId) : "Not resolved"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-soft">Identity verified</dt>
              <dd className="mt-0.5 text-ink">{nandaVerified ? "Yes, via Nanda" : "No"}</dd>
            </div>
          </dl>
        </div>
      )}

      {prava && (
        <div className="mt-3 rounded-lg border border-border-soft bg-surface-2/60 p-3">
          <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-soft">
            <CreditCard className="h-3.5 w-3.5" />
            Network transaction details
          </p>
          <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs sm:grid-cols-3">
            <div>
              <dt className="text-muted-soft">Card</dt>
              <dd className="mono-tabular mt-0.5 capitalize text-ink">
                {prava.cardBrand} •••• {prava.cardLast4}
              </dd>
            </div>
            <div>
              <dt className="text-muted-soft">Prava session</dt>
              <dd className="mono-tabular mt-0.5 text-ink" title={prava.sessionId}>
                {truncateId(prava.sessionId)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-soft">Network status</dt>
              <dd className="mt-0.5 capitalize text-ink">{prava.status}</dd>
            </div>
            {prava.orderId && (
              <div>
                <dt className="text-muted-soft">Order ID</dt>
                <dd className="mono-tabular mt-0.5 text-ink" title={prava.orderId}>
                  {truncateId(prava.orderId)}
                </dd>
              </div>
            )}
            <div>
              <dt className="text-muted-soft">Enrollment</dt>
              <dd className="mono-tabular mt-0.5 text-ink" title={prava.cardEnrollmentId}>
                {truncateId(prava.cardEnrollmentId)}
              </dd>
            </div>
            {prava.expiresAt && (
              <div>
                <dt className="text-muted-soft">Credential expires</dt>
                <dd className="mt-0.5 text-ink">{formatTimestamp(prava.expiresAt)}</dd>
              </div>
            )}
          </dl>
        </div>
      )}
    </div>
  );
}
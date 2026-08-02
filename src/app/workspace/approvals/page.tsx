"use client";

import { useState } from "react";
import { WorkspaceHeader } from "@/components/workspace/workspace-header";
import { ApprovalDrawer } from "@/components/workspace/approval-drawer";
import { purchaseRequests, PurchaseRequest } from "@/lib/mock-data";
import { formatINR, formatTimestamp } from "@/lib/utils";
import { AlertTriangle, Bot, Store, ChevronRight, MessageCircle } from "lucide-react";

export default function ApprovalsPage() {
  const [selected, setSelected] = useState<PurchaseRequest | null>(null);

  const queue = [...purchaseRequests]
    .filter((r) => r.status === "escalated")
    .sort((a, b) => Number(b.urgent) - Number(a.urgent) || b.amount - a.amount);

  return (
    <div>
      <WorkspaceHeader
        title="Approval Center"
        description={`${queue.length} request${queue.length === 1 ? "" : "s"} waiting on a human decision.`}
      />
      <div className="px-6 py-6 lg:px-8">
        {queue.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted">
            Nothing to review — the queue is clear.
          </div>
        ) : (
          <div className="space-y-3">
            {queue.map((r) => (
              <button
                key={r.id}
                onClick={() => setSelected(r)}
                className="flex w-full items-center gap-4 rounded-xl border border-warning/25 bg-warning/5 p-4 text-left transition-colors hover:bg-warning/10"
              >
                {r.urgent && (
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-warning/15 text-warning">
                    <AlertTriangle className="h-4 w-4" />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium text-ink">{r.item}</p>
                    {r.urgent && (
                      <span className="rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-semibold text-warning">
                        URGENT
                      </span>
                    )}
                    {r.linqStatus && (
                      <span
                        title="Pushed to the mandate holder as an interactive iMessage approval card via Linq"
                        className="inline-flex items-center gap-1 rounded-full border border-accent-ring/40 bg-accent-ring/10 px-2 py-0.5 text-[10px] font-semibold text-ink"
                      >
                        <MessageCircle className="h-2.5 w-2.5" strokeWidth={2.5} />
                        Sent via Linq
                      </span>
                    )}
                  </div>
                  <p className="mt-1 truncate text-xs text-muted">{r.reason}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-soft">
                    <span className="flex items-center gap-1"><Store className="h-3 w-3" /> {r.merchant}</span>
                    <span className="flex items-center gap-1"><Bot className="h-3 w-3" /> {r.agent}</span>
                    <span>{formatTimestamp(r.timestamp)}</span>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="mono-tabular font-medium text-ink">{formatINR(r.amount)}</p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-soft" />
              </button>
            ))}
          </div>
        )}
      </div>
      <ApprovalDrawer request={selected} onClose={() => setSelected(null)} showApprovalActions />
    </div>
  );
}

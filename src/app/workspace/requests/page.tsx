"use client";

import { useMemo, useState } from "react";
import { WorkspaceHeader } from "@/components/workspace/workspace-header";
import { PurchaseRequestCard } from "@/components/workspace/purchase-request-card";
import { ApprovalDrawer } from "@/components/workspace/approval-drawer";
import { NewRequestPanel } from "@/components/workspace/new-request-panel";
import { purchaseRequests, mandates as seedMandates, RequestStatus, Mandate } from "@/lib/mock-data";
import { Search, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { PurchaseRequest } from "@/lib/mock-data";

const filters: { label: string; value: RequestStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Approved", value: "approved" },
  { label: "Escalated", value: "escalated" },
  { label: "Blocked", value: "blocked" },
  { label: "Pending", value: "pending" },
];

export default function RequestsPage() {
  const [filter, setFilter] = useState<RequestStatus | "all">("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<PurchaseRequest | null>(null);
  const [newRequestOpen, setNewRequestOpen] = useState(false);

  // Live-created requests + the mandate spend they consume both live in
  // client state — this app has no database. `liveMandates` starts as a
  // copy of the seed data and is the copy actually sent to the policy
  // engine for evaluation, so a request approved earlier in the same
  // session genuinely counts against the next one's daily limit.
  const [liveRequests, setLiveRequests] = useState<PurchaseRequest[]>([]);
  const [liveMandates, setLiveMandates] = useState<Mandate[]>(() => seedMandates.map((m) => ({ ...m })));

  const allRequests = useMemo(
    () => [...liveRequests, ...purchaseRequests],
    [liveRequests]
  );

  function handleCreated(request: PurchaseRequest) {
    setLiveRequests((prev) => [request, ...prev]);
    if (request.status === "approved") {
      setLiveMandates((prev) =>
        prev.map((m) => (m.name === request.mandate ? { ...m, spentToday: m.spentToday + request.amount } : m))
      );
    }
  }

  const filtered = useMemo(() => {
    return allRequests
      .filter((r) => filter === "all" || r.status === filter)
      .filter((r) =>
        query.trim() === ""
          ? true
          : [r.item, r.merchant, r.agent, r.category].some((v) => v.toLowerCase().includes(query.toLowerCase()))
      )
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [allRequests, filter, query]);

  return (
    <div>
      <WorkspaceHeader
        title="Purchase Requests"
        description="Every proposed AI-agent purchase, from request to outcome."
        actions={
          <button
            onClick={() => setNewRequestOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-ink px-3 py-1.5 text-sm font-medium text-surface transition-opacity hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> New request
          </button>
        }
      />
      <div className="px-6 py-6 lg:px-8">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap gap-1.5">
            {filters.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  filter === f.value
                    ? "border-ink bg-ink text-surface"
                    : "border-border bg-surface text-muted hover:text-ink"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm">
            <Search className="h-4 w-4 text-muted-soft" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search merchant, agent, item…"
              className="w-48 bg-transparent text-ink placeholder:text-muted-soft focus:outline-none"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted">
            No requests match this filter.
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((r) => (
              <PurchaseRequestCard key={r.id} request={r} onClick={() => setSelected(r)} />
            ))}
          </div>
        )}
      </div>
      <ApprovalDrawer request={selected} onClose={() => setSelected(null)} />
      <NewRequestPanel
        open={newRequestOpen}
        onClose={() => setNewRequestOpen(false)}
        mandates={liveMandates}
        onCreated={handleCreated}
      />
    </div>
  );
}


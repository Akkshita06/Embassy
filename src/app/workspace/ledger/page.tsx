"use client";

import { useMemo, useState } from "react";
import { WorkspaceHeader } from "@/components/workspace/workspace-header";
import { AuditReceipt } from "@/components/workspace/audit-receipt";
import { purchaseRequests, RequestStatus } from "@/lib/mock-data";
import { Search, Download } from "lucide-react";
import { cn } from "@/lib/utils";

const filters: { label: string; value: RequestStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Approved", value: "approved" },
  { label: "Escalated", value: "escalated" },
  { label: "Blocked", value: "blocked" },
  { label: "Pending", value: "pending" },
];

export default function LedgerPage() {
  const [filter, setFilter] = useState<RequestStatus | "all">("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    return purchaseRequests
      .filter((r) => filter === "all" || r.status === filter)
      .filter((r) =>
        query.trim() === "" ? true : [r.id, r.item, r.merchant, r.agent].some((v) => v.toLowerCase().includes(query.toLowerCase()))
      )
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [filter, query]);

  return (
    <div>
      <WorkspaceHeader
        title="Audit Ledger"
        description="A signed, queryable record of every decision — including attempts that never reached Prava."
        actions={
          <button className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-muted hover:text-ink">
            <Download className="h-4 w-4" /> Export
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
                  filter === f.value ? "border-ink bg-ink text-surface" : "border-border bg-surface text-muted hover:text-ink"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
          <input type="date" className="rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs text-muted" />
          <span className="text-xs text-muted-soft">to</span>
          <input type="date" className="rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs text-muted" />
          <div className="ml-auto flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm">
            <Search className="h-4 w-4 text-muted-soft" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search request ID, merchant…"
              className="w-48 bg-transparent text-ink placeholder:text-muted-soft focus:outline-none"
            />
          </div>
        </div>

        <div className="space-y-2.5">
          {filtered.map((r) => (
            <AuditReceipt key={r.id} request={r} />
          ))}
        </div>
      </div>
    </div>
  );
}

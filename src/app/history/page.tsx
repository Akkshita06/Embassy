"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { Panel } from "@/components/panel";
import { StatusDot } from "@/components/seal";
import { transactions, TxStatus } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const filters: { label: string; value: TxStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Approved", value: "approved" },
  { label: "Escalated", value: "escalated" },
  { label: "Denied", value: "denied" },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function HistoryPage() {
  const [filter, setFilter] = useState<TxStatus | "all">("all");
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    return transactions.filter((t) => {
      const matchesFilter = filter === "all" || t.status === filter;
      const matchesQuery =
        query.trim() === "" ||
        t.item.toLowerCase().includes(query.toLowerCase()) ||
        t.merchant.toLowerCase().includes(query.toLowerCase());
      return matchesFilter && matchesQuery;
    });
  }, [filter, query]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8 flex flex-col gap-1">
        <p className="text-xs uppercase tracking-[0.2em] text-muted">Ledger</p>
        <h1 className="font-display text-3xl">Transaction history</h1>
      </div>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1.5">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                "relative rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                filter === f.value ? "text-ink" : "text-muted hover:text-ink"
              )}
            >
              {filter === f.value && (
                <motion.span
                  layoutId="history-filter-active"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  className="absolute inset-0 rounded-lg bg-surface-2"
                />
              )}
              <span className="relative z-10">{f.label}</span>
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-soft" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search item or merchant…"
            className="w-full rounded-lg border border-border-soft bg-surface px-8 py-2 text-sm outline-none placeholder:text-muted-soft focus:border-brass/50"
          />
        </div>
      </div>

      <Panel className="overflow-hidden">
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-4 border-b border-border-soft px-5 py-3 text-xs uppercase tracking-wider text-muted-soft">
          <span>Item</span>
          <span>Merchant</span>
          <span>Amount</span>
          <span>Status</span>
          <span>When</span>
        </div>
        <div>
          {rows.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] items-center gap-4 border-b border-border-soft/60 px-5 py-3.5 text-sm transition-colors hover:bg-surface-2/40 last:border-0"
            >
              <div>
                <div className="text-ink">{t.item}</div>
                <div className="text-xs text-muted-soft">{t.agent} · {t.id}</div>
              </div>
              <span className="text-muted">{t.merchant}</span>
              <span className="mono-tabular">₹{t.amount.toLocaleString("en-IN")}</span>
              <span className="flex items-center gap-2 capitalize">
                <StatusDot status={t.status} />
                {t.status}
              </span>
              <span className="text-xs text-muted">{formatDate(t.timestamp)}</span>
            </motion.div>
          ))}
          {rows.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-3 px-5 py-16 text-center"
            >
              <div className="rounded-full border border-border-soft bg-surface-2 p-3 text-muted-soft">
                <Search className="h-5 w-5" />
              </div>
              <p className="text-sm text-muted">No transactions match your filters.</p>
              <button
                onClick={() => {
                  setFilter("all");
                  setQuery("");
                }}
                className="text-xs font-medium text-brass hover:underline"
              >
                Clear filters
              </button>
            </motion.div>
          )}
        </div>
      </Panel>
    </div>
  );
}

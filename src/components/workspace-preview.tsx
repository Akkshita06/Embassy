"use client";

import { motion } from "framer-motion";
import { ShieldCheck, AlertTriangle, FileCheck2, CalendarDays, ArrowRight } from "lucide-react";

const requestsPreview = [
  { item: "Stock Photo License", merchant: "Shutterstock", amount: "₹11,499", status: "approved" as const },
  { item: "SEO Tool Renewal", merchant: "Ahrefs", amount: "₹8,300", status: "escalated" as const },
  { item: "Logo Design Package", merchant: "99designs", amount: "₹18,000", status: "blocked" as const },
];

const calendarPreview = [
  { day: "01", label: "Mandate expires" },
  { day: "03", label: "SEO renewal" },
  { day: "10", label: "Budget review" },
];

const statusStyle = {
  approved: "text-success bg-success/10 border-success/25",
  escalated: "text-warning bg-warning/10 border-warning/25",
  blocked: "text-error bg-error/10 border-error/25",
};

export function WorkspacePreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="w-full max-w-4xl rounded-2xl border border-border bg-surface p-3 shadow-[0_20px_60px_-30px_rgba(20,20,20,0.25)] md:p-4"
    >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {/* Purchase Requests panel */}
        <div className="rounded-xl border border-border-soft bg-bg p-4 md:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-soft">
              <ShieldCheck className="h-3.5 w-3.5" /> Purchase Requests
            </p>
            <span className="text-[11px] text-muted-soft">Live</span>
          </div>
          <div className="space-y-2">
            {requestsPreview.map((r) => (
              <div
                key={r.item}
                className="flex items-center justify-between rounded-lg border border-border-soft bg-surface px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm text-ink">{r.item}</p>
                  <p className="truncate text-[11px] text-muted-soft">{r.merchant}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="mono-tabular text-xs text-ink">{r.amount}</span>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize ${statusStyle[r.status]}`}>
                    {r.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right column: Approval Center + Calendar stacked */}
        <div className="flex flex-col gap-3">
          <div className="rounded-xl border border-border-soft bg-bg p-4">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-soft">
              <AlertTriangle className="h-3.5 w-3.5" /> Approval Center
            </p>
            <div className="rounded-lg border border-warning/25 bg-warning/5 p-2.5">
              <p className="text-xs text-ink">Meta Ads top-up</p>
              <p className="mt-0.5 text-[11px] text-muted-soft">Exceeds per-charge limit</p>
            </div>
            <p className="mt-2 text-[11px] text-muted-soft">2 requests waiting</p>
          </div>

          <div className="rounded-xl border border-border-soft bg-bg p-4">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-soft">
              <CalendarDays className="h-3.5 w-3.5" /> Calendar
            </p>
            <div className="space-y-1.5">
              {calendarPreview.map((c) => (
                <div key={c.day} className="flex items-center gap-2 text-xs">
                  <span className="mono-tabular flex h-5 w-7 shrink-0 items-center justify-center rounded bg-surface-2 text-[10px] text-muted">
                    {c.day}
                  </span>
                  <span className="truncate text-muted">{c.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Audit Ledger strip */}
      <div className="mt-3 flex items-center justify-between rounded-xl border border-border-soft bg-bg px-4 py-2.5">
        <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-soft">
          <FileCheck2 className="h-3.5 w-3.5" /> Audit Ledger — every attempt recorded, signed, and queryable
        </p>
        <span className="flex items-center gap-1 text-[11px] text-muted-soft">
          View ledger <ArrowRight className="h-3 w-3" />
        </span>
      </div>
    </motion.div>
  );
}

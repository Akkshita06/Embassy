"use client";

import { Pause, Play, Pencil, Ban, Store, CreditCard } from "lucide-react";
import { Mandate } from "@/lib/mock-data";
import { formatINR } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function MandateCard({ mandate }: { mandate: Mandate }) {
  const remaining = Math.max(mandate.dailyLimit - mandate.spentToday, 0);
  const pctUsed = mandate.dailyLimit > 0
    ? Math.min(Math.round((mandate.spentToday / mandate.dailyLimit) * 100), 100)
    : 0;

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-ink">{mandate.name}</p>
          <p className="mt-0.5 text-xs text-muted">{mandate.category}</p>
        </div>
        <span
          className={cn(
            "rounded-full border px-2 py-0.5 text-[11px] font-medium",
            mandate.status === "active"
              ? "border-success/25 bg-success/10 text-success"
              : "border-border bg-surface-2 text-muted"
          )}
        >
          {mandate.status === "active" ? "Active" : "Paused"}
        </span>
      </div>

      <div className="mt-4 space-y-2 text-sm">
        <div className="flex items-center justify-between text-muted">
          <span>Linked card</span>
          {mandate.card ? (
            <span className="flex items-center gap-1.5 text-ink">
              <CreditCard className="h-3.5 w-3.5 text-muted" />
              <span className="capitalize">{mandate.card.brand}</span>
              <span className="mono-tabular">•••• {mandate.card.last4}</span>
            </span>
          ) : (
            <span className="text-muted-soft">Not linked</span>
          )}
        </div>
        <div className="flex items-center justify-between text-muted">
          <span>Daily limit</span>
          <span className="mono-tabular text-ink">{formatINR(mandate.dailyLimit)}</span>
        </div>
        <div className="flex items-center justify-between text-muted">
          <span>Per-charge limit</span>
          <span className="mono-tabular text-ink">{formatINR(mandate.perChargeLimit)}</span>
        </div>
        <div className="flex items-center justify-between text-muted">
          <span>Remaining today</span>
          <span className="mono-tabular text-ink">{formatINR(remaining)}</span>
        </div>
      </div>

      <div className="mt-3">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
          <div className="h-full rounded-full bg-ink" style={{ width: `${pctUsed}%` }} />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-1.5">
        {mandate.merchants.map((m) => (
          <span key={m.name} className="flex items-center gap-1.5 rounded-full border border-border-soft bg-surface-2 px-2 py-0.5 text-[11px] text-muted">
            <span className="flex items-center gap-1">
              <Store className="h-3 w-3" /> {m.name}
            </span>
          </span>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-1 border-t border-border-soft pt-3">
        <button className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-muted hover:bg-surface-2 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring">
          <Pencil className="h-3.5 w-3.5" /> Edit
        </button>
        <button className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-muted hover:bg-surface-2 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring">
          {mandate.status === "active" ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          {mandate.status === "active" ? "Pause" : "Resume"}
        </button>
        <button className="ml-auto flex items-center gap-1.5 rounded-lg border border-error/30 px-2.5 py-1.5 text-xs text-error hover:bg-error/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring">
          <Ban className="h-3.5 w-3.5" /> Revoke
        </button>
      </div>
    </div>
  );
}
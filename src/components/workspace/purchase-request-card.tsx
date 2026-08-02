"use client";

import { Bot, Store, Tag, Clock } from "lucide-react";
import { PurchaseRequest } from "@/lib/mock-data";
import { StatusBadge } from "./status-badge";
import { formatINR, formatTimestamp } from "@/lib/utils";

export function PurchaseRequestCard({
  request,
  onClick,
}: {
  request: PurchaseRequest;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-xl border border-border bg-surface p-4 text-left transition-all hover:border-border-soft hover:shadow-[0_6px_20px_-12px_rgba(20,20,20,0.25)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium text-ink">{request.item}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
            <span className="flex items-center gap-1.5">
              <span className="flex items-center gap-1"><Store className="h-3 w-3" /> {request.merchant}</span>
            </span>
            <span className="flex items-center gap-1"><Tag className="h-3 w-3" /> {request.category}</span>
            <span className="flex items-center gap-1"><Bot className="h-3 w-3" /> {request.agent}</span>
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {formatTimestamp(request.timestamp)}</span>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="mono-tabular font-medium text-ink">{formatINR(request.amount)}</p>
          <div className="mt-1.5">
            <StatusBadge status={request.status} />
          </div>
        </div>
      </div>
    </button>
  );
}
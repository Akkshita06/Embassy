"use client";

import { useState } from "react";
import { PurchaseRequest } from "@/lib/mock-data";
import { PurchaseRequestCard } from "@/components/workspace/purchase-request-card";
import { ApprovalDrawer } from "@/components/workspace/approval-drawer";

export function PurchaseRequestCardList({ requests }: { requests: PurchaseRequest[] }) {
  const [selected, setSelected] = useState<PurchaseRequest | null>(null);

  if (requests.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted">
        No purchase requests to show.
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {requests.map((r) => (
          <PurchaseRequestCard key={r.id} request={r} onClick={() => setSelected(r)} />
        ))}
      </div>
      <ApprovalDrawer request={selected} onClose={() => setSelected(null)} />
    </>
  );
}

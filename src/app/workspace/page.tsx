import { WorkspaceHeader } from "@/components/workspace/workspace-header";
import { PurchaseRequestCardList } from "./_components/purchase-request-card-list";
import { purchaseRequests, mandates } from "@/lib/mock-data";
import { formatINR } from "@/lib/utils";
import { ShieldCheck, AlertTriangle, ShieldOff, ScrollText, Wallet } from "lucide-react";

export default function OverviewPage() {
  const approved = purchaseRequests.filter((r) => r.status === "approved").length;
  const escalated = purchaseRequests.filter((r) => r.status === "escalated").length;
  const blocked = purchaseRequests.filter((r) => r.status === "blocked").length;
  const activeMandates = mandates.filter((m) => m.status === "active").length;
  const spend = purchaseRequests
    .filter((r) => r.status === "approved")
    .reduce((sum, r) => sum + r.amount, 0);

  const stats = [
    { label: "Total attempts", value: purchaseRequests.length, icon: ScrollText },
    { label: "Approved", value: approved, icon: ShieldCheck, tone: "success" },
    { label: "Escalated", value: escalated, icon: AlertTriangle, tone: "warning" },
    { label: "Blocked", value: blocked, icon: ShieldOff, tone: "error" },
    { label: "Active mandates", value: activeMandates, icon: ScrollText },
    { label: "Spend under management", value: formatINR(spend), icon: Wallet },
  ];

  const recent = [...purchaseRequests]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);

  return (
    <div>
      <WorkspaceHeader
        title="Overview"
        description="Every AI-agent purchase is evaluated before money moves, and every attempt is recorded."
      />
      <div className="px-6 py-6 lg:px-8">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-surface p-4">
              <s.icon className="h-4 w-4 text-muted-soft" />
              <p className="mono-tabular mt-3 text-xl font-medium text-ink">{s.value}</p>
              <p className="mt-1 text-xs text-muted">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg text-ink">Recent activity</h2>
            <a href="/workspace/requests" className="text-xs text-muted hover:text-ink">
              View all requests →
            </a>
          </div>
          <PurchaseRequestCardList requests={recent} />
        </div>
      </div>
    </div>
  );
}

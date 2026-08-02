import { Bot, BadgeCheck, ShieldQuestion } from "lucide-react";
import { AppAgent } from "@/lib/mock-data";
import { formatINR, cn } from "@/lib/utils";

const statusColor: Record<AppAgent["status"], string> = {
  active: "text-success bg-success/10 border-success/25",
  idle: "text-muted bg-surface-2 border-border",
  suspended: "text-error bg-error/10 border-error/25",
};

/*
 * ⚠️ STUBBED — verifiedIdentity comes from the (stubbed) Nanda registry
 * resolve step in src/lib/nanda/client.ts, not a real Nanda API yet.
 */
function NandaVerifiedBadge({ agent }: { agent: AppAgent }) {
  if (agent.verifiedIdentity) {
    return (
      <span
        title={`Resolved via Nanda (stubbed)${agent.nandaAgentId ? `: ${agent.nandaAgentId}` : ""}`}
        className="inline-flex items-center gap-1 rounded-full border border-success/25 bg-success/10 px-2 py-0.5 text-[11px] font-medium text-success"
      >
        <BadgeCheck className="h-3 w-3" strokeWidth={2.25} />
        Nanda-verified
      </span>
    );
  }

  return (
    <span
      title="Not yet resolved against the (stubbed) Nanda registry"
      className="inline-flex items-center gap-1 rounded-full border border-border bg-surface-2 px-2 py-0.5 text-[11px] font-medium text-muted-soft"
    >
      <ShieldQuestion className="h-3 w-3" strokeWidth={2.25} />
      Unverified
    </span>
  );
}

export function AgentSummaryCard({ agent }: { agent: AppAgent }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-2 text-ink">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <p className="font-medium text-ink">{agent.name}</p>
            <p className="text-xs text-muted">{agent.role}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span className={cn("rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize", statusColor[agent.status])}>
            {agent.status}
          </span>
          <NandaVerifiedBadge agent={agent} />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-muted-soft">Total attempts</p>
          <p className="mono-tabular mt-0.5 text-ink">{agent.totalAttempts}</p>
        </div>
        <div>
          <p className="text-xs text-muted-soft">Approval rate</p>
          <p className="mono-tabular mt-0.5 text-ink">{Math.round(agent.approvalRate * 100)}%</p>
        </div>
        <div>
          <p className="text-xs text-muted-soft">Blocked attempts</p>
          <p className="mono-tabular mt-0.5 text-ink">{agent.blockedAttempts}</p>
        </div>
        <div>
          <p className="text-xs text-muted-soft">Spend under mgmt</p>
          <p className="mono-tabular mt-0.5 text-ink">{formatINR(agent.spend)}</p>
        </div>
      </div>
    </div>
  );
}

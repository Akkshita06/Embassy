"use client";

import { useState } from "react";
import { WorkspaceHeader } from "@/components/workspace/workspace-header";
import { AgentSummaryCard } from "@/components/workspace/agent-summary-card";
import { AuditReceipt } from "@/components/workspace/audit-receipt";
import { agents, purchaseRequests } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export default function AgentsPage() {
  const [selectedAgent, setSelectedAgent] = useState(agents[0].name);
  const agentRequests = purchaseRequests
    .filter((r) => r.agent === selectedAgent)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div>
      <WorkspaceHeader title="Agent Activity" description="Monitor what each AI agent is doing on your behalf." />
      <div className="px-6 py-6 lg:px-8">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {agents.map((a) => (
            <button
              key={a.id}
              onClick={() => setSelectedAgent(a.name)}
              className={cn(
                "rounded-xl text-left transition-shadow",
                selectedAgent === a.name && "ring-2 ring-ink ring-offset-2 ring-offset-bg"
              )}
            >
              <AgentSummaryCard agent={a} />
            </button>
          ))}
        </div>

        <div className="mt-8">
          <h2 className="mb-3 font-display text-lg text-ink">{selectedAgent} — activity timeline</h2>
          {agentRequests.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted">
              No recorded activity for this agent yet.
            </div>
          ) : (
            <div className="space-y-2.5">
              {agentRequests.map((r) => (
                <AuditReceipt key={r.id} request={r} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

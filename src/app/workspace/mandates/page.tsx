"use client";

import { useState } from "react";
import { WorkspaceHeader } from "@/components/workspace/workspace-header";
import { MandateCard } from "@/components/workspace/mandate-card";
import { CardLinkPanel } from "@/components/workspace/card-link-panel";
import { mandates as initialMandates, Mandate } from "@/lib/mock-data";
import { Plus } from "lucide-react";

export default function MandatesPage() {
  const [mandates, setMandates] = useState<Mandate[]>(initialMandates);
  const [panelOpen, setPanelOpen] = useState(false);

  function handleLinked(mandate: Mandate) {
    setMandates((prev) => [mandate, ...prev]);
  }

  return (
    <div>
      <WorkspaceHeader
        title="Mandates"
        description="The rules that define what each agent may buy, from whom, and how much."
        actions={
          <button
            onClick={() => setPanelOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-ink px-3 py-1.5 text-sm font-medium text-surface hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> New mandate
          </button>
        }
      />
      <div className="px-6 py-6 lg:px-8">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {mandates.map((m) => (
            <MandateCard key={m.id} mandate={m} />
          ))}
        </div>
      </div>

      <CardLinkPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        onLinked={handleLinked}
      />
    </div>
  );
}

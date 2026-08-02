"use client";

import { useState } from "react";
import { WorkspaceHeader } from "@/components/workspace/workspace-header";
import { TaskRow } from "@/components/workspace/task-row";
import { tasks, WorkspaceTask } from "@/lib/mock-data";
import { formatDate, cn } from "@/lib/utils";
import { Plus } from "lucide-react";

const columns: { key: WorkspaceTask["status"]; label: string }[] = [
  { key: "todo", label: "To do" },
  { key: "in-progress", label: "In progress" },
  { key: "done", label: "Done" },
];

export default function TasksPage() {
  const [view, setView] = useState<"list" | "board">("list");

  return (
    <div>
      <WorkspaceHeader
        title="Tasks"
        description="Governance and operational work — renewals, approvals, and mandate upkeep."
        actions={
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-border bg-surface p-0.5 text-xs">
              {(["list", "board"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={cn(
                    "rounded-md px-2.5 py-1 capitalize transition-colors",
                    view === v ? "bg-ink text-surface" : "text-muted hover:text-ink"
                  )}
                >
                  {v}
                </button>
              ))}
            </div>
            <button className="flex items-center gap-1.5 rounded-lg bg-ink px-3 py-1.5 text-sm font-medium text-surface hover:opacity-90">
              <Plus className="h-4 w-4" /> New task
            </button>
          </div>
        }
      />
      <div className="px-6 py-6 lg:px-8">
        {view === "list" ? (
          <div className="space-y-2">
            {tasks.map((t) => (
              <TaskRow key={t.id} task={t} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {columns.map((col) => (
              <div key={col.key} className="rounded-xl border border-border bg-surface-2 p-3">
                <p className="mb-3 flex items-center justify-between text-xs font-medium uppercase tracking-wide text-muted-soft">
                  {col.label}
                  <span className="rounded-full bg-surface px-1.5 text-[10px]">
                    {tasks.filter((t) => t.status === col.key).length}
                  </span>
                </p>
                <div className="space-y-2">
                  {tasks
                    .filter((t) => t.status === col.key)
                    .map((t) => (
                      <div key={t.id} className="rounded-lg border border-border bg-surface p-3">
                        <p className="text-sm text-ink">{t.title}</p>
                        <div className="mt-2 flex items-center justify-between text-[11px] text-muted-soft">
                          <span className="capitalize">{t.priority} priority</span>
                          <span>{formatDate(t.dueDate)}</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

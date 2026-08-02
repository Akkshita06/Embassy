import { WorkspaceTask } from "@/lib/mock-data";
import { formatDate, cn } from "@/lib/utils";

const priorityColor: Record<WorkspaceTask["priority"], string> = {
  high: "text-error bg-error/10 border-error/25",
  medium: "text-warning bg-warning/10 border-warning/25",
  low: "text-muted bg-surface-2 border-border",
};

const statusLabel: Record<WorkspaceTask["status"], string> = {
  todo: "To do",
  "in-progress": "In progress",
  done: "Done",
};

export function TaskRow({ task }: { task: WorkspaceTask }) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3">
      <input
        type="checkbox"
        defaultChecked={task.status === "done"}
        className="h-4 w-4 shrink-0 rounded border-border accent-[var(--ink)]"
      />
      <div className="min-w-0 flex-1">
        <p className={cn("truncate text-sm text-ink", task.status === "done" && "text-muted-soft line-through")}>
          {task.title}
        </p>
        <p className="mt-0.5 text-xs text-muted-soft">Linked: {task.linked}</p>
      </div>
      <span className={cn("rounded-full border px-2 py-0.5 text-[11px] font-medium", priorityColor[task.priority])}>
        {task.priority}
      </span>
      <span className="rounded-full border border-border-soft bg-surface-2 px-2 py-0.5 text-[11px] text-muted">
        {statusLabel[task.status]}
      </span>
      <span className="text-xs text-muted-soft">{formatDate(task.dueDate)}</span>
      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-ink text-[10px] font-medium text-surface">
        {task.assignee[0]}
      </div>
    </div>
  );
}

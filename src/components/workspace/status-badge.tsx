import { CheckCircle2, AlertTriangle, ShieldOff, Clock3, XCircle, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type Status = "approved" | "escalated" | "blocked" | "pending" | "denied";

const config: Record<Status, { label: string; icon: LucideIcon; className: string }> = {
  approved: {
    label: "Approved",
    icon: CheckCircle2,
    className: "text-success bg-success/10 border-success/25",
  },
  escalated: {
    label: "Escalated",
    icon: AlertTriangle,
    className: "text-warning bg-warning/10 border-warning/25",
  },
  blocked: {
    label: "Blocked",
    icon: ShieldOff,
    className: "text-error bg-error/10 border-error/25",
  },
  denied: {
    label: "Denied",
    icon: XCircle,
    className: "text-error bg-error/10 border-error/25",
  },
  pending: {
    label: "Pending",
    icon: Clock3,
    className: "text-muted bg-surface-2 border-border",
  },
};

export function StatusBadge({ status, className }: { status: Status; className?: string }) {
  const c = config[status];
  const Icon = c.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        c.className,
        className
      )}
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={2.25} />
      {c.label}
    </span>
  );
}

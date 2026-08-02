import { Check, X, Clock3, Minus } from "lucide-react";
import { DecisionStep } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const iconFor = {
  passed: Check,
  failed: X,
  waiting: Clock3,
  skipped: Minus,
};

const colorFor: Record<DecisionStep["status"], string> = {
  passed: "border-success/30 bg-success/10 text-success",
  failed: "border-error/30 bg-error/10 text-error",
  waiting: "border-warning/30 bg-warning/10 text-warning",
  skipped: "border-border bg-surface-2 text-muted-soft",
};

export function ActivityTimeline({ steps }: { steps: DecisionStep[] }) {
  return (
    <ol className="space-y-0">
      {steps.map((step, i) => {
        const Icon = iconFor[step.status];
        const last = i === steps.length - 1;
        return (
          <li key={step.label} className="relative flex gap-3 pb-6 last:pb-0">
            {!last && <span className="absolute left-[13px] top-7 h-[calc(100%-1.5rem)] w-px bg-border" />}
            <span
              className={cn(
                "z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border",
                colorFor[step.status]
              )}
            >
              <Icon className="h-3.5 w-3.5" strokeWidth={2.5} />
            </span>
            <div className="pt-0.5">
              <p className="text-sm font-medium text-ink">{step.label}</p>
              <p className="mt-0.5 text-xs text-muted">{step.detail}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

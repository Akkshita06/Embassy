"use client";

import { CalendarEventItem } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const typeColor: Record<CalendarEventItem["type"], string> = {
  expiration: "bg-error/10 text-error border-error/25",
  renewal: "bg-warning/10 text-warning border-warning/25",
  recurring: "bg-surface-2 text-muted border-border",
  deadline: "bg-error/10 text-error border-error/25",
  review: "bg-success/10 text-success border-success/25",
};

export function CalendarEventPill({
  event,
  onClick,
}: {
  event: CalendarEventItem;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full truncate rounded-md border px-1.5 py-0.5 text-left text-[11px] font-medium transition-opacity hover:opacity-80",
        typeColor[event.type]
      )}
      title={event.title}
    >
      {event.title}
    </button>
  );
}

"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { WorkspaceHeader } from "@/components/workspace/workspace-header";
import { CalendarEventPill } from "@/components/workspace/calendar-event";
import { calendarEvents, CalendarEventItem } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function buildMonthGrid(year: number, month: number) {
  const first = new Date(year, month, 1);
  const startWeekday = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = Array(startWeekday).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

// Default view lands on the month with the most activity in the mock
// data, rather than hardcoding "August 2026" as the only month that exists.
const DEFAULT_YEAR = 2026;
const DEFAULT_MONTH = 7; // August (0-indexed)

export default function CalendarPage() {
  const [view, setView] = useState<"month" | "agenda">("month");
  const [selected, setSelected] = useState<CalendarEventItem | null>(null);
  const [year, setYear] = useState(DEFAULT_YEAR);
  const [month, setMonth] = useState(DEFAULT_MONTH);
  const cells = buildMonthGrid(year, month);

  function goToMonth(delta: number) {
    let newMonth = month + delta;
    let newYear = year;
    if (newMonth < 0) {
      newMonth = 11;
      newYear -= 1;
    } else if (newMonth > 11) {
      newMonth = 0;
      newYear += 1;
    }
    setMonth(newMonth);
    setYear(newYear);
  }

  function goToToday() {
    setYear(DEFAULT_YEAR);
    setMonth(DEFAULT_MONTH);
  }

  const eventsByDay = (day: number) => {
    const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return calendarEvents.filter((e) => e.date === key);
  };

  const isDefaultMonth = year === DEFAULT_YEAR && month === DEFAULT_MONTH;

  return (
    <div>
      <WorkspaceHeader
        title="Calendar"
        description="Mandate expirations, renewals, and upcoming agent actions in one view."
        actions={
          <div className="flex rounded-lg border border-border bg-surface p-0.5 text-xs">
            {(["month", "agenda"] as const).map((v) => (
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
        }
      />
      <div className="px-6 py-6 lg:px-8">
        <div className="mb-3 flex items-center justify-between">
          <p className="font-display text-lg text-ink">
            {MONTH_NAMES[month]} {year}
          </p>
          {view === "month" && (
            <div className="flex items-center gap-1">
              {!isDefaultMonth && (
                <button
                  onClick={goToToday}
                  className="mr-1 rounded-lg border border-border px-2.5 py-1 text-xs text-muted hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring"
                >
                  Today
                </button>
              )}
              <button
                onClick={() => goToMonth(-1)}
                aria-label="Previous month"
                className="rounded-lg border border-border p-1.5 text-muted hover:bg-surface-2 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => goToMonth(1)}
                aria-label="Next month"
                className="rounded-lg border border-border p-1.5 text-muted hover:bg-surface-2 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {view === "month" ? (
          <div className="overflow-hidden rounded-xl border border-border">
            <div className="grid grid-cols-7 border-b border-border bg-surface-2">
              {WEEKDAYS.map((d) => (
                <div key={d} className="px-2 py-2 text-center text-xs font-medium text-muted-soft">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {cells.map((day, i) => (
                <div
                  key={i}
                  className={cn(
                    "min-h-[92px] border-b border-r border-border-soft p-1.5",
                    (i + 1) % 7 === 0 && "border-r-0"
                  )}
                >
                  {day && (
                    <>
                      <p className="mb-1 text-xs text-muted-soft">{day}</p>
                      <div className="space-y-1">
                        {eventsByDay(day).map((e) => (
                          <CalendarEventPill key={e.id} event={e} onClick={() => setSelected(e)} />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {[...calendarEvents]
              .sort((a, b) => a.date.localeCompare(b.date))
              .map((e) => (
                <button
                  key={e.id}
                  onClick={() => setSelected(e)}
                  className="flex w-full items-center justify-between rounded-xl border border-border bg-surface px-4 py-3 text-left hover:border-border-soft"
                >
                  <div>
                    <p className="text-sm font-medium text-ink">{e.title}</p>
                    <p className="mt-0.5 text-xs text-muted-soft capitalize">{e.type}</p>
                  </div>
                  <p className="text-xs text-muted">{e.date}</p>
                </button>
              ))}
          </div>
        )}

        {selected && (
          <div className="mt-6 rounded-xl border border-border bg-surface p-4">
            <p className="text-xs uppercase tracking-wide text-muted-soft">Linked item — {selected.linked}</p>
            <p className="mt-1 font-medium text-ink">{selected.title}</p>
            <p className="mt-1 text-xs text-muted">
              {selected.date} · {selected.type}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

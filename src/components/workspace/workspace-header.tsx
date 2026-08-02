"use client";

import { Search, Bell } from "lucide-react";
import { ReactNode } from "react";

export function WorkspaceHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="sticky top-0 z-20 border-b border-border bg-bg/90 px-6 py-4 backdrop-blur lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl tracking-tight text-ink">{title}</h1>
          {description && <p className="mt-1 text-sm text-muted">{description}</p>}
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-muted-soft sm:flex">
            <Search className="h-4 w-4" />
            <span>Search…</span>
          </div>
          <button
            className="relative rounded-lg border border-border bg-surface p-2 text-muted-soft transition-colors hover:text-ink"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-warning" />
          </button>
          {actions}
        </div>
      </div>
    </div>
  );
}

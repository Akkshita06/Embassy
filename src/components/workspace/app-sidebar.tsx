"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  ListChecks,
  ScrollText,
  ShieldCheck,
  FileClock,
  CalendarDays,
  KanbanSquare,
  Bot,
  Users,
  Settings as SettingsIcon,
  LucideIcon,
} from "lucide-react";
import { EmbassyCrest } from "@/components/seal";
import { cn } from "@/lib/utils";

const sections: { href: string; label: string; icon: LucideIcon; badge?: number }[] = [
  { href: "/workspace", label: "Overview", icon: LayoutGrid },
  { href: "/workspace/requests", label: "Purchase Requests", icon: ListChecks },
  { href: "/workspace/mandates", label: "Mandates", icon: ScrollText },
  { href: "/workspace/approvals", label: "Approval Center", icon: ShieldCheck, badge: 2 },
  { href: "/workspace/ledger", label: "Audit Ledger", icon: FileClock },
  { href: "/workspace/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/workspace/tasks", label: "Tasks", icon: KanbanSquare },
  { href: "/workspace/agents", label: "Agent Activity", icon: Bot },
  { href: "/workspace/team", label: "Team / Workspace", icon: Users },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen w-[248px] shrink-0 flex-col border-r border-border bg-surface px-3 py-4 lg:flex">
      <Link href="/" className="flex items-center gap-2.5 px-2 py-2 text-ink">
        <EmbassyCrest className="text-seal-gold" size={22} />
        <span className="font-display text-lg tracking-tight">Embassy</span>
      </Link>

      <nav className="mt-4 flex-1 space-y-0.5 overflow-y-auto pr-1">
        {sections.map((s) => {
          const active = s.href === "/workspace" ? pathname === "/workspace" : pathname?.startsWith(s.href);
          const Icon = s.icon;
          return (
            <Link
              key={s.href}
              href={s.href}
              className={cn(
                "group flex items-center justify-between rounded-lg px-2.5 py-2 text-sm transition-colors",
                active ? "bg-surface-2 text-ink font-medium" : "text-muted hover:bg-surface-2 hover:text-ink"
              )}
            >
              <span className="flex items-center gap-2.5">
                <Icon className={cn("h-4 w-4", active ? "text-ink" : "text-muted-soft group-hover:text-ink")} strokeWidth={2} />
                {s.label}
              </span>
              {s.badge ? (
                <span className="rounded-full bg-warning/15 px-1.5 py-0.5 text-[10px] font-semibold text-warning">
                  {s.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="mt-2 border-t border-border-soft pt-2">
        <Link
          href="/workspace/settings"
          className={cn(
            "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
            pathname?.startsWith("/workspace/settings")
              ? "bg-surface-2 text-ink font-medium"
              : "text-muted hover:bg-surface-2 hover:text-ink"
          )}
        >
          <SettingsIcon className="h-4 w-4 text-muted-soft" strokeWidth={2} />
          Settings
        </Link>
        <div className="mt-2 flex items-center gap-2 rounded-lg px-2.5 py-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-ink text-[11px] font-medium text-surface">
            YS
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-ink">Your Studio</p>
            <p className="truncate text-[11px] text-muted-soft">Freelancer plan</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

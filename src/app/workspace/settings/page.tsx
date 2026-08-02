"use client";

import { useState } from "react";
import { WorkspaceHeader } from "@/components/workspace/workspace-header";
import { CheckCircle2, KeyRound, Bell, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

function Toggle({ defaultOn = false }: { defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <button
      onClick={() => setOn((v) => !v)}
      className={cn(
        "relative h-5 w-9 rounded-full transition-colors",
        on ? "bg-ink" : "bg-surface-2 border border-border"
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 h-4 w-4 rounded-full bg-surface shadow transition-transform",
          on ? "translate-x-[18px]" : "translate-x-0.5"
        )}
      />
    </button>
  );
}

const notifications = [
  { label: "Escalated purchase awaiting review", defaultOn: true },
  { label: "Mandate expiring within 7 days", defaultOn: true },
  { label: "Blocked purchase attempt", defaultOn: true },
  { label: "Weekly spend summary", defaultOn: false },
];

export default function WorkspaceSettingsPage() {
  return (
    <div>
      <WorkspaceHeader title="Settings" description="Workspace defaults, notifications, and security." />
      <div className="mx-auto max-w-3xl space-y-6 px-6 py-6 lg:px-8">
        <section className="rounded-xl border border-border bg-surface p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg text-ink">Prava connection</h2>
              <p className="mt-1 text-xs text-muted">Mandate verification and payment authorization.</p>
            </div>
            <span className="flex items-center gap-1.5 rounded-full border border-success/25 bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
              <CheckCircle2 className="h-3.5 w-3.5" /> Connected
            </span>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-surface p-6">
          <h2 className="font-display text-lg text-ink">Default policy rules</h2>
          <p className="mt-1 text-xs text-muted">Applied to new mandates unless overridden.</p>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between border-b border-border-soft pb-3">
              <span className="text-ink">Require human approval above ₹15,000</span>
              <Toggle defaultOn />
            </div>
            <div className="flex items-center justify-between border-b border-border-soft pb-3">
              <span className="text-ink">Block unrecognized merchants by default</span>
              <Toggle defaultOn />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-ink">Auto-approve recurring charges under ₹2,000</span>
              <Toggle />
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-surface p-6">
          <div className="mb-4 flex items-center gap-2">
            <Bell className="h-4 w-4 text-muted-soft" />
            <h2 className="font-display text-lg text-ink">Notification preferences</h2>
          </div>
          <div className="space-y-3 text-sm">
            {notifications.map((n) => (
              <div key={n.label} className="flex items-center justify-between border-b border-border-soft pb-3 last:border-0 last:pb-0">
                <span className="text-ink">{n.label}</span>
                <Toggle defaultOn={n.defaultOn} />
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-border bg-surface p-6">
          <div className="mb-4 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-muted-soft" />
            <h2 className="font-display text-lg text-ink">Security</h2>
          </div>
          <div className="flex items-center justify-between border-b border-border-soft pb-3">
            <div>
              <p className="text-sm text-ink">Passkey required for approvals</p>
              <p className="text-xs text-muted-soft">Every human approval is confirmed with a Prava passkey.</p>
            </div>
            <Toggle defaultOn />
          </div>
          <div className="flex items-center justify-between pt-3">
            <div className="flex items-center gap-2 text-sm text-ink">
              <KeyRound className="h-4 w-4 text-muted-soft" /> API keys and integrations
            </div>
            <a href="/settings" className="text-xs text-muted hover:text-ink">Manage →</a>
          </div>
        </section>
      </div>
    </div>
  );
}

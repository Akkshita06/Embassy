import { WorkspaceHeader } from "@/components/workspace/workspace-header";
import { teamMembers } from "@/lib/mock-data";
import { ShieldCheck, Mail, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";

export default function TeamPage() {
  return (
    <div>
      <WorkspaceHeader
        title="Team / Workspace"
        description="Members, roles, and who can approve escalated purchases."
        actions={
          <button className="flex items-center gap-1.5 rounded-lg bg-ink px-3 py-1.5 text-sm font-medium text-surface hover:opacity-90">
            <UserPlus className="h-4 w-4" /> Invite member
          </button>
        }
      />
      <div className="px-6 py-6 lg:px-8">
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface-2 text-xs uppercase tracking-wide text-muted-soft">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Member</th>
                <th className="px-4 py-3 text-left font-medium">Role</th>
                <th className="px-4 py-3 text-left font-medium">Approval authority</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {teamMembers.map((m) => (
                <tr key={m.id} className="border-t border-border-soft bg-surface">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-2 text-xs font-medium text-ink">
                        {m.name[0]}
                      </div>
                      <div>
                        <p className="text-ink">{m.name}</p>
                        <p className="flex items-center gap-1 text-xs text-muted-soft">
                          <Mail className="h-3 w-3" /> {m.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted">{m.role}</td>
                  <td className="px-4 py-3">
                    {m.approvalAuthority ? (
                      <span className="flex items-center gap-1.5 text-success">
                        <ShieldCheck className="h-3.5 w-3.5" /> Can approve
                      </span>
                    ) : (
                      <span className="text-muted-soft">View only</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize",
                        m.status === "active"
                          ? "border-success/25 bg-success/10 text-success"
                          : "border-border bg-surface-2 text-muted"
                      )}
                    >
                      {m.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

import { AppSidebar } from "@/components/workspace/app-sidebar";

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

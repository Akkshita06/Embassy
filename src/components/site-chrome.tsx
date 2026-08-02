"use client";

import { usePathname } from "next/navigation";
import { Nav } from "@/components/nav";
import { AmbientBackground } from "@/components/ambient-background";

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const inWorkspace = pathname?.startsWith("/workspace");

  if (inWorkspace) {
    // The workspace has its own persistent sidebar + header chrome.
    return <div className="relative z-10">{children}</div>;
  }

  return (
    <>
      <AmbientBackground />
      <div className="relative z-10">
        <Nav />
        <main>{children}</main>
      </div>
    </>
  );
}

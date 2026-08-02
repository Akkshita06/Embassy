import type { Metadata } from "next";
import { SiteChrome } from "@/components/site-chrome";
import "./globals.css";

export const metadata: Metadata = {
  title: "Embassy — The Trust Layer for AI Commerce",
  description:
    "Embassy is the AI trust and policy layer for agentic commerce — the border control where AI agents present mandates before they can spend.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <div className="grain fixed inset-0 z-0" />
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}

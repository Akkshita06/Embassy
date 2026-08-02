"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { EmbassyCrest } from "@/components/seal";
import { cn } from "@/lib/utils";

const links = [
  { href: "/workspace", label: "Workspace" },
  { href: "/demo", label: "Demo" },
  { href: "/history", label: "Transactions" },
  { href: "/architecture", label: "Architecture" },
  { href: "/analytics", label: "Analytics" },
  { href: "/settings", label: "Settings" },
];

export function Nav() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 12);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 px-4 pt-4">
      <motion.div
        animate={{
          maxWidth: scrolled ? 880 : 1000,
          paddingTop: scrolled ? 8 : 12,
          paddingBottom: scrolled ? 8 : 12,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={cn(
          "glass mx-auto flex items-center justify-between rounded-2xl px-5 transition-shadow duration-300",
          scrolled && "shadow-[0_8px_30px_-8px_rgba(0,0,0,0.5)]"
        )}
        style={{ maxWidth: 1000 }}
      >
        <Link href="/" className="flex items-center gap-2.5 text-ink">
          <motion.span whileHover={{ rotate: 8, scale: 1.08 }} transition={{ type: "spring", stiffness: 300 }}>
            <EmbassyCrest className="text-brass" size={24} />
          </motion.span>
          <span className="font-display text-lg tracking-tight">Embassy</span>
        </Link>

        <nav className="relative hidden items-center gap-1 md:flex">
          {links.map((l) => {
            const active = pathname === l.href || pathname?.startsWith(l.href + "/");
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "relative rounded-lg px-3 py-1.5 text-sm transition-colors",
                  active ? "text-ink" : "text-muted hover:text-ink"
                )}
              >
                {active && (
                  <motion.span
                    layoutId="nav-active"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    className="absolute inset-0 rounded-lg bg-surface-2"
                  />
                )}
                <span className="relative z-10">{l.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/demo"
            className="hidden rounded-lg bg-brass px-3.5 py-1.5 text-sm font-medium text-white transition-all hover:brightness-110 active:scale-[0.98] sm:inline-flex"
          >
            Launch Demo
          </Link>
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="rounded-lg p-2 text-ink md:hidden"
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </motion.div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.nav
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            transition={{ duration: 0.22 }}
            className="glass mx-auto mt-2 flex max-w-[1000px] flex-col overflow-hidden rounded-2xl md:hidden"
          >
            {links.map((l) => {
              const active = pathname === l.href || pathname?.startsWith(l.href + "/");
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={cn(
                    "px-5 py-3 text-sm transition-colors",
                    active ? "bg-surface-2 text-ink" : "text-muted hover:text-ink"
                  )}
                >
                  {l.label}
                </Link>
              );
            })}
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}

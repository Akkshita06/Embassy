"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function EmbassyCrest({ className, size = 28 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      className={className}
      aria-hidden
    >
      <circle cx="20" cy="20" r="19" stroke="currentColor" strokeWidth="1.2" opacity="0.5" />
      <circle cx="20" cy="20" r="14.5" stroke="currentColor" strokeWidth="1" opacity="0.35" />
      <path
        d="M20 8 L29 13 V21 C29 27.5 25 31.5 20 33 C15 31.5 11 27.5 11 21 V13 Z"
        stroke="currentColor"
        strokeWidth="1.4"
        fill="none"
      />
      <path d="M20 14 V27 M15 18 L20 14 L25 18" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const verdictConfig = {
  approved: { label: "APPROVED", color: "var(--green)", rotate: -8 },
  escalated: { label: "ESCALATION", color: "var(--amber)", rotate: -5 },
  denied: { label: "DENIED", color: "var(--red)", rotate: -10 },
} as const;

export function VerdictStamp({
  status,
  animate = true,
}: {
  status: keyof typeof verdictConfig;
  animate?: boolean;
}) {
  const cfg = verdictConfig[status];
  return (
    <motion.div
      initial={animate ? { scale: 2.4, opacity: 0, rotate: 0 } : false}
      animate={{ scale: 1, opacity: 1, rotate: cfg.rotate }}
      transition={{ type: "spring", stiffness: 400, damping: 14, delay: 0.15 }}
      className="inline-flex select-none items-center justify-center"
      style={{ color: cfg.color }}
    >
      <div
        className="flex items-center gap-2 rounded-md border-[3px] px-4 py-1.5 font-mono text-sm font-bold tracking-[0.25em]"
        style={{
          borderColor: cfg.color,
          boxShadow: `0 0 0 1px ${cfg.color}22, 0 0 24px ${cfg.color}33`,
        }}
      >
        <EmbassyCrest size={16} />
        {cfg.label}
      </div>
    </motion.div>
  );
}

export function StatusDot({ status }: { status: "approved" | "escalated" | "denied" }) {
  const color =
    status === "approved" ? "var(--green)" : status === "escalated" ? "var(--amber)" : "var(--red)";
  return (
    <span
      className={cn("relative inline-flex h-2 w-2 rounded-full")}
      style={{ background: color }}
    >
      {status === "approved" && (
        <span className="absolute inset-0 rounded-full animate-pulse-ring" style={{ background: color }} />
      )}
    </span>
  );
}

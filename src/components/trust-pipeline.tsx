"use client";

import { motion } from "framer-motion";
import { Bot, Network, ScrollText, ShieldCheck, KeyRound, Store, BadgeCheck, ReceiptText } from "lucide-react";

const stages = [
  { icon: Bot, label: "AI Agent", note: "requests to spend" },
  { icon: Network, label: "Nanda Orchestration", note: "resolves agent identity" },
  { icon: ScrollText, label: "Embassy Policy", note: "loads active mandate" },
  { icon: ShieldCheck, label: "Policy Validation", note: "checks limits & scope" },
  { icon: KeyRound, label: "Credential", note: "short-lived, signed" },
  { icon: Store, label: "Merchant", note: "receives credential" },
  { icon: BadgeCheck, label: "Verified Purchase", note: "checkout executes" },
  { icon: ReceiptText, label: "Receipt", note: "signed audit record" },
];

/**
 * Vertical pipeline visualization for the hero. Runs a continuous
 * "pulse" down the chain — each node lights up in sequence, independent
 * of scroll or hover, to read as a living system at a glance.
 */
export function TrustPipeline() {
  return (
    <div className="relative mx-auto w-full max-w-xs">
      <div className="absolute left-[27px] top-6 bottom-6 w-px bg-border-soft">
        <motion.div
          className="absolute left-0 top-0 w-px bg-gradient-to-b from-transparent via-brass-bright to-transparent"
          style={{ height: "22%" }}
          animate={{ top: ["-10%", "100%"] }}
          transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
        />
      </div>

      <div className="flex flex-col gap-1">
        {stages.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
            className="relative flex items-center gap-3.5 py-2.5"
          >
            <motion.div
              animate={{
                borderColor: ["var(--border)", "var(--brass)", "var(--border)"],
                color: ["var(--muted)", "var(--brass)", "var(--muted)"],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                delay: i * (5 / stages.length),
                ease: "easeInOut",
                times: [0, 0.15, 0.3],
              }}
              className="relative z-10 flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full border bg-surface"
            >
              <s.icon className="h-3.5 w-3.5" />
            </motion.div>
            <div className="min-w-0">
              <div className="text-sm font-medium text-ink">{s.label}</div>
              <div className="truncate text-xs text-muted-soft">{s.note}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

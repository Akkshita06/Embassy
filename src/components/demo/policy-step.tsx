"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, ChevronRight } from "lucide-react";
import { Panel } from "@/components/panel";
import { VerdictStamp } from "@/components/seal";

const facts = [
  { label: "Merchant", value: "Amazon" },
  { label: "Amount", value: "₹8,999" },
  { label: "Category", value: "Office Accessories" },
  { label: "Daily limit", value: "₹25,000 (₹16,001 remaining)" },
  { label: "Per-charge limit", value: "₹12,000" },
  { label: "Delegation status", value: "Active — Nova AI" },
  { label: "Mandate status", value: "Valid until Dec 2026" },
];

const checks = [
  "Amount within per-charge limit",
  "Category matches mandate scope",
  "Merchant is allow-listed",
  "Daily limit not exceeded",
];

export function PolicyStep({ onDone }: { onDone: () => void }) {
  const [checked, setChecked] = useState(0);
  const [verdict, setVerdict] = useState(false);

  useEffect(() => {
    if (checked < checks.length) {
      const t = setTimeout(() => setChecked((c) => c + 1), 480);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setVerdict(true), 400);
    return () => clearTimeout(t);
  }, [checked]);

  useEffect(() => {
    if (verdict) {
      const t = setTimeout(onDone, 1400);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verdict]);

  return (
    <Panel className="mx-auto w-full max-w-3xl px-6 py-8 md:px-10 md:py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted">Policy engine</p>
          <h3 className="mt-1 font-display text-xl">Reviewing the request against mandate</h3>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-[1fr_auto_1fr]">
        <div className="space-y-3">
          {facts.map((f, i) => (
            <motion.div
              key={f.label}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center justify-between border-b border-border-soft/70 pb-2 text-sm"
            >
              <span className="text-muted">{f.label}</span>
              <span className="mono-tabular text-right text-ink">{f.value}</span>
            </motion.div>
          ))}
        </div>

        <div className="hidden items-center text-muted-soft md:flex">
          <ChevronRight className="h-5 w-5" />
        </div>

        <div className="flex flex-col justify-between">
          <div className="space-y-2.5">
            {checks.map((c, i) => {
              const done = i < checked;
              return (
                <motion.div
                  key={c}
                  animate={{ opacity: i <= checked ? 1 : 0.3 }}
                  className="flex items-center gap-2.5 rounded-lg border border-border-soft bg-surface/60 px-3 py-2 text-sm"
                >
                  <motion.div
                    animate={{
                      borderColor: done ? "var(--green)" : "var(--border)",
                      background: done ? "rgba(61,214,140,0.15)" : "rgba(0,0,0,0)",
                      scale: done ? [1.3, 1] : 1,
                    }}
                    transition={{ duration: 0.3 }}
                    className="flex h-5 w-5 items-center justify-center rounded-full border"
                  >
                    {done && <Check className="h-3 w-3" style={{ color: "var(--green)" }} />}
                  </motion.div>
                  {c}
                </motion.div>
              );
            })}
          </div>

          <div className="mt-8 flex items-center justify-center">
            {verdict ? (
              <VerdictStamp status="approved" />
            ) : (
              <div className="text-xs text-muted-soft">Evaluating decision tree…</div>
            )}
          </div>
        </div>
      </div>
    </Panel>
  );
}

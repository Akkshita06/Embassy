"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, KeyRound, Globe, CreditCard, FileText, Receipt } from "lucide-react";
import { Panel } from "@/components/panel";

const stages = [
  { label: "Minting credential", icon: KeyRound },
  { label: "Running browser checkout", icon: Globe },
  { label: "Completing purchase", icon: CreditCard },
  { label: "Reporting charge", icon: FileText },
  { label: "Generating receipt", icon: Receipt },
];

export function ExecutionStep({ onDone }: { onDone: () => void }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (active >= stages.length) {
      const t = setTimeout(onDone, 700);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setActive((a) => a + 1), 560);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const progress = Math.min(active / stages.length, 1) * 100;

  return (
    <Panel className="mx-auto w-full max-w-2xl px-6 py-9 md:px-10">
      <p className="mb-1 text-xs uppercase tracking-[0.2em] text-muted">Purchase execution</p>
      <h3 className="mb-8 font-display text-xl">Embassy is completing the checkout</h3>

      <div className="mb-8 h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-brass to-brass-bright"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {stages.map((s, i) => {
          const done = i < active;
          const current = i === active;
          return (
            <motion.div
              key={s.label}
              animate={{ opacity: i <= active ? 1 : 0.35 }}
              className="flex items-center gap-3 rounded-xl border border-border-soft bg-surface/50 px-4 py-3"
            >
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border"
                style={{
                  borderColor: done ? "var(--green)" : "var(--border)",
                  color: done ? "var(--green)" : current ? "var(--brass)" : "var(--muted-soft)",
                  background: done ? "rgba(61,214,140,0.1)" : "transparent",
                }}
              >
                {done ? <Check className="h-4 w-4" /> : <s.icon className={current ? "h-4 w-4 animate-pulse" : "h-4 w-4"} />}
              </div>
              <span className="text-sm">{s.label}</span>
            </motion.div>
          );
        })}
      </div>
    </Panel>
  );
}

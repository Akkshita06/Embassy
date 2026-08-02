"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X } from "lucide-react";
import { EmbassyCrest } from "@/components/seal";

export function ApprovalStep({ onDecision }: { onDecision: (approved: boolean) => void }) {
  const [decided, setDecided] = useState<"approve" | "reject" | null>(null);

  function handle(choice: "approve" | "reject") {
    setDecided(choice);
    setTimeout(() => onDecision(choice === "approve"), 700);
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col items-center">
      <p className="mb-4 text-xs uppercase tracking-[0.2em] text-muted">Linq · push approval</p>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
        className="w-full overflow-hidden rounded-[26px] border border-border bg-surface shadow-2xl"
      >
        <div className="flex items-center gap-2.5 border-b border-border-soft bg-surface-2/60 px-5 py-4">
          <div className="rounded-full border border-border p-1.5 text-brass">
            <EmbassyCrest size={16} />
          </div>
          <div>
            <div className="text-sm font-medium">Embassy</div>
            <div className="text-[11px] text-muted">now</div>
          </div>
        </div>

        <div className="px-5 py-5">
          <p className="text-sm text-ink/90">
            <span className="font-medium">Nova AI</span> wants permission to purchase
          </p>

          <div className="mt-4 rounded-2xl border border-border-soft bg-surface-2/50 p-4">
            <div className="text-base font-medium">Logitech MX Master 3S</div>
            <div className="mt-3 grid grid-cols-2 gap-y-2 text-xs">
              <span className="text-muted">Merchant</span>
              <span className="text-right mono-tabular">Amazon</span>
              <span className="text-muted">Amount</span>
              <span className="text-right mono-tabular">₹8,999</span>
            </div>
            <div className="mt-3 border-t border-border-soft pt-3 text-xs text-muted">
              Reason: Within Office Accessories mandate.
            </div>
          </div>

          <AnimatePresence mode="wait">
            {!decided ? (
              <motion.div
                key="buttons"
                exit={{ opacity: 0 }}
                className="mt-5 flex gap-3"
              >
                <button
                  onClick={() => handle("reject")}
                  className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium text-muted transition-colors hover:bg-surface-2 hover:text-ink"
                >
                  Reject
                </button>
                <button
                  onClick={() => handle("approve")}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-green py-2.5 text-sm font-medium text-[#08160f] transition-transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  Approve
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-5 flex items-center justify-center gap-2 rounded-xl border border-border-soft py-2.5 text-sm"
                style={{ color: decided === "approve" ? "var(--green)" : "var(--red)" }}
              >
                {decided === "approve" ? (
                  <>
                    <Check className="h-4 w-4" /> Approved
                  </>
                ) : (
                  <>
                    <X className="h-4 w-4" /> Rejected
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

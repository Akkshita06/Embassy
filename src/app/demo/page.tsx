"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { RotateCcw } from "lucide-react";
import { ChatStep } from "@/components/demo/chat-step";
import { ReasoningStep } from "@/components/demo/reasoning-step";
import { PolicyStep } from "@/components/demo/policy-step";
import { ApprovalStep } from "@/components/demo/approval-step";
import { ExecutionStep } from "@/components/demo/execution-step";
import { ReceiptStep } from "@/components/demo/receipt-step";
import { cn } from "@/lib/utils";
import type { ExtractedIntent } from "@/app/api/agent/reason/route";

const DEMO_INTENT = "Buy a Logitech MX Master 3S under ₹10,000.";

type Step = "chat" | "reasoning" | "policy" | "approval" | "execution" | "receipt" | "rejected";

const stepOrder: Step[] = ["chat", "reasoning", "policy", "approval", "execution", "receipt"];
const stepLabels: Record<Step, string> = {
  chat: "Request",
  reasoning: "Reasoning",
  policy: "Policy",
  approval: "Approval",
  execution: "Checkout",
  receipt: "Receipt",
  rejected: "Rejected",
};

export default function DemoPage() {
  const [step, setStep] = useState<Step>("chat");
  const [extracted, setExtracted] = useState<ExtractedIntent | null>(null);

  const visibleIndex = stepOrder.indexOf(step === "rejected" ? "approval" : step);

  function restart() {
    setStep("chat");
    setExtracted(null);
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-100px)] max-w-6xl flex-col px-6 py-10">
      {/* Progress rail */}
      <div className="mx-auto mb-12 flex w-full max-w-2xl items-center">
        {stepOrder.map((s, i) => (
          <div key={s} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <motion.div
                animate={{
                  scale: i === visibleIndex ? 1.3 : 1,
                  backgroundColor: i <= visibleIndex ? "var(--brass)" : "transparent",
                  borderColor: i <= visibleIndex ? "var(--brass)" : "var(--border)",
                  boxShadow: i === visibleIndex ? "0 0 0 5px rgba(201,162,39,0.18)" : "0 0 0 0 rgba(201,162,39,0)",
                }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="flex h-2.5 w-2.5 rounded-full border"
              />
              <span
                className={cn(
                  "hidden text-[10px] uppercase tracking-wider transition-colors sm:block",
                  i <= visibleIndex ? "text-muted" : "text-muted-soft"
                )}
              >
                {stepLabels[s]}
              </span>
            </div>
            {i < stepOrder.length - 1 && (
              <div className="relative mx-2 h-px flex-1 overflow-hidden bg-border">
                <motion.div
                  initial={false}
                  animate={{ scaleX: i < visibleIndex ? 1 : 0 }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                  style={{ originX: 0 }}
                  className="absolute inset-0 bg-brass/60"
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-1 items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35 }}
            className="w-full"
          >
            {step === "chat" && <ChatStep prompt={DEMO_INTENT} onDone={() => setStep("reasoning")} />}
            {step === "reasoning" && (
              <ReasoningStep
                intent={DEMO_INTENT}
                onDone={(result) => {
                  setExtracted(result);
                  setStep("policy");
                }}
              />
            )}
            {step === "policy" && <PolicyStep onDone={() => setStep("approval")} />}
            {step === "approval" && (
              <ApprovalStep
                onDecision={(approved) => setStep(approved ? "execution" : "rejected")}
              />
            )}
            {step === "execution" && <ExecutionStep onDone={() => setStep("receipt")} />}
            {step === "receipt" && <ReceiptStep onRestart={restart} />}
            {step === "rejected" && (
              <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-4 text-center">
                <p className="font-display text-2xl">Purchase rejected</p>
                <p className="text-sm text-muted">
                  Nova AI has been notified and will not proceed with this transaction.
                </p>
                <button
                  onClick={restart}
                  className="mt-2 inline-flex items-center gap-2 rounded-xl border border-border px-5 py-2.5 text-sm transition-colors hover:bg-surface-2"
                >
                  <RotateCcw className="h-4 w-4" /> Try again
                </button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

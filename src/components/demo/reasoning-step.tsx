"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, Loader2, AlertTriangle } from "lucide-react";
import { Panel } from "@/components/panel";
import type { ExtractedIntent } from "@/app/api/agent/reason/route";

const items = [
  "Understanding request",
  "Searching merchant",
  "Checking mandate",
  "Evaluating purchase policy",
  "Preparing transaction",
];

/**
 * Step 0 ("Understanding request") makes a real call to /api/agent/reason
 * to structure the free-text intent via gpt-4o-mini. That extraction is
 * informational only — it's passed along as input, never used here (or
 * anywhere downstream) to decide allow/escalate/deny. The rest of the
 * list continues as a simulated demo sequence, same as before.
 */
export function ReasoningStep({
  intent,
  onDone,
}: {
  intent: string;
  onDone: (extracted: ExtractedIntent | null) => void;
}) {
  const [active, setActive] = useState(0);
  const [extracted, setExtracted] = useState<ExtractedIntent | null>(null);
  const [extractError, setExtractError] = useState<string | null>(null);

  // Real work happens on step 0; everything after it is the existing
  // timed simulation.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/agent/reason", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ intent }),
        });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setExtractError(data?.error ?? "Reasoning extraction failed.");
        } else {
          setExtracted(data as ExtractedIntent);
        }
      } catch {
        if (!cancelled) setExtractError("Reasoning extraction failed.");
      } finally {
        if (!cancelled) setActive(1);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (active === 0) return; // waiting on the real call above
    if (active >= items.length) {
      const t = setTimeout(() => onDone(extracted), 650);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setActive((a) => a + 1), 620);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  return (
    <Panel className="mx-auto w-full max-w-2xl px-6 py-8">
      <p className="mb-6 text-xs uppercase tracking-[0.2em] text-muted">Agent reasoning</p>
      <div className="flex flex-col gap-1">
        {items.map((label, i) => {
          const done = i < active;
          const current = i === active;
          return (
            <motion.div
              key={label}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: i <= active ? 1 : 0.35, x: 0 }}
              transition={{ duration: 0.35 }}
              className="flex flex-col gap-1.5 py-2.5"
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border"
                  style={{
                    borderColor: done ? "var(--green)" : "var(--border)",
                    background: done ? "rgba(61,214,140,0.12)" : "transparent",
                  }}
                >
                  {done ? (
                    <Check className="h-3.5 w-3.5" style={{ color: "var(--green)" }} />
                  ) : current ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-brass" />
                  ) : (
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-soft" />
                  )}
                </div>
                <span className={done || current ? "text-ink text-sm" : "text-sm text-muted-soft"}>
                  {label}
                </span>
                {done && (
                  <span className="ml-auto font-mono text-[11px] text-green">done</span>
                )}
              </div>

              {i === 0 && done && extracted && (
                <div className="ml-9 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                  <span>
                    Item: <span className="text-ink">{extracted.item}</span>
                  </span>
                  {extracted.merchant && (
                    <span>
                      Merchant: <span className="text-ink">{extracted.merchant}</span>
                    </span>
                  )}
                  <span>
                    Category: <span className="text-ink">{extracted.category}</span>
                  </span>
                  {extracted.riskFlags.length > 0 && (
                    <span className="flex items-center gap-1 text-brass">
                      <AlertTriangle className="h-3 w-3" /> {extracted.riskFlags.join(", ")}
                    </span>
                  )}
                </div>
              )}

              {i === 0 && done && extractError && (
                <div className="ml-9 flex items-center gap-1.5 text-xs text-error">
                  <AlertTriangle className="h-3 w-3" /> {extractError} — continuing without it.
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </Panel>
  );
}

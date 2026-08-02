"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, Lock, Zap } from "lucide-react";
import { AnimatedCounter } from "@/components/animated-counter";
import { TrustPipeline } from "@/components/trust-pipeline";
import { WorkspacePreview } from "@/components/workspace-preview";
import { Primitives } from "@/components/primitives";
import { CodeBlock } from "@/components/code-block";
import { analyticsSummary } from "@/lib/mock-data";

const trustIndicators = [
  { icon: Lock, label: "Signed credentials" },
  { icon: Zap, label: "<100ms verification" },
  { icon: ShieldCheck, label: "Works with any agent" },
];

const kpis = [
  { label: "Protected transactions", value: analyticsSummary.totalPurchases, suffix: "", color: "var(--ink)" },
  { label: "Approval rate", value: Math.round(analyticsSummary.approvalRate * 100), suffix: "%", color: "var(--green)" },
  { label: "Credentials issued", value: 118, suffix: "", color: "var(--brass-bright)" },
  { label: "Trust score", value: 98, suffix: "", color: "var(--brass)" },
];

const purchaseExample = `const result = await embassy.purchase({
  merchant: "Amazon",
  amount: 2499,
  policy: "Employee-Laptop",
})

✓ Approved`;

export default function Home() {
  return (
    <div className="mx-auto max-w-6xl px-6">
      {/* Hero */}
      <section className="flex flex-col items-center gap-16 py-28 text-center md:py-36">
        <div className="flex max-w-3xl flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs text-muted"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-green animate-pulse-ring" />
            Agentic commerce, under mandate
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 14, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="text-balance font-display text-5xl leading-[1.05] tracking-tight md:text-7xl"
          >
            Trust infrastructure
            <br />
            for <span className="text-gradient-brass">AI commerce.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mt-7 max-w-xl text-balance text-lg leading-relaxed text-muted"
          >
            Every AI-agent purchase is evaluated before money moves —
            and every attempt, approved or not, is recorded. Embassy is
            the governance workspace that sits between your agents and
            the merchants they buy from.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-3"
          >
            <Link
              href="/workspace"
              className="group inline-flex items-center gap-2 rounded-lg bg-brass px-6 py-3 text-sm font-medium text-white shadow-[0_0_0_1px_var(--accent-ring)] transition-all hover:brightness-110 active:scale-[0.98]"
            >
              Open Workspace
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/demo"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-6 py-3 text-sm font-medium text-ink transition-colors hover:border-accent/40 hover:bg-surface-2"
            >
              Watch the demo
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="mt-12 flex flex-wrap items-center justify-center gap-x-7 gap-y-2"
          >
            {trustIndicators.map((t) => (
              <div key={t.label} className="flex items-center gap-1.5 text-xs text-muted-soft">
                <t.icon className="h-3.5 w-3.5" />
                {t.label}
              </div>
            ))}
          </motion.div>
        </div>

        <WorkspacePreview />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="glass w-full max-w-xl rounded-2xl px-6 py-8 text-left md:px-10"
        >
          <p className="mb-5 text-xs uppercase tracking-[0.2em] text-muted-soft">Live pipeline</p>
          <TrustPipeline />
        </motion.div>
      </section>

      {/* KPI strip */}
      <section className="border-t border-border-soft py-16">
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border-soft bg-border-soft sm:grid-cols-4">
          {kpis.map((k) => (
            <div key={k.label} className="bg-surface px-5 py-6 transition-colors hover:bg-surface-2">
              <div className="font-display text-2xl md:text-3xl" style={{ color: k.color }}>
                <AnimatedCounter value={k.value} suffix={k.suffix} />
              </div>
              <div className="mt-1 text-[11px] leading-tight text-muted">{k.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Primitives */}
      <Primitives />

      {/* Terminal example */}
      <section className="border-t border-border-soft py-24">
        <div className="grid items-center gap-14 md:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted">One call to check out</p>
            <h2 className="mt-2 font-display text-3xl md:text-4xl">
              Your agent just calls <span className="font-mono text-brass">purchase()</span>
            </h2>
            <p className="mt-4 max-w-md text-muted">
              Embassy handles policy checks, credential issuance, and merchant
              verification behind a single call — your agent gets a clean
              approve or deny, plus a receipt either way.
            </p>
          </div>
          <CodeBlock code={purchaseExample} filename="checkout.ts" highlightLines={[6]} />
        </div>
      </section>
    </div>
  );
}

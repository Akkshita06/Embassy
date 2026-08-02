"use client";

import { motion } from "framer-motion";
import { ShieldCheck, ScrollText, KeyRound, CheckCircle2, FileSearch } from "lucide-react";
import { Panel } from "@/components/panel";
import { CodeBlock } from "@/components/code-block";

const primitives = [
  {
    icon: ScrollText,
    name: "Policy()",
    desc: "Define what an agent is allowed to spend, on what, and where — a mandate the policy engine can evaluate in real time.",
    code: `const policy = embassy.Policy({
  name: "Employee-Laptop",
  dailyLimit: 25000,
  category: "Electronics",
  merchants: ["amazon.in"],
})`,
  },
  {
    icon: ShieldCheck,
    name: "Verify()",
    desc: "Check a purchase request against the active policy — amount, category, and merchant are all evaluated before anything proceeds.",
    code: `const result = await embassy.Verify({
  policy: "Employee-Laptop",
  amount: 8999,
  merchant: "amazon.in",
})
// -> { allowed: true, reason: null }`,
  },
  {
    icon: KeyRound,
    name: "IssueCredential()",
    desc: "Generate a short-lived, signed credential that proves this specific purchase was authorized under mandate.",
    code: `const credential = await embassy.IssueCredential({
  requestId: result.requestId,
  ttl: "5m",
})`,
  },
  {
    icon: CheckCircle2,
    name: "Approve()",
    desc: "Escalate to a human when a request needs a real-time decision, and resolve it with a single call.",
    code: `await embassy.Approve({
  requestId: result.requestId,
  decision: "approved",
})`,
  },
  {
    icon: FileSearch,
    name: "Audit()",
    desc: "Every purchase leaves a signed, queryable record — what was bought, under which policy, and at what price.",
    code: `const receipt = await embassy.Audit({
  requestId: result.requestId,
})
// -> signed receipt, ready to store or export`,
  },
];

export function Primitives() {
  return (
    <section className="py-24">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5 }}
        className="mb-14 max-w-2xl"
      >
        <p className="text-xs uppercase tracking-[0.2em] text-muted">Primitives</p>
        <h2 className="mt-2 font-display text-3xl md:text-4xl">
          Five calls between an agent and a purchase
        </h2>
        <p className="mt-4 text-muted">
          Embassy isn&apos;t a dashboard you configure once — it&apos;s a small set of
          primitives your agent calls at the moment it needs to spend.
        </p>
      </motion.div>

      <div className="space-y-16">
        {primitives.map((p, i) => (
          <motion.div
            key={p.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="grid items-center gap-8 md:grid-cols-2 md:gap-14"
          >
            <div className={i % 2 === 1 ? "md:order-2" : ""}>
              <Panel interactive className="mb-5 inline-flex h-11 w-11 items-center justify-center px-0 py-0 text-brass">
                <p.icon className="h-5 w-5" />
              </Panel>
              <h3 className="font-mono text-xl text-ink">{p.name}</h3>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">{p.desc}</p>
            </div>
            <div className={i % 2 === 1 ? "md:order-1" : ""}>
              <CodeBlock code={p.code} filename="agent.ts" />
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

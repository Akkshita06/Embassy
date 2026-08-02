"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Bot, Network, Package, ShieldCheck, Landmark, Link2, PlayCircle, Receipt } from "lucide-react";
import { Panel } from "@/components/panel";

const nodes = [
  {
    key: "agent",
    icon: Bot,
    title: "Agent",
    desc: "The AI system acting on the user's behalf — it decides what to buy, but never holds spending power directly.",
  },
  {
    key: "nanda",
    icon: Network,
    title: "Nanda",
    desc: "Resolves and verifies the originating agent's identity before the request moves any further — this is what Embassy's delegation check relies on, instead of assuming it. (Stubbed — no real Nanda API docs yet.)",
  },
  {
    key: "sdk",
    icon: Package,
    title: "Embassy SDK",
    desc: "Wraps the agent's purchase intent into a signed request and hands it to the policy engine for review.",
  },
  {
    key: "policy",
    icon: ShieldCheck,
    title: "Policy Engine",
    desc: "Evaluates the request against the active mandate — limits, categories, merchants — and produces a verdict.",
  },
  {
    key: "prava",
    icon: Landmark,
    title: "Prava",
    desc: "Issues the short-lived credential that proves this specific purchase was authorized under mandate.",
  },
  {
    key: "linq",
    icon: Link2,
    title: "Linq",
    desc: "Pushes an interactive iMessage approval card to the mandate holder's phone when a request escalates, and receives their approve/deny decision back via webhook. (Real integration — see src/lib/linq/client.ts.)",
  },
  {
    key: "execution",
    icon: PlayCircle,
    title: "Execution Engine",
    desc: "Carries out the checkout using the issued credential — browser automation or merchant API, whichever fits.",
  },
  {
    key: "receipt",
    icon: Receipt,
    title: "Receipt",
    desc: "A signed record of what was bought, under which mandate, and at what price — the paper trail for every agent purchase.",
  },
];

export default function ArchitecturePage() {
  const [active, setActive] = useState("policy");
  const activeNode = nodes.find((n) => n.key === active)!;

  return (
    <div className="mx-auto max-w-5xl px-6 py-14">
      <div className="mb-12 text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-muted">System</p>
        <h1 className="mt-1 font-display text-3xl md:text-4xl">How a purchase crosses the border</h1>
        <p className="mx-auto mt-3 max-w-lg text-sm text-muted">
          Hover or tap any stage to see what it does.
        </p>
      </div>

      <div className="flex flex-col items-center gap-0">
        {nodes.map((n, i) => {
          const isActive = active === n.key;
          return (
            <div key={n.key} className="flex flex-col items-center">
              <motion.button
                onMouseEnter={() => setActive(n.key)}
                onFocus={() => setActive(n.key)}
                onClick={() => setActive(n.key)}
                whileHover={{ scale: 1.03, y: -1 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 350, damping: 22 }}
                className={`flex w-72 items-center gap-3 rounded-2xl border px-5 py-4 text-left transition-colors duration-300 ${
                  isActive
                    ? "border-brass/60 bg-surface-2 shadow-[0_0_0_1px_rgba(201,162,39,0.25),0_8px_30px_-8px_rgba(201,162,39,0.35)]"
                    : "border-border-soft bg-surface/60 hover:bg-surface-2/60"
                }`}
              >
                <div
                  className={`rounded-xl border p-2.5 transition-colors duration-300 ${
                    isActive ? "border-brass/60 text-brass" : "border-border text-muted"
                  }`}
                >
                  <n.icon className="h-4 w-4" />
                </div>
                <span className="font-medium">{n.title}</span>
                {isActive && (
                  <motion.span
                    layoutId="arch-active-dot"
                    className="ml-auto h-1.5 w-1.5 rounded-full bg-brass-bright shadow-[0_0_8px_2px_rgba(232,198,91,0.6)]"
                  />
                )}
              </motion.button>
              {i < nodes.length - 1 && (
                <div className="relative h-8 w-px bg-gradient-to-b from-border to-transparent overflow-hidden">
                  <motion.div
                    animate={{ y: ["-100%", "200%"] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: "linear", delay: i * 0.15 }}
                    className="absolute left-1/2 h-3 w-px -translate-x-1/2 bg-brass-bright/70"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <motion.div
        key={activeNode.key}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mt-10"
      >
        <Panel className="mx-auto max-w-xl px-6 py-5 text-center">
          <div className="mb-1 text-xs uppercase tracking-[0.2em] text-brass">{activeNode.title}</div>
          <p className="text-sm text-ink/85">{activeNode.desc}</p>
        </Panel>
      </motion.div>
    </div>
  );
}

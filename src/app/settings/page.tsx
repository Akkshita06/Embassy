"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Copy, Check, Moon, Sun } from "lucide-react";
import { Panel } from "@/components/panel";

const keys = [
  { label: "Prava API Key", value: "prava_live_9f2b7c1a8e4d6f3210" },
  { label: "Linq API Key", value: "linq_live_3e8a1d5c7b902f4461" },
  { label: "Shopify Access Token", value: "shpat_a41c9e2f6d8b30175c" },
];

function KeyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center justify-between border-b border-border-soft/60 py-3.5 last:border-0">
      <div>
        <div className="text-sm">{label}</div>
        <div className="mono-tabular mt-0.5 text-xs text-muted-soft">
          {value.slice(0, 10)}••••••••••••{value.slice(-4)}
        </div>
      </div>
      <button
        onClick={() => {
          navigator.clipboard?.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1400);
        }}
        className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted transition-colors hover:bg-surface-2 hover:text-ink"
      >
        {copied ? <Check className="h-3.5 w-3.5 text-green" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const [dark, setDark] = useState(true);

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.2em] text-muted">Configuration</p>
        <h1 className="mt-1 font-display text-3xl">Settings</h1>
      </div>

      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <Panel className="px-6 py-6">
            <h2 className="mb-1 font-display text-lg">Connected keys</h2>
            <p className="mb-3 text-xs text-muted">Used by Embassy to talk to Prava, Linq, and Shopify.</p>
            <div>
              {keys.map((k) => (
                <KeyRow key={k.label} {...k} />
              ))}
            </div>
          </Panel>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}>
          <Panel className="flex items-center justify-between px-6 py-6">
            <div>
              <h2 className="font-display text-lg">Agent identity</h2>
              <p className="mt-1 text-xs text-muted">The agent currently authorized under your mandates.</p>
            </div>
            <div className="rounded-lg border border-border-soft bg-surface-2 px-3 py-1.5 font-mono text-xs">
              agent_nova_ai_01
            </div>
          </Panel>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
          <Panel className="flex items-center justify-between px-6 py-6">
            <div>
              <h2 className="font-display text-lg">Appearance</h2>
              <p className="mt-1 text-xs text-muted">Embassy is designed light-first, in warm off-white.</p>
            </div>
            <button
              onClick={() => setDark((d) => !d)}
              className="flex items-center gap-2 rounded-lg border border-border px-3.5 py-2 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-ink"
            >
              {dark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              {dark ? "Dark" : "Light"}
            </button>
          </Panel>
        </motion.div>
      </div>
    </div>
  );
}

"use client";

import { motion } from "framer-motion";
import { Download, RotateCcw, CheckCircle2, ShieldCheck, QrCode } from "lucide-react";
import { Panel } from "@/components/panel";
import { Confetti } from "@/components/demo/confetti";

const receipt = {
  id: "RCPT-2K91-8841",
  txnId: "txn_8841",
  merchant: "Amazon",
  amount: "₹8,999.00",
  policy: "Office Accessories · Nova AI",
  timestamp: "28 Jul 2026, 09:14 IST",
  status: "Settled",
  credentialHash: "0x7f3a…c1e9",
  policyVersion: "v2.4.1",
  signature: "ed25519:9kQ2…7mLp",
};

export function ReceiptStep({ onRestart }: { onRestart: () => void }) {
  function download() {
    const text = Object.entries(receipt)
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${receipt.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="relative mx-auto w-full max-w-md">
      <Confetti />
      <Panel className="overflow-hidden px-0 py-0">
        <div className="flex flex-col items-center gap-3 border-b border-border-soft bg-gradient-to-b from-green/10 to-transparent px-6 py-8 text-center">
          <motion.div
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 16, delay: 0.1 }}
            className="rounded-full bg-green/15 p-3 text-green"
          >
            <CheckCircle2 className="h-8 w-8" />
          </motion.div>
          <h3 className="font-display text-2xl">Purchase complete</h3>
          <p className="text-sm text-muted">Logitech MX Master 3S has been ordered.</p>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-green/30 bg-green/10 px-3 py-1 text-xs font-medium text-green"
          >
            <ShieldCheck className="h-3.5 w-3.5" /> Merchant verified · Trust badge issued
          </motion.div>
        </div>

        <div className="flex items-center justify-center gap-5 border-b border-border-soft bg-surface/40 px-6 py-5">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg border border-border-soft bg-surface-2 text-muted-soft">
            <QrCode className="h-12 w-12" strokeWidth={1.2} />
          </div>
          <div className="min-w-0 flex-1 space-y-1 text-xs">
            <div className="flex justify-between gap-2">
              <span className="text-muted">Credential hash</span>
              <span className="mono-tabular truncate text-ink">{receipt.credentialHash}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-muted">Digital signature</span>
              <span className="mono-tabular truncate text-ink">{receipt.signature}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-muted">Policy version</span>
              <span className="mono-tabular text-ink">{receipt.policyVersion}</span>
            </div>
          </div>
        </div>

        <div className="space-y-3 px-6 py-6 text-sm">
          {[
            ["Receipt ID", receipt.id],
            ["Transaction ID", receipt.txnId],
            ["Merchant", receipt.merchant],
            ["Amount", receipt.amount],
            ["Policy used", receipt.policy],
            ["Timestamp", receipt.timestamp],
            ["Status", receipt.status],
          ].map(([k, v]) => (
            <div key={k} className="flex items-center justify-between border-b border-border-soft/60 pb-2.5 last:border-0">
              <span className="text-muted">{k}</span>
              <span className="mono-tabular text-right text-ink">{v}</span>
            </div>
          ))}
        </div>

        <div className="flex gap-3 border-t border-border-soft px-6 py-5">
          <button
            onClick={download}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brass py-2.5 text-sm font-medium text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <Download className="h-4 w-4" /> Download receipt
          </button>
          <button
            onClick={onRestart}
            className="flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-ink"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </Panel>
    </div>
  );
}

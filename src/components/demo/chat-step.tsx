"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowUp, Sparkles } from "lucide-react";
import { EmbassyCrest } from "@/components/seal";
import { Panel } from "@/components/panel";

const REPLY =
  "On it. Checking the Office Accessories mandate, comparing prices across your linked merchants, and preparing the purchase for your approval.";

export function ChatStep({
  prompt,
  onDone,
}: {
  prompt: string;
  onDone: () => void;
}) {
  const [typed, setTyped] = useState("");
  const [showReply, setShowReply] = useState(false);
  const [replyTyped, setReplyTyped] = useState("");

  useEffect(() => {
    let i = 0;
    const t = setInterval(() => {
      i++;
      setTyped(prompt.slice(0, i));
      if (i >= prompt.length) {
        clearInterval(t);
        setTimeout(() => setShowReply(true), 400);
      }
    }, 28);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!showReply) return;
    let i = 0;
    const t = setInterval(() => {
      i++;
      setReplyTyped(REPLY.slice(0, i));
      if (i >= REPLY.length) {
        clearInterval(t);
        setTimeout(onDone, 700);
      }
    }, 14);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showReply]);

  return (
    <Panel className="mx-auto flex w-full max-w-2xl flex-col overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border-soft px-5 py-4">
        <div className="rounded-lg bg-surface-2 p-1.5 text-brass">
          <Sparkles className="h-4 w-4" />
        </div>
        <div>
          <div className="text-sm font-medium">Nova AI</div>
          <div className="text-xs text-muted">Agent · connected via Embassy SDK</div>
        </div>
      </div>

      <div className="flex min-h-[280px] flex-col gap-5 px-5 py-6">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="ml-auto max-w-[85%] rounded-2xl rounded-tr-sm bg-surface-2 px-4 py-2.5 text-sm"
        >
          {typed}
          {typed.length < prompt.length && (
            <span className="ml-0.5 inline-block h-3.5 w-[2px] animate-pulse bg-ink align-middle" />
          )}
        </motion.div>

        {showReply && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mr-auto flex max-w-[85%] items-start gap-2.5"
          >
            <div className="mt-0.5 rounded-full border border-border p-1 text-brass">
              <EmbassyCrest size={14} />
            </div>
            <div className="rounded-2xl rounded-tl-sm border border-border-soft bg-surface px-4 py-2.5 text-sm text-ink/90">
              {replyTyped}
              {replyTyped.length < REPLY.length && (
                <span className="ml-0.5 inline-block h-3.5 w-[2px] animate-pulse bg-ink align-middle" />
              )}
            </div>
          </motion.div>
        )}
      </div>

      <div className="flex items-center gap-2 border-t border-border-soft px-4 py-3">
        <div className="flex-1 rounded-xl border border-border-soft bg-surface px-3.5 py-2 text-sm text-muted-soft">
          Message Nova AI…
        </div>
        <button
          disabled
          className="rounded-lg bg-surface-2 p-2 text-muted-soft"
          aria-label="Send"
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      </div>
    </Panel>
  );
}

"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

export function CodeBlock({
  code,
  filename,
  className,
  highlightLines = [],
}: {
  code: string;
  filename?: string;
  className?: string;
  /** 1-indexed line numbers to render in the success/accent color */
  highlightLines?: number[];
}) {
  const [copied, setCopied] = useState(false);
  const lines = code.split("\n");

  function copy() {
    navigator.clipboard?.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  }

  return (
    <div className={cn("code-block overflow-hidden", className)}>
      <div className="flex items-center justify-between border-b border-border-soft px-4 py-2.5">
        <div className="flex items-center gap-1.5">
          <span className="code-dot bg-[#f0554c]/70" />
          <span className="code-dot bg-[#f0a93c]/70" />
          <span className="code-dot bg-[#3dd68c]/70" />
          {filename && <span className="ml-3 text-xs text-muted-soft">{filename}</span>}
        </div>
        <button
          onClick={copy}
          aria-label="Copy code"
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-soft transition-colors hover:bg-surface-2 hover:text-ink"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-green" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto px-4 py-4">
        <code>
          {lines.map((line, i) => (
            <div
              key={i}
              className={cn(
                "whitespace-pre",
                highlightLines.includes(i + 1) ? "text-green" : "text-ink/85"
              )}
            >
              {line || "\u00A0"}
            </div>
          ))}
        </code>
      </pre>
    </div>
  );
}

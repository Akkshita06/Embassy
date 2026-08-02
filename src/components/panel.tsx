"use client";

import { cn } from "@/lib/utils";
import { ReactNode, useRef } from "react";
import { motion } from "framer-motion";

export function Panel({
  children,
  className,
  interactive = false,
  glow = false,
}: {
  children: ReactNode;
  className?: string;
  /** Enables hover lift + cursor spotlight, for clickable/hoverable cards */
  interactive?: boolean;
  /** Adds an animated border glow (use sparingly, e.g. featured cards) */
  glow?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!interactive || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    ref.current.style.setProperty("--spot-x", `${e.clientX - rect.left}px`);
    ref.current.style.setProperty("--spot-y", `${e.clientY - rect.top}px`);
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      whileHover={interactive ? { y: -2 } : undefined}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className={cn(
        "glass rounded-xl transition-shadow duration-300",
        interactive && "spotlight-card cursor-default hover:shadow-[0_8px_24px_-10px_rgba(0,0,0,0.45)] hover:border-border-soft",
        glow && "border-brass/25",
        className
      )}
    >
      <div className="relative z-10 h-full">{children}</div>
    </motion.div>
  );
}

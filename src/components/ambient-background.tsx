"use client";

import { useEffect, useRef } from "react";

/**
 * Fixed, restrained backdrop: a faded grid, one soft radial glow drifting
 * slowly, and a subtle spotlight that follows the cursor. Deliberately
 * understated — Browserbase-style, not neon.
 */
export function AmbientBackground() {
  const spotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleMove(e: MouseEvent) {
      spotRef.current?.style.setProperty("--mx", `${e.clientX}px`);
      spotRef.current?.style.setProperty("--my", `${e.clientY}px`);
    }
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
      {/* One restrained radial glow, top center */}
      <div
        className="animate-blob-1 absolute left-1/2 top-[-20%] h-[600px] w-[900px] -translate-x-1/2 opacity-[0.16] blur-[130px]"
        style={{ background: "radial-gradient(ellipse, rgba(201,162,39,0.5), transparent 70%)" }}
      />
      <div
        className="animate-blob-2 absolute right-[-10%] top-[30%] h-[420px] w-[420px] opacity-[0.10] blur-[120px]"
        style={{ background: "radial-gradient(circle, rgba(61,214,140,0.4), transparent 70%)", animationDelay: "-10s" }}
      />

      {/* Faded grid */}
      <div className="bg-grid absolute inset-0 opacity-70" />

      {/* Mouse-responsive spotlight, very subtle */}
      <div
        ref={spotRef}
        className="absolute inset-0 opacity-40 transition-opacity duration-500"
        style={{
          background:
            "radial-gradient(560px circle at var(--mx, 50%) var(--my, 0%), rgba(232,198,91,0.045), transparent 70%)",
        }}
      />
    </div>
  );
}

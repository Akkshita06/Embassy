"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";

const colors = ["#c9a227", "#e8c65b", "#3dd68c", "#edeef2"];

export function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 42 }).map((_, i) => ({
        id: i,
        x: (Math.random() - 0.5) * 640,
        rotate: Math.random() * 360,
        delay: Math.random() * 0.25,
        color: colors[i % colors.length],
        size: 5 + Math.random() * 5,
        duration: 1.1 + Math.random() * 0.7,
      })),
    []
  );

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center overflow-visible">
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          initial={{ opacity: 1, x: 0, y: 0, rotate: 0 }}
          animate={{
            opacity: 0,
            x: p.x,
            y: 260 + Math.random() * 120,
            rotate: p.rotate,
          }}
          transition={{ duration: p.duration, delay: p.delay, ease: "easeOut" }}
          style={{
            position: "absolute",
            width: p.size,
            height: p.size * 0.4,
            background: p.color,
            top: 0,
          }}
        />
      ))}
    </div>
  );
}

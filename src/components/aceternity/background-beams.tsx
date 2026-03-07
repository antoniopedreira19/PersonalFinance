"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function BackgroundBeams({ className }: { className?: string }) {
  const beams = [
    { x: 8, delay: 0, duration: 3.5 },
    { x: 16, delay: 0.5, duration: 4 },
    { x: 24, delay: 1, duration: 3 },
    { x: 32, delay: 0.2, duration: 4.5 },
    { x: 42, delay: 0.8, duration: 3.8 },
    { x: 52, delay: 1.4, duration: 3.2 },
    { x: 62, delay: 0.3, duration: 4.2 },
    { x: 72, delay: 1.1, duration: 3.6 },
    { x: 80, delay: 0.6, duration: 4.8 },
    { x: 90, delay: 1.7, duration: 3.4 },
  ];

  return (
    <div className={cn("absolute inset-0 overflow-hidden", className)}>
      {/* Grid pattern */}
      <svg
        className="absolute inset-0 h-full w-full opacity-[0.15]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
            <path
              d="M 48 0 L 0 0 0 48"
              fill="none"
              stroke="rgb(59 130 246)"
              strokeWidth="0.5"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Animated vertical beams */}
      {beams.map((beam, i) => (
        <motion.div
          key={i}
          className="absolute top-0 w-px"
          style={{
            left: `${beam.x}%`,
            background:
              "linear-gradient(to bottom, transparent, rgba(59,130,246,0.4) 40%, rgba(139,92,246,0.2) 70%, transparent)",
            height: "100%",
          }}
          animate={{
            opacity: [0, 0.8, 0],
            scaleY: [0.3, 1, 0.3],
          }}
          transition={{
            duration: beam.duration,
            delay: beam.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Radial gradient overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(59,130,246,0.12),transparent)]" />
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />
    </div>
  );
}

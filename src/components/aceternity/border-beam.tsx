"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface BorderBeamProps {
  className?: string;
  colorFrom?: string;
  colorTo?: string;
  duration?: number;
  borderWidth?: number;
}

export function BorderBeam({
  className,
  colorFrom = "#3b82f6",
  colorTo = "#8b5cf6",
  duration = 4,
  borderWidth = 1.5,
}: BorderBeamProps) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 rounded-[inherit] overflow-hidden",
        className
      )}
    >
      <motion.div
        className="absolute h-px"
        style={{
          background: `linear-gradient(90deg, transparent, ${colorFrom}, ${colorTo}, transparent)`,
          top: 0,
          left: 0,
          right: 0,
          height: `${borderWidth}px`,
        }}
        animate={{ x: ["-100%", "100%"] }}
        transition={{
          duration,
          ease: "linear",
          repeat: Infinity,
        }}
      />
      <motion.div
        className="absolute w-px"
        style={{
          background: `linear-gradient(180deg, transparent, ${colorTo}, ${colorFrom}, transparent)`,
          top: 0,
          right: 0,
          bottom: 0,
          width: `${borderWidth}px`,
        }}
        animate={{ y: ["-100%", "100%"] }}
        transition={{
          duration,
          ease: "linear",
          repeat: Infinity,
          delay: duration * 0.25,
        }}
      />
      <motion.div
        className="absolute h-px"
        style={{
          background: `linear-gradient(90deg, transparent, ${colorTo}, ${colorFrom}, transparent)`,
          bottom: 0,
          left: 0,
          right: 0,
          height: `${borderWidth}px`,
        }}
        animate={{ x: ["100%", "-100%"] }}
        transition={{
          duration,
          ease: "linear",
          repeat: Infinity,
          delay: duration * 0.5,
        }}
      />
      <motion.div
        className="absolute w-px"
        style={{
          background: `linear-gradient(180deg, transparent, ${colorFrom}, ${colorTo}, transparent)`,
          top: 0,
          left: 0,
          bottom: 0,
          width: `${borderWidth}px`,
        }}
        animate={{ y: ["100%", "-100%"] }}
        transition={{
          duration,
          ease: "linear",
          repeat: Infinity,
          delay: duration * 0.75,
        }}
      />
    </div>
  );
}

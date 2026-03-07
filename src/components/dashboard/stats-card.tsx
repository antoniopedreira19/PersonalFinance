"use client";

import { DollarSign, TrendingUp, TrendingDown, Percent } from "lucide-react";
import { NumberTicker } from "@/components/aceternity/number-ticker";
import { BorderBeam } from "@/components/aceternity/border-beam";
import { cn } from "@/lib/utils";

const iconMap = {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Percent,
} as const;

type IconName = keyof typeof iconMap;

interface StatsCardProps {
  title: string;
  value: number;
  prefix?: string;
  suffix?: string;
  icon: IconName;
  trend?: number;
  trendLabel?: string;
  variant?: "default" | "green" | "red" | "purple";
  decimalPlaces?: number;
}

const variants = {
  default: {
    icon: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    value: "text-white",
    beamFrom: "#3b82f6",
    beamTo: "#8b5cf6",
  },
  green: {
    icon: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    value: "text-emerald-400",
    beamFrom: "#10b981",
    beamTo: "#06b6d4",
  },
  red: {
    icon: "text-red-400 bg-red-500/10 border-red-500/20",
    value: "text-red-400",
    beamFrom: "#ef4444",
    beamTo: "#f97316",
  },
  purple: {
    icon: "text-violet-400 bg-violet-500/10 border-violet-500/20",
    value: "text-violet-400",
    beamFrom: "#8b5cf6",
    beamTo: "#3b82f6",
  },
};

export function StatsCard({
  title,
  value,
  prefix = "",
  suffix = "",
  icon,
  trend,
  trendLabel,
  variant = "default",
  decimalPlaces = 2,
}: StatsCardProps) {
  const styles = variants[variant];
  const Icon = iconMap[icon];

  return (
    <div className="relative rounded-xl bg-zinc-900 border border-zinc-800 p-5 overflow-hidden group hover:border-zinc-700 transition-colors">
      <BorderBeam
        colorFrom={styles.beamFrom}
        colorTo={styles.beamTo}
        duration={5}
      />

      <div className="flex items-start justify-between mb-4">
        <div
          className={cn(
            "w-9 h-9 rounded-lg flex items-center justify-center border",
            styles.icon
          )}
        >
          <Icon className="w-4 h-4" />
        </div>

        {trend !== undefined && (
          <span
            className={cn(
              "text-[11px] font-medium px-2 py-0.5 rounded-full",
              trend >= 0
                ? "text-emerald-400 bg-emerald-500/10"
                : "text-red-400 bg-red-500/10"
            )}
          >
            {trend >= 0 ? "▲" : "▼"} {Math.abs(trend)}%
          </span>
        )}
      </div>

      <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1.5">
        {title}
      </p>

      <div className={cn("text-2xl font-bold font-mono tracking-tight", styles.value)}>
        {prefix}
        <NumberTicker
          value={value}
          decimalPlaces={decimalPlaces}
          className={styles.value}
        />
        {suffix}
      </div>

      {trendLabel && (
        <p className="text-[11px] text-zinc-600 mt-1.5">{trendLabel}</p>
      )}
    </div>
  );
}

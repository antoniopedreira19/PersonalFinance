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
  compact?: boolean;
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
  compact = false,
}: StatsCardProps) {
  const styles = variants[variant];
  const Icon = iconMap[icon];

  return (
    <div className={cn(
      "relative rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden group hover:border-zinc-700 transition-colors",
      compact ? "p-3" : "p-5"
    )}>
      <BorderBeam
        colorFrom={styles.beamFrom}
        colorTo={styles.beamTo}
        duration={5}
      />

      <div className={cn("flex items-start justify-between", compact ? "mb-2" : "mb-4")}>
        <div
          className={cn(
            "rounded-lg flex items-center justify-center border",
            compact ? "w-7 h-7" : "w-9 h-9",
            styles.icon
          )}
        >
          <Icon className={compact ? "w-3 h-3" : "w-4 h-4"} />
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

      <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">
        {title}
      </p>

      <div className={cn("font-bold font-mono tracking-tight", compact ? "text-lg" : "text-2xl", styles.value)}>
        {prefix}
        <NumberTicker
          value={value}
          decimalPlaces={decimalPlaces}
          className={styles.value}
        />
        {suffix}
      </div>

      {trendLabel && (
        <p className="text-[10px] text-zinc-600 mt-1">{trendLabel}</p>
      )}
    </div>
  );
}

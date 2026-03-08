"use client";

import { useState } from "react";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  ChevronDown,
  ChevronRight,
  X,
  Clock,
} from "lucide-react";
import { NumberTicker } from "@/components/aceternity/number-ticker";
import { BorderBeam } from "@/components/aceternity/border-beam";
import { cn } from "@/lib/utils";
import type { ProjectionItem } from "@/lib/queries/dashboard";

type Fatura = {
  bankId: string;
  bankName: string;
  bankColor: string;
  closingDay: number;
  paymentDueDay: number | null;
  fatura: number;
  transactions: Array<{ amount: number; description: string; date: string }>;
};

interface ClickableStatCardProps {
  title: string;
  value: number;
  variant?: "default" | "green" | "red" | "purple";
  icon?: "DollarSign" | "TrendingUp" | "TrendingDown" | "CreditCard";
  subtitle?: string;
  compact?: boolean;
  // Normal item list
  items?: ProjectionItem[];
  itemsLabel?: string;
  // Credit card fatura mode
  isCreditCard?: boolean;
  faturas?: Fatura[];
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

const iconMap = { DollarSign, TrendingUp, TrendingDown, CreditCard };

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
}

function ItemsModal({
  title,
  items,
  itemsLabel,
  onClose,
}: {
  title: string;
  items: ProjectionItem[];
  itemsLabel?: string;
  onClose: () => void;
}) {
  const sorted = [...items].sort((a, b) => a.date.localeCompare(b.date));
  const total = items.reduce((s, i) => s + i.amount, 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-zinc-800 shrink-0">
          <div>
            <h2 className="text-base font-semibold text-white">{title}</h2>
            {itemsLabel && (
              <p className="text-xs text-zinc-500 mt-0.5">{itemsLabel}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1.5">
          {sorted.length === 0 ? (
            <p className="text-zinc-500 text-sm text-center py-8">
              Nenhum item encontrado
            </p>
          ) : (
            sorted.map((item, i) => (
              <div
                key={item.id + i}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-zinc-800/50 transition-colors"
              >
                {/* Bank color dot */}
                {item.banks && (
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: item.banks.color }}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm text-zinc-200 truncate">
                      {item.description}
                    </p>
                    {item.isProjected && (
                      <span className="flex items-center gap-0.5 text-[10px] text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded-full shrink-0">
                        <Clock className="w-2.5 h-2.5" />
                        Previsto
                      </span>
                    )}
                    {item.installment_number && item.total_installments && (
                      <span className="text-[10px] text-zinc-500 shrink-0">
                        {item.installment_number}/{item.total_installments}x
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    {formatDate(item.date)}
                    {item.banks && ` · ${item.banks.name}`}
                  </p>
                </div>
                <span className="text-sm font-mono font-medium text-zinc-200 shrink-0">
                  R$ {formatCurrency(item.amount)}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Footer total */}
        <div className="px-6 py-4 border-t border-zinc-800 shrink-0 flex items-center justify-between">
          <span className="text-xs text-zinc-500 uppercase tracking-widest">Total</span>
          <span className="text-base font-bold font-mono text-white">
            R$ {formatCurrency(total)}
          </span>
        </div>
      </div>
    </div>
  );
}

function CreditCardModal({
  faturas,
  onClose,
}: {
  faturas: Fatura[];
  onClose: () => void;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const total = faturas.reduce((s, f) => s + f.fatura, 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-zinc-800 shrink-0">
          <div>
            <h2 className="text-base font-semibold text-white">Despesas Comprometidas</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Faturas do ciclo atual</p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Banks */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {faturas.length === 0 ? (
            <p className="text-zinc-500 text-sm text-center py-8">
              Nenhum cartão de crédito cadastrado
            </p>
          ) : (
            faturas.map((f) => (
              <div key={f.bankId} className="rounded-xl border border-zinc-800 overflow-hidden">
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-800/40 transition-colors text-left"
                  onClick={() => setExpanded(expanded === f.bankId ? null : f.bankId)}
                >
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: f.bankColor }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-200">{f.bankName}</p>
                    <p className="text-[11px] text-zinc-500">
                      Fecha dia {f.closingDay}
                      {f.paymentDueDay && ` · Vence dia ${f.paymentDueDay}`}
                    </p>
                  </div>
                  <span className="text-sm font-mono font-semibold text-red-400 shrink-0">
                    R$ {formatCurrency(f.fatura)}
                  </span>
                  {expanded === f.bankId ? (
                    <ChevronDown className="w-4 h-4 text-zinc-500 shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-zinc-500 shrink-0" />
                  )}
                </button>

                {expanded === f.bankId && (
                  <div className="border-t border-zinc-800 bg-zinc-950/50">
                    {f.transactions.length === 0 ? (
                      <p className="text-zinc-500 text-xs text-center py-4">
                        Nenhuma despesa no ciclo atual
                      </p>
                    ) : (
                      f.transactions.map((t, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-3 px-4 py-2.5 border-b border-zinc-800/50 last:border-0"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-zinc-300 truncate">{t.description}</p>
                            <p className="text-[11px] text-zinc-600">{formatDate(t.date)}</p>
                          </div>
                          <span className="text-xs font-mono text-zinc-300 shrink-0">
                            R$ {formatCurrency(t.amount)}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-800 shrink-0 flex items-center justify-between">
          <span className="text-xs text-zinc-500 uppercase tracking-widest">Total comprometido</span>
          <span className="text-base font-bold font-mono text-red-400">
            R$ {formatCurrency(total)}
          </span>
        </div>
      </div>
    </div>
  );
}

export function ClickableStatCard({
  title,
  value,
  variant = "default",
  icon = "DollarSign",
  subtitle,
  compact = false,
  items,
  itemsLabel,
  isCreditCard = false,
  faturas,
}: ClickableStatCardProps) {
  const [open, setOpen] = useState(false);
  const styles = variants[variant];
  const Icon = iconMap[icon];
  const hasDetail = (items && items.length >= 0) || isCreditCard;

  return (
    <>
      <div
        className={cn(
          "relative rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden transition-colors",
          compact ? "p-3" : "p-5",
          hasDetail && "cursor-pointer hover:border-zinc-600"
        )}
        onClick={() => hasDetail && setOpen(true)}
      >
        <BorderBeam colorFrom={styles.beamFrom} colorTo={styles.beamTo} duration={5} />

        <div className={cn("flex items-start justify-between", compact ? "mb-2" : "mb-4")}>
          <div className={cn(
            "rounded-lg flex items-center justify-center border",
            compact ? "w-7 h-7" : "w-9 h-9",
            styles.icon
          )}>
            <Icon className={compact ? "w-3 h-3" : "w-4 h-4"} />
          </div>
        </div>

        <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">{title}</p>

        <div className={cn("font-bold font-mono tracking-tight", compact ? "text-lg" : "text-2xl", styles.value)}>
          R${" "}
          <NumberTicker value={value} decimalPlaces={2} className={styles.value} />
        </div>

        {subtitle && <p className="text-[10px] text-zinc-600 mt-1">{subtitle}</p>}
      </div>

      {open && !isCreditCard && items && (
        <ItemsModal
          title={title}
          items={items}
          itemsLabel={itemsLabel}
          onClose={() => setOpen(false)}
        />
      )}

      {open && isCreditCard && faturas && (
        <CreditCardModal faturas={faturas} onClose={() => setOpen(false)} />
      )}
    </>
  );
}

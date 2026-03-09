"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  ChevronDown,
  ChevronRight,
  X,
  Clock,
  Check,
  Pencil,
  Trash2,
} from "lucide-react";
import { markIncomePaid, updateTransaction, deleteTransaction } from "@/lib/actions/transactions";
import { NumberInput } from "@/components/ui/number-input";
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
  groupByBank?: boolean;
  isIncome?: boolean;
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

function ItemRow({
  item,
  onMarkPaid,
  onMutated,
}: {
  item: ProjectionItem;
  onMarkPaid?: (id: string) => void;
  onMutated?: (id: string, deleted?: boolean) => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isEditing, setIsEditing] = useState(false);
  const [editDesc, setEditDesc] = useState(item.description);
  const [editAmount, setEditAmount] = useState(String(item.amount));
  const [editDate, setEditDate] = useState(item.date);

  function handlePaid() {
    startTransition(async () => {
      await markIncomePaid(item.id);
      onMarkPaid?.(item.id);
    });
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteTransaction(item.id);
      onMutated?.(item.id, true);
      router.refresh();
    });
  }

  function handleSave() {
    const amt = parseFloat(editAmount);
    if (isNaN(amt) || amt <= 0) return;
    startTransition(async () => {
      await updateTransaction(item.id, {
        description: editDesc.trim(),
        amount: amt,
        date: editDate,
      });
      setIsEditing(false);
      onMutated?.(item.id);
      router.refresh();
    });
  }

  if (isEditing) {
    return (
      <div className="flex flex-col gap-2 px-3 py-3 rounded-lg bg-zinc-800/60 border border-zinc-700/50">
        <input
          type="text"
          value={editDesc}
          onChange={(e) => setEditDesc(e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
          autoFocus
        />
        <div className="grid grid-cols-2 gap-2">
          <NumberInput value={editAmount} onChange={setEditAmount} step={0.01} min={0.01} placeholder="0,00" />
          <input
            type="date"
            value={editDate}
            onChange={(e) => setEditDate(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={isPending}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors disabled:opacity-50"
          >
            <Check className="w-3 h-3" />
            {isPending ? "..." : "Salvar"}
          </button>
          <button
            onClick={() => setIsEditing(false)}
            disabled={isPending}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white text-xs transition-colors"
          >
            <X className="w-3 h-3" />
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-zinc-800/50 transition-colors group/row">
      {item.banks && (
        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.banks.color }} />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm text-zinc-200 truncate">{item.description}</p>
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
        <p className="text-[11px] text-zinc-500 mt-0.5">{formatDate(item.date)}</p>
      </div>
      <span className="text-sm font-mono font-medium text-zinc-200 shrink-0">
        R$ {formatCurrency(item.amount)}
      </span>
      {!item.isProjected && (
        <div className="flex items-center gap-0.5 opacity-0 group-hover/row:opacity-100 transition-opacity shrink-0">
          {onMarkPaid && (
            <button
              onClick={handlePaid}
              disabled={isPending}
              className="p-1 rounded-md text-zinc-600 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors disabled:opacity-40"
              title="Marcar como recebido"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={() => setIsEditing(true)}
            disabled={isPending}
            className="p-1 rounded-md text-zinc-600 hover:text-zinc-300 hover:bg-zinc-700/50 transition-colors disabled:opacity-40"
            title="Editar"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="p-1 rounded-md text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40"
            title="Excluir"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

function ItemsModal({
  title,
  items,
  itemsLabel,
  groupByBank,
  isIncome,
  onClose,
}: {
  title: string;
  items: ProjectionItem[];
  itemsLabel?: string;
  groupByBank?: boolean;
  isIncome?: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [localItems, setLocalItems] = useState(items);
  const sorted = [...localItems].sort((a, b) => a.date.localeCompare(b.date));
  const total = localItems.reduce((s, i) => s + i.amount, 0);

  function handleMarkPaid(id: string) {
    setLocalItems((prev) => prev.filter((i) => i.id !== id));
    router.refresh();
  }

  function handleMutated(id: string, deleted?: boolean) {
    if (deleted) setLocalItems((prev) => prev.filter((i) => i.id !== id));
  }

  // Group by bank when requested
  const bankGroups = groupByBank
    ? (() => {
        const map = new Map<string, { id: string; name: string; color: string; items: ProjectionItem[]; total: number }>();
        for (const item of sorted) {
          const key = item.banks?.id ?? "__none__";
          const name = item.banks?.name ?? "Sem banco";
          const color = item.banks?.color ?? "#71717a";
          if (!map.has(key)) map.set(key, { id: key, name, color, items: [], total: 0 });
          const g = map.get(key)!;
          g.items.push(item);
          g.total += item.amount;
        }
        return Array.from(map.values());
      })()
    : null;

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
            {itemsLabel && <p className="text-xs text-zinc-500 mt-0.5">{itemsLabel}</p>}
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1.5">
          {sorted.length === 0 ? (
            <p className="text-zinc-500 text-sm text-center py-8">Nenhum item encontrado</p>
          ) : bankGroups ? (
            // Grouped by bank
            <div className="space-y-2">
              {bankGroups.map((g) => (
                <div key={g.id} className="rounded-xl border border-zinc-800 overflow-hidden">
                  <button
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-800/40 transition-colors text-left"
                    onClick={() => setExpanded(expanded === g.id ? null : g.id)}
                  >
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: g.color }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-200">{g.name}</p>
                      <p className="text-[11px] text-zinc-500">{g.items.length} parcela{g.items.length > 1 ? "s" : ""}</p>
                    </div>
                    <span className="text-sm font-mono font-semibold text-red-400 shrink-0">
                      R$ {formatCurrency(g.total)}
                    </span>
                    {expanded === g.id
                      ? <ChevronDown className="w-4 h-4 text-zinc-500 shrink-0" />
                      : <ChevronRight className="w-4 h-4 text-zinc-500 shrink-0" />}
                  </button>
                  {expanded === g.id && (
                    <div className="border-t border-zinc-800 bg-zinc-950/50 px-1 py-1">
                      {g.items.map((item, i) => <ItemRow key={item.id + i} item={item} />)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            // Flat list
            sorted.map((item, i) => (
              <ItemRow
                key={item.id + i}
                item={item}
                onMarkPaid={isIncome ? handleMarkPaid : undefined}
                onMutated={handleMutated}
              />
            ))
          )}
        </div>

        {/* Footer total */}
        <div className="px-6 py-4 border-t border-zinc-800 shrink-0 flex items-center justify-between">
          <span className="text-xs text-zinc-500 uppercase tracking-widest">Total</span>
          <span className="text-base font-bold font-mono text-white">R$ {formatCurrency(total)}</span>
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
  groupByBank = false,
  isIncome = false,
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
          groupByBank={groupByBank}
          isIncome={isIncome}
          onClose={() => setOpen(false)}
        />
      )}

      {open && isCreditCard && faturas && (
        <CreditCardModal faturas={faturas} onClose={() => setOpen(false)} />
      )}
    </>
  );
}

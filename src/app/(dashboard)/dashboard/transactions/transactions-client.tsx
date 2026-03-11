"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Minus, Trash2, AlertCircle, Sparkles } from "lucide-react"
import { BankLogo } from "@/components/dashboard/bank-logo"
import { deleteTransaction } from "@/lib/actions/transactions"
import type { Bank, TransactionWithRelations } from "@/lib/supabase/types"

const MONTH_LABELS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
]

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  checking: "Conta Corrente",
  savings: "Investimento",
  credit_card: "Cartão de Crédito",
}

interface Props {
  transactions: TransactionWithRelations[]
  banks: Bank[]
  month: string
  upToToday?: boolean
  today?: string
}

export function TransactionsClient({ transactions, banks, month, upToToday = false, today }: Props) {
  const router = useRouter()
  const [localTxs, setLocalTxs] = useState(transactions)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [year, mon] = month.split("-").map(Number)

  const currentMonthStr = today ? today.slice(0, 7) : ""
  const isCurrentMonth = month === currentMonthStr

  function navigate(offset: number) {
    let m = mon + offset
    let y = year
    if (m > 12) { m = 1; y++ }
    if (m < 1) { m = 12; y-- }
    router.push(`/dashboard/transactions?month=${y}-${String(m).padStart(2, "0")}`)
  }

  function setFilter(f: "month" | "today") {
    const base = `/dashboard/transactions?month=${month}`
    router.push(f === "today" ? `${base}&filter=today` : base)
  }

  async function handleDelete(id: string) {
    const snapshot = localTxs
    setLocalTxs((prev) => prev.filter((t) => t.id !== id))
    setDeleteError(null)
    try {
      await deleteTransaction(id)
      router.refresh()
    } catch {
      setLocalTxs(snapshot)
      setDeleteError("Erro ao excluir transação. Tente novamente.")
    }
  }

  const grouped = useMemo(() => {
    const map = new Map<string, TransactionWithRelations[]>()
    for (const t of localTxs) {
      if (!map.has(t.bank_id)) map.set(t.bank_id, [])
      map.get(t.bank_id)!.push(t)
    }
    return Array.from(map.entries())
      .map(([bankId, txs]) => {
        const bankMeta = banks.find((b) => b.id === bankId)
        const total = txs.reduce((s, t) => s + (t.type === "income" ? t.amount : -t.amount), 0)
        return { bankId, bankMeta, txs, total }
      })
      .sort((a, b) => {
        const order = { checking: 0, savings: 1, credit_card: 2 }
        const ao = order[a.bankMeta?.account_type as keyof typeof order] ?? 3
        const bo = order[b.bankMeta?.account_type as keyof typeof order] ?? 3
        if (ao !== bo) return ao - bo
        return (a.txs[0].banks?.name ?? "").localeCompare(b.txs[0].banks?.name ?? "")
      })
  }, [localTxs, banks])

  const totals = useMemo(() => ({
    income: localTxs.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0),
    expense: localTxs.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0),
    investment: localTxs.filter((t) => t.type === "investment").reduce((s, t) => s + t.amount, 0),
  }), [localTxs])

  return (
    <div className="flex-1 min-h-screen bg-zinc-950 p-8">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-zinc-500 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </Link>

          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
            <button
              onClick={() => navigate(-1)}
              className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-white font-semibold text-sm min-w-[140px] text-center">
              {MONTH_LABELS[mon - 1]} {year}
            </span>
            <button
              onClick={() => navigate(1)}
              className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {isCurrentMonth && (
              <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-0.5 gap-0.5">
                <button
                  onClick={() => setFilter("month")}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    !upToToday ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  Mês completo
                </button>
                <button
                  onClick={() => setFilter("today")}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    upToToday ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  Até hoje
                </button>
              </div>
            )}
            <span className="text-zinc-600 text-xs">{transactions.length} mov.</span>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
            <p className="text-[11px] text-zinc-500 uppercase tracking-wider mb-1.5">Receitas</p>
            <p className="text-base font-mono font-semibold text-emerald-400">
              +R$ {totals.income.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
            <p className="text-[11px] text-zinc-500 uppercase tracking-wider mb-1.5">Despesas</p>
            <p className="text-base font-mono font-semibold text-red-400">
              -R$ {totals.expense.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
            <p className="text-[11px] text-zinc-500 uppercase tracking-wider mb-1.5">Aportes</p>
            <p className="text-base font-mono font-semibold text-violet-400">
              -R$ {totals.investment.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Error banner */}
        {deleteError && (
          <div className="flex items-center gap-2 mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {deleteError}
          </div>
        )}

        {/* Groups */}
        {localTxs.length === 0 ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-16 text-center">
            <p className="text-zinc-500 text-sm">Nenhuma transação em {MONTH_LABELS[mon - 1]} {year}.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {grouped.map(({ bankId, bankMeta, txs, total }) => {
              const firstBank = txs[0].banks
              return (
                <div key={bankId} className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
                  {/* Bank header */}
                  <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800/60">
                    <div className="flex items-center gap-3">
                      <BankLogo slug={firstBank?.slug ?? ""} name={firstBank?.name ?? ""} size="sm" />
                      <div>
                        <span className="text-sm font-medium text-white">{firstBank?.name}</span>
                        {bankMeta?.account_type && (
                          <span className="ml-2 text-[10px] text-zinc-600">
                            {ACCOUNT_TYPE_LABELS[bankMeta.account_type] ?? bankMeta.account_type}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-zinc-700 bg-zinc-800 px-1.5 py-0.5 rounded-md">
                        {txs.length}
                      </span>
                    </div>
                    <span className={`text-sm font-mono font-semibold ${total >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {total >= 0 ? "+" : ""}R$ {Math.abs(total).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  {/* Transaction rows */}
                  <div className="divide-y divide-zinc-800/30">
                    {txs.map((t) => (
                      <div
                        key={t.id}
                        className="flex items-center gap-3 px-5 py-2.5 hover:bg-zinc-800/25 transition-colors group"
                      >
                        <div className="w-6 h-6 rounded-md bg-zinc-800/60 flex items-center justify-center flex-shrink-0">
                          {t.type === "income"
                            ? <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                            : t.type === "investment" && t.subtype === "yield"
                            ? <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                            : t.type === "investment"
                            ? <Minus className="w-3.5 h-3.5 text-violet-400" />
                            : <TrendingDown className="w-3.5 h-3.5 text-red-400" />}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white truncate">{t.description}</p>
                          {t.installment_number && (
                            <p className="text-[10px] text-zinc-600">
                              Parcela {t.installment_number}/{t.total_installments}
                            </p>
                          )}
                        </div>

                        <span
                          className="hidden sm:block text-[10px] px-1.5 py-0.5 rounded-full shrink-0"
                          style={{ backgroundColor: (t.categories?.color ?? "#666") + "18", color: t.categories?.color ?? "#666" }}
                        >
                          {t.categories?.name}
                        </span>

                        <span className="text-[11px] text-zinc-600 tabular-nums shrink-0">
                          {new Date(t.date + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                        </span>

                        <span className={`text-sm font-mono font-medium tabular-nums w-28 text-right shrink-0 ${
                          t.type === "income" ? "text-emerald-400"
                          : t.type === "investment" && t.subtype === "yield" ? "text-teal-400"
                          : t.type === "investment" ? "text-violet-400"
                          : "text-red-400"
                        }`}>
                          {t.type === "income" || (t.type === "investment" && t.subtype === "yield") ? "+" : "-"}R$ {t.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </span>

                        <button
                          onClick={() => handleDelete(t.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-zinc-700 hover:text-red-400 transition-all shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

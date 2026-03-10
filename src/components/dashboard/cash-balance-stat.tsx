"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Pencil, Check, X, DollarSign, Calendar } from "lucide-react"
import { NumberTicker } from "@/components/aceternity/number-ticker"
import { BorderBeam } from "@/components/aceternity/border-beam"
import { cn } from "@/lib/utils"
import { NumberInput } from "@/components/ui/number-input"
import { updateBank } from "@/lib/actions/banks"

type BankBalance = {
  id: string
  name: string
  color: string
  current_balance: number
  balance_date?: string
  account_type?: string
  is_active?: boolean
}

interface Props {
  banks: BankBalance[]
  compact?: boolean
  isCurrentMonth?: boolean
}

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function formatDateBR(iso: string) {
  if (!iso) return "—"
  const [y, m, d] = iso.split("-")
  return `${d}/${m}/${y}`
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function EditModal({
  cashBanks,
  onClose,
}: {
  cashBanks: BankBalance[]
  onClose: () => void
}) {
  const router = useRouter()
  const [balances, setBalances] = useState<Record<string, string>>(() => {
    const m: Record<string, string> = {}
    cashBanks.forEach((b) => { m[b.id] = String(b.current_balance ?? 0) })
    return m
  })
  const [dates, setDates] = useState<Record<string, string>>(() => {
    const m: Record<string, string> = {}
    cashBanks.forEach((b) => { m[b.id] = b.balance_date ?? todayStr() })
    return m
  })
  const [isPending, startTransition] = useTransition()

  function handleSave() {
    startTransition(async () => {
      await Promise.all(
        cashBanks.map((b) => {
          const newVal = parseFloat(balances[b.id] ?? String(b.current_balance))
          if (isNaN(newVal)) return Promise.resolve()
          return updateBank(b.id, {
            current_balance: newVal,
            balance_date: dates[b.id] ?? todayStr(),
          })
        })
      )
      onClose()
      router.refresh()
    })
  }

  const totalPreview = cashBanks.reduce((s, b) => {
    const v = parseFloat(balances[b.id] ?? "0")
    return s + (isNaN(v) ? 0 : v)
  }, 0)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-sm shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Conciliar Saldo</p>
              <p className="text-[11px] text-zinc-500">Saldo real por conta</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Banks */}
        <div className="px-5 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {cashBanks.length === 0 && (
            <p className="text-sm text-zinc-500 text-center py-6">Nenhum banco cadastrado</p>
          )}
          {cashBanks.map((b) => (
            <div key={b.id} className="space-y-3">
              {/* Bank name */}
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: b.color }} />
                <span className="text-sm font-medium text-zinc-200">{b.name}</span>
              </div>

              {/* Saldo */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest">
                  Saldo atual
                </label>
                <NumberInput
                  value={balances[b.id] ?? ""}
                  onChange={(v) => setBalances((prev) => ({ ...prev, [b.id]: v }))}
                  step={0.01}
                  placeholder="0,00"
                />
              </div>

              {/* Data */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest flex items-center gap-1">
                  <Calendar className="w-2.5 h-2.5" />
                  Conciliado em
                </label>
                <input
                  type="date"
                  value={dates[b.id] ?? ""}
                  onChange={(e) => setDates((prev) => ({ ...prev, [b.id]: e.target.value }))}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-zinc-500 transition-colors"
                />
              </div>

              {/* Divider between banks */}
              {cashBanks.indexOf(b) < cashBanks.length - 1 && (
                <div className="border-b border-zinc-800 pt-1" />
              )}
            </div>
          ))}
        </div>

        {/* Total preview + footer */}
        <div className="border-t border-zinc-800 px-5 py-4 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-500">Total em caixa</span>
            <span className="font-mono font-semibold text-white">
              R$ {totalPreview.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={isPending}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              {isPending ? "Salvando..." : "Salvar"}
            </button>
            <button
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2.5 rounded-xl border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-600 text-sm transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Card ─────────────────────────────────────────────────────────────────────

export function CashBalanceStat({ banks, compact = false, isCurrentMonth = true }: Props) {
  const [modalOpen, setModalOpen] = useState(false)

  const cashBanks = banks.filter(
    (b) => b.is_active !== false && b.account_type !== "credit_card" && b.account_type !== "savings"
  )
  const total = isCurrentMonth ? cashBanks.reduce((s, b) => s + (b.current_balance ?? 0), 0) : 0

  const latestDate = isCurrentMonth ? cashBanks.reduce((latest, b) => {
    const d = b.balance_date ?? ""
    return d > latest ? d : latest
  }, "") : ""

  function handleClick() {
    if (isCurrentMonth) setModalOpen(true)
  }

  return (
    <>
      <div
        className={cn(
          "relative rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden transition-colors",
          isCurrentMonth ? "group hover:border-zinc-700 cursor-pointer" : "cursor-default",
          compact ? "p-3" : "p-5"
        )}
        onClick={handleClick}
      >
        <BorderBeam colorFrom="#3b82f6" colorTo="#8b5cf6" duration={5} />

        <div className={cn("flex items-start justify-between", compact ? "mb-2" : "mb-4")}>
          <div className={cn(
            "rounded-lg flex items-center justify-center border text-blue-400 bg-blue-500/10 border-blue-500/20",
            compact ? "w-7 h-7" : "w-9 h-9"
          )}>
            <DollarSign className={compact ? "w-3 h-3" : "w-4 h-4"} />
          </div>
          {isCurrentMonth && (
            <button
              onClick={(e) => { e.stopPropagation(); setModalOpen(true) }}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-zinc-600 hover:text-zinc-300"
            >
              <Pencil className="w-3 h-3" />
            </button>
          )}
        </div>

        <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1.5">
          Saldo em Caixa
        </p>

        <div className={cn("font-bold font-mono tracking-tight text-white", compact ? "text-lg" : "text-2xl")}>
          R${" "}
          <NumberTicker value={total} decimalPlaces={2} className="text-white" />
        </div>

        <p className="text-[10px] text-zinc-600 mt-1">
          {!isCurrentMonth
            ? "Mês anterior"
            : latestDate
              ? `Conciliado ${formatDateBR(latestDate)}`
              : cashBanks.length > 0
                ? `${cashBanks.length} conta${cashBanks.length > 1 ? "s" : ""}`
                : "Clique para atualizar"}
        </p>
      </div>

      {modalOpen && isCurrentMonth && (
        <EditModal cashBanks={cashBanks} onClose={() => setModalOpen(false)} />
      )}
    </>
  )
}

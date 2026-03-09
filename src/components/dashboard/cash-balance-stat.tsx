"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Pencil, Check, X, DollarSign } from "lucide-react"
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
}

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

export function CashBalanceStat({ banks, compact = false }: Props) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [balances, setBalances] = useState<Record<string, string>>({})
  const [dates, setDates] = useState<Record<string, string>>({})
  const [isPending, startTransition] = useTransition()

  // Only checking/savings banks count as cash
  const cashBanks = banks.filter(
    (b) => b.is_active !== false && b.account_type !== "credit_card"
  )
  const total = cashBanks.reduce((s, b) => s + (b.current_balance ?? 0), 0)

  function handleEdit() {
    const initialBalances: Record<string, string> = {}
    const initialDates: Record<string, string> = {}
    cashBanks.forEach((b) => {
      initialBalances[b.id] = String(b.current_balance ?? 0)
      initialDates[b.id] = b.balance_date ?? todayStr()
    })
    setBalances(initialBalances)
    setDates(initialDates)
    setEditing(true)
  }

  function handleCancel() {
    setEditing(false)
  }

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
      setEditing(false)
      router.refresh()
    })
  }

  return (
    <div className={cn(
      "relative rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden group hover:border-zinc-700 transition-colors",
      compact ? "p-3" : "p-5"
    )}>
      <BorderBeam colorFrom="#3b82f6" colorTo="#8b5cf6" duration={5} />

      <div className={cn("flex items-start justify-between", compact ? "mb-2" : "mb-4")}>
        <div className={cn(
          "rounded-lg flex items-center justify-center border text-blue-400 bg-blue-500/10 border-blue-500/20",
          compact ? "w-7 h-7" : "w-9 h-9"
        )}>
          <DollarSign className={compact ? "w-3 h-3" : "w-4 h-4"} />
        </div>
        {!editing && (
          <button
            onClick={handleEdit}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-zinc-600 hover:text-zinc-300"
          >
            <Pencil className="w-3 h-3" />
          </button>
        )}
      </div>

      <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1.5">
        Saldo em Caixa
      </p>

      {editing ? (
        <div className="space-y-2">
          {cashBanks.length === 0 && (
            <p className="text-xs text-zinc-600">Nenhum banco cadastrado</p>
          )}
          {cashBanks.map((b) => (
            <div key={b.id} className="space-y-1">
              <div className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: b.color }}
                />
                <span className="text-[10px] text-zinc-400 truncate w-16 shrink-0">{b.name}</span>
                <NumberInput
                  value={balances[b.id] ?? ""}
                  onChange={(v) => setBalances((prev) => ({ ...prev, [b.id]: v }))}
                  step={0.01}
                  placeholder="0,00"
                />
              </div>
              <div className="flex items-center gap-2 pl-4">
                <span className="text-[9px] text-zinc-600 w-16 shrink-0">Conciliado em</span>
                <input
                  type="date"
                  value={dates[b.id] ?? ""}
                  onChange={(e) => setDates((prev) => ({ ...prev, [b.id]: e.target.value }))}
                  className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-1.5 py-0.5 text-[10px] text-zinc-300 focus:outline-none focus:border-zinc-500"
                />
              </div>
            </div>
          ))}
          <div className="flex gap-1.5 pt-1">
            <button
              onClick={handleSave}
              disabled={isPending}
              className="flex items-center gap-1 px-2 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs transition-colors disabled:opacity-50"
            >
              <Check className="w-3 h-3" />
              {isPending ? "..." : "Salvar"}
            </button>
            <button
              onClick={handleCancel}
              disabled={isPending}
              className="flex items-center gap-1 px-2 py-1 rounded border border-zinc-700 text-zinc-400 hover:text-white text-xs transition-colors"
            >
              <X className="w-3 h-3" />
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <div className={cn("font-bold font-mono tracking-tight text-white", compact ? "text-lg" : "text-2xl")}>
          R${" "}
          <NumberTicker value={total} decimalPlaces={2} className="text-white" />
        </div>
      )}

      {!editing && (
        <p className="text-[10px] text-zinc-600 mt-1">
          {cashBanks.length > 0
            ? `${cashBanks.length} conta${cashBanks.length > 1 ? "s" : ""}`
            : "Clique no lápis para atualizar"}
        </p>
      )}
    </div>
  )
}

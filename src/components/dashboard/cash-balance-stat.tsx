"use client"

import { useState, useTransition } from "react"
import { Pencil, Check, X } from "lucide-react"
import { DollarSign } from "lucide-react"
import { NumberTicker } from "@/components/aceternity/number-ticker"
import { BorderBeam } from "@/components/aceternity/border-beam"
import { cn } from "@/lib/utils"
import { NumberInput } from "@/components/ui/number-input"
import { upsertMonthlyCashBalance } from "@/lib/actions/cash-balance"

interface Props {
  value: number
  month: string
  compact?: boolean
}

export function CashBalanceStat({ value, month, compact = false }: Props) {
  const [editing, setEditing] = useState(false)
  const [input, setInput] = useState(String(value))
  const [isPending, startTransition] = useTransition()

  function handleEdit() {
    setInput(String(value))
    setEditing(true)
  }

  function handleCancel() {
    setEditing(false)
  }

  function handleSave() {
    const amount = parseFloat(input.replace(",", "."))
    if (isNaN(amount)) return
    startTransition(async () => {
      await upsertMonthlyCashBalance(month, amount)
      setEditing(false)
    })
  }

  return (
    <div className={cn("relative rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden group hover:border-zinc-700 transition-colors", compact ? "p-3" : "p-5")}>
      <BorderBeam colorFrom="#3b82f6" colorTo="#8b5cf6" duration={5} />

      <div className={cn("flex items-start justify-between", compact ? "mb-2" : "mb-4")}>
        <div className={cn("rounded-lg flex items-center justify-center border text-blue-400 bg-blue-500/10 border-blue-500/20", compact ? "w-7 h-7" : "w-9 h-9")}>
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
          <NumberInput
            value={input}
            onChange={setInput}
            step={0.01}
            autoFocus
            placeholder="0,00"
          />
          <div className="flex gap-1.5">
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
          <NumberTicker value={value} decimalPlaces={2} className="text-white" />
        </div>
      )}

      {!editing && (
        <p className="text-[10px] text-zinc-600 mt-1">Clique no lápis para atualizar</p>
      )}
    </div>
  )
}

"use client"

import { useState } from "react"
import { Target, TrendingUp, Plus, Pencil } from "lucide-react"
import { upsertInvestmentGoal } from "@/lib/actions/goals"

interface GoalWithActual {
  id: string
  month: string
  target_amount: number
  actual_amount: number
}

interface Props {
  goals: GoalWithActual[]
}

const MONTHS_PT = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]

function formatMonth(dateStr: string) {
  const [year, month] = dateStr.split("-")
  return `${MONTHS_PT[parseInt(month) - 1]}/${year.slice(2)}`
}

function currentMonthKey() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`
}

export function GoalsClient({ goals }: Props) {
  const [showModal, setShowModal] = useState(false)
  const [editingMonth, setEditingMonth] = useState(currentMonthKey())
  const [targetAmount, setTargetAmount] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  function openModal(month?: string) {
    const m = month ?? currentMonthKey()
    setEditingMonth(m)
    const existing = goals.find((g) => g.month.startsWith(m.slice(0, 7)))
    setTargetAmount(existing ? existing.target_amount.toString() : "")
    setShowModal(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const amount = parseFloat(targetAmount)
    if (isNaN(amount) || amount <= 0) { setError("Valor inválido"); return }
    setLoading(true)
    setError("")
    try {
      await upsertInvestmentGoal(editingMonth, amount)
      setShowModal(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro")
    } finally {
      setLoading(false)
    }
  }

  const totalTarget = goals.reduce((s, g) => s + g.target_amount, 0)
  const totalActual = goals.reduce((s, g) => s + g.actual_amount, 0)

  return (
    <div className="flex-1 min-h-screen bg-zinc-950 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Metas de Investimento</h1>
            <p className="text-zinc-500 text-sm mt-1">Acompanhe o quanto você está investindo</p>
          </div>
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Definir meta
          </button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">Meta acumulada</p>
            <p className="text-xl font-bold font-mono text-white">
              R$ {totalTarget.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">Investido</p>
            <p className="text-xl font-bold font-mono text-emerald-400">
              R$ {totalActual.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">Atingimento</p>
            <p className="text-xl font-bold font-mono text-violet-400">
              {totalTarget > 0 ? Math.round((totalActual / totalTarget) * 100) : 0}%
            </p>
          </div>
        </div>

        {/* Goals list */}
        {goals.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900/50 p-12 text-center">
            <Target className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-500 text-sm">Nenhuma meta definida ainda.</p>
            <button
              onClick={() => openModal()}
              className="mt-4 text-blue-400 hover:text-blue-300 text-sm"
            >
              Definir meta para este mês →
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {goals.map((goal) => {
              const pct = goal.target_amount > 0 ? Math.min((goal.actual_amount / goal.target_amount) * 100, 100) : 0
              const reached = goal.actual_amount >= goal.target_amount
              return (
                <div key={goal.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${reached ? "bg-emerald-500/10" : "bg-violet-500/10"}`}>
                        {reached ? <TrendingUp className="w-4 h-4 text-emerald-400" /> : <Target className="w-4 h-4 text-violet-400" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{formatMonth(goal.month)}</p>
                        <p className="text-[11px] text-zinc-500">
                          R$ {goal.actual_amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} de R$ {goal.target_amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-sm font-mono font-bold ${reached ? "text-emerald-400" : "text-violet-400"}`}>
                        {Math.round(pct)}%
                      </span>
                      <button
                        onClick={() => openModal(goal.month)}
                        className="p-1.5 text-zinc-600 hover:text-white transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${reached ? "bg-emerald-400" : "bg-violet-400"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-5">Meta de investimento</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Mês</label>
                <input
                  type="month"
                  value={editingMonth.slice(0, 7)}
                  onChange={(e) => setEditingMonth(e.target.value + "-01")}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Meta (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  required
                  placeholder="Ex: 1000,00"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                  autoFocus
                />
              </div>
              {error && <p className="text-red-400 text-xs">{error}</p>}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white text-sm transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {loading ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

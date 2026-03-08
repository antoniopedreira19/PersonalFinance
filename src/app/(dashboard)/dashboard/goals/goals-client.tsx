"use client"

import { useState, useMemo, useTransition } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts"
import {
  Settings2, Plus, X, CalendarIcon, Check,
  TrendingUp, Wallet, Target, ChevronDown, ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/Select"
import { createTransaction } from "@/lib/actions/transactions"
import { upsertInvestmentSettings } from "@/lib/actions/goals"
import type { Bank, Category } from "@/lib/supabase/types"

// ─── Types ────────────────────────────────────────────────────────────────────

interface InvestmentTransaction {
  id: string
  description: string
  amount: number
  date: string
  banks: { name: string; color: string } | null
}

interface Settings {
  goalAmount: number
  initialBalance: number
}

interface Props {
  settings: Settings
  transactions: InvestmentTransaction[]
  banks: Bank[]
  categories: Category[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const RATES = [0.5, 0.75, 1.0, 1.25]
const HORIZONS = [5, 10, 20, 30]
const MONTHS_PT = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
const MONTHS_FULL = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]

// ─── Utils ────────────────────────────────────────────────────────────────────

function futureValue(pv: number, pmt: number, monthlyRatePct: number, years: number): number {
  const n = years * 12
  const r = monthlyRatePct / 100
  if (r === 0) return pv + pmt * n
  const factor = Math.pow(1 + r, n)
  return pv * factor + pmt * (factor - 1) / r
}

function fmtBRL(v: number) {
  return v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtCompact(v: number) {
  if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(2).replace(".", ",")}M`
  if (v >= 1_000) return `R$ ${(v / 1_000).toFixed(1).replace(".", ",")}k`
  return `R$ ${fmtBRL(v)}`
}

// ─── Chart tooltip ────────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: {
  active?: boolean
  payload?: { name: string; value: number; color: string }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-3 shadow-xl text-xs">
      <p className="text-zinc-400 mb-2 font-medium">{label}</p>
      {payload.map((e) => (
        <div key={e.name} className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: e.color }} />
          <span className="text-zinc-400">{e.name}:</span>
          <span className="text-white font-mono font-medium">R$ {fmtBRL(e.value)}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Settings Modal ───────────────────────────────────────────────────────────

function SettingsModal({ settings, onClose }: { settings: Settings; onClose: () => void }) {
  const [goal, setGoal] = useState(settings.goalAmount > 0 ? String(settings.goalAmount) : "")
  const [initial, setInitial] = useState(settings.initialBalance > 0 ? String(settings.initialBalance) : "")
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState("")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const goalAmt = parseFloat(goal.replace(",", ".")) || 0
    const initAmt = parseFloat(initial.replace(",", ".")) || 0
    setError("")
    startTransition(async () => {
      try {
        await upsertInvestmentSettings(goalAmt, initAmt)
        onClose()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao salvar")
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold text-white">Configurar Investimentos</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5">Saldo inicial (R$)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={initial}
              onChange={(e) => setInitial(e.target.value)}
              placeholder="Quanto você já tem investido"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
            />
            <p className="text-[10px] text-zinc-600 mt-1">Patrimônio investido antes de usar este app</p>
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5">Meta de patrimônio (R$)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="Ex: 1.000.000,00"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
            />
            <p className="text-[10px] text-zinc-600 mt-1">Quanto você quer acumular no total</p>
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white text-sm transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={isPending} className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors disabled:opacity-50">
              {isPending ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Aporte Modal ─────────────────────────────────────────────────────────────

function AporteModal({ banks, categories, onClose }: {
  banks: Bank[]
  categories: Category[]
  onClose: () => void
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("")
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [bankId, setBankId] = useState(banks[0]?.id ?? "")
  const [categoryId, setCategoryId] = useState("")
  const [error, setError] = useState("")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const amt = parseFloat(amount)
    if (isNaN(amt) || amt <= 0) { setError("Valor inválido"); return }
    if (!date) { setError("Selecione a data"); return }
    if (!bankId) { setError("Selecione um banco"); return }
    if (!categoryId) { setError("Selecione uma categoria"); return }
    setError("")
    startTransition(async () => {
      try {
        await createTransaction({
          bank_id: bankId,
          category_id: categoryId,
          description: description.trim() || `Aporte ${MONTHS_FULL[date.getMonth()]}`,
          amount: amt,
          type: "investment",
          subtype: "investment",
          date: format(date, "yyyy-MM-dd"),
          notes: null,
        })
        router.refresh()
        onClose()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao salvar")
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold text-white">Registrar Aporte</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Descrição</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: CDB Nubank, Tesouro Direto..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Valor (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                placeholder="0,00"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Data</label>
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      "flex h-9 w-full items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-3 text-sm text-left",
                      !date && "text-zinc-500"
                    )}
                  >
                    <CalendarIcon className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                    {date ? format(date, "dd/MM/yy") : "Data"}
                  </button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-auto p-0">
                  <Calendar mode="single" selected={date} onSelect={setDate} locale={ptBR} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Banco</label>
            <Select value={bankId} onValueChange={setBankId}>
              <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
              <SelectContent>
                {banks.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Categoria</label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
              <SelectContent>
                {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white text-sm transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={isPending} className="flex-1 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition-colors disabled:opacity-50">
              {isPending ? "Salvando..." : "Registrar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function GoalsClient({ settings, transactions, banks, categories }: Props) {
  const [showSettings, setShowSettings] = useState(false)
  const [showAporte, setShowAporte] = useState(false)
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set())

  // ── Derived values
  const totalInvested = useMemo(
    () => transactions.reduce((s, t) => s + t.amount, 0),
    [transactions]
  )
  const currentBalance = settings.initialBalance + totalInvested
  const progress = settings.goalAmount > 0
    ? Math.min((currentBalance / settings.goalAmount) * 100, 100)
    : 0

  // Monthly map for chart + avg calculation
  const monthlyMap = useMemo(() => {
    const map = new Map<string, number>()
    for (const t of transactions) {
      const key = t.date.slice(0, 7)
      map.set(key, (map.get(key) ?? 0) + t.amount)
    }
    return map
  }, [transactions])

  const avgPMT = monthlyMap.size > 0 ? totalInvested / monthlyMap.size : 0

  // Last 12 months chart data
  const chartData = useMemo(() => {
    const now = new Date()
    let cumulative = settings.initialBalance
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1)
      const key = d.toISOString().slice(0, 7)
      const aporte = monthlyMap.get(key) ?? 0
      cumulative += aporte
      return {
        label: `${MONTHS_PT[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`,
        aporte,
        cumulative,
      }
    })
  }, [settings.initialBalance, monthlyMap])

  // Transactions grouped by month for the list
  const groupedTransactions = useMemo(() => {
    const groups = new Map<string, { total: number; items: InvestmentTransaction[] }>()
    for (const t of transactions) {
      const key = t.date.slice(0, 7)
      const existing = groups.get(key)
      if (existing) {
        existing.total += t.amount
        existing.items.push(t)
      } else {
        groups.set(key, { total: t.amount, items: [t] })
      }
    }
    return Array.from(groups.entries()).map(([month, data]) => ({ month, ...data }))
  }, [transactions])

  function toggleMonth(month: string) {
    setExpandedMonths((prev) => {
      const next = new Set(prev)
      if (next.has(month)) next.delete(month)
      else next.add(month)
      return next
    })
  }

  const yAxisMax = settings.goalAmount > 0
    ? Math.max(settings.goalAmount, currentBalance * 1.1)
    : undefined

  return (
    <div className="flex-1 min-h-screen bg-zinc-950 p-8">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* ── Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white tracking-tight">Investimentos</h1>
            <p className="text-sm text-zinc-500 mt-0.5">Acompanhe e projete seu patrimônio</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-600 text-sm transition-colors"
            >
              <Settings2 className="w-3.5 h-3.5" />
              Configurar
            </button>
            <button
              onClick={() => setShowAporte(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Registrar Aporte
            </button>
          </div>
        </div>

        {/* ── Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                <Wallet className="w-3.5 h-3.5 text-violet-400" />
              </div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Patrimônio</p>
            </div>
            <p className="text-xl font-bold font-mono text-white">R$ {fmtBRL(currentBalance)}</p>
            {settings.initialBalance > 0 && (
              <p className="text-[10px] text-zinc-600 mt-1">
                Inicial: R$ {fmtBRL(settings.initialBalance)}
              </p>
            )}
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Aportes</p>
            </div>
            <p className="text-xl font-bold font-mono text-emerald-400">R$ {fmtBRL(totalInvested)}</p>
            <p className="text-[10px] text-zinc-600 mt-1">{transactions.length} registros</p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <Target className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Meta</p>
            </div>
            {settings.goalAmount > 0 ? (
              <>
                <p className="text-xl font-bold font-mono text-blue-400">R$ {fmtBRL(settings.goalAmount)}</p>
                <p className="text-[10px] text-zinc-600 mt-1">
                  Falta: R$ {fmtBRL(Math.max(settings.goalAmount - currentBalance, 0))}
                </p>
              </>
            ) : (
              <button onClick={() => setShowSettings(true)} className="text-sm text-zinc-600 hover:text-zinc-400 transition-colors">
                Definir meta →
              </button>
            )}
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <Check className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Progresso</p>
            </div>
            <p className="text-xl font-bold font-mono text-amber-400">{progress.toFixed(1)}%</p>
            <p className="text-[10px] text-zinc-600 mt-1">
              {avgPMT > 0 ? `Média: R$ ${fmtBRL(avgPMT)}/mês` : "Nenhum aporte ainda"}
            </p>
          </div>
        </div>

        {/* ── Progress bar */}
        {settings.goalAmount > 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-zinc-400">Progresso até a meta</span>
              <span className="text-xs font-mono text-white">{fmtCompact(currentBalance)} / {fmtCompact(settings.goalAmount)}</span>
            </div>
            <div className="w-full bg-zinc-800 rounded-full h-2.5 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${progress}%`,
                  background: progress >= 100
                    ? "#10b981"
                    : `linear-gradient(90deg, #8b5cf6 0%, ${progress > 60 ? "#3b82f6" : "#8b5cf6"} 100%)`,
                }}
              />
            </div>
            {avgPMT > 0 && settings.goalAmount > currentBalance && (
              <p className="text-[10px] text-zinc-600 mt-2">
                {(() => {
                  const remaining = settings.goalAmount - currentBalance
                  const months = Math.ceil(remaining / avgPMT)
                  const years = Math.floor(months / 12)
                  const rem = months % 12
                  if (years === 0) return `Aproximadamente ${months} meses no ritmo atual (sem rendimentos)`
                  return `Aproximadamente ${years} ano${years > 1 ? "s" : ""}${rem > 0 ? ` e ${rem} mês${rem > 1 ? "es" : ""}` : ""} no ritmo atual (sem rendimentos)`
                })()}
              </p>
            )}
          </div>
        )}

        {/* ── Evolution chart */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-medium text-white">Evolução dos Investimentos</h3>
              <p className="text-xs text-zinc-500 mt-0.5">Últimos 12 meses — patrimônio acumulado</p>
            </div>
            <div className="flex items-center gap-4 text-[11px] text-zinc-500">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-violet-400" />
                Aporte mensal
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                Patrimônio total
              </span>
              {settings.goalAmount > 0 && (
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-emerald-500" />
                  Meta
                </span>
              )}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={230}>
            <ComposedChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="gradCumulative" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: "#52525b", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fill: "#52525b", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
                width={52}
                domain={yAxisMax ? [0, yAxisMax] : ["auto", "auto"]}
              />
              <Tooltip content={<ChartTooltip />} />
              {settings.goalAmount > 0 && (
                <ReferenceLine
                  y={settings.goalAmount}
                  stroke="#10b981"
                  strokeDasharray="6 3"
                  strokeWidth={1.5}
                  label={{ value: "Meta", position: "right", fill: "#10b981", fontSize: 10 }}
                />
              )}
              <Bar dataKey="aporte" name="Aporte mensal" fill="#8b5cf6" fillOpacity={0.7} radius={[3, 3, 0, 0]} maxBarSize={32} />
              <Line
                type="monotone"
                dataKey="cumulative"
                name="Patrimônio total"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: "#3b82f6", strokeWidth: 0 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* ── Projection table */}
        {(currentBalance > 0 || avgPMT > 0) && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <div className="mb-5">
              <h3 className="text-sm font-medium text-white">Projeção de Patrimônio</h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Se você continuar aportando{" "}
                <span className="text-violet-400 font-medium">R$ {fmtBRL(avgPMT)}/mês</span>{" "}
                em média — a partir do patrimônio atual de{" "}
                <span className="text-blue-400 font-medium">R$ {fmtBRL(currentBalance)}</span>
              </p>
            </div>

            {/* Grid header */}
            <div className="grid grid-cols-5 gap-2 mb-2">
              <div className="text-[10px] text-zinc-600 uppercase tracking-widest pt-1">Taxa</div>
              {HORIZONS.map((h) => (
                <div key={h} className="text-center">
                  <p className="text-xs font-medium text-zinc-300">{h} anos</p>
                  <p className="text-[10px] text-zinc-600">{h * 12} meses</p>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              {RATES.map((rate, ri) => {
                const colors = [
                  { bg: "bg-blue-500/5 border-blue-500/15", badge: "bg-blue-500/10 text-blue-400", value: "text-blue-300", div: "text-blue-400/70" },
                  { bg: "bg-violet-500/5 border-violet-500/15", badge: "bg-violet-500/10 text-violet-400", value: "text-violet-300", div: "text-violet-400/70" },
                  { bg: "bg-emerald-500/5 border-emerald-500/15", badge: "bg-emerald-500/10 text-emerald-400", value: "text-emerald-300", div: "text-emerald-400/70" },
                  { bg: "bg-amber-500/5 border-amber-500/15", badge: "bg-amber-500/10 text-amber-400", value: "text-amber-300", div: "text-amber-400/70" },
                ][ri]

                return (
                  <div key={rate} className={cn("grid grid-cols-5 gap-2 rounded-xl border p-3", colors.bg)}>
                    <div className="flex items-center">
                      <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full", colors.badge)}>
                        {rate.toFixed(2).replace(".", ",")}% a.m.
                      </span>
                    </div>
                    {HORIZONS.map((h) => {
                      const fv = futureValue(currentBalance, avgPMT, rate, h)
                      const monthlyDiv = fv * (rate / 100)
                      return (
                        <div key={h} className="text-center">
                          <p className={cn("text-sm font-bold font-mono", colors.value)}>{fmtCompact(fv)}</p>
                          <p className={cn("text-[10px] font-mono mt-0.5", colors.div)}>
                            {fmtCompact(monthlyDiv)}/mês
                          </p>
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>

            <p className="text-[10px] text-zinc-700 mt-3">
              * Projeção usa juros compostos com aporte mensal constante. Dividendos estimados = patrimônio × taxa mensal.
              Não considera inflação, impostos ou variações de mercado.
            </p>
          </div>
        )}

        {/* ── Contributions list */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-medium text-white">Aportes Registrados</h3>
              <p className="text-xs text-zinc-500 mt-0.5">{transactions.length} registros no total</p>
            </div>
            <button
              onClick={() => setShowAporte(true)}
              className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 transition-colors"
            >
              <Plus className="w-3 h-3" />
              Novo aporte
            </button>
          </div>

          {groupedTransactions.length === 0 ? (
            <div className="py-10 text-center">
              <TrendingUp className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
              <p className="text-zinc-500 text-sm">Nenhum aporte registrado ainda</p>
              <button
                onClick={() => setShowAporte(true)}
                className="mt-3 text-violet-400 hover:text-violet-300 text-sm transition-colors"
              >
                Registrar primeiro aporte →
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {groupedTransactions.map(({ month, total, items }) => {
                const isExpanded = expandedMonths.has(month)
                const [y, m] = month.split("-").map(Number)
                const label = `${MONTHS_FULL[m - 1]} ${y}`
                return (
                  <div key={month} className="border border-zinc-800 rounded-xl overflow-hidden">
                    <button
                      onClick={() => toggleMonth(month)}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-800/40 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {isExpanded
                          ? <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
                          : <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />}
                        <span className="text-sm text-zinc-200">{label}</span>
                        <span className="text-[10px] text-zinc-600">{items.length} aporte{items.length > 1 ? "s" : ""}</span>
                      </div>
                      <span className="text-sm font-mono font-semibold text-violet-400">
                        R$ {fmtBRL(total)}
                      </span>
                    </button>
                    {isExpanded && (
                      <div className="border-t border-zinc-800/60 divide-y divide-zinc-800/40">
                        {items.map((t) => (
                          <div key={t.id} className="flex items-center gap-3 px-4 py-2.5 pl-10">
                            {t.banks && (
                              <div
                                className="w-1.5 h-1.5 rounded-full shrink-0"
                                style={{ backgroundColor: t.banks.color }}
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-zinc-300 truncate">{t.description}</p>
                              <p className="text-[10px] text-zinc-600">
                                {new Date(t.date + "T00:00:00").toLocaleDateString("pt-BR")}
                                {t.banks && ` · ${t.banks.name}`}
                              </p>
                            </div>
                            <span className="text-xs font-mono text-zinc-400">R$ {fmtBRL(t.amount)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>

      {/* ── Modals */}
      {showSettings && (
        <SettingsModal settings={settings} onClose={() => setShowSettings(false)} />
      )}
      {showAporte && (
        <AporteModal banks={banks} categories={categories} onClose={() => setShowAporte(false)} />
      )}
    </div>
  )
}

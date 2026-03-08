"use client"

import { useRouter } from "next/navigation"
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface DailyData {
  day: string
  balance: number
  income: number
  expenses: number
}

interface Props {
  data: DailyData[]
  month: string // YYYY-MM
}

const MONTH_LABELS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
]

function formatMonth(ym: string) {
  const [year, mon] = ym.split("-").map(Number)
  return `${MONTH_LABELS[mon - 1]} ${year}`
}

function shiftMonth(ym: string, delta: number) {
  const [year, mon] = ym.split("-").map(Number)
  const d = new Date(year, mon - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

const CustomTooltip = ({
  active, payload, label,
}: {
  active?: boolean
  payload?: { name: string; value: number; color: string }[]
  label?: string
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-3 shadow-xl text-xs">
        <p className="text-zinc-400 mb-2 font-medium">Dia {label}</p>
        {payload.map((entry) => (
          <div key={entry.name} className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-zinc-400 capitalize">{entry.name}:</span>
            <span className="text-zinc-100 font-mono font-medium">
              R$ {entry.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

export function BalanceChart({ data, month }: Props) {
  const router = useRouter()
  const prevMonth = shiftMonth(month, -1)
  const nextMonth = shiftMonth(month, +1)
  const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`
  const isCurrentMonth = month === currentMonth

  return (
    <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-5">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-medium text-white">Evolução do Saldo</h3>
          <p className="text-xs text-zinc-500 mt-0.5">Dia a dia — {formatMonth(month)}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-5 text-[11px] text-zinc-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              Saldo
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Receitas
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-400" />
              Despesas
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => router.push(`?month=${prevMonth}`)}
              className="w-7 h-7 rounded-md border border-zinc-700 flex items-center justify-center text-zinc-500 hover:text-white hover:border-zinc-600 transition-all"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => router.push(`?month=${nextMonth}`)}
              disabled={isCurrentMonth}
              className="w-7 h-7 rounded-md border border-zinc-700 flex items-center justify-center text-zinc-500 hover:text-white hover:border-zinc-600 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="gradBalance" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradIncome" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradExpenses" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.12} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
          <XAxis
            dataKey="day"
            tick={{ fill: "#52525b", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            interval={2}
          />
          <YAxis
            tick={{ fill: "#52525b", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
            width={48}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="balance" name="saldo" stroke="#3b82f6" strokeWidth={2} fill="url(#gradBalance)" dot={false} activeDot={{ r: 4, fill: "#3b82f6", strokeWidth: 0 }} />
          <Area type="monotone" dataKey="income" name="receitas" stroke="#10b981" strokeWidth={2} fill="url(#gradIncome)" dot={false} activeDot={{ r: 4, fill: "#10b981", strokeWidth: 0 }} />
          <Area type="monotone" dataKey="expenses" name="despesas" stroke="#ef4444" strokeWidth={2} fill="url(#gradExpenses)" dot={false} activeDot={{ r: 4, fill: "#ef4444", strokeWidth: 0 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

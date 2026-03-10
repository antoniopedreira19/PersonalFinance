import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"

const MONTH_LABELS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
]

function computeMonth(month: string, offset: number) {
  const [year, mon] = month.split("-").map(Number)
  let m = mon + offset
  let y = year
  if (m > 12) { m = 1; y++ }
  if (m < 1) { m = 12; y-- }
  return `${y}-${String(m).padStart(2, "0")}`
}

export function MonthNav({ month, basePath = "/dashboard" }: { month: string; basePath?: string }) {
  const [year, mon] = month.split("-").map(Number)

  return (
    <div className="flex items-center gap-1 mt-0.5">
      <Link
        href={`${basePath}?month=${computeMonth(month, -1)}`}
        className="p-0.5 rounded text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
      </Link>
      <span className="text-sm text-zinc-500 min-w-[100px] text-center">
        {MONTH_LABELS[mon - 1]} {year}
      </span>
      <Link
        href={`${basePath}?month=${computeMonth(month, 1)}`}
        className="p-0.5 rounded text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
      >
        <ChevronRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  )
}

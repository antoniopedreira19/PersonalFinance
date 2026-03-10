"use client"

import { useState } from "react"
import { X, TrendingDown } from "lucide-react"
import { BankLogo } from "@/components/dashboard/bank-logo"

interface CategoryTx {
  description: string
  date: string
  amount: number
  banks: { name: string; color: string; slug: string }
}

interface CategoryData {
  name: string
  color: string
  amount: number
  percentage: number
  transactions?: CategoryTx[]
}

function CategoryModal({
  category,
  onClose,
}: {
  category: CategoryData
  onClose: () => void
}) {
  const txs = category.transactions ?? []

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: category.color }} />
            <div>
              <h3 className="text-sm font-semibold text-white">{category.name}</h3>
              <p className="text-[11px] text-zinc-500">{txs.length} transação(ões)</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-mono font-semibold text-red-400">
              -R$ {category.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>
            <button
              onClick={onClose}
              className="p-1 text-zinc-500 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Transactions */}
        <div className="max-h-[60vh] overflow-y-auto">
          {txs.length === 0 ? (
            <div className="p-8 text-center text-zinc-600 text-sm">Sem transações.</div>
          ) : (
            <div className="divide-y divide-zinc-800/40">
              {txs.map((t, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3">
                  <div className="w-6 h-6 rounded-md bg-zinc-800/60 flex items-center justify-center flex-shrink-0">
                    <TrendingDown className="w-3.5 h-3.5 text-red-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{t.description}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <BankLogo slug={t.banks.slug} name={t.banks.name} size="sm" />
                      <span className="text-[10px] text-zinc-600">{t.banks.name}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-mono text-red-400">
                      -R$ {t.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-[10px] text-zinc-600">
                      {new Date(t.date + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function CategoryBreakdown({ categories }: { categories: CategoryData[] }) {
  const [selected, setSelected] = useState<CategoryData | null>(null)
  const total = categories.reduce((s, c) => s + c.amount, 0)

  return (
    <>
      <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-5 h-full">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-sm font-medium text-white">Por Categoria</h3>
            <p className="text-xs text-zinc-500 mt-0.5">Este mês</p>
          </div>
        </div>

        {categories.length === 0 ? (
          <div className="py-8 text-center text-zinc-600 text-sm">Sem despesas este mês</div>
        ) : (
          <div className="space-y-4">
            {categories.map((cat) => (
              <div
                key={cat.name}
                className="cursor-pointer group"
                onClick={() => setSelected(cat)}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                    <span className="text-xs text-zinc-300 group-hover:text-white transition-colors">{cat.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-zinc-500">{cat.percentage.toFixed(1)}%</span>
                    <span className="text-xs font-mono text-zinc-300 group-hover:text-white transition-colors w-20 text-right">
                      R$ {cat.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
                <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${cat.percentage}%`, backgroundColor: cat.color, opacity: 0.85 }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-5 pt-4 border-t border-zinc-800 flex justify-between items-center">
          <span className="text-xs text-zinc-500">Total despesas</span>
          <span className="text-sm font-mono font-semibold text-white">
            R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {selected && (
        <CategoryModal category={selected} onClose={() => setSelected(null)} />
      )}
    </>
  )
}

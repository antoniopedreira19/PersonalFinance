interface CategoryData {
  name: string
  color: string
  amount: number
  percentage: number
}

export function CategoryBreakdown({ categories }: { categories: CategoryData[] }) {
  const total = categories.reduce((s, c) => s + c.amount, 0)

  return (
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
            <div key={cat.name}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                  <span className="text-xs text-zinc-300">{cat.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-zinc-500">{cat.percentage.toFixed(1)}%</span>
                  <span className="text-xs font-mono text-zinc-300 w-20 text-right">
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
  );
}

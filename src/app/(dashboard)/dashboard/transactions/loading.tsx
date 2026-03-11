export default function TransactionsLoading() {
  return (
    <div className="flex-1 min-h-screen bg-zinc-950 p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="h-4 w-20 bg-zinc-800 rounded animate-pulse" />
          <div className="h-5 w-36 bg-zinc-800 rounded animate-pulse" />
          <div className="h-4 w-16 bg-zinc-800 rounded animate-pulse" />
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-xl bg-zinc-900 border border-zinc-800 p-4 animate-pulse">
              <div className="h-2.5 w-16 bg-zinc-800 rounded mb-2" />
              <div className="h-5 w-24 bg-zinc-700 rounded" />
            </div>
          ))}
        </div>

        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden animate-pulse">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800/60">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-zinc-800" />
                  <div className="h-4 w-28 bg-zinc-800 rounded" />
                </div>
                <div className="h-4 w-20 bg-zinc-800 rounded" />
              </div>
              {[...Array(4)].map((_, j) => (
                <div key={j} className="flex items-center gap-3 px-5 py-2.5 border-b border-zinc-800/30 last:border-0">
                  <div className="w-6 h-6 rounded-md bg-zinc-800 shrink-0" />
                  <div className="flex-1 space-y-1">
                    <div className="h-3.5 w-40 bg-zinc-800 rounded" />
                  </div>
                  <div className="h-3 w-20 bg-zinc-800 rounded" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

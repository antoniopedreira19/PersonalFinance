export default function SettingsLoading() {
  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="h-6 w-24 bg-zinc-800 rounded animate-pulse mb-8" />

      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl bg-zinc-900 border border-zinc-800 p-5 animate-pulse">
            <div className="flex items-center justify-between mb-4">
              <div className="h-4 w-28 bg-zinc-800 rounded" />
              <div className="h-7 w-16 bg-zinc-800 rounded" />
            </div>
            <div className="space-y-3">
              {[...Array(2)].map((_, j) => (
                <div key={j} className="flex items-center gap-3 py-2 border-t border-zinc-800/50">
                  <div className="w-8 h-8 rounded-lg bg-zinc-800 shrink-0" />
                  <div className="flex-1 space-y-1">
                    <div className="h-3 w-24 bg-zinc-800 rounded" />
                    <div className="h-2.5 w-16 bg-zinc-800/60 rounded" />
                  </div>
                  <div className="h-3 w-14 bg-zinc-800 rounded" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

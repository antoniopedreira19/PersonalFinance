export default function GoalsLoading() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="h-6 w-24 bg-zinc-800 rounded animate-pulse" />
        <div className="h-8 w-32 bg-zinc-800 rounded animate-pulse" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="rounded-xl bg-zinc-900 border border-zinc-800 p-5 animate-pulse">
            <div className="h-3 w-20 bg-zinc-800 rounded mb-3" />
            <div className="h-7 w-32 bg-zinc-700 rounded mb-2" />
            <div className="h-2 w-full bg-zinc-800 rounded-full mt-4" />
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="rounded-xl bg-zinc-900 border border-zinc-800 p-4 animate-pulse flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-3.5 w-24 bg-zinc-800 rounded" />
              <div className="h-2.5 w-16 bg-zinc-800/60 rounded" />
            </div>
            <div className="h-5 w-20 bg-zinc-700 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}

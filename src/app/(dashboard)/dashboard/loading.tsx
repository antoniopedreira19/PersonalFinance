export default function DashboardLoading() {
  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="h-6 w-32 bg-zinc-800 rounded animate-pulse" />
        <div className="h-8 w-40 bg-zinc-800 rounded animate-pulse" />
        <div className="h-8 w-24 bg-zinc-800 rounded animate-pulse" />
      </div>

      <div className="grid grid-cols-8 gap-3 mb-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="rounded-xl bg-zinc-900 border border-zinc-800 p-3 animate-pulse">
            <div className="h-2.5 w-12 bg-zinc-800 rounded mb-2" />
            <div className="h-5 w-16 bg-zinc-700 rounded" />
          </div>
        ))}
      </div>

      <div className="h-24 rounded-xl bg-zinc-900 border border-zinc-800 mb-4 animate-pulse" />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 rounded-xl bg-zinc-900 border border-zinc-800 p-5 animate-pulse">
          <div className="h-4 w-40 bg-zinc-800 rounded mb-5" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-zinc-800 shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-3/4 bg-zinc-800 rounded" />
                <div className="h-2.5 w-1/3 bg-zinc-800/60 rounded" />
              </div>
              <div className="h-3 w-16 bg-zinc-800 rounded self-center" />
            </div>
          ))}
        </div>
        <div className="lg:col-span-2 rounded-xl bg-zinc-900 border border-zinc-800 p-5 animate-pulse">
          <div className="h-4 w-28 bg-zinc-800 rounded mb-5" />
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 mb-4">
              <div className="w-2.5 h-2.5 rounded-full bg-zinc-700 shrink-0" />
              <div className="flex-1 h-1.5 bg-zinc-800 rounded-full" />
              <div className="h-3 w-14 bg-zinc-800 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

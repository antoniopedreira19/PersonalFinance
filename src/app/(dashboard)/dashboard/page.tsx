import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardHeader } from "@/components/layout/dashboard-header"
import { StatsCard } from "@/components/dashboard/stats-card"
import { CashBalanceStat } from "@/components/dashboard/cash-balance-stat"
import { ClickableStatCard } from "@/components/dashboard/clickable-stat-card"
import { BalanceChart } from "@/components/dashboard/balance-chart"
import { TransactionList } from "@/components/dashboard/transaction-list"
import { CategoryBreakdown } from "@/components/dashboard/category-breakdown"
import { DashboardActionTabs } from "@/components/dashboard/dashboard-tabs"
import {
  getMonthlyProjection,
  getCreditCardFaturas,
  getRecentTransactions,
  getCategoryBreakdown,
  getDailyChartData,
  getBanks,
  getCategories,
  getRecurringTemplates,
} from "@/lib/queries/dashboard"

const MONTH_LABELS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
]

// ─── Deferred server components ───────────────────────────────────────────────

async function ChartSection({
  dataPromise,
  month,
}: {
  dataPromise: ReturnType<typeof getDailyChartData>
  month: string
}) {
  const data = await dataPromise
  return (
    <div className="mb-6">
      <BalanceChart data={data} month={month} />
    </div>
  )
}

type Reconciliation = { balance: number; date: string }

async function BottomSection({
  txPromise,
  catPromise,
}: {
  txPromise: ReturnType<typeof getRecentTransactions>
  catPromise: ReturnType<typeof getCategoryBreakdown>
}) {
  const [transactions, categories] = await Promise.all([txPromise, catPromise])
  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
      <div className="lg:col-span-3">
        <TransactionList transactions={transactions} />
      </div>
      <div className="lg:col-span-2">
        <CategoryBreakdown categories={categories} />
      </div>
    </div>
  )
}

// ─── Skeletons ────────────────────────────────────────────────────────────────

function ChartSkeleton() {
  return (
    <div className="mb-6 rounded-xl bg-zinc-900 border border-zinc-800 p-5 animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-2">
          <div className="h-4 w-36 bg-zinc-800 rounded" />
          <div className="h-3 w-28 bg-zinc-800/60 rounded" />
        </div>
        <div className="h-7 w-24 bg-zinc-800/60 rounded-lg" />
      </div>
      <div className="h-[220px] bg-zinc-800/40 rounded-lg" />
    </div>
  )
}

function BottomSkeleton() {
  return (
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
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const params = await searchParams
  const now = new Date()
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  const monthParam = params.month ?? currentMonthStr

  const [year, mon] = monthParam.split("-").map(Number)
  const monthDate = new Date(year, mon - 1, 1)
  const monthLabel = `${MONTH_LABELS[mon - 1]} ${year}`

  // Fast queries — await immediately so header + stats render without delay
  const [projection, faturas, banks, categories, recurringTemplates] = await Promise.all([
    getMonthlyProjection(monthDate),
    getCreditCardFaturas(),
    getBanks(),
    getCategories(),
    getRecurringTemplates(),
  ])

  const cashBanks = banks.filter((b) => b.is_active && b.account_type !== "credit_card")
  const cashBalance = cashBanks.reduce((s, b) => s + (Number(b.current_balance) ?? 0), 0)

  // Reconciliation anchor: total cash balance on the latest balance_date among cash banks
  const reconciliation: Reconciliation | undefined = cashBanks.length > 0 ? {
    balance: cashBalance,
    date: cashBanks.reduce((latest, b) => {
      const d = b.balance_date ?? ""
      return d > latest ? d : latest
    }, ""),
  } : undefined

  // Heavy queries — start but don't await; stream via Suspense
  const chartDataPromise = getDailyChartData(monthDate, reconciliation)
  const recentTxPromise = getRecentTransactions()
  const categoryBreakdownPromise = getCategoryBreakdown(monthDate)

  const totalFatura = faturas.reduce((s, f) => s + f.fatura, 0)
  const resultado = cashBalance - projection.totalFixed - projection.totalInstallments - projection.totalDaily

  return (
    <div className="p-8">
      <DashboardHeader title="Dashboard" subtitle={monthLabel} userEmail={user.email}>
        <DashboardActionTabs banks={banks} categories={categories} recurringTemplates={recurringTemplates} />
      </DashboardHeader>

      {/* Stats — 7 cards em linha única */}
      <div className="grid grid-cols-7 gap-3 mb-6">
        <CashBalanceStat banks={banks} compact />
        <ClickableStatCard
          title="Receita A Receber"
          value={projection.totalReceber}
          icon="TrendingUp"
          variant="green"
          items={projection.receberItems}
          itemsLabel={`${projection.receberItems.filter(i => i.isProjected).length} previsto(s) · ${projection.receberItems.filter(i => !i.isProjected).length} pendente(s)`}
          isIncome
          compact
        />
        <ClickableStatCard
          title="Despesas Fixas"
          value={projection.totalFixed}
          icon="TrendingDown"
          variant="red"
          items={projection.fixedItems}
          itemsLabel={`Recorrentes do mês · ${projection.fixedItems.filter(i => i.isProjected).length} previsto(s)`}
          compact
        />
        <ClickableStatCard
          title="Despesas Parceladas"
          value={projection.totalInstallments}
          icon="DollarSign"
          variant="red"
          items={projection.installmentItems}
          itemsLabel="Parcelas do mês"
          groupByBank
          compact
        />
        <ClickableStatCard
          title="Despesas do Dia"
          value={projection.totalDaily}
          icon="TrendingDown"
          variant="red"
          items={projection.dailyItems}
          itemsLabel="Gastos variáveis"
          compact
        />
        <StatsCard
          title="Resultado"
          value={resultado}
          prefix="R$ "
          icon="DollarSign"
          variant={resultado >= 0 ? "green" : "red"}
          trendLabel="Caixa + Receitas − Despesas"
          compact
        />
        <ClickableStatCard
          title="Comprometidas"
          value={totalFatura}
          icon="CreditCard"
          variant={totalFatura > 0 ? "red" : "default"}
          isCreditCard
          faturas={faturas}
          subtitle={faturas.length > 0 ? `${faturas.length} cartão(ões)` : "Nenhum cartão"}
          compact
        />
      </div>

      {/* Chart: streams in as data resolves */}
      <Suspense fallback={<ChartSkeleton />}>
        <ChartSection dataPromise={chartDataPromise} month={monthParam} />
      </Suspense>

      {/* Bottom row: streams in as data resolves */}
      <Suspense fallback={<BottomSkeleton />}>
        <BottomSection txPromise={recentTxPromise} catPromise={categoryBreakdownPromise} />
      </Suspense>
    </div>
  )
}

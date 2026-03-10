import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardHeader } from "@/components/layout/dashboard-header"
import { StatsCard } from "@/components/dashboard/stats-card"
import { CashBalanceStat } from "@/components/dashboard/cash-balance-stat"
import { ClickableStatCard } from "@/components/dashboard/clickable-stat-card"
import { TransactionList } from "@/components/dashboard/transaction-list"
import { CategoryBreakdown } from "@/components/dashboard/category-breakdown"
import { DashboardActionTabs } from "@/components/dashboard/dashboard-tabs"
import { MonthNav } from "@/components/dashboard/month-nav"
import { SpendingScenarios } from "@/components/dashboard/spending-scenarios"
import {
  getMonthlyProjection,
  getCreditCardFaturas,
  getRecentTransactions,
  getCategoryBreakdown,
  getBanks,
  getCategories,
  getRecurringTemplates,
  getMonthlyInvestmentGoal,
} from "@/lib/queries/dashboard"

// ─── Deferred server components ───────────────────────────────────────────────

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
  const isCurrentMonth = monthParam === currentMonthStr

  const [year, mon] = monthParam.split("-").map(Number)
  const monthDate = new Date(year, mon - 1, 1)

  // Fast queries — await immediately so header + stats render without delay
  const [projection, faturas, banks, categories, recurringTemplates, investmentGoal] = await Promise.all([
    getMonthlyProjection(monthDate),
    getCreditCardFaturas(monthParam),
    getBanks(),
    getCategories(),
    getRecurringTemplates(),
    getMonthlyInvestmentGoal(monthParam),
  ])

  const cashBanks = banks.filter((b) => b.is_active && b.account_type !== "credit_card" && b.account_type !== "savings")
  const cashBalance = isCurrentMonth
    ? cashBanks.reduce((s, b) => s + (Number(b.current_balance) ?? 0), 0)
    : 0

  // Heavy queries — start but don't await; stream via Suspense
  const recentTxPromise = getRecentTransactions()
  const categoryBreakdownPromise = getCategoryBreakdown(monthDate)

  const totalFatura = faturas.reduce((s, f) => s + f.fatura, 0)
  const resultado = cashBalance
    + projection.totalReceber
    - projection.totalFixed
    - projection.totalInstallments
    - projection.totalDaily

  const bankOptions = banks.map(b => ({ id: b.id, name: b.name, color: b.color, account_type: b.account_type ?? undefined }))

  return (
    <div className="p-8">
      <DashboardHeader title="Dashboard" nav={<MonthNav month={monthParam} />} userEmail={user.email}>
        <DashboardActionTabs banks={banks} categories={categories} recurringTemplates={recurringTemplates} />
      </DashboardHeader>

      {/* Stats — 8 cards em linha única */}
      <div className="grid grid-cols-8 gap-3 mb-6">
        <CashBalanceStat banks={banks} compact isCurrentMonth={isCurrentMonth} />
        <ClickableStatCard
          title="Receita A Receber"
          value={projection.totalReceber}
          icon="TrendingUp"
          variant="green"
          items={projection.receberItems}
          itemsLabel={`${projection.receberItems.filter(i => i.isProjected).length} previsto(s) · ${projection.receberItems.filter(i => !i.isProjected).length} pendente(s)`}
          isIncome
          banks={bankOptions}
          compact
        />
        <ClickableStatCard
          title="Despesas Fixas"
          value={projection.totalFixed}
          icon="TrendingDown"
          variant="red"
          items={projection.fixedItems}
          itemsLabel={`Recorrentes do mês · ${projection.fixedItems.filter(i => i.isProjected).length} previsto(s)`}
          groupByBank
          banks={bankOptions}
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
          banks={bankOptions}
          compact
        />
        <ClickableStatCard
          title="Despesas do Dia"
          value={projection.totalDaily}
          icon="TrendingDown"
          variant="red"
          items={projection.dailyItems}
          itemsLabel="Gastos variáveis"
          banks={bankOptions}
          compact
        />
        <ClickableStatCard
          title="Aportes"
          value={projection.totalInvestments}
          icon="BarChart2"
          variant="purple"
          items={projection.investmentItems}
          itemsLabel={investmentGoal > 0
            ? `Meta: R$ ${investmentGoal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
            : `${projection.investmentItems.length} aporte(s)`}
          subtitle={investmentGoal > 0
            ? `${Math.round((projection.totalInvestments / investmentGoal) * 100)}% da meta`
            : undefined}
          groupByBank
          banks={bankOptions}
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
        <StatsCard
          title="Resultado"
          value={resultado}
          prefix="R$ "
          icon="DollarSign"
          variant={resultado >= 0 ? "green" : "red"}
          trendLabel="Caixa + Receitas − Despesas"
          compact
        />
      </div>

      {/* Spending scenarios */}
      <div className="mb-4">
        <SpendingScenarios
          totalIncome={projection.totalAllIncome}
          totalExpenses={projection.totalFixed + projection.totalInstallments + projection.totalDaily}
        />
      </div>

      {/* Bottom row: streams in as data resolves */}
      <Suspense fallback={<BottomSkeleton />}>
        <BottomSection txPromise={recentTxPromise} catPromise={categoryBreakdownPromise} />
      </Suspense>
    </div>
  )
}

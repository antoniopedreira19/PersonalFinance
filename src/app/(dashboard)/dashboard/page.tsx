import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { StatsCard } from "@/components/dashboard/stats-card";
import { BalanceChart } from "@/components/dashboard/balance-chart";
import { TransactionList } from "@/components/dashboard/transaction-list";
import { CategoryBreakdown } from "@/components/dashboard/category-breakdown";
import { DashboardActionTabs } from "@/components/dashboard/dashboard-tabs";
import {
  getDashboardStats,
  getTotalBalance,
  getRecentTransactions,
  getCategoryBreakdown,
  getMonthlyChartData,
  getBanks,
  getCategories,
  getRecurringTemplates,
} from "@/lib/queries/dashboard";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [stats, totalBalance, recentTransactions, categoryBreakdown, monthlyData, banks, categories, recurringTemplates] =
    await Promise.all([
      getDashboardStats(),
      getTotalBalance(),
      getRecentTransactions(9),
      getCategoryBreakdown(),
      getMonthlyChartData(6),
      getBanks(),
      getCategories(),
      getRecurringTemplates(),
    ]);

  const savingsRate =
    stats.income > 0
      ? ((stats.income - stats.expenses - stats.investments) / stats.income) * 100
      : 0;

  return (
    <div className="p-8">
      <DashboardHeader title="Dashboard" userEmail={user.email}>
        <DashboardActionTabs banks={banks} categories={categories} recurringTemplates={recurringTemplates} />
      </DashboardHeader>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard
          title="Saldo em Caixa"
          value={totalBalance}
          prefix="R$ "
          icon="DollarSign"
          variant="default"
        />
        <StatsCard
          title="Receitas do Mês"
          value={stats.income}
          prefix="R$ "
          icon="TrendingUp"
          variant="green"
        />
        <StatsCard
          title="Despesas do Mês"
          value={stats.expenses}
          prefix="R$ "
          icon="TrendingDown"
          variant="red"
        />
        <StatsCard
          title="Taxa de Poupança"
          value={savingsRate}
          suffix="%"
          icon="Percent"
          variant="purple"
          decimalPlaces={1}
        />
      </div>

      {/* Balance Chart */}
      <div className="mb-6">
        <BalanceChart data={monthlyData} />
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3">
          <TransactionList transactions={recentTransactions} />
        </div>
        <div className="lg:col-span-2">
          <CategoryBreakdown categories={categoryBreakdown} />
        </div>
      </div>
    </div>
  );
}

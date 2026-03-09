import { createClient } from "@/lib/supabase/server"
import type { TransactionWithRelations } from "@/lib/supabase/types"

function monthRange(date: Date) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1)
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0)
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  }
}

export type ProjectionItem = {
  id: string
  description: string
  amount: number
  date: string
  subtype?: string | null
  installment_number?: number | null
  total_installments?: number | null
  is_paid?: boolean
  isProjected?: true
  banks: { id: string; name: string; color: string } | null
  categories?: { id: string; name: string; color: string; icon: string } | null
}

export async function getMonthlyProjection(month: Date) {
  const supabase = await createClient()
  const { start, end } = monthRange(month)

  const [{ data: transactions }, { data: templates }] = await Promise.all([
    supabase
      .from("transactions")
      .select("id, type, subtype, amount, date, description, is_paid, recurring_template_id, installment_number, total_installments, banks(id, name, color), categories(id, name, color, icon)")
      .gte("date", start)
      .lte("date", end),
    supabase
      .from("recurring_templates")
      .select("id, type, amount, description, day_of_month, banks(id, name, color)")
      .eq("is_active", true)
      .lte("start_date", end),
  ])

  const coveredTemplateIds = new Set(
    (transactions ?? []).map((t) => t.recurring_template_id).filter(Boolean)
  )
  const monthPrefix = start.slice(0, 7)

  const allIncomeTransactions = (transactions ?? []).filter((t) => t.type === "income")
  const unpaidIncomeTransactions = allIncomeTransactions.filter((t) => !t.is_paid)
  const projectedIncomeTemplates = (templates ?? [])
    .filter((t) => t.type === "income" && !coveredTemplateIds.has(t.id))
    .map((t) => ({ ...t, isProjected: true as const, date: `${monthPrefix}-${String(t.day_of_month).padStart(2, "0")}`, subtype: "recurring", categories: null }))
  const totalReceber = [...unpaidIncomeTransactions, ...projectedIncomeTemplates].reduce((s, t) => s + t.amount, 0)

  const fixedTransactions = (transactions ?? []).filter((t) => t.type === "expense" && t.recurring_template_id !== null)
  const projectedFixedTemplates = (templates ?? [])
    .filter((t) => t.type === "expense" && !coveredTemplateIds.has(t.id))
    .map((t) => ({ ...t, isProjected: true as const, date: `${monthPrefix}-${String(t.day_of_month).padStart(2, "0")}`, subtype: "recurring", categories: null }))
  const totalFixed = [...fixedTransactions, ...projectedFixedTemplates].reduce((s, t) => s + t.amount, 0)

  const installmentTransactions = (transactions ?? []).filter((t) => t.type === "expense" && t.subtype === "installment")
  const totalInstallments = installmentTransactions.reduce((s, t) => s + t.amount, 0)

  const dailyTransactions = (transactions ?? []).filter(
    (t) => t.type === "expense" && !t.recurring_template_id && t.subtype !== "installment"
  )
  const totalDaily = dailyTransactions.reduce((s, t) => s + t.amount, 0)

  return {
    totalReceber,
    totalFixed,
    totalInstallments,
    totalDaily,
    receberItems: [...unpaidIncomeTransactions, ...projectedIncomeTemplates] as unknown as ProjectionItem[],
    fixedItems: [...fixedTransactions, ...projectedFixedTemplates] as unknown as ProjectionItem[],
    installmentItems: installmentTransactions as unknown as ProjectionItem[],
    dailyItems: dailyTransactions as unknown as ProjectionItem[],
  }
}

export async function getCreditCardFaturas() {
  const supabase = await createClient()
  const today = new Date()

  const { data: banks } = await supabase
    .from("banks")
    .select("id, name, color, closing_day, payment_due_day")
    .eq("account_type", "credit_card")
    .eq("is_active", true)

  if (!banks || banks.length === 0) return []

  const results = await Promise.all(
    banks.map(async (bank) => {
      const closingDay = bank.closing_day ?? 1
      const d = today.getDate()
      let cycleStart: Date, cycleEnd: Date
      if (d > closingDay) {
        cycleStart = new Date(today.getFullYear(), today.getMonth(), closingDay + 1)
        cycleEnd = new Date(today.getFullYear(), today.getMonth() + 1, closingDay)
      } else {
        cycleStart = new Date(today.getFullYear(), today.getMonth() - 1, closingDay + 1)
        cycleEnd = new Date(today.getFullYear(), today.getMonth(), closingDay)
      }

      const { data } = await supabase
        .from("transactions")
        .select("amount, description, date")
        .eq("bank_id", bank.id)
        .eq("type", "expense")
        .gte("date", cycleStart.toISOString().slice(0, 10))
        .lte("date", cycleEnd.toISOString().slice(0, 10))
        .order("date", { ascending: false })

      return {
        bankId: bank.id,
        bankName: bank.name,
        bankColor: bank.color,
        closingDay,
        paymentDueDay: bank.payment_due_day as number | null,
        fatura: (data ?? []).reduce((s, t) => s + t.amount, 0),
        transactions: (data ?? []) as Array<{ amount: number; description: string; date: string }>,
      }
    })
  )

  return results
}

export async function getMonthlyCashBalance(month: string): Promise<number> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("monthly_cash_balances")
    .select("cash_balance")
    .eq("month", month)
    .maybeSingle()
  return data?.cash_balance ?? 0
}

export async function getRecentTransactions(): Promise<TransactionWithRelations[]> {
  const supabase = await createClient()
  const today = new Date()
  const fiveDaysAgo = new Date(today)
  fiveDaysAgo.setDate(today.getDate() - 4) // today + 4 previous days = 5 days total
  const from = fiveDaysAgo.toISOString().slice(0, 10)
  const to = today.toISOString().slice(0, 10)

  const { data } = await supabase
    .from("transactions")
    .select("id, description, amount, type, subtype, date, notes, bank_id, category_id, user_id, created_at, installment_number, total_installments, installment_group_id, recurring_template_id, banks(id, name, slug, color), categories(id, name, color, icon)")
    .gte("date", from)
    .lte("date", to)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(10)

  return (data ?? []) as unknown as TransactionWithRelations[]
}

export async function getCategoryBreakdown(month?: Date) {
  const supabase = await createClient()
  const { start, end } = monthRange(month ?? new Date())

  const { data } = await supabase
    .from("transactions")
    .select("amount, categories(id, name, color)")
    .eq("type", "expense")
    .gte("date", start)
    .lte("date", end)

  if (!data || data.length === 0) return []

  const map = new Map<string, { name: string; color: string; amount: number }>()
  for (const t of data) {
    const cat = (Array.isArray(t.categories) ? t.categories[0] : t.categories) as { id: string; name: string; color: string } | null
    if (!cat) continue
    const existing = map.get(cat.id)
    if (existing) existing.amount += t.amount
    else map.set(cat.id, { name: cat.name, color: cat.color, amount: t.amount })
  }

  const total = Array.from(map.values()).reduce((s, c) => s + c.amount, 0)
  return Array.from(map.values())
    .map((c) => ({ ...c, percentage: total > 0 ? (c.amount / total) * 100 : 0 }))
    .sort((a, b) => b.amount - a.amount)
}

export async function getDailyChartData(
  month: Date,
  reconciliation?: { balance: number; date: string },
) {
  const supabase = await createClient()
  const { start, end } = monthRange(month)
  const lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()

  const [{ data: transactions }, { data: templates }] = await Promise.all([
    supabase
      .from("transactions")
      .select("type, amount, date, recurring_template_id")
      .gte("date", start)
      .lte("date", end),
    supabase
      .from("recurring_templates")
      .select("id, type, amount, day_of_month")
      .eq("is_active", true)
      .lte("start_date", end),
  ])

  const coveredTemplateIds = new Set(
    (transactions ?? []).map((t) => t.recurring_template_id).filter(Boolean)
  )

  type DayEntry = { income: number; expenses: number }
  const dayMap = new Map<number, DayEntry>()
  for (let d = 1; d <= lastDay; d++) {
    dayMap.set(d, { income: 0, expenses: 0 })
  }

  for (const t of transactions ?? []) {
    const day = parseInt(t.date.slice(8, 10))
    const entry = dayMap.get(day)!
    if (t.type === "income") entry.income += t.amount
    else entry.expenses += t.amount
  }

  for (const tpl of templates ?? []) {
    if (coveredTemplateIds.has(tpl.id)) continue
    const day = Math.min(tpl.day_of_month, lastDay)
    const entry = dayMap.get(day)!
    if (tpl.type === "income") entry.income += tpl.amount
    else entry.expenses += tpl.amount
  }

  // Build prefix net: prefixNet[d] = cumulative net at end of day d (index 0 = before day 1)
  const prefixNet: number[] = [0]
  for (let d = 1; d <= lastDay; d++) {
    const { income, expenses } = dayMap.get(d)!
    prefixNet.push(prefixNet[d - 1] + income - expenses)
  }

  // Determine anchor: which day index and balance to anchor on
  let anchorDay = 0 // default: before month start
  if (reconciliation) {
    const recDate = new Date(reconciliation.date + "T00:00:00")
    if (
      recDate.getFullYear() === month.getFullYear() &&
      recDate.getMonth() === month.getMonth()
    ) {
      anchorDay = Math.min(recDate.getDate(), lastDay)
    }
  }

  const offset = reconciliation ? reconciliation.balance - prefixNet[anchorDay] : 0

  return Array.from(dayMap.entries()).map(([day, { income, expenses }]) => ({
    day: String(day),
    income,
    expenses,
    balance: prefixNet[day] + offset,
  }))
}

// Single query for all months instead of N sequential queries
export async function getMonthlyChartData(months = 6) {
  const supabase = await createClient()
  const now = new Date()
  const earliest = new Date(now.getFullYear(), now.getMonth() - months + 1, 1)
  const { start: rangeStart } = monthRange(earliest)
  const { end: rangeEnd } = monthRange(now)

  const { data } = await supabase
    .from("transactions")
    .select("type, amount, date")
    .gte("date", rangeStart)
    .lte("date", rangeEnd)

  const monthMap = new Map<string, { month: string; income: number; expenses: number; investments: number }>()
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = d.toISOString().slice(0, 7)
    const label = d.toLocaleString("pt-BR", { month: "short" })
    monthMap.set(key, { month: label, income: 0, expenses: 0, investments: 0 })
  }

  for (const t of data ?? []) {
    const key = t.date.slice(0, 7)
    const entry = monthMap.get(key)
    if (!entry) continue
    if (t.type === "income") entry.income += t.amount
    else if (t.type === "expense") entry.expenses += t.amount
    else if (t.type === "investment") entry.investments += t.amount
  }

  return Array.from(monthMap.values()).map(({ month, income, expenses, investments }) => ({
    month,
    income,
    expenses,
    investments,
    balance: income - expenses - investments,
  }))
}

export async function getTransactions(filters?: {
  month?: string
  bankId?: string
  categoryId?: string
  type?: string
}): Promise<TransactionWithRelations[]> {
  const supabase = await createClient()
  let query = supabase
    .from("transactions")
    .select("*, banks(id, name, slug, color), categories(id, name, color, icon)")
    .order("date", { ascending: false })

  if (filters?.month) {
    const [year, month] = filters.month.split("-").map(Number)
    const start = new Date(year, month - 1, 1).toISOString().slice(0, 10)
    const end = new Date(year, month, 0).toISOString().slice(0, 10)
    query = query.gte("date", start).lte("date", end)
  }
  if (filters?.bankId) query = query.eq("bank_id", filters.bankId)
  if (filters?.categoryId) query = query.eq("category_id", filters.categoryId)
  if (filters?.type) query = query.eq("type", filters.type)

  const { data } = await query
  return (data ?? []) as TransactionWithRelations[]
}

export async function getBanks() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("banks")
    .select("id, name, slug, color, current_balance, balance_date, is_active, account_type, closing_day, payment_due_day, created_at, user_id")
    .order("created_at")
  return data ?? []
}

export async function getCategories(type?: "income" | "expense") {
  const supabase = await createClient()
  let query = supabase.from("categories").select("id, name, type, color, icon, user_id, created_at").order("name")
  if (type) query = query.eq("type", type)
  const { data } = await query
  return data ?? []
}

export async function getRecurringTemplates(type?: "income" | "expense") {
  const supabase = await createClient()
  let query = supabase
    .from("recurring_templates")
    .select("id, description, amount, type, day_of_month, is_active, start_date, banks(id, name, color), categories(id, name, color)")
    .order("created_at", { ascending: false })
  if (type) query = query.eq("type", type)
  const { data } = await query
  return (data ?? []) as unknown as Array<{
    id: string
    description: string
    amount: number
    type: string
    day_of_month: number
    is_active: boolean
    start_date: string
    banks: { id: string; name: string; color: string }
    categories: { id: string; name: string; color: string }
  }>
}

export async function getInvestmentSettings() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("investment_settings")
    .select("goal_amount, initial_balance, target_date")
    .maybeSingle()
  return {
    goalAmount: data?.goal_amount ?? 0,
    initialBalance: data?.initial_balance ?? 0,
    targetDate: (data?.target_date as string | null) ?? null,
  }
}

export async function getAllInvestmentTransactions() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("transactions")
    .select("id, description, amount, date, banks(name, color)")
    .eq("type", "investment")
    .order("date", { ascending: false })
  return (data ?? []) as unknown as Array<{
    id: string
    description: string
    amount: number
    date: string
    banks: { name: string; color: string } | null
  }>
}

// Parallel queries instead of sequential
export async function getInvestmentGoals(months = 6) {
  const supabase = await createClient()
  const from = new Date()
  from.setMonth(from.getMonth() - months + 1)
  from.setDate(1)
  const fromStr = from.toISOString().slice(0, 10)

  const [{ data: goals }, { data: investments }] = await Promise.all([
    supabase
      .from("investment_goals")
      .select("*")
      .gte("month", fromStr)
      .order("month", { ascending: false }),
    supabase
      .from("transactions")
      .select("amount, date")
      .eq("type", "investment")
      .gte("date", fromStr),
  ])

  const map = new Map<string, number>()
  for (const t of investments ?? []) {
    const key = t.date.slice(0, 7)
    map.set(key, (map.get(key) ?? 0) + t.amount)
  }

  return (goals ?? []).map((g) => ({
    ...g,
    actual_amount: map.get(g.month.slice(0, 7)) ?? 0,
  }))
}

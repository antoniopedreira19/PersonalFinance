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

export async function getDashboardStats(month?: Date) {
  const supabase = await createClient()
  const { start, end } = monthRange(month ?? new Date())

  const { data } = await supabase
    .from("transactions")
    .select("type, amount")
    .gte("date", start)
    .lte("date", end)

  const income = data?.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0) ?? 0
  const expenses = data?.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0) ?? 0
  const investments = data?.filter((t) => t.type === "investment").reduce((s, t) => s + t.amount, 0) ?? 0
  const cashBalance = income - expenses - investments

  return { income, expenses, investments, cashBalance }
}

export async function getTotalBalance() {
  const supabase = await createClient()
  const { data } = await supabase.from("banks").select("current_balance").eq("is_active", true)
  return data?.reduce((s, b) => s + b.current_balance, 0) ?? 0
}

export async function getRecentTransactions(limit = 10): Promise<TransactionWithRelations[]> {
  const supabase = await createClient()
  const { start, end } = monthRange(new Date())

  const { data } = await supabase
    .from("transactions")
    .select("*, banks(id, name, slug, color), categories(id, name, color, icon)")
    .gte("date", start)
    .lte("date", end)
    .order("date", { ascending: false })
    .limit(limit)

  return (data ?? []) as TransactionWithRelations[]
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

export async function getMonthlyChartData(months = 6) {
  const supabase = await createClient()
  const results = []
  const now = new Date()

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const { start, end } = monthRange(d)
    const { data } = await supabase
      .from("transactions")
      .select("type, amount")
      .gte("date", start)
      .lte("date", end)

    const income = data?.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0) ?? 0
    const expenses = data?.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0) ?? 0
    const investments = data?.filter((t) => t.type === "investment").reduce((s, t) => s + t.amount, 0) ?? 0

    results.push({
      month: d.toLocaleString("pt-BR", { month: "short" }),
      income,
      expenses,
      investments,
      balance: income - expenses - investments,
    })
  }

  return results
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
  const { data } = await supabase.from("banks").select("*").order("created_at")
  return data ?? []
}

export async function getCategories(type?: "income" | "expense") {
  const supabase = await createClient()
  let query = supabase.from("categories").select("*").order("name")
  if (type) query = query.eq("type", type)
  const { data } = await query
  return data ?? []
}

export async function getRecurringTemplates(type?: "income" | "expense") {
  const supabase = await createClient()
  let query = supabase
    .from("recurring_templates")
    .select("*, banks(id, name, color), categories(id, name, color)")
    .order("created_at", { ascending: false })
  if (type) query = query.eq("type", type)
  const { data } = await query
  return (data ?? []) as Array<{
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

export async function getInvestmentGoals(months = 6) {
  const supabase = await createClient()
  const from = new Date()
  from.setMonth(from.getMonth() - months + 1)
  from.setDate(1)

  const { data: goals } = await supabase
    .from("investment_goals")
    .select("*")
    .gte("month", from.toISOString().slice(0, 10))
    .order("month", { ascending: false })

  const { data: investments } = await supabase
    .from("transactions")
    .select("amount, date")
    .eq("type", "investment")
    .gte("date", from.toISOString().slice(0, 10))

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

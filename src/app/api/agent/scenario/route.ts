import { NextRequest, NextResponse } from "next/server"
import { validateAgentKey, createAdminClient } from "@/lib/agent-auth"

function monthRange(date: Date) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().slice(0, 10)
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().slice(0, 10)
  return { start, end }
}

function getProfile(ratio: number): "economista" | "intermediario" | "consumista" {
  if (ratio <= 60) return "economista"
  if (ratio <= 80) return "intermediario"
  return "consumista"
}

// GET /api/agent/scenario?userId=<uuid>&month=YYYY-MM
export async function GET(req: NextRequest) {
  if (!validateAgentKey(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = req.nextUrl.searchParams.get("userId")
  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 })
  }

  const monthParam = req.nextUrl.searchParams.get("month")
  const ref = monthParam
    ? new Date(parseInt(monthParam.slice(0, 4)), parseInt(monthParam.slice(5, 7)) - 1, 1)
    : new Date()

  const { start, end } = monthRange(ref)
  const supabase = createAdminClient()

  const [{ data: transactions }, { data: templates }] = await Promise.all([
    supabase
      .from("transactions")
      .select("type, amount, date, is_paid, recurring_template_id")
      .eq("user_id", userId)
      .gte("date", start)
      .lte("date", end),
    supabase
      .from("recurring_templates")
      .select("id, type, amount, day_of_month")
      .eq("user_id", userId)
      .eq("is_active", true)
      .lte("start_date", end),
  ])

  const coveredTemplateIds = new Set(
    (transactions ?? []).map((t) => t.recurring_template_id).filter(Boolean)
  )
  const monthPrefix = start.slice(0, 7)

  const allIncomeTransactions = (transactions ?? []).filter((t) => t.type === "income")
  const projectedIncomeTemplates = (templates ?? [])
    .filter((t) => t.type === "income" && !coveredTemplateIds.has(t.id))
    .map((t) => ({ amount: t.amount, date: `${monthPrefix}-${String(t.day_of_month).padStart(2, "0")}` }))
  const totalAllIncome = [...allIncomeTransactions, ...projectedIncomeTemplates].reduce((s, t) => s + t.amount, 0)

  const expenseTransactions = (transactions ?? []).filter((t) => t.type === "expense")
  const projectedExpenseTemplates = (templates ?? [])
    .filter((t) => t.type === "expense" && !coveredTemplateIds.has(t.id))
    .map((t) => ({ amount: t.amount }))
  const totalExpenses = [...expenseTransactions, ...projectedExpenseTemplates].reduce((s, t) => s + t.amount, 0)

  const ratio = totalAllIncome > 0 ? (totalExpenses / totalAllIncome) * 100 : 0
  const profile = getProfile(ratio)

  const fmt = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })

  const profileLabels = {
    economista: "Economista 🟢",
    intermediario: "Intermediário 🟡",
    consumista: "Consumista 🔴",
  }

  const toEconomista = totalAllIncome > 0 ? Math.max(0, totalExpenses - totalAllIncome * 0.6) : 0

  return NextResponse.json({
    profile,
    profileLabel: profileLabels[profile],
    ratio: parseFloat(ratio.toFixed(1)),
    totalIncome: fmt.format(totalAllIncome),
    totalExpenses: fmt.format(totalExpenses),
    toEconomista: toEconomista > 0 ? fmt.format(toEconomista) : null,
    month: monthPrefix,
  })
}

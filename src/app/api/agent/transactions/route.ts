import { NextRequest, NextResponse } from "next/server"
import { validateAgentKey, createAdminClient } from "@/lib/agent-auth"

// GET /api/agent/transactions?userId=<uuid>&limit=5
export async function GET(req: NextRequest) {
  if (!validateAgentKey(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = req.nextUrl.searchParams.get("userId")
  const limit = parseInt(req.nextUrl.searchParams.get("limit") ?? "5")

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("transactions")
    .select("id, description, amount, type, date, banks(name), categories(name)")
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const fmt = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })
  const transactions = (data ?? []).map((t) => {
    const bank = Array.isArray(t.banks) ? t.banks[0] : t.banks
    const cat = Array.isArray(t.categories) ? t.categories[0] : t.categories
    return {
      id: t.id,
      description: t.description,
      amount: fmt.format(t.amount),
      type: t.type,
      date: t.date,
      bank: (bank as { name: string } | null)?.name ?? null,
      category: (cat as { name: string } | null)?.name ?? null,
    }
  })

  return NextResponse.json({ transactions })
}

// POST /api/agent/transactions
// Body: { userId, description, amount, type, date, categoryName?, bankId? }
export async function POST(req: NextRequest) {
  if (!validateAgentKey(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const { userId, description, amount, type, date, categoryName, bankId } = body

  if (!userId || !description || !amount || !type || !date) {
    return NextResponse.json({ error: "userId, description, amount, type, date are required" }, { status: 400 })
  }

  if (!["income", "expense", "investment"].includes(type)) {
    return NextResponse.json({ error: "type must be income, expense, or investment" }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Resolve category_id by name if provided
  let categoryId: string | null = null
  if (categoryName) {
    const { data: cat } = await supabase
      .from("categories")
      .select("id")
      .eq("user_id", userId)
      .ilike("name", categoryName)
      .maybeSingle()
    categoryId = cat?.id ?? null
  }

  // If no bankId provided, pick first active bank for this user
  let resolvedBankId = bankId ?? null
  if (!resolvedBankId) {
    const { data: bank } = await supabase
      .from("banks")
      .select("id")
      .eq("user_id", userId)
      .eq("is_active", true)
      .neq("account_type", "credit_card")
      .order("created_at")
      .limit(1)
      .maybeSingle()
    resolvedBankId = bank?.id ?? null
  }

  if (!resolvedBankId) {
    return NextResponse.json({ error: "No active bank found for user" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("transactions")
    .insert({
      user_id: userId,
      description,
      amount: parseFloat(amount),
      type,
      date,
      bank_id: resolvedBankId,
      category_id: categoryId,
      is_paid: true,
    })
    .select("id")
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, transactionId: data.id })
}

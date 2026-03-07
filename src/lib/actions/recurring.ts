"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

/** Given a day_of_month and a Date, return YYYY-MM-DD clamped to the last day of that month */
function dateForMonth(dayOfMonth: number, ref: Date): string {
  const year = ref.getFullYear()
  const month = ref.getMonth()
  const lastDay = new Date(year, month + 1, 0).getDate()
  const day = Math.min(dayOfMonth, lastDay)
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
}

export async function createRecurringTemplate(data: {
  bank_id: string
  category_id: string
  description: string
  amount: number
  type: "income" | "expense"
  day_of_month: number
  start_month: string // "YYYY-MM"
  notes?: string | null
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Não autenticado")

  const startDate = `${data.start_month}-01`

  // Create the recurring template
  const { data: template, error: tplError } = await supabase
    .from("recurring_templates")
    .insert({
      user_id: user.id,
      bank_id: data.bank_id,
      category_id: data.category_id,
      description: data.description,
      amount: data.amount,
      type: data.type,
      day_of_month: data.day_of_month,
      start_date: startDate,
      is_active: true,
    })
    .select()
    .single()

  if (tplError) throw new Error(tplError.message)

  // Generate the transaction for the start month
  const ref = new Date(startDate + "T00:00:00")
  const txDate = dateForMonth(data.day_of_month, ref)

  const { error: txError } = await supabase.from("transactions").insert({
    user_id: user.id,
    bank_id: data.bank_id,
    category_id: data.category_id,
    description: data.description,
    amount: data.amount,
    type: data.type,
    subtype: data.type === "income" ? "recurring" : "fixed",
    date: txDate,
    recurring_template_id: template.id,
    notes: data.notes || null,
  })

  if (txError) throw new Error(txError.message)

  revalidatePath("/dashboard")
  revalidatePath("/dashboard/transactions")
}

export async function toggleRecurringTemplate(id: string, isActive: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Não autenticado")

  const { error } = await supabase
    .from("recurring_templates")
    .update({ is_active: isActive })
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) throw new Error(error.message)

  revalidatePath("/dashboard")
}

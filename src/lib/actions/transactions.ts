"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import type { TransactionInsert } from "@/lib/supabase/types"

export async function createTransaction(data: Omit<TransactionInsert, "user_id">) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Não autenticado")

  const { error } = await supabase.from("transactions").insert({ ...data, user_id: user.id })
  if (error) throw new Error(error.message)

  revalidatePath("/dashboard")
  revalidatePath("/dashboard/transactions")
}

export async function createInstallmentTransaction(
  base: { bank_id: string; category_id: string; description: string; amount: number; notes?: string | null },
  startDate: string,
  totalInstallments: number,
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Não autenticado")

  const groupId = crypto.randomUUID()
  const rows: TransactionInsert[] = []

  for (let i = 0; i < totalInstallments; i++) {
    const d = new Date(startDate)
    d.setMonth(d.getMonth() + i)
    rows.push({
      ...base,
      user_id: user.id,
      date: d.toISOString().slice(0, 10),
      installment_group_id: groupId,
      installment_number: i + 1,
      total_installments: totalInstallments,
      subtype: "installment",
      type: "expense",
    })
  }

  const { error } = await supabase.from("transactions").insert(rows)
  if (error) throw new Error(error.message)

  revalidatePath("/dashboard")
  revalidatePath("/dashboard/transactions")
}

export async function updateTransaction(id: string, data: Partial<TransactionInsert>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Não autenticado")

  const { error } = await supabase.from("transactions").update(data).eq("id", id).eq("user_id", user.id)
  if (error) throw new Error(error.message)

  revalidatePath("/dashboard")
  revalidatePath("/dashboard/transactions")
}

export async function deleteTransaction(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Não autenticado")

  const { error } = await supabase.from("transactions").delete().eq("id", id).eq("user_id", user.id)
  if (error) throw new Error(error.message)

  revalidatePath("/dashboard")
  revalidatePath("/dashboard/transactions")
}

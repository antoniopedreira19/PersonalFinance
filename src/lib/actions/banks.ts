"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import type { BankInsert } from "@/lib/supabase/types"

export async function createBank(data: Omit<BankInsert, "user_id"> & { account_type?: string; closing_day?: number | null; payment_due_day?: number | null }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Não autenticado")

  const { error } = await supabase.from("banks").insert({ ...data, user_id: user.id })
  if (error) throw new Error(error.message)
  revalidatePath("/dashboard/settings")
}

export async function updateBank(id: string, data: { name?: string; current_balance?: number; balance_date?: string; is_active?: boolean; account_type?: string; closing_day?: number | null; payment_due_day?: number | null }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Não autenticado")

  const { error } = await supabase.from("banks").update(data).eq("id", id).eq("user_id", user.id)
  if (error) throw new Error(error.message)
  revalidatePath("/dashboard/settings")
  revalidatePath("/dashboard")
}

export async function deleteBank(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Não autenticado")

  const { error } = await supabase.from("banks").delete().eq("id", id).eq("user_id", user.id)
  if (error) throw new Error(error.message)
  revalidatePath("/dashboard/settings")
  revalidatePath("/dashboard")
}

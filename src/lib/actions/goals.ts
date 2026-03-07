"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

export async function upsertInvestmentGoal(month: string, targetAmount: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Não autenticado")

  const { error } = await supabase
    .from("investment_goals")
    .upsert(
      { user_id: user.id, month, target_amount: targetAmount },
      { onConflict: "user_id,month" }
    )

  if (error) throw new Error(error.message)
  revalidatePath("/dashboard/goals")
  revalidatePath("/dashboard")
}

export async function deleteInvestmentGoal(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Não autenticado")

  const { error } = await supabase.from("investment_goals").delete().eq("id", id).eq("user_id", user.id)
  if (error) throw new Error(error.message)
  revalidatePath("/dashboard/goals")
}

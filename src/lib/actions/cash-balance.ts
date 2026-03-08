"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function upsertMonthlyCashBalance(month: string, amount: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Não autenticado")

  const { error } = await supabase
    .from("monthly_cash_balances")
    .upsert(
      { user_id: user.id, month, cash_balance: amount },
      { onConflict: "user_id,month" }
    )

  if (error) throw new Error(error.message)
  revalidatePath("/dashboard")
}

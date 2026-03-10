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

export async function upsertInvestmentSettings(
  goalAmount: number,
  initialBalance: number,
  targetDate: string | null,
  bankId: string | null,
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Não autenticado")

  // Get current settings to compute initial_balance delta
  const { data: existing } = await supabase
    .from("investment_settings")
    .select("initial_balance, bank_id")
    .eq("user_id", user.id)
    .maybeSingle()

  const oldInitial = existing?.initial_balance ?? 0
  const oldBankId = existing?.bank_id ?? null

  // If the bank changed, remove the initial balance contribution from the old bank
  if (oldBankId && oldBankId !== bankId) {
    await supabase.rpc("increment_bank_balance", { p_bank_id: oldBankId, p_delta: -oldInitial })
  }

  // For the new (or same) bank: set balance = initialBalance + sum(all investment transactions)
  // This reconciles any aportes created before the bank was linked/typed as savings
  if (bankId) {
    const { data: txData } = await supabase
      .from("transactions")
      .select("amount")
      .eq("bank_id", bankId)
      .eq("type", "investment")
      .eq("user_id", user.id)
    const totalInvested = (txData ?? []).reduce((s, t: { amount: number }) => s + t.amount, 0)
    const correctBalance = initialBalance + totalInvested
    await supabase.from("banks").update({ current_balance: correctBalance }).eq("id", bankId).eq("user_id", user.id)
  }

  const { error } = await supabase
    .from("investment_settings")
    .upsert(
      { user_id: user.id, goal_amount: goalAmount, initial_balance: initialBalance, target_date: targetDate, bank_id: bankId },
      { onConflict: "user_id" }
    )

  if (error) throw new Error(error.message)
  revalidatePath("/dashboard/goals")
  revalidatePath("/dashboard/settings")
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

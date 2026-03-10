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

  // If investment transaction, accumulate into the savings bank balance
  if (data.type === "investment" && data.bank_id) {
    const { data: bank } = await supabase
      .from("banks")
      .select("current_balance, account_type")
      .eq("id", data.bank_id)
      .eq("user_id", user.id)
      .single()
    if (bank?.account_type === "savings") {
      await supabase
        .from("banks")
        .update({ current_balance: (bank.current_balance ?? 0) + data.amount })
        .eq("id", data.bank_id)
        .eq("user_id", user.id)
    }
  }

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

  // If bank is changing on an installment, propagate to all parcelas of the same group
  if (data.bank_id) {
    const { data: tx } = await supabase
      .from("transactions")
      .select("installment_group_id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (tx?.installment_group_id) {
      const { error } = await supabase
        .from("transactions")
        .update({ bank_id: data.bank_id })
        .eq("installment_group_id", tx.installment_group_id)
        .eq("user_id", user.id)
      if (error) throw new Error(error.message)

      // Update remaining fields (non bank_id) on the single transaction
      const { bank_id: _, ...rest } = data
      if (Object.keys(rest).length > 0) {
        const { error: e2 } = await supabase.from("transactions").update(rest).eq("id", id).eq("user_id", user.id)
        if (e2) throw new Error(e2.message)
      }

      revalidatePath("/dashboard")
      revalidatePath("/dashboard/transactions")
      return
    }
  }

  const { error } = await supabase.from("transactions").update(data).eq("id", id).eq("user_id", user.id)
  if (error) throw new Error(error.message)

  revalidatePath("/dashboard")
  revalidatePath("/dashboard/transactions")
}

export async function markIncomePaid(transactionId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Não autenticado")

  const { data: tx } = await supabase
    .from("transactions")
    .select("amount, bank_id")
    .eq("id", transactionId)
    .eq("user_id", user.id)
    .single()
  if (!tx) throw new Error("Transação não encontrada")

  await supabase
    .from("transactions")
    .update({ is_paid: true })
    .eq("id", transactionId)
    .eq("user_id", user.id)

  if (tx.bank_id) {
    const { data: bank } = await supabase
      .from("banks")
      .select("current_balance")
      .eq("id", tx.bank_id)
      .eq("user_id", user.id)
      .single()
    if (bank) {
      await supabase
        .from("banks")
        .update({ current_balance: (bank.current_balance ?? 0) + tx.amount })
        .eq("id", tx.bank_id)
        .eq("user_id", user.id)
    }
  }

  revalidatePath("/dashboard")
  revalidatePath("/dashboard/transactions")
}

export async function deleteTransaction(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Não autenticado")

  // If deleting an investment tx linked to a savings bank, revert the balance
  const { data: tx } = await supabase
    .from("transactions")
    .select("type, amount, bank_id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single()

  if (tx?.type === "investment" && tx.bank_id) {
    const { data: bank } = await supabase
      .from("banks")
      .select("current_balance, account_type")
      .eq("id", tx.bank_id)
      .eq("user_id", user.id)
      .single()
    if (bank?.account_type === "savings") {
      await supabase
        .from("banks")
        .update({ current_balance: (bank.current_balance ?? 0) - tx.amount })
        .eq("id", tx.bank_id)
        .eq("user_id", user.id)
    }
  }

  const { error } = await supabase.from("transactions").delete().eq("id", id).eq("user_id", user.id)
  if (error) throw new Error(error.message)

  revalidatePath("/dashboard")
  revalidatePath("/dashboard/transactions")
}

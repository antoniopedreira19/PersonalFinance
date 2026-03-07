"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import type { CategoryInsert } from "@/lib/supabase/types"

export async function createCategory(data: Omit<CategoryInsert, "user_id">) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Não autenticado")

  const { error } = await supabase.from("categories").insert({ ...data, user_id: user.id })
  if (error) throw new Error(error.message)
  revalidatePath("/dashboard")
  revalidatePath("/dashboard/categories")
}

export async function updateCategory(id: string, data: { name?: string; color?: string; icon?: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Não autenticado")

  const { error } = await supabase.from("categories").update(data).eq("id", id).eq("user_id", user.id)
  if (error) throw new Error(error.message)
  revalidatePath("/dashboard")
  revalidatePath("/dashboard/categories")
}

export async function deleteCategory(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Não autenticado")

  const { error } = await supabase.from("categories").delete().eq("id", id).eq("user_id", user.id)
  if (error) throw new Error(error.message)
  revalidatePath("/dashboard")
  revalidatePath("/dashboard/categories")
}

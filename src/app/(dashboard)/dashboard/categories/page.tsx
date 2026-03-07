import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getCategories } from "@/lib/queries/dashboard"
import { CategoriesClient } from "./categories-client"

export default async function CategoriesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const categories = await getCategories()

  return <CategoriesClient categories={categories} />
}

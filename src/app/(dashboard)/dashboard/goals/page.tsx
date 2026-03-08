import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getInvestmentSettings, getAllInvestmentTransactions, getBanks, getCategories } from "@/lib/queries/dashboard"
import { GoalsClient } from "./goals-client"

export default async function GoalsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const [settings, transactions, banks, categories] = await Promise.all([
    getInvestmentSettings(),
    getAllInvestmentTransactions(),
    getBanks(),
    getCategories(),
  ])

  return (
    <GoalsClient
      settings={settings}
      transactions={transactions}
      banks={banks}
      categories={categories}
    />
  )
}

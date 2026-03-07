import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getTransactions, getBanks, getCategories } from "@/lib/queries/dashboard"
import { TransactionsClient } from "./transactions-client"

export default async function TransactionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const [transactions, banks, categories] = await Promise.all([
    getTransactions(),
    getBanks(),
    getCategories(),
  ])

  return (
    <TransactionsClient
      transactions={transactions}
      banks={banks}
      categories={categories}
    />
  )
}

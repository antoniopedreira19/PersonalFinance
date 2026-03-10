import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getTransactions, getBanks } from "@/lib/queries/dashboard"
import { TransactionsClient } from "./transactions-client"

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; filter?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const params = await searchParams
  const now = new Date()
  const today = now.toISOString().slice(0, 10)
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  const month = params.month ?? currentMonthStr
  const upToToday = params.filter === "today"
  const endDate = upToToday ? today : undefined

  const [transactions, banks] = await Promise.all([
    getTransactions({ month, endDate }),
    getBanks(),
  ])

  return (
    <TransactionsClient
      transactions={transactions}
      banks={banks}
      month={month}
      upToToday={upToToday}
      today={today}
    />
  )
}

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getBanks } from "@/lib/queries/dashboard"
import { SettingsClient } from "./settings-client"

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const [banks, profileData] = await Promise.all([
    getBanks(),
    supabase.from("profiles").select("name, avatar_url").eq("id", user.id).single(),
  ])

  return (
    <SettingsClient
      banks={banks}
      profile={profileData.data}
      userEmail={user.email ?? ""}
    />
  )
}

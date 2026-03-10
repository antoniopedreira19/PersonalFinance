import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import type { NextRequest } from "next/server"

export function validateAgentKey(req: NextRequest): boolean {
  const key = req.headers.get("x-agent-key")
  return !!process.env.AGENT_API_KEY && key === process.env.AGENT_API_KEY
}

export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

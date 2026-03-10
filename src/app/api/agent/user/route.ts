import { NextRequest, NextResponse } from "next/server"
import { validateAgentKey, createAdminClient } from "@/lib/agent-auth"

// GET /api/agent/user?phone=5511999999999
export async function GET(req: NextRequest) {
  if (!validateAgentKey(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const phone = req.nextUrl.searchParams.get("phone")
  if (!phone) {
    return NextResponse.json({ error: "phone is required" }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("agent_phone_links")
    .select("user_id, pin")
    .eq("phone", phone)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: "Phone not linked" }, { status: 404 })
  }

  return NextResponse.json({ userId: data.user_id, pinHash: data.pin })
}

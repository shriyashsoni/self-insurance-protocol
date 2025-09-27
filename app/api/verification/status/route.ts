import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const address = searchParams.get("address")
    const sessionId = searchParams.get("sessionId")

    if (!address && !sessionId) {
      return NextResponse.json({ error: "Address or sessionId is required" }, { status: 400 })
    }

    const supabase = createServerClient()

    let query = supabase.from("user_profiles").select("verification_status, verification_data, verified_at")

    if (address) {
      query = query.eq("wallet_address", address.toLowerCase())
    } else if (sessionId) {
      // Get session first, then user profile
      const { data: session } = await supabase
        .from("verification_sessions")
        .select("user_address, status")
        .eq("id", sessionId)
        .single()

      if (!session) {
        return NextResponse.json({ error: "Session not found" }, { status: 404 })
      }

      if (session.status === "pending") {
        return NextResponse.json({ status: "in_progress" })
      }

      query = query.eq("wallet_address", session.user_address)
    }

    const { data: profile, error } = await query.single()

    if (error || !profile) {
      return NextResponse.json({ status: "not_started" })
    }

    const result = {
      status: profile.verification_status || "not_started",
      verifiedAt: profile.verified_at,
      attributes: profile.verification_data,
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Status check error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

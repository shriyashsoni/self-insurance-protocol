import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { SELF_CONFIG } from "@/lib/self-sdk/self-config"

export async function POST(request: NextRequest) {
  try {
    const { address, config } = await request.json()

    if (!address) {
      return NextResponse.json({ error: "Address is required" }, { status: 400 })
    }

    const supabase = createServerClient()

    // Create verification session
    const sessionId = crypto.randomUUID()
    const verificationUrl = `https://self.id/verify?config=${encodeURIComponent(
      JSON.stringify({
        ...config,
        scope: SELF_CONFIG.scopeSeed,
        callback: `${process.env.NEXT_PUBLIC_APP_URL}/api/verification/callback`,
        sessionId,
      }),
    )}`

    // Store session in database
    const { error } = await supabase.from("verification_sessions").insert({
      id: sessionId,
      user_address: address.toLowerCase(),
      status: "pending",
      config,
      created_at: new Date().toISOString(),
    })

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to create session" }, { status: 500 })
    }

    return NextResponse.json({
      sessionId,
      verificationUrl,
    })
  } catch (error) {
    console.error("Verification start error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

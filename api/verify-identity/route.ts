import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { userId, walletAddress } = await request.json()
    const supabase = createServerClient()

    console.log("[v0] Verifying identity for user:", userId)

    // Check if user has completed verification
    const { data: verification, error } = await supabase
      .from("verification_sessions")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "completed")
      .single()

    if (error && error.code !== "PGRST116") {
      throw error
    }

    const isVerified = !!verification

    // Store verification result
    if (isVerified) {
      await supabase.from("user_profiles").upsert({
        user_id: userId,
        wallet_address: walletAddress,
        identity_verified: true,
        verified_at: new Date().toISOString(),
      })
    }

    return NextResponse.json({
      verified: isVerified,
      verificationId: verification?.id,
      message: isVerified ? "Identity verified successfully" : "Please complete verification",
    })
  } catch (error) {
    console.error("[v0] Identity verification API error:", error)
    return NextResponse.json(
      {
        error: "Unable to verify identity",
        verified: false,
        message: "Please complete verification to continue",
      },
      { status: 500 },
    )
  }
}

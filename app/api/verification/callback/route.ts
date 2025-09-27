import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { sessionId, proof, attributes } = await request.json()

    if (!sessionId || !proof) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = createServerClient()

    // Get session
    const { data: session, error: sessionError } = await supabase
      .from("verification_sessions")
      .select("user_address")
      .eq("id", sessionId)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: "Invalid session" }, { status: 404 })
    }

    // Verify proof (simplified - in production, verify against Self Protocol)
    const isValidProof = await verifyProof(proof)

    if (!isValidProof) {
      // Update session as failed
      await supabase.from("verification_sessions").update({ status: "failed" }).eq("id", sessionId)

      return NextResponse.json({ error: "Invalid proof" }, { status: 400 })
    }

    // Update user profile with verification
    const { error: updateError } = await supabase
      .from("user_profiles")
      .update({
        verification_status: "completed",
        verification_data: attributes,
        verified_at: new Date().toISOString(),
      })
      .eq("wallet_address", session.user_address)

    if (updateError) {
      console.error("Profile update error:", updateError)
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
    }

    // Update session as completed
    await supabase.from("verification_sessions").update({ status: "completed" }).eq("id", sessionId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Verification callback error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function verifyProof(proof: any): Promise<boolean> {
  // TODO: Implement actual Self Protocol proof verification
  // This would involve checking the proof against the Self Protocol smart contract
  // For now, return true for demo purposes
  console.log("Verifying proof:", proof)
  return true
}

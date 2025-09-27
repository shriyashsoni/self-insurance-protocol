import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const address = searchParams.get("address")

    if (!address) {
      return NextResponse.json({ error: "Address is required" }, { status: 400 })
    }

    const supabase = createServerClient()

    const { data: claims, error } = await supabase
      .from("claims")
      .select(`
        *,
        policies (
          id,
          policy_types (
            name
          )
        )
      `)
      .eq("user_address", address.toLowerCase())
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to fetch claims" }, { status: 500 })
    }

    // Transform data for frontend
    const transformedClaims =
      claims?.map((claim) => ({
        id: claim.id,
        policyId: claim.policy_id,
        policyTitle: claim.policies?.policy_types?.name || "Insurance Policy",
        amount: claim.amount,
        status: claim.status,
        submittedAt: new Date(claim.created_at),
        processedAt: claim.processed_at ? new Date(claim.processed_at) : undefined,
        reason: claim.reason,
      })) || []

    return NextResponse.json(transformedClaims)
  } catch (error) {
    console.error("User claims error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

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

    const { data: policies, error } = await supabase
      .from("policies")
      .select(`
        *,
        policy_types (
          name,
          description,
          category
        )
      `)
      .eq("user_address", address.toLowerCase())
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to fetch policies" }, { status: 500 })
    }

    // Transform data for frontend
    const transformedPolicies =
      policies?.map((policy) => ({
        id: policy.id,
        type: policy.policy_types?.category || "general",
        title: policy.policy_types?.name || "Insurance Policy",
        premium: policy.premium_amount,
        payout: policy.payout_amount,
        status: policy.status,
        purchasedAt: new Date(policy.created_at),
        expiresAt: new Date(policy.expires_at),
        conditions: policy.conditions || policy.policy_types?.description || "",
        location: policy.location,
        claimAmount: policy.claim_amount,
        claimDate: policy.claim_date ? new Date(policy.claim_date) : undefined,
      })) || []

    return NextResponse.json(transformedPolicies)
  } catch (error) {
    console.error("User policies error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

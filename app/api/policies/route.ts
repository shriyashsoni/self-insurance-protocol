import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

// Get all available policy types
export async function GET() {
  try {
    const supabase = createServerClient()

    const { data: policyTypes, error } = await supabase
      .from("policy_types")
      .select("*")
      .eq("is_active", true)
      .order("category", { ascending: true })

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to fetch policy types" }, { status: 500 })
    }

    return NextResponse.json(policyTypes || [])
  } catch (error) {
    console.error("Policy types error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Create a new policy purchase
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      policyTypeId,
      userAddress,
      premiumAmount,
      payoutAmount,
      duration,
      location,
      conditions,
      oracleConditions,
      contractAddress,
      tokenId,
    } = body

    if (!policyTypeId || !userAddress || !premiumAmount || !payoutAmount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = createServerClient()

    // Calculate expiry date based on duration
    const startDate = new Date()
    const expiryDate = new Date()

    // Parse duration (e.g., "30 days", "1 month", "1 year")
    const durationMatch = duration.match(/(\d+)\s*(day|month|year)s?/i)
    if (durationMatch) {
      const amount = Number.parseInt(durationMatch[1])
      const unit = durationMatch[2].toLowerCase()

      switch (unit) {
        case "day":
          expiryDate.setDate(expiryDate.getDate() + amount)
          break
        case "month":
          expiryDate.setMonth(expiryDate.getMonth() + amount)
          break
        case "year":
          expiryDate.setFullYear(expiryDate.getFullYear() + amount)
          break
      }
    } else {
      // Default to 30 days if duration can't be parsed
      expiryDate.setDate(expiryDate.getDate() + 30)
    }

    const policyData = {
      policy_type_id: policyTypeId,
      user_address: userAddress.toLowerCase(),
      premium_amount: premiumAmount,
      payout_amount: payoutAmount,
      status: "active",
      created_at: startDate.toISOString(),
      expires_at: expiryDate.toISOString(),
      location,
      conditions,
      oracle_conditions: oracleConditions,
      contract_address: contractAddress,
      token_id: tokenId,
    }

    const { data: newPolicy, error } = await supabase
      .from("policies")
      .insert(policyData)
      .select(`
        *,
        policy_types (
          name,
          description,
          category
        )
      `)
      .single()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to create policy" }, { status: 500 })
    }

    // Transform data for frontend
    const transformedPolicy = {
      id: newPolicy.id,
      type: newPolicy.policy_types?.category || "general",
      title: newPolicy.policy_types?.name || "Insurance Policy",
      premium: newPolicy.premium_amount,
      payout: newPolicy.payout_amount,
      status: newPolicy.status,
      purchasedAt: new Date(newPolicy.created_at),
      expiresAt: new Date(newPolicy.expires_at),
      conditions: newPolicy.conditions || newPolicy.policy_types?.description || "",
      location: newPolicy.location,
      contractAddress: newPolicy.contract_address,
      tokenId: newPolicy.token_id,
    }

    return NextResponse.json(transformedPolicy, { status: 201 })
  } catch (error) {
    console.error("Policy creation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

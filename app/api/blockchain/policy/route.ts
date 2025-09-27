import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

// POST - Create a new blockchain policy
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      birthday_date,
      celebration_location,
      celebration_type,
      premium_amount,
      coverage_amount,
      oracle_conditions,
      user_address,
    } = body

    if (!birthday_date || !celebration_location || !premium_amount || !coverage_amount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // In a real implementation, this would be handled client-side
    // This endpoint serves as a reference for the expected data structure
    const policyData = {
      birthday_date,
      celebration_location,
      celebration_type,
      premium_amount,
      coverage_amount,
      oracle_conditions: oracle_conditions || [],
      user_address,
      status: "pending_blockchain_creation",
      created_at: new Date().toISOString(),
    }

    // Store policy creation request
    const supabase = createServerClient()
    const { data: policy, error } = await supabase
      .from("blockchain_policy_requests")
      .insert(policyData)
      .select()
      .single()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to store policy request" }, { status: 500 })
    }

    return NextResponse.json({
      message: "Policy creation request stored. Complete the transaction in your wallet.",
      policy_request_id: policy.id,
      estimated_gas: "0.005", // Mock gas estimate
    })
  } catch (error) {
    console.error("Policy creation request error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// GET - Get blockchain policy status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tokenId = searchParams.get("token_id")
    const userAddress = searchParams.get("user_address")

    const supabase = createServerClient()

    if (tokenId) {
      // Get specific policy by token ID
      const { data: policy, error } = await supabase
        .from("blockchain_policies")
        .select("*")
        .eq("token_id", tokenId)
        .single()

      if (error) {
        return NextResponse.json({ error: "Policy not found" }, { status: 404 })
      }

      return NextResponse.json(policy)
    } else if (userAddress) {
      // Get all policies for a user
      const { data: policies, error } = await supabase
        .from("blockchain_policies")
        .select("*")
        .eq("policy_holder", userAddress)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Database error:", error)
        return NextResponse.json({ error: "Failed to fetch policies" }, { status: 500 })
      }

      return NextResponse.json(policies || [])
    } else {
      return NextResponse.json({ error: "token_id or user_address parameter required" }, { status: 400 })
    }
  } catch (error) {
    console.error("Policy fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

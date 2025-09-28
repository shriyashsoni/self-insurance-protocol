import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

// Get specific policy details
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    const supabase = createServerClient()

    const { data: policy, error } = await supabase
      .from("policies")
      .select(`
        *,
        policy_types (
          name,
          description,
          category,
          base_premium,
          max_payout
        )
      `)
      .eq("id", id)
      .single()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Policy not found" }, { status: 404 })
    }

    // Transform data for frontend
    const transformedPolicy = {
      id: policy.id,
      type: policy.policy_types?.category || "general",
      title: policy.policy_types?.name || "Insurance Policy",
      description: policy.policy_types?.description || "",
      premium: policy.premium_amount,
      payout: policy.payout_amount,
      status: policy.status,
      purchasedAt: new Date(policy.created_at),
      expiresAt: new Date(policy.expires_at),
      conditions: policy.conditions || policy.policy_types?.description || "",
      location: policy.location,
      oracleConditions: policy.oracle_conditions,
      contractAddress: policy.contract_address,
      tokenId: policy.token_id,
      claimAmount: policy.claim_amount,
      claimDate: policy.claim_date ? new Date(policy.claim_date) : undefined,
    }

    return NextResponse.json(transformedPolicy)
  } catch (error) {
    console.error("Policy fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Update policy status or details
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const body = await request.json()
    const { status, claimAmount, claimDate, location } = body

    const supabase = createServerClient()

    const updateData: any = {}
    if (status) updateData.status = status
    if (claimAmount) updateData.claim_amount = claimAmount
    if (claimDate) updateData.claim_date = claimDate
    if (location) updateData.location = location

    const { data: updatedPolicy, error } = await supabase
      .from("policies")
      .update(updateData)
      .eq("id", id)
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
      return NextResponse.json({ error: "Failed to update policy" }, { status: 500 })
    }

    // Transform data for frontend
    const transformedPolicy = {
      id: updatedPolicy.id,
      type: updatedPolicy.policy_types?.category || "general",
      title: updatedPolicy.policy_types?.name || "Insurance Policy",
      premium: updatedPolicy.premium_amount,
      payout: updatedPolicy.payout_amount,
      status: updatedPolicy.status,
      purchasedAt: new Date(updatedPolicy.created_at),
      expiresAt: new Date(updatedPolicy.expires_at),
      conditions: updatedPolicy.conditions || updatedPolicy.policy_types?.description || "",
      location: updatedPolicy.location,
      claimAmount: updatedPolicy.claim_amount,
      claimDate: updatedPolicy.claim_date ? new Date(updatedPolicy.claim_date) : undefined,
    }

    return NextResponse.json(transformedPolicy)
  } catch (error) {
    console.error("Policy update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Cancel/delete policy
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    const supabase = createServerClient()

    // Check if policy can be cancelled (only active policies within grace period)
    const { data: policy, error: fetchError } = await supabase
      .from("policies")
      .select("status, created_at")
      .eq("id", id)
      .single()

    if (fetchError || !policy) {
      return NextResponse.json({ error: "Policy not found" }, { status: 404 })
    }

    if (policy.status !== "active") {
      return NextResponse.json({ error: "Only active policies can be cancelled" }, { status: 400 })
    }

    // Check if within 24-hour grace period
    const createdAt = new Date(policy.created_at)
    const now = new Date()
    const hoursSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60)

    if (hoursSinceCreation > 24) {
      return NextResponse.json({ error: "Cancellation period has expired" }, { status: 400 })
    }

    // Update status to cancelled instead of deleting
    const { error: updateError } = await supabase.from("policies").update({ status: "cancelled" }).eq("id", id)

    if (updateError) {
      console.error("Database error:", updateError)
      return NextResponse.json({ error: "Failed to cancel policy" }, { status: 500 })
    }

    return NextResponse.json({ message: "Policy cancelled successfully" })
  } catch (error) {
    console.error("Policy cancellation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

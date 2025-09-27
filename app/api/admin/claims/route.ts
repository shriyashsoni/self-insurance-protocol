import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

// GET - Fetch all claims for admin review
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    const supabase = createServerClient()

    // Verify admin access
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    let query = supabase
      .from("claims")
      .select(`
        *,
        policies!inner(
          id,
          policy_type,
          destination_country,
          travel_start_date,
          travel_end_date,
          coverage_amount,
          users!inner(
            id,
            wallet_address
          )
        )
      `)
      .order("submitted_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (status) {
      query = query.eq("status", status)
    }

    const { data: claims, error } = await query

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to fetch claims" }, { status: 500 })
    }

    return NextResponse.json(claims || [])
  } catch (error) {
    console.error("Admin claims fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT - Update claim status (admin action)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { claim_id, status, rejection_reason, admin_notes } = body

    if (!claim_id || !status) {
      return NextResponse.json({ error: "Missing required fields: claim_id, status" }, { status: 400 })
    }

    const supabase = createServerClient()

    // Verify admin access
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const updateData: any = {
      status,
      processed_at: new Date().toISOString(),
      admin_notes,
    }

    if (rejection_reason) {
      updateData.rejection_reason = rejection_reason
    }

    // If approved, simulate payout
    if (status === "approved") {
      const mockTransactionHash = `0x${Math.random().toString(16).substr(2, 64)}`
      updateData.payout_transaction_hash = mockTransactionHash
      updateData.status = "paid" // Automatically mark as paid after approval
    }

    const { data: updatedClaim, error } = await supabase
      .from("claims")
      .update(updateData)
      .eq("id", claim_id)
      .select()
      .single()

    if (error) {
      console.error("Update error:", error)
      return NextResponse.json({ error: "Failed to update claim" }, { status: 500 })
    }

    return NextResponse.json(updatedClaim)
  } catch (error) {
    console.error("Admin claim update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

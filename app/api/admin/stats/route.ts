import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()

    // Verify admin access
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // In a real implementation, check admin role here
    // For now, allow any authenticated user

    // Fetch comprehensive stats
    const [
      { count: totalPolicies },
      { count: activePolicies },
      { count: totalClaims },
      { count: pendingClaims },
      { count: approvedClaims },
      { count: rejectedClaims },
      { count: paidClaims },
      { data: payoutData },
      { count: totalUsers },
      { count: verifiedUsers },
    ] = await Promise.all([
      supabase.from("policies").select("*", { count: "exact", head: true }),
      supabase.from("policies").select("*", { count: "exact", head: true }).eq("policy_status", "active"),
      supabase.from("claims").select("*", { count: "exact", head: true }),
      supabase.from("claims").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("claims").select("*", { count: "exact", head: true }).eq("status", "approved"),
      supabase.from("claims").select("*", { count: "exact", head: true }).eq("status", "rejected"),
      supabase.from("claims").select("*", { count: "exact", head: true }).eq("status", "paid"),
      supabase.from("claims").select("claim_amount").eq("status", "paid"),
      supabase.from("users").select("*", { count: "exact", head: true }),
      supabase.from("users").select("*", { count: "exact", head: true }).eq("kyc_verified", true),
    ])

    const totalPayouts = payoutData?.reduce((sum, claim) => sum + Number(claim.claim_amount), 0) || 0

    // Calculate additional metrics
    const claimRate = totalPolicies ? (totalClaims / totalPolicies) * 100 : 0
    const approvalRate = totalClaims ? (approvedClaims / totalClaims) * 100 : 0
    const averagePayout = paidClaims ? totalPayouts / paidClaims : 0

    const stats = {
      policies: {
        total: totalPolicies || 0,
        active: activePolicies || 0,
        expired: (totalPolicies || 0) - (activePolicies || 0),
      },
      claims: {
        total: totalClaims || 0,
        pending: pendingClaims || 0,
        approved: approvedClaims || 0,
        rejected: rejectedClaims || 0,
        paid: paidClaims || 0,
      },
      payouts: {
        total: totalPayouts,
        average: averagePayout,
        count: paidClaims || 0,
      },
      users: {
        total: totalUsers || 0,
        verified: verifiedUsers || 0,
        unverified: (totalUsers || 0) - (verifiedUsers || 0),
      },
      metrics: {
        claimRate: claimRate,
        approvalRate: approvalRate,
        verificationRate: totalUsers ? (verifiedUsers / totalUsers) * 100 : 0,
      },
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error("Admin stats error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

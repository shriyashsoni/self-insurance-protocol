import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { policyType, userAddress, monitoringParams } = await request.json()
    const supabase = createServerClient()

    console.log("[v0] Setting up oracle monitoring for:", policyType)

    const { data, error } = await supabase
      .from("oracle_events")
      .insert({
        policy_type: policyType,
        user_address: userAddress,
        monitoring_params: monitoringParams,
        status: "active",
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error

    const oracleJobId = `job_${Date.now()}`

    return NextResponse.json({
      success: true,
      oracleJobId,
      monitoringId: data.id,
    })
  } catch (error) {
    console.error("[v0] Oracle setup API error:", error)
    return NextResponse.json({ error: "Oracle setup failed" }, { status: 500 })
  }
}

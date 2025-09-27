import { type NextRequest, NextResponse } from "next/server"
import { createServerClientForAPI } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { eventType, eventData } = await request.json()
    const supabase = createServerClientForAPI()

    console.log("[v0] Processing oracle event:", eventType)

    let shouldTriggerPayout = false

    switch (eventType) {
      case "flight_delay":
        shouldTriggerPayout = eventData.delayMinutes > 120
        break
      case "extreme_weather":
        shouldTriggerPayout = eventData.severity === "high"
        break
      case "health_emergency":
        shouldTriggerPayout = eventData.emergencyLevel === "critical"
        break
    }

    if (shouldTriggerPayout) {
      // Find active policies that match this event
      const { data: policies, error } = await supabase
        .from("policies")
        .select("*")
        .eq("policy_type", eventType.replace("_", ""))
        .eq("active", true)
        .lt("expires_at", new Date().toISOString())

      if (error) throw error

      // Trigger payouts for matching policies
      for (const policy of policies || []) {
        await triggerPolicyPayout(policy)
      }
    }

    // Log the oracle event
    await supabase.from("oracle_events").insert({
      event_type: eventType,
      event_data: eventData,
      payout_triggered: shouldTriggerPayout,
      processed_at: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      payoutTriggered: shouldTriggerPayout,
    })
  } catch (error) {
    console.error("[v0] Oracle monitoring error:", error)
    return NextResponse.json({ error: "Oracle processing failed" }, { status: 500 })
  }
}

async function triggerPolicyPayout(policy: any) {
  const supabase = createServerClientForAPI()

  try {
    console.log("[v0] Triggering payout for policy:", policy.id)

    // Update policy status
    await supabase
      .from("policies")
      .update({
        active: false,
        payout_triggered: true,
        payout_amount: policy.payout,
        payout_date: new Date().toISOString(),
      })
      .eq("id", policy.id)

    // In production, this would trigger the smart contract payout
    console.log("[v0] Payout triggered for policy:", policy.id, "Amount:", policy.payout)
  } catch (error) {
    console.error("[v0] Payout trigger failed:", error)
  }
}

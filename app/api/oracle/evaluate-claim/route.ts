import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

// POST - Evaluate a travel insurance claim using oracle data
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { claim_id } = body

    if (!claim_id) {
      return NextResponse.json({ error: "Claim ID is required" }, { status: 400 })
    }

    const supabase = createServerClient()

    // Fetch the claim with policy details
    const { data: claim, error: claimError } = await supabase
      .from("claims")
      .select(`
        *,
        policies!inner(
          id,
          policy_type,
          coverage_amount,
          destination_country,
          travel_start_date,
          travel_end_date,
          oracle_conditions(
            condition_type,
            oracle_source,
            trigger_conditions,
            payout_percentage
          )
        )
      `)
      .eq("id", claim_id)
      .single()

    if (claimError || !claim) {
      return NextResponse.json({ error: "Claim not found" }, { status: 404 })
    }

    // Only process pending claims
    if (claim.status !== "pending") {
      return NextResponse.json({ error: "Claim is not in pending status" }, { status: 400 })
    }

    let shouldApprove = false
    const oracleData: any = {}
    let payoutPercentage = 100

    // Evaluate based on claim type and oracle conditions
    switch (claim.claim_type) {
      case "weather_cancellation":
        const weatherResult = await evaluateWeatherClaim(claim)
        shouldApprove = weatherResult.approved
        oracleData.weather = weatherResult.data
        payoutPercentage = weatherResult.payoutPercentage
        break

      case "flight_delay":
      case "flight_cancellation":
        const flightResult = await evaluateFlightClaim(claim)
        shouldApprove = flightResult.approved
        oracleData.flight = flightResult.data
        payoutPercentage = flightResult.payoutPercentage
        break

      case "medical_emergency":
        // Medical claims require manual review
        shouldApprove = false
        oracleData.medical = { requires_manual_review: true }
        break

      case "baggage_loss":
        const baggageResult = await evaluateBaggageClaim(claim)
        shouldApprove = baggageResult.approved
        oracleData.baggage = baggageResult.data
        payoutPercentage = baggageResult.payoutPercentage
        break

      default:
        // Other claims require manual review
        shouldApprove = false
        oracleData.other = { requires_manual_review: true }
    }

    // Update claim status based on evaluation
    const newStatus = shouldApprove ? "approved" : "investigating"
    const finalAmount = shouldApprove ? (claim.claim_amount * payoutPercentage) / 100 : claim.claim_amount

    const { data: updatedClaim, error: updateError } = await supabase
      .from("claims")
      .update({
        status: newStatus,
        oracle_data: oracleData,
        claim_amount: finalAmount,
        processed_at: shouldApprove ? new Date().toISOString() : null,
      })
      .eq("id", claim_id)
      .select()
      .single()

    if (updateError) {
      console.error("Update error:", updateError)
      return NextResponse.json({ error: "Failed to update claim" }, { status: 500 })
    }

    // If approved, trigger payout process
    if (shouldApprove) {
      try {
        await triggerPayout(updatedClaim)
      } catch (payoutError) {
        console.error("Payout error:", payoutError)
        // Update claim to indicate payout failed
        await supabase
          .from("claims")
          .update({ status: "approved" }) // Keep as approved but payout pending
          .eq("id", claim_id)
      }
    }

    return NextResponse.json({
      claim: updatedClaim,
      evaluation: {
        approved: shouldApprove,
        oracle_data: oracleData,
        payout_percentage: payoutPercentage,
      },
    })
  } catch (error) {
    console.error("Claim evaluation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function evaluateWeatherClaim(claim: any) {
  try {
    const travelDate = new Date(claim.policies.travel_start_date)
    const destination = claim.policies.destination_country

    // Simulate weather API call
    const weatherData = {
      date: travelDate.toISOString(),
      location: destination,
      temperature: Math.random() * 30 + 5, // 5-35°C
      precipitation: Math.random() * 20, // 0-20mm
      windSpeed: Math.random() * 30, // 0-30 km/h
      conditions: ["sunny", "cloudy", "rainy", "stormy"][Math.floor(Math.random() * 4)],
    }

    // Check oracle conditions
    const oracleConditions = claim.policies.oracle_conditions.find((c: any) => c.condition_type === "weather")

    if (oracleConditions) {
      const triggers = oracleConditions.trigger_conditions
      let approved = false

      // Check if weather conditions meet trigger criteria
      if (triggers.precipitation_threshold && weatherData.precipitation > triggers.precipitation_threshold) {
        approved = true
      }
      if (triggers.max_wind_speed && weatherData.windSpeed > triggers.max_wind_speed) {
        approved = true
      }
      if (triggers.min_temperature && weatherData.temperature < triggers.min_temperature) {
        approved = true
      }

      return {
        approved,
        data: weatherData,
        payoutPercentage: approved ? oracleConditions.payout_percentage : 0,
      }
    }

    return { approved: false, data: weatherData, payoutPercentage: 0 }
  } catch (error) {
    console.error("Weather evaluation error:", error)
    return { approved: false, data: {}, payoutPercentage: 0 }
  }
}

async function evaluateFlightClaim(claim: any) {
  try {
    // Simulate flight status check
    const flightData = {
      flight_number: claim.evidence_data?.flight_number || "Unknown",
      status: ["on_time", "delayed", "cancelled"][Math.floor(Math.random() * 3)],
      delay_hours: Math.random() * 12,
      checked_at: new Date().toISOString(),
    }

    let approved = false
    let payoutPercentage = 0

    if (flightData.status === "cancelled") {
      approved = true
      payoutPercentage = 100
    } else if (flightData.status === "delayed" && flightData.delay_hours > 4) {
      approved = true
      payoutPercentage = 75
    }

    return {
      approved,
      data: flightData,
      payoutPercentage,
    }
  } catch (error) {
    console.error("Flight evaluation error:", error)
    return { approved: false, data: {}, payoutPercentage: 0 }
  }
}

async function evaluateBaggageClaim(claim: any) {
  try {
    // Simulate baggage status check
    const baggageData = {
      baggage_reference: claim.evidence_data?.baggage_reference || "Unknown",
      status: ["found", "lost", "delayed"][Math.floor(Math.random() * 3)],
      delay_hours: Math.random() * 48,
      checked_at: new Date().toISOString(),
    }

    let approved = false
    let payoutPercentage = 0

    if (baggageData.status === "lost") {
      approved = true
      payoutPercentage = 100
    } else if (baggageData.status === "delayed" && baggageData.delay_hours > 24) {
      approved = true
      payoutPercentage = 50
    }

    return {
      approved,
      data: baggageData,
      payoutPercentage,
    }
  } catch (error) {
    console.error("Baggage evaluation error:", error)
    return { approved: false, data: {}, payoutPercentage: 0 }
  }
}

async function triggerPayout(claim: any) {
  // In a real implementation, this would interact with smart contracts
  // to trigger the actual payout
  console.log(`Triggering payout for claim ${claim.id} - Amount: ${claim.claim_amount} ETH`)

  // Simulate blockchain transaction
  const mockTransactionHash = `0x${Math.random().toString(16).substr(2, 64)}`

  // Update claim with transaction hash
  const supabase = createServerClient()
  await supabase
    .from("claims")
    .update({
      status: "paid",
      payout_transaction_hash: mockTransactionHash,
    })
    .eq("id", claim.id)

  return mockTransactionHash
}

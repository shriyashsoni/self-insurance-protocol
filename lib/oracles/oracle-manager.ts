// Oracle Manager - Coordinates multiple oracle sources and triggers payouts

import { ChainlinkClient } from "./chainlink-client"
import { PythClient } from "./pyth-client"
import { createClient } from "@/lib/supabase/server"

export interface TriggerCondition {
  type: "flight_delay" | "weather_event" | "price_threshold" | "health_emergency"
  parameters: Record<string, any>
  threshold?: number
  operator?: "gt" | "lt" | "eq" | "gte" | "lte"
}

export interface PolicyTrigger {
  policyId: string
  userId: string
  conditions: TriggerCondition[]
  payoutAmount: number
}

export interface OracleResult {
  triggered: boolean
  data: any
  timestamp: string
  source: string
  confidence: number
}

export class OracleManager {
  private chainlinkClient: ChainlinkClient
  private pythClient: PythClient
  private supabase: any

  constructor() {
    this.chainlinkClient = new ChainlinkClient()
    this.pythClient = new PythClient()
  }

  async initializeSupabase() {
    this.supabase = await createClient()
  }

  // Check if policy conditions are met and trigger payouts
  async evaluatePolicyConditions(policyId: string): Promise<OracleResult> {
    if (!this.supabase) await this.initializeSupabase()

    try {
      // Get policy details from database
      const { data: policy, error } = await this.supabase
        .from("insurance_policies")
        .select("*")
        .eq("id", policyId)
        .single()

      if (error || !policy) {
        throw new Error("Policy not found")
      }

      const conditions = policy.oracle_conditions
      let triggered = false
      let oracleData: any = {}

      // Evaluate conditions based on policy type
      switch (policy.policy_type) {
        case "flight":
          const flightResult = await this.evaluateFlightConditions(conditions)
          triggered = flightResult.triggered
          oracleData = flightResult.data
          break

        case "weather":
          const weatherResult = await this.evaluateWeatherConditions(conditions)
          triggered = weatherResult.triggered
          oracleData = weatherResult.data
          break

        case "health":
          const healthResult = await this.evaluateHealthConditions(conditions)
          triggered = healthResult.triggered
          oracleData = healthResult.data
          break

        default:
          throw new Error("Unknown policy type")
      }

      // If conditions are met, process payout
      if (triggered) {
        await this.processPayout(policy, oracleData)
      }

      // Store oracle data
      await this.storeOracleData({
        oracle_type: "chainlink",
        data_feed: policy.policy_type,
        data_value: oracleData,
        timestamp: new Date().toISOString(),
      })

      return {
        triggered,
        data: oracleData,
        timestamp: new Date().toISOString(),
        source: "oracle-manager",
        confidence: 0.95,
      }
    } catch (error) {
      console.error("[v0] Oracle evaluation error:", error)
      return {
        triggered: false,
        data: null,
        timestamp: new Date().toISOString(),
        source: "oracle-manager",
        confidence: 0,
      }
    }
  }

  private async evaluateFlightConditions(conditions: any): Promise<{ triggered: boolean; data: any }> {
    // Mock flight number for demo
    const flightNumber = conditions.flightNumber || "AA1234"
    const date = new Date().toISOString().split("T")[0]

    const flightData = await this.chainlinkClient.getFlightStatus(flightNumber, date)

    if (!flightData.success) {
      return { triggered: false, data: null }
    }

    const flight = flightData.data
    const delayThreshold = conditions.delayThreshold || 120 // 2 hours default

    const triggered = flight.status === "delayed" && flight.delayMinutes >= delayThreshold

    return {
      triggered,
      data: {
        flightNumber: flight.flightNumber,
        status: flight.status,
        delayMinutes: flight.delayMinutes,
        reason: flight.reason,
        threshold: delayThreshold,
      },
    }
  }

  private async evaluateWeatherConditions(conditions: any): Promise<{ triggered: boolean; data: any }> {
    const location = conditions.location || "New York, NY"

    const weatherData = await this.chainlinkClient.getWeatherData(location)

    if (!weatherData.success) {
      return { triggered: false, data: null }
    }

    const weather = weatherData.data
    let triggered = false

    // Check various weather thresholds
    if (conditions.rainfallThreshold && weather.rainfall < conditions.rainfallThreshold) {
      triggered = true
    }
    if (conditions.windSpeedThreshold && weather.windSpeed > conditions.windSpeedThreshold) {
      triggered = true
    }
    if (conditions.temperatureThreshold) {
      if (conditions.temperatureOperator === "lt" && weather.temperature < conditions.temperatureThreshold) {
        triggered = true
      }
      if (conditions.temperatureOperator === "gt" && weather.temperature > conditions.temperatureThreshold) {
        triggered = true
      }
    }

    return {
      triggered,
      data: {
        location: weather.location,
        temperature: weather.temperature,
        rainfall: weather.rainfall,
        windSpeed: weather.windSpeed,
        conditions: conditions,
      },
    }
  }

  private async evaluateHealthConditions(conditions: any): Promise<{ triggered: boolean; data: any }> {
    // Mock health emergency data
    // In production, this would integrate with health data providers
    const mockHealthEvent = {
      eventType: "emergency_hospitalization",
      location: conditions.location || "Global",
      severity: Math.random() > 0.8 ? "high" : "low",
      timestamp: new Date().toISOString(),
    }

    const triggered = mockHealthEvent.severity === "high"

    return {
      triggered,
      data: mockHealthEvent,
    }
  }

  private async processPayout(policy: any, oracleData: any): Promise<void> {
    try {
      // Create claim record
      const claimData = {
        policy_id: policy.id,
        user_id: policy.user_id,
        claim_amount: policy.coverage_amount,
        claim_status: "approved",
        oracle_data: oracleData,
        created_at: new Date().toISOString(),
      }

      const { data: claim, error: claimError } = await this.supabase.from("claims").insert(claimData).select().single()

      if (claimError) throw claimError

      // In production, this would:
      // 1. Call smart contract payout function
      // 2. Transfer stablecoin to user's wallet
      // 3. Update policy status to 'claimed'
      // 4. Store transaction hash

      console.log("[v0] Payout processed for policy:", policy.id, "Amount:", policy.coverage_amount)

      // Update policy status
      await this.supabase
        .from("insurance_policies")
        .update({
          policy_status: "claimed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", policy.id)

      // Update claim with payout completion
      await this.supabase
        .from("claims")
        .update({
          claim_status: "paid",
          payout_date: new Date().toISOString(),
          transaction_hash: "mock_tx_" + Date.now(), // Mock transaction hash
        })
        .eq("id", claim.id)
    } catch (error) {
      console.error("[v0] Payout processing error:", error)
    }
  }

  private async storeOracleData(oracleData: any): Promise<void> {
    try {
      await this.supabase.from("oracle_data").insert(oracleData)
    } catch (error) {
      console.error("[v0] Oracle data storage error:", error)
    }
  }

  // Batch process multiple policies
  async evaluateAllActivePolicies(): Promise<void> {
    if (!this.supabase) await this.initializeSupabase()

    try {
      const { data: policies, error } = await this.supabase
        .from("insurance_policies")
        .select("*")
        .eq("policy_status", "active")
        .lt("end_date", new Date().toISOString())

      if (error) throw error

      for (const policy of policies || []) {
        await this.evaluatePolicyConditions(policy.id)
        // Add delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    } catch (error) {
      console.error("[v0] Batch policy evaluation error:", error)
    }
  }
}

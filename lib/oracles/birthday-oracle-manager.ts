// Birthday Insurance Oracle Manager - Specialized oracle integration for birthday celebrations
// Handles weather, venue, travel, and health data for birthday insurance claims

import { ChainlinkClient } from "./chainlink-client"
import { createClient } from "@/lib/supabase/server"

export interface BirthdayOracleCondition {
  id: string
  policy_id: string
  condition_type: "weather" | "venue_status" | "travel_disruption" | "health_emergency"
  oracle_source: string
  trigger_conditions: Record<string, any>
  payout_percentage: number
  is_active: boolean
}

export interface BirthdayOracleResult {
  condition_met: boolean
  confidence_score: number
  data_sources: string[]
  oracle_data: Record<string, any>
  payout_percentage: number
  evaluation_timestamp: string
}

export interface WeatherConditions {
  location: string
  date: string
  temperature: number
  precipitation: number
  wind_speed: number
  humidity: number
  weather_condition: string
  visibility: number
}

export interface VenueStatus {
  venue_name: string
  venue_id?: string
  status: "open" | "closed" | "cancelled" | "restricted"
  closure_reason?: string
  alternative_available: boolean
  last_updated: string
}

export interface TravelDisruption {
  flight_number?: string
  airline?: string
  departure_airport: string
  arrival_airport: string
  status: "on_time" | "delayed" | "cancelled" | "diverted"
  delay_minutes: number
  disruption_reason?: string
  alternative_flights: boolean
}

export class BirthdayOracleManager {
  private chainlinkClient: ChainlinkClient
  private supabase: any

  constructor() {
    this.chainlinkClient = new ChainlinkClient()
  }

  async initializeSupabase() {
    this.supabase = await createClient()
  }

  // Main evaluation function for birthday insurance policies
  async evaluateBirthdayPolicy(policyId: string): Promise<BirthdayOracleResult> {
    if (!this.supabase) await this.initializeSupabase()

    try {
      // Get policy and oracle conditions
      const { data: policy, error: policyError } = await this.supabase
        .from("birthday_policies")
        .select(`
          *,
          birthday_oracle_conditions(*),
          insurance_policies!inner(*)
        `)
        .eq("policy_id", policyId)
        .single()

      if (policyError || !policy) {
        throw new Error("Birthday policy not found")
      }

      const oracleConditions = policy.birthday_oracle_conditions || []
      let overallConditionMet = false
      let maxPayoutPercentage = 0
      const combinedOracleData: Record<string, any> = {}
      const dataSources: string[] = []
      let totalConfidence = 0

      // Evaluate each oracle condition
      for (const condition of oracleConditions) {
        if (!condition.is_active) continue

        const result = await this.evaluateCondition(condition, policy)

        if (result.condition_met) {
          overallConditionMet = true
          maxPayoutPercentage = Math.max(maxPayoutPercentage, result.payout_percentage)
        }

        combinedOracleData[condition.condition_type] = result.oracle_data
        dataSources.push(...result.data_sources)
        totalConfidence += result.confidence_score
      }

      const averageConfidence = oracleConditions.length > 0 ? totalConfidence / oracleConditions.length : 0

      // Store oracle evaluation result
      await this.storeOracleEvent({
        policy_id: policyId,
        event_type: "policy_evaluation",
        condition_met: overallConditionMet,
        payout_triggered: overallConditionMet,
        event_data: combinedOracleData,
      })

      return {
        condition_met: overallConditionMet,
        confidence_score: averageConfidence,
        data_sources: [...new Set(dataSources)], // Remove duplicates
        oracle_data: combinedOracleData,
        payout_percentage: maxPayoutPercentage,
        evaluation_timestamp: new Date().toISOString(),
      }
    } catch (error) {
      console.error("Birthday oracle evaluation error:", error)
      return {
        condition_met: false,
        confidence_score: 0,
        data_sources: [],
        oracle_data: { error: error.message },
        payout_percentage: 0,
        evaluation_timestamp: new Date().toISOString(),
      }
    }
  }

  // Evaluate individual oracle condition
  private async evaluateCondition(condition: BirthdayOracleCondition, policy: any): Promise<BirthdayOracleResult> {
    switch (condition.condition_type) {
      case "weather":
        return await this.evaluateWeatherCondition(condition, policy)
      case "venue_status":
        return await this.evaluateVenueCondition(condition, policy)
      case "travel_disruption":
        return await this.evaluateTravelCondition(condition, policy)
      case "health_emergency":
        return await this.evaluateHealthCondition(condition, policy)
      default:
        throw new Error(`Unknown condition type: ${condition.condition_type}`)
    }
  }

  // Weather condition evaluation
  private async evaluateWeatherCondition(
    condition: BirthdayOracleCondition,
    policy: any,
  ): Promise<BirthdayOracleResult> {
    const location = policy.celebration_location
    const birthdayDate = policy.birthday_date
    const triggers = condition.trigger_conditions

    // Get weather data from multiple sources for higher confidence
    const weatherSources = await Promise.allSettled([
      this.getChainlinkWeatherData(location, birthdayDate),
      this.getBackupWeatherData(location, birthdayDate),
    ])

    const successfulSources = weatherSources
      .filter((result): result is PromiseFulfilledResult<WeatherConditions> => result.status === "fulfilled")
      .map((result) => result.value)

    if (successfulSources.length === 0) {
      return {
        condition_met: false,
        confidence_score: 0,
        data_sources: [],
        oracle_data: { error: "No weather data available" },
        payout_percentage: 0,
        evaluation_timestamp: new Date().toISOString(),
      }
    }

    // Average weather data from multiple sources
    const avgWeather = this.averageWeatherData(successfulSources)
    let conditionMet = false

    // Check trigger conditions
    if (triggers.min_temperature && avgWeather.temperature < triggers.min_temperature) {
      conditionMet = true
    }
    if (triggers.max_temperature && avgWeather.temperature > triggers.max_temperature) {
      conditionMet = true
    }
    if (triggers.precipitation_threshold && avgWeather.precipitation > triggers.precipitation_threshold) {
      conditionMet = true
    }
    if (triggers.max_wind_speed && avgWeather.wind_speed > triggers.max_wind_speed) {
      conditionMet = true
    }
    if (triggers.min_visibility && avgWeather.visibility < triggers.min_visibility) {
      conditionMet = true
    }

    const confidence = Math.min(successfulSources.length / 2, 1) * 0.9 // Higher confidence with more sources

    return {
      condition_met: conditionMet,
      confidence_score: confidence,
      data_sources: ["chainlink_weather", "backup_weather"],
      oracle_data: {
        weather_data: avgWeather,
        trigger_conditions: triggers,
        sources_count: successfulSources.length,
      },
      payout_percentage: conditionMet ? condition.payout_percentage : 0,
      evaluation_timestamp: new Date().toISOString(),
    }
  }

  // Venue status condition evaluation
  private async evaluateVenueCondition(condition: BirthdayOracleCondition, policy: any): Promise<BirthdayOracleResult> {
    const venueName = policy.celebration_location
    const birthdayDate = policy.birthday_date

    // Simulate venue status check (in production, this would call venue APIs)
    const venueStatus = await this.getVenueStatus(venueName, birthdayDate)

    const conditionMet = venueStatus.status === "closed" || venueStatus.status === "cancelled"
    const confidence = venueStatus.status !== "unknown" ? 0.85 : 0.3

    return {
      condition_met: conditionMet,
      confidence_score: confidence,
      data_sources: ["venue_api", "social_media_monitoring"],
      oracle_data: {
        venue_status: venueStatus,
        check_date: birthdayDate,
      },
      payout_percentage: conditionMet ? condition.payout_percentage : 0,
      evaluation_timestamp: new Date().toISOString(),
    }
  }

  // Travel disruption condition evaluation
  private async evaluateTravelCondition(
    condition: BirthdayOracleCondition,
    policy: any,
  ): Promise<BirthdayOracleResult> {
    const triggers = condition.trigger_conditions
    const birthdayDate = policy.birthday_date

    // Get travel disruption data
    const travelData = await this.getTravelDisruptionData(triggers, birthdayDate)

    let conditionMet = false

    if (travelData.status === "cancelled") {
      conditionMet = true
    } else if (travelData.status === "delayed" && travelData.delay_minutes >= (triggers.min_delay_minutes || 240)) {
      conditionMet = true
    }

    const confidence = travelData.status !== "unknown" ? 0.9 : 0.2

    return {
      condition_met: conditionMet,
      confidence_score: confidence,
      data_sources: ["flight_api", "airline_feeds"],
      oracle_data: {
        travel_data: travelData,
        trigger_conditions: triggers,
      },
      payout_percentage: conditionMet ? condition.payout_percentage : 0,
      evaluation_timestamp: new Date().toISOString(),
    }
  }

  // Health emergency condition evaluation
  private async evaluateHealthCondition(
    condition: BirthdayOracleCondition,
    policy: any,
  ): Promise<BirthdayOracleResult> {
    // Health conditions typically require manual verification
    // This is a placeholder for integration with health data providers

    return {
      condition_met: false,
      confidence_score: 0,
      data_sources: ["manual_verification_required"],
      oracle_data: {
        message: "Health emergency claims require manual verification and medical documentation",
        requires_manual_review: true,
      },
      payout_percentage: 0,
      evaluation_timestamp: new Date().toISOString(),
    }
  }

  // Get weather data from Chainlink
  private async getChainlinkWeatherData(location: string, date: string): Promise<WeatherConditions> {
    const response = await this.chainlinkClient.getWeatherData(location)

    if (!response.success) {
      throw new Error("Chainlink weather data unavailable")
    }

    return {
      location,
      date,
      temperature: response.data.temperature,
      precipitation: response.data.rainfall,
      wind_speed: response.data.windSpeed,
      humidity: response.data.humidity,
      weather_condition: this.getWeatherCondition(response.data),
      visibility: Math.random() * 10 + 5, // Mock visibility data
    }
  }

  // Get backup weather data
  private async getBackupWeatherData(location: string, date: string): Promise<WeatherConditions> {
    // Simulate backup weather API
    return {
      location,
      date,
      temperature: Math.floor(Math.random() * 40) - 10,
      precipitation: Math.random() * 30,
      wind_speed: Math.random() * 80,
      humidity: Math.random() * 100,
      weather_condition: ["sunny", "cloudy", "rainy", "stormy"][Math.floor(Math.random() * 4)],
      visibility: Math.random() * 10 + 5,
    }
  }

  // Average weather data from multiple sources
  private averageWeatherData(sources: WeatherConditions[]): WeatherConditions {
    if (sources.length === 0) throw new Error("No weather sources available")
    if (sources.length === 1) return sources[0]

    const avg = sources.reduce((acc, curr) => ({
      location: curr.location,
      date: curr.date,
      temperature: acc.temperature + curr.temperature,
      precipitation: acc.precipitation + curr.precipitation,
      wind_speed: acc.wind_speed + curr.wind_speed,
      humidity: acc.humidity + curr.humidity,
      weather_condition: curr.weather_condition, // Use last condition
      visibility: acc.visibility + curr.visibility,
    }))

    const count = sources.length
    return {
      ...avg,
      temperature: avg.temperature / count,
      precipitation: avg.precipitation / count,
      wind_speed: avg.wind_speed / count,
      humidity: avg.humidity / count,
      visibility: avg.visibility / count,
    }
  }

  // Get venue status
  private async getVenueStatus(venueName: string, date: string): Promise<VenueStatus> {
    // Simulate venue status API call
    const statuses = ["open", "closed", "cancelled", "restricted"] as const
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)]

    return {
      venue_name: venueName,
      status: randomStatus,
      closure_reason: randomStatus !== "open" ? "COVID-19 restrictions" : undefined,
      alternative_available: Math.random() > 0.5,
      last_updated: new Date().toISOString(),
    }
  }

  // Get travel disruption data
  private async getTravelDisruptionData(triggers: any, date: string): Promise<TravelDisruption> {
    // Simulate travel API call
    const statuses = ["on_time", "delayed", "cancelled", "diverted"] as const
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)]

    return {
      flight_number: triggers.flight_number || "AA1234",
      departure_airport: triggers.departure_airport || "JFK",
      arrival_airport: triggers.arrival_airport || "LAX",
      status: randomStatus,
      delay_minutes: randomStatus === "delayed" ? Math.floor(Math.random() * 480) + 30 : 0,
      disruption_reason: randomStatus !== "on_time" ? "Weather conditions" : undefined,
      alternative_flights: Math.random() > 0.3,
    }
  }

  // Helper function to determine weather condition
  private getWeatherCondition(weatherData: any): string {
    if (weatherData.rainfall > 10) return "rainy"
    if (weatherData.windSpeed > 50) return "stormy"
    if (weatherData.temperature < 0) return "snowy"
    if (weatherData.humidity > 80) return "cloudy"
    return "sunny"
  }

  // Store oracle event in database
  private async storeOracleEvent(eventData: any): Promise<void> {
    try {
      await this.supabase.from("oracle_events").insert({
        ...eventData,
        created_at: new Date().toISOString(),
      })
    } catch (error) {
      console.error("Error storing oracle event:", error)
    }
  }

  // Continuous monitoring for active policies
  async startContinuousMonitoring(): Promise<void> {
    if (!this.supabase) await this.initializeSupabase()

    try {
      // Get all active birthday policies that need monitoring
      const { data: policies, error } = await this.supabase
        .from("birthday_policies")
        .select(`
          policy_id,
          birthday_date,
          insurance_policies!inner(
            policy_status
          )
        `)
        .eq("insurance_policies.policy_status", "active")
        .gte("birthday_date", new Date().toISOString().split("T")[0])

      if (error) throw error

      console.log(`Starting continuous monitoring for ${policies?.length || 0} birthday policies`)

      // Monitor each policy
      for (const policy of policies || []) {
        const daysUntilBirthday = this.getDaysUntilDate(policy.birthday_date)

        // Start monitoring 7 days before birthday
        if (daysUntilBirthday <= 7) {
          await this.evaluateBirthdayPolicy(policy.policy_id)

          // Store monitoring record
          await this.supabase.from("oracle_monitoring").upsert({
            policy_id: policy.policy_id,
            monitoring_type: "birthday_insurance",
            status: "active",
            last_check_at: new Date().toISOString(),
            monitoring_params: {
              days_until_birthday: daysUntilBirthday,
              monitoring_frequency: "hourly",
            },
          })
        }
      }
    } catch (error) {
      console.error("Continuous monitoring error:", error)
    }
  }

  // Helper function to calculate days until date
  private getDaysUntilDate(dateString: string): number {
    const targetDate = new Date(dateString)
    const today = new Date()
    const diffTime = targetDate.getTime() - today.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }
}

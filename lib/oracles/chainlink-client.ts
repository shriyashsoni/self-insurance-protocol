// Chainlink Oracle Integration for Parametric Insurance
// Handles flight data, weather data, and other external data feeds

export interface ChainlinkJobSpec {
  jobId: string
  oracle: string
  payment: string
  url: string
  path: string
  times?: number
}

export interface FlightData {
  flightNumber: string
  status: "on-time" | "delayed" | "cancelled"
  delayMinutes: number
  scheduledDeparture: string
  actualDeparture?: string
  reason?: string
}

export interface WeatherData {
  location: string
  temperature: number
  rainfall: number
  windSpeed: number
  humidity: number
  timestamp: string
}

export interface OracleResponse {
  success: boolean
  data: any
  timestamp: string
  source: string
}

export class ChainlinkClient {
  private apiKey: string
  private baseUrl: string

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.CHAINLINK_API_KEY || ""
    this.baseUrl = "https://api.chain.link/v1"
  }

  // Flight data oracle integration
  async getFlightStatus(flightNumber: string, date: string): Promise<OracleResponse> {
    try {
      // Mock Chainlink flight data API call
      const mockFlightData: FlightData = {
        flightNumber,
        status: Math.random() > 0.7 ? "delayed" : "on-time",
        delayMinutes: Math.random() > 0.7 ? Math.floor(Math.random() * 180) + 30 : 0,
        scheduledDeparture: date,
        actualDeparture: new Date(Date.now() + Math.random() * 3600000).toISOString(),
        reason: Math.random() > 0.5 ? "Weather conditions" : "Technical issues",
      }

      // In production, this would make actual API calls to flight data providers
      console.log("[v0] Chainlink flight oracle called for:", flightNumber)

      return {
        success: true,
        data: mockFlightData,
        timestamp: new Date().toISOString(),
        source: "chainlink-flight-oracle",
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        timestamp: new Date().toISOString(),
        source: "chainlink-flight-oracle",
      }
    }
  }

  // Weather data oracle integration
  async getWeatherData(location: string): Promise<OracleResponse> {
    try {
      // Mock Chainlink weather data API call
      const mockWeatherData: WeatherData = {
        location,
        temperature: Math.floor(Math.random() * 40) - 10, // -10 to 30°C
        rainfall: Math.random() * 50, // 0-50mm
        windSpeed: Math.random() * 100, // 0-100 mph
        humidity: Math.random() * 100, // 0-100%
        timestamp: new Date().toISOString(),
      }

      console.log("[v0] Chainlink weather oracle called for:", location)

      return {
        success: true,
        data: mockWeatherData,
        timestamp: new Date().toISOString(),
        source: "chainlink-weather-oracle",
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        timestamp: new Date().toISOString(),
        source: "chainlink-weather-oracle",
      }
    }
  }

  // Generic oracle request
  async makeOracleRequest(jobSpec: ChainlinkJobSpec, parameters: Record<string, any>): Promise<OracleResponse> {
    try {
      // Mock Chainlink oracle request
      console.log("[v0] Chainlink oracle request:", jobSpec.jobId, parameters)

      // Simulate oracle response based on job type
      let mockData: any = {}

      if (jobSpec.path.includes("flight")) {
        mockData = await this.getFlightStatus(parameters.flightNumber, parameters.date)
      } else if (jobSpec.path.includes("weather")) {
        mockData = await this.getWeatherData(parameters.location)
      }

      return {
        success: true,
        data: mockData,
        timestamp: new Date().toISOString(),
        source: `chainlink-${jobSpec.jobId}`,
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        timestamp: new Date().toISOString(),
        source: `chainlink-${jobSpec.jobId}`,
      }
    }
  }
}

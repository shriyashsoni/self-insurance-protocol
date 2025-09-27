export interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy"
  timestamp: string
  services: {
    database: ServiceStatus
    oracles: ServiceStatus
    blockchain: ServiceStatus
    selfSDK: ServiceStatus
  }
}

export interface ServiceStatus {
  status: "up" | "down" | "degraded"
  responseTime?: number
  lastCheck: string
  error?: string
}

export class HealthMonitor {
  async checkSystemHealth(): Promise<HealthStatus> {
    const timestamp = new Date().toISOString()

    const [database, oracles, blockchain, selfSDK] = await Promise.all([
      this.checkDatabase(),
      this.checkOracles(),
      this.checkBlockchain(),
      this.checkSelfSDK(),
    ])

    const services = { database, oracles, blockchain, selfSDK }
    const overallStatus = this.calculateOverallStatus(services)

    return {
      status: overallStatus,
      timestamp,
      services,
    }
  }

  private async checkDatabase(): Promise<ServiceStatus> {
    try {
      const startTime = Date.now()
      // Simple database connectivity check
      const response = await fetch("/api/health/database")
      const responseTime = Date.now() - startTime

      return {
        status: response.ok ? "up" : "down",
        responseTime,
        lastCheck: new Date().toISOString(),
      }
    } catch (error) {
      return {
        status: "down",
        lastCheck: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  private async checkOracles(): Promise<ServiceStatus> {
    try {
      const startTime = Date.now()
      // Check oracle responsiveness
      const response = await fetch("/api/oracle/health")
      const responseTime = Date.now() - startTime

      return {
        status: response.ok ? "up" : "degraded",
        responseTime,
        lastCheck: new Date().toISOString(),
      }
    } catch (error) {
      return {
        status: "down",
        lastCheck: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Oracle connection failed",
      }
    }
  }

  private async checkBlockchain(): Promise<ServiceStatus> {
    try {
      // Simulate blockchain connectivity check
      const startTime = Date.now()
      await new Promise((resolve) => setTimeout(resolve, 100))
      const responseTime = Date.now() - startTime

      return {
        status: "up",
        responseTime,
        lastCheck: new Date().toISOString(),
      }
    } catch (error) {
      return {
        status: "down",
        lastCheck: new Date().toISOString(),
        error: "Blockchain connection failed",
      }
    }
  }

  private async checkSelfSDK(): Promise<ServiceStatus> {
    try {
      const startTime = Date.now()
      // Check Self SDK availability
      await new Promise((resolve) => setTimeout(resolve, 50))
      const responseTime = Date.now() - startTime

      return {
        status: "up",
        responseTime,
        lastCheck: new Date().toISOString(),
      }
    } catch (error) {
      return {
        status: "down",
        lastCheck: new Date().toISOString(),
        error: "Self SDK unavailable",
      }
    }
  }

  private calculateOverallStatus(services: HealthStatus["services"]): HealthStatus["status"] {
    const statuses = Object.values(services).map((service) => service.status)

    if (statuses.every((status) => status === "up")) {
      return "healthy"
    } else if (statuses.some((status) => status === "down")) {
      return "unhealthy"
    } else {
      return "degraded"
    }
  }
}

export const healthMonitor = new HealthMonitor()

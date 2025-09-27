import { NextResponse } from "next/server"
import { healthMonitor } from "@/lib/monitoring/health-check"

export async function GET() {
  try {
    const healthStatus = await healthMonitor.checkSystemHealth()

    const statusCode = healthStatus.status === "healthy" ? 200 : healthStatus.status === "degraded" ? 200 : 503

    return NextResponse.json(healthStatus, { status: statusCode })
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        error: "Health check failed",
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    )
  }
}

import { NextResponse } from "next/server"
import { OracleManager } from "@/lib/oracles/oracle-manager"

export async function POST() {
  try {
    const oracleManager = new OracleManager()
    await oracleManager.evaluateAllActivePolicies()

    return NextResponse.json({
      success: true,
      message: "Batch evaluation completed",
    })
  } catch (error) {
    console.error("[v0] Batch oracle evaluation API error:", error)
    return NextResponse.json({ error: "Batch evaluation failed" }, { status: 500 })
  }
}

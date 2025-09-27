import { type NextRequest, NextResponse } from "next/server"
import { OracleManager } from "@/lib/oracles/oracle-manager"

export async function POST(request: NextRequest) {
  try {
    const { policyId } = await request.json()

    if (!policyId) {
      return NextResponse.json({ error: "Policy ID is required" }, { status: 400 })
    }

    const oracleManager = new OracleManager()
    const result = await oracleManager.evaluatePolicyConditions(policyId)

    return NextResponse.json({
      success: true,
      result,
    })
  } catch (error) {
    console.error("[v0] Oracle evaluation API error:", error)
    return NextResponse.json({ error: "Oracle evaluation failed" }, { status: 500 })
  }
}

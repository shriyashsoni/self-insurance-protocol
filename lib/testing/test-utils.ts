export class TestingUtils {
  static async simulateIdentityVerification(): Promise<boolean> {
    console.log("[v0] Simulating Self SDK identity verification...")
    // Simulate verification delay
    await new Promise((resolve) => setTimeout(resolve, 2000))
    return Math.random() > 0.1 // 90% success rate for testing
  }

  static async simulatePolicyPurchase(
    policyType: string,
    premium: number,
  ): Promise<{
    success: boolean
    transactionHash?: string
    tokenId?: number
  }> {
    console.log("[v0] Simulating policy purchase...", { policyType, premium })
    await new Promise((resolve) => setTimeout(resolve, 3000))

    if (Math.random() > 0.05) {
      // 95% success rate
      return {
        success: true,
        transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`,
        tokenId: Math.floor(Math.random() * 10000),
      }
    } else {
      return { success: false }
    }
  }

  static async simulateOracleEvent(eventType: "flight_delay" | "weather" | "health"): Promise<boolean> {
    console.log("[v0] Simulating oracle event:", eventType)
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Different trigger rates for different event types
    const triggerRates = {
      flight_delay: 0.3, // 30% chance of flight delay
      weather: 0.1, // 10% chance of extreme weather
      health: 0.05, // 5% chance of health emergency
    }

    return Math.random() < triggerRates[eventType]
  }

  static async simulateAutomaticPayout(
    tokenId: number,
    amount: number,
  ): Promise<{
    success: boolean
    transactionHash?: string
  }> {
    console.log("[v0] Simulating automatic payout...", { tokenId, amount })
    await new Promise((resolve) => setTimeout(resolve, 2000))

    return {
      success: true,
      transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`,
    }
  }

  static generateMockPolicyData() {
    return {
      id: `policy_${Date.now()}`,
      user: "0x742d35Cc6634C0532925a3b8D0C9e3e0C8b0e4c2",
      premium: 50,
      payout: 1000,
      expiry: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
      active: true,
      policyType: "flight_delay",
      tokenId: Math.floor(Math.random() * 10000),
    }
  }
}

// Integration test scenarios
export const TEST_SCENARIOS = {
  completeFlow: async () => {
    console.log("[v0] Running complete flow test...")

    // Step 1: Identity verification
    const identityVerified = await TestingUtils.simulateIdentityVerification()
    if (!identityVerified) throw new Error("Identity verification failed")

    // Step 2: Policy purchase
    const purchase = await TestingUtils.simulatePolicyPurchase("flight_delay", 50)
    if (!purchase.success) throw new Error("Policy purchase failed")

    // Step 3: Oracle monitoring
    const eventTriggered = await TestingUtils.simulateOracleEvent("flight_delay")

    // Step 4: Automatic payout (if event triggered)
    if (eventTriggered && purchase.tokenId) {
      const payout = await TestingUtils.simulateAutomaticPayout(purchase.tokenId, 1000)
      if (!payout.success) throw new Error("Automatic payout failed")
      console.log("[v0] Complete flow test passed with payout!")
    } else {
      console.log("[v0] Complete flow test passed without payout (no event triggered)")
    }

    return true
  },
}

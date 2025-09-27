export interface PolicyContract {
  address: string
  abi: any[]
}

export interface Policy {
  id: string
  user: string
  premium: number
  payout: number
  expiry: number
  active: boolean
  policyType: string
  tokenId?: number
}

export class InsuranceContract {
  private contract: any
  private provider: any

  constructor(contractAddress: string, abi: any[], provider: any) {
    this.contract = new provider.eth.Contract(abi, contractAddress)
    this.provider = provider
  }

  async verifyIdentity(proof: string): Promise<boolean> {
    try {
      console.log("[v0] Verifying identity with Self SDK proof...")
      const result = await this.contract.methods.verifyProof(proof).call()
      return result
    } catch (error) {
      console.error("[v0] Identity verification failed:", error)
      return false
    }
  }

  async purchasePolicy(policyType: string, premium: number, payout: number, duration: number): Promise<string> {
    try {
      console.log("[v0] Purchasing policy on-chain...")
      const tx = await this.contract.methods
        .purchasePolicy(policyType, premium, payout, duration)
        .send({ from: this.provider.selectedAddress, value: premium })

      return tx.transactionHash
    } catch (error) {
      console.error("[v0] Policy purchase failed:", error)
      throw error
    }
  }

  async checkPolicyStatus(tokenId: number): Promise<Policy> {
    try {
      const policy = await this.contract.methods.getPolicy(tokenId).call()
      return {
        id: policy.id,
        user: policy.user,
        premium: policy.premium,
        payout: policy.payout,
        expiry: policy.expiry,
        active: policy.active,
        policyType: policy.policyType,
        tokenId,
      }
    } catch (error) {
      console.error("[v0] Failed to check policy status:", error)
      throw error
    }
  }

  async triggerPayout(tokenId: number): Promise<string> {
    try {
      console.log("[v0] Triggering automatic payout...")
      const tx = await this.contract.methods.triggerPayout(tokenId).send({
        from: this.provider.selectedAddress,
      })
      return tx.transactionHash
    } catch (error) {
      console.error("[v0] Payout trigger failed:", error)
      throw error
    }
  }
}

// Oracle integration for automatic payouts
export class InsuranceOracle {
  private chainlinkContract: any
  private provider: any

  constructor(oracleAddress: string, abi: any[], provider: any) {
    this.chainlinkContract = new provider.eth.Contract(abi, oracleAddress)
    this.provider = provider
  }

  async monitorFlightStatus(flightNumber: string, date: string): Promise<boolean> {
    try {
      console.log("[v0] Monitoring flight status via Chainlink oracle...")
      const result = await this.chainlinkContract.methods.getFlightStatus(flightNumber, date).call()

      return result.delayed && result.delayMinutes > 120 // 2+ hours delay
    } catch (error) {
      console.error("[v0] Flight status check failed:", error)
      return false
    }
  }

  async monitorWeatherConditions(location: string): Promise<boolean> {
    try {
      console.log("[v0] Monitoring weather conditions via oracle...")
      const result = await this.chainlinkContract.methods.getWeatherData(location).call()

      return result.extremeWeather // Extreme weather event detected
    } catch (error) {
      console.error("[v0] Weather monitoring failed:", error)
      return false
    }
  }

  async setupAutomaticMonitoring(policyId: string, monitoringType: string, parameters: any): Promise<void> {
    try {
      console.log("[v0] Setting up automatic oracle monitoring...")
      await this.chainlinkContract.methods
        .setupMonitoring(policyId, monitoringType, parameters)
        .send({ from: this.provider.selectedAddress })
    } catch (error) {
      console.error("[v0] Failed to setup monitoring:", error)
      throw error
    }
  }
}

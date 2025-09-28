"use client"

interface SelfConfig {
  apiKey: string
  network: "mainnet" | "testnet"
  appId?: string
}

interface SelfSession {
  did: string
  isAuthenticated: boolean
  userIdentifier?: string
}

interface VerificationResult {
  country: string
  ageRange: string
  sanctionsCheck: string
  documentType: string
  nullifier: string
  userIdentifier: string
}

class SelfClient {
  private config: SelfConfig
  private session: SelfSession | null = null

  constructor(config: SelfConfig) {
    this.config = config
  }

  async authenticate(walletAddress: string): Promise<SelfSession> {
    try {
      console.log("[v0] Authenticating with Self SDK for address:", walletAddress)

      const mockSession: SelfSession = {
        did: `did:self:${walletAddress.slice(2, 10)}`,
        isAuthenticated: true,
        userIdentifier: `user_${Date.now()}`,
      }

      this.session = mockSession
      return mockSession
    } catch (error) {
      console.error("[v0] Self SDK authentication error:", error)
      throw new Error("Failed to authenticate with Self SDK")
    }
  }

  async startVerification(config: {
    disclosures: string[]
    redirectUrl: string
  }): Promise<string> {
    try {
      console.log("[v0] Starting Self SDK verification with config:", config)

      return `https://self.id/verify?config=${encodeURIComponent(JSON.stringify(config))}`
    } catch (error) {
      console.error("[v0] Self SDK verification start error:", error)
      throw new Error("Failed to start verification")
    }
  }

  async verifyProof(proof: any): Promise<VerificationResult> {
    try {
      console.log("[v0] Verifying Self SDK proof:", proof)

      const mockResult: VerificationResult = {
        country: "US",
        ageRange: "25-35",
        sanctionsCheck: "clear",
        documentType: "passport",
        nullifier: `nullifier_${Date.now()}`,
        userIdentifier: `user_${Date.now()}`,
      }

      return mockResult
    } catch (error) {
      console.error("[v0] Self SDK proof verification error:", error)
      throw new Error("Failed to verify proof")
    }
  }

  getSession(): SelfSession | null {
    return this.session
  }

  disconnect(): void {
    this.session = null
  }
}

let selfClientInstance: SelfClient | null = null

export function createSelfClient(): SelfClient {
  if (!selfClientInstance) {
    const config: SelfConfig = {
      apiKey: process.env.NEXT_PUBLIC_SELF_SDK_API_KEY || process.env.SELF_APP_ID || "mock_api_key",
      network: "testnet",
      appId: process.env.SELF_APP_ID,
    }

    selfClientInstance = new SelfClient(config)
  }

  return selfClientInstance
}

export { SelfClient, type SelfSession, type VerificationResult }

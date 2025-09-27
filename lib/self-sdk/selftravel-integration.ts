import { getUniversalLink } from "@selfxyz/core"
import { SelfAppBuilder } from "@selfxyz/qrcode"

export interface TravelCredential {
  id: string
  type: "passport" | "visa" | "vaccination" | "travel_pass"
  issuer: string
  issuedAt: string
  expiresAt?: string
  claims: Record<string, any>
  proof: string
}

export interface VerificationSession {
  id: string
  userId: string
  status: "pending" | "in_progress" | "completed" | "failed"
  verificationUrl?: string
  deepLink?: string
  qrCode?: string
  completedAt?: string
  credentials?: TravelCredential[]
}

export class SelfTravelIntegration {
  private selfApp: any
  private apiKey: string
  private baseUrl: string

  constructor() {
    this.apiKey = process.env.SELF_SDK_API_KEY || "test_key"
    this.baseUrl = process.env.SELF_SDK_BASE_URL || "https://api.self.id"

    this.selfApp = new SelfAppBuilder({
      appId: process.env.SELF_APP_ID || "selftravel-protocol",
      name: "SelfTravel Protocol",
      description: "Privacy-preserving travel credentials",
      logoUrl: "/placeholder-logo.svg",
      redirectUrl: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || "http://localhost:3000/verification",
      // Travel-specific verification requirements
      requiredClaims: [
        "identity.passport",
        "identity.age_over_18",
        "identity.country_of_residence",
        "compliance.ofac_clear",
      ],
      optionalClaims: ["identity.vaccination_status", "identity.visa_status", "travel.frequent_traveler"],
    }).build()
  }

  async createVerificationSession(userId: string, walletAddress?: string): Promise<VerificationSession> {
    try {
      console.log("[v0] Creating SelfTravel verification session for user:", userId)

      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      const deepLink = getUniversalLink(this.selfApp)

      const qrCode = await this.generateQRCode(sessionId, deepLink)

      return {
        id: sessionId,
        userId,
        status: "pending",
        verificationUrl: `${this.baseUrl}/verify/${sessionId}`,
        deepLink,
        qrCode,
      }
    } catch (error) {
      console.error("[v0] Failed to create verification session:", error)
      throw error
    }
  }

  private async generateQRCode(sessionId: string, deepLink: string): Promise<string> {
    const qrData = {
      type: "selftravel_verification",
      sessionId,
      deepLink,
      timestamp: Date.now(),
      requiredClaims: this.selfApp.config.requiredClaims,
    }

    return `data:application/json;base64,${Buffer.from(JSON.stringify(qrData)).toString("base64")}`
  }

  async checkVerificationStatus(sessionId: string): Promise<VerificationSession> {
    try {
      console.log("[v0] Checking verification status for session:", sessionId)

      const isCompleted = Math.random() > 0.2 // 80% success rate for demo

      if (isCompleted) {
        const credentials: TravelCredential[] = [
          {
            id: `cred_${sessionId}_passport`,
            type: "passport",
            issuer: "did:self:passport_authority",
            issuedAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toISOString(), // 10 years
            claims: {
              country: "US",
              age_over_18: true,
              age_over_21: true,
              document_number: "P***1234",
              nationality: "US",
            },
            proof: `proof_${sessionId}_passport`,
          },
          {
            id: `cred_${sessionId}_travel`,
            type: "travel_pass",
            issuer: "did:self:selftravel_protocol",
            issuedAt: new Date().toISOString(),
            claims: {
              verified_traveler: true,
              ofac_clear: true,
              kyc_level: "full",
              travel_score: 95,
            },
            proof: `proof_${sessionId}_travel`,
          },
        ]

        return {
          id: sessionId,
          userId: "user_id",
          status: "completed",
          completedAt: new Date().toISOString(),
          credentials,
        }
      }

      return {
        id: sessionId,
        userId: "user_id",
        status: "in_progress",
      }
    } catch (error) {
      console.error("[v0] Failed to check verification status:", error)
      throw error
    }
  }

  async verifyCredential(credential: TravelCredential): Promise<boolean> {
    try {
      console.log("[v0] Verifying travel credential:", credential.type)

      const isValidProof = credential.proof.length > 0 && credential.proof.startsWith("proof_")
      const isNotExpired = !credential.expiresAt || new Date(credential.expiresAt) > new Date()
      const hasRequiredClaims = this.validateTravelClaims(credential)

      return isValidProof && isNotExpired && hasRequiredClaims
    } catch (error) {
      console.error("[v0] Credential verification failed:", error)
      return false
    }
  }

  private validateTravelClaims(credential: TravelCredential): boolean {
    switch (credential.type) {
      case "passport":
        return !!(credential.claims.country && credential.claims.age_over_18)
      case "travel_pass":
        return !!(credential.claims.verified_traveler && credential.claims.ofac_clear)
      case "vaccination":
        return !!(credential.claims.vaccine_type && credential.claims.vaccination_date)
      case "visa":
        return !!(credential.claims.destination_country && credential.claims.visa_type)
      default:
        return false
    }
  }

  async presentCredential(credentialId: string, verifierDid: string): Promise<string> {
    try {
      console.log("[v0] Creating credential presentation for verifier:", verifierDid)

      const presentationData = {
        type: "credential_presentation",
        credentialId,
        verifierDid,
        timestamp: Date.now(),
        nonce: Math.random().toString(36).substr(2, 16),
      }

      return `data:application/json;base64,${Buffer.from(JSON.stringify(presentationData)).toString("base64")}`
    } catch (error) {
      console.error("[v0] Failed to create credential presentation:", error)
      throw error
    }
  }

  async revokeCredential(credentialId: string): Promise<boolean> {
    try {
      console.log("[v0] Revoking credential:", credentialId)

      // In production, this would update the revocation registry
      return true
    } catch (error) {
      console.error("[v0] Failed to revoke credential:", error)
      return false
    }
  }
}

export const selfTravelSDK = new SelfTravelIntegration()

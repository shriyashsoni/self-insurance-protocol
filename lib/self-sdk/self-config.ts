export const SELF_CONFIG = {
  // Self Protocol configuration
  hubAddress: "0x1234567890123456789012345678901234567890", // Replace with actual hub address
  scopeSeed: "insurance-protocol",

  // Verification requirements
  verificationConfig: {
    olderThan: 18,
    forbiddenCountries: ["US"], // Add restricted countries
    ofacEnabled: true,
    requirePassport: true,
    requireAadhaar: false, // Set to true if targeting Indian users
  },

  // Supported networks
  supportedChains: {
    celo: {
      chainId: 42220,
      name: "Celo Mainnet",
      rpcUrl: "https://forno.celo.org",
      hubAddress: "0x1234567890123456789012345678901234567890",
    },
    celoAlfajores: {
      chainId: 44787,
      name: "Celo Alfajores Testnet",
      rpcUrl: "https://alfajores-forno.celo-testnet.org",
      hubAddress: "0x1234567890123456789012345678901234567890",
    },
  },
}

export type SelfVerificationStatus = "not_started" | "in_progress" | "completed" | "failed" | "expired"

export interface SelfVerificationResult {
  status: SelfVerificationStatus
  proofHash?: string
  verifiedAt?: Date
  attributes?: {
    age?: number
    country?: string
    isOfacClear?: boolean
    hasPassport?: boolean
    hasAadhaar?: boolean
  }
  error?: string
}

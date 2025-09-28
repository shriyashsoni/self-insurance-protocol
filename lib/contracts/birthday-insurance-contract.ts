// Birthday Insurance Smart Contract Integration
// Handles policy creation, premium payments, and automated payouts for birthday celebrations

import { ethers } from "ethers"
import { createClient } from "@/lib/supabase/server"

export interface BirthdayPolicy {
  tokenId: number
  policyHolder: string
  birthdayDate: string
  celebrationLocation: string
  celebrationType: string
  premiumAmount: string
  coverageAmount: string
  policyStatus: "active" | "expired" | "claimed" | "cancelled"
  createdAt: number
  expiresAt: number
  oracleConditions: OracleCondition[]
}

export interface OracleCondition {
  conditionType: "weather" | "venue" | "travel" | "health"
  parameters: Record<string, any>
  payoutPercentage: number
  isActive: boolean
}

export interface ClaimRequest {
  tokenId: number
  claimType: string
  claimReason: string
  evidenceHash: string
  requestedAmount: string
  submittedAt: number
}

export interface PayoutEvent {
  tokenId: number
  recipient: string
  amount: string
  reason: string
  transactionHash: string
  timestamp: number
}

export class BirthdayInsuranceContract {
  private contract: ethers.Contract
  private provider: ethers.Provider
  private signer?: ethers.Signer
  private contractAddress: string
  private supabase: any

  constructor(contractAddress: string, provider: ethers.Provider, signer?: ethers.Signer) {
    this.contractAddress = contractAddress
    this.provider = provider
    this.signer = signer
    this.contract = new ethers.Contract(contractAddress, BIRTHDAY_INSURANCE_ABI, signer || provider)
  }

  async initializeSupabase() {
    this.supabase = await createClient()
  }

  // Create a new birthday insurance policy
  async createPolicy(
    birthdayDate: string,
    celebrationLocation: string,
    celebrationType: string,
    premiumAmount: string,
    coverageAmount: string,
    oracleConditions: OracleCondition[],
  ): Promise<{ tokenId: number; transactionHash: string }> {
    if (!this.signer) {
      throw new Error("Signer required for policy creation")
    }

    try {
      console.log("[v0] Creating birthday insurance policy on-chain...")

      // Convert dates and amounts
      const birthdayTimestamp = Math.floor(new Date(birthdayDate).getTime() / 1000)
      const expiryTimestamp = birthdayTimestamp + 86400 // 24 hours after birthday
      const premiumWei = ethers.parseEther(premiumAmount)
      const coverageWei = ethers.parseEther(coverageAmount)

      // Encode oracle conditions
      const encodedConditions = this.encodeOracleConditions(oracleConditions)

      // Create policy transaction
      const tx = await this.contract.createBirthdayPolicy(
        birthdayTimestamp,
        celebrationLocation,
        celebrationType,
        coverageWei,
        encodedConditions,
        {
          value: premiumWei,
          gasLimit: 500000,
        },
      )

      const receipt = await tx.wait()

      // Extract token ID from event logs
      const policyCreatedEvent = receipt.logs.find(
        (log: any) => log.topics[0] === ethers.id("PolicyCreated(uint256,address,uint256,uint256)"),
      )

      const tokenId = Number.parseInt(policyCreatedEvent?.topics[1] || "0", 16)

      // Store policy data in database
      if (!this.supabase) await this.initializeSupabase()

      await this.supabase.from("blockchain_policies").insert({
        token_id: tokenId,
        contract_address: this.contractAddress,
        policy_holder: await this.signer.getAddress(),
        birthday_date: birthdayDate,
        celebration_location: celebrationLocation,
        celebration_type: celebrationType,
        premium_amount: premiumAmount,
        coverage_amount: coverageAmount,
        policy_status: "active",
        transaction_hash: tx.hash,
        block_number: receipt.blockNumber,
        oracle_conditions: oracleConditions,
        created_at: new Date().toISOString(),
      })

      console.log(`[v0] Policy created successfully. Token ID: ${tokenId}, TX: ${tx.hash}`)

      return {
        tokenId,
        transactionHash: tx.hash,
      }
    } catch (error) {
      console.error("[v0] Policy creation failed:", error)
      throw new Error(`Failed to create policy: ${error.message}`)
    }
  }

  // Get policy details from blockchain
  async getPolicy(tokenId: number): Promise<BirthdayPolicy> {
    try {
      const policyData = await this.contract.getPolicy(tokenId)

      return {
        tokenId,
        policyHolder: policyData.policyHolder,
        birthdayDate: new Date(policyData.birthdayDate * 1000).toISOString(),
        celebrationLocation: policyData.celebrationLocation,
        celebrationType: policyData.celebrationType,
        premiumAmount: ethers.formatEther(policyData.premiumAmount),
        coverageAmount: ethers.formatEther(policyData.coverageAmount),
        policyStatus: this.mapPolicyStatus(policyData.status),
        createdAt: policyData.createdAt,
        expiresAt: policyData.expiresAt,
        oracleConditions: this.decodeOracleConditions(policyData.oracleConditions),
      }
    } catch (error) {
      console.error("[v0] Failed to get policy:", error)
      throw new Error(`Failed to retrieve policy: ${error.message}`)
    }
  }

  // Submit a claim for a policy
  async submitClaim(
    tokenId: number,
    claimType: string,
    claimReason: string,
    evidenceHash: string,
    requestedAmount: string,
  ): Promise<string> {
    if (!this.signer) {
      throw new Error("Signer required for claim submission")
    }

    try {
      console.log(`[v0] Submitting claim for policy ${tokenId}...`)

      const requestedWei = ethers.parseEther(requestedAmount)
      const evidenceBytes = ethers.toUtf8Bytes(evidenceHash)

      const tx = await this.contract.submitClaim(tokenId, claimType, claimReason, evidenceBytes, requestedWei, {
        gasLimit: 300000,
      })

      await tx.wait()

      // Store claim in database
      if (!this.supabase) await this.initializeSupabase()

      await this.supabase.from("blockchain_claims").insert({
        token_id: tokenId,
        claim_type: claimType,
        claim_reason: claimReason,
        evidence_hash: evidenceHash,
        requested_amount: requestedAmount,
        transaction_hash: tx.hash,
        status: "pending",
        submitted_at: new Date().toISOString(),
      })

      console.log(`[v0] Claim submitted successfully. TX: ${tx.hash}`)
      return tx.hash
    } catch (error) {
      console.error("[v0] Claim submission failed:", error)
      throw new Error(`Failed to submit claim: ${error.message}`)
    }
  }

  // Process automatic payout based on oracle data
  async processAutomaticPayout(tokenId: number, oracleData: any, payoutPercentage: number): Promise<string> {
    if (!this.signer) {
      throw new Error("Signer required for payout processing")
    }

    try {
      console.log(`[v0] Processing automatic payout for policy ${tokenId}...`)

      // Encode oracle data
      const encodedOracleData = ethers.AbiCoder.defaultAbiCoder().encode(
        ["string", "uint256", "bytes"],
        [JSON.stringify(oracleData), payoutPercentage, "0x"],
      )

      const tx = await this.contract.processAutomaticPayout(tokenId, encodedOracleData, {
        gasLimit: 400000,
      })

      const receipt = await tx.wait()

      // Extract payout amount from event logs
      const payoutEvent = receipt.logs.find(
        (log: any) => log.topics[0] === ethers.id("PayoutProcessed(uint256,address,uint256,string)"),
      )

      console.log(`[v0] Automatic payout processed successfully. TX: ${tx.hash}`)

      // Store payout record
      if (!this.supabase) await this.initializeSupabase()

      await this.supabase.from("blockchain_payouts").insert({
        token_id: tokenId,
        payout_type: "automatic",
        oracle_data: oracleData,
        payout_percentage: payoutPercentage,
        transaction_hash: tx.hash,
        block_number: receipt.blockNumber,
        processed_at: new Date().toISOString(),
      })

      return tx.hash
    } catch (error) {
      console.error("[v0] Automatic payout failed:", error)
      throw new Error(`Failed to process payout: ${error.message}`)
    }
  }

  // Process manual payout (admin function)
  async processManualPayout(tokenId: number, payoutAmount: string, reason: string): Promise<string> {
    if (!this.signer) {
      throw new Error("Signer required for manual payout")
    }

    try {
      console.log(`[v0] Processing manual payout for policy ${tokenId}...`)

      const payoutWei = ethers.parseEther(payoutAmount)
      const reasonBytes = ethers.toUtf8Bytes(reason)

      const tx = await this.contract.processManualPayout(tokenId, payoutWei, reasonBytes, {
        gasLimit: 350000,
      })

      await tx.wait()

      console.log(`[v0] Manual payout processed successfully. TX: ${tx.hash}`)

      // Store payout record
      if (!this.supabase) await this.initializeSupabase()

      await this.supabase.from("blockchain_payouts").insert({
        token_id: tokenId,
        payout_type: "manual",
        payout_amount: payoutAmount,
        payout_reason: reason,
        transaction_hash: tx.hash,
        processed_at: new Date().toISOString(),
      })

      return tx.hash
    } catch (error) {
      console.error("[v0] Manual payout failed:", error)
      throw new Error(`Failed to process manual payout: ${error.message}`)
    }
  }

  // Get all policies for a user
  async getUserPolicies(userAddress: string): Promise<BirthdayPolicy[]> {
    try {
      const tokenIds = await this.contract.getUserPolicies(userAddress)
      const policies: BirthdayPolicy[] = []

      for (const tokenId of tokenIds) {
        try {
          const policy = await this.getPolicy(tokenId)
          policies.push(policy)
        } catch (error) {
          console.warn(`[v0] Failed to load policy ${tokenId}:`, error)
        }
      }

      return policies
    } catch (error) {
      console.error("[v0] Failed to get user policies:", error)
      throw new Error(`Failed to retrieve user policies: ${error.message}`)
    }
  }

  // Get contract statistics
  async getContractStats(): Promise<{
    totalPolicies: number
    activePolicies: number
    totalPremiums: string
    totalPayouts: string
    totalClaims: number
  }> {
    try {
      const stats = await this.contract.getContractStats()

      return {
        totalPolicies: stats.totalPolicies.toNumber(),
        activePolicies: stats.activePolicies.toNumber(),
        totalPremiums: ethers.formatEther(stats.totalPremiums),
        totalPayouts: ethers.formatEther(stats.totalPayouts),
        totalClaims: stats.totalClaims.toNumber(),
      }
    } catch (error) {
      console.error("[v0] Failed to get contract stats:", error)
      throw new Error(`Failed to retrieve contract statistics: ${error.message}`)
    }
  }

  // Helper methods
  private encodeOracleConditions(conditions: OracleCondition[]): string {
    return ethers.AbiCoder.defaultAbiCoder().encode(
      ["tuple(string,bytes,uint256,bool)[]"],
      [
        conditions.map((c) => [
          c.conditionType,
          ethers.toUtf8Bytes(JSON.stringify(c.parameters)),
          c.payoutPercentage,
          c.isActive,
        ]),
      ],
    )
  }

  private decodeOracleConditions(encodedConditions: string): OracleCondition[] {
    try {
      const decoded = ethers.AbiCoder.defaultAbiCoder().decode(
        ["tuple(string,bytes,uint256,bool)[]"],
        encodedConditions,
      )

      return decoded[0].map((c: any) => ({
        conditionType: c[0],
        parameters: JSON.parse(ethers.toUtf8String(c[1])),
        payoutPercentage: c[2],
        isActive: c[3],
      }))
    } catch (error) {
      console.warn("[v0] Failed to decode oracle conditions:", error)
      return []
    }
  }

  private mapPolicyStatus(status: number): "active" | "expired" | "claimed" | "cancelled" {
    switch (status) {
      case 0:
        return "active"
      case 1:
        return "expired"
      case 2:
        return "claimed"
      case 3:
        return "cancelled"
      default:
        return "active"
    }
  }
}

// Smart Contract ABI for Birthday Insurance
export const BIRTHDAY_INSURANCE_ABI = [
  {
    inputs: [
      { name: "birthdayDate", type: "uint256" },
      { name: "celebrationLocation", type: "string" },
      { name: "celebrationType", type: "string" },
      { name: "coverageAmount", type: "uint256" },
      { name: "oracleConditions", type: "bytes" },
    ],
    name: "createBirthdayPolicy",
    outputs: [{ name: "tokenId", type: "uint256" }],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [{ name: "tokenId", type: "uint256" }],
    name: "getPolicy",
    outputs: [
      { name: "policyHolder", type: "address" },
      { name: "birthdayDate", type: "uint256" },
      { name: "celebrationLocation", type: "string" },
      { name: "celebrationType", type: "string" },
      { name: "premiumAmount", type: "uint256" },
      { name: "coverageAmount", type: "uint256" },
      { name: "status", type: "uint8" },
      { name: "createdAt", type: "uint256" },
      { name: "expiresAt", type: "uint256" },
      { name: "oracleConditions", type: "bytes" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "tokenId", type: "uint256" },
      { name: "claimType", type: "string" },
      { name: "claimReason", type: "string" },
      { name: "evidenceHash", type: "bytes" },
      { name: "requestedAmount", type: "uint256" },
    ],
    name: "submitClaim",
    outputs: [{ name: "success", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "tokenId", type: "uint256" },
      { name: "oracleData", type: "bytes" },
    ],
    name: "processAutomaticPayout",
    outputs: [{ name: "success", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "tokenId", type: "uint256" },
      { name: "payoutAmount", type: "uint256" },
      { name: "reason", type: "bytes" },
    ],
    name: "processManualPayout",
    outputs: [{ name: "success", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "user", type: "address" }],
    name: "getUserPolicies",
    outputs: [{ name: "tokenIds", type: "uint256[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getContractStats",
    outputs: [
      { name: "totalPolicies", type: "uint256" },
      { name: "activePolicies", type: "uint256" },
      { name: "totalPremiums", type: "uint256" },
      { name: "totalPayouts", type: "uint256" },
      { name: "totalClaims", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "tokenId", type: "uint256" },
      { indexed: true, name: "policyHolder", type: "address" },
      { indexed: false, name: "premiumAmount", type: "uint256" },
      { indexed: false, name: "coverageAmount", type: "uint256" },
    ],
    name: "PolicyCreated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "tokenId", type: "uint256" },
      { indexed: true, name: "recipient", type: "address" },
      { indexed: false, name: "amount", type: "uint256" },
      { indexed: false, name: "reason", type: "string" },
    ],
    name: "PayoutProcessed",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "tokenId", type: "uint256" },
      { indexed: true, name: "claimant", type: "address" },
      { indexed: false, name: "claimType", type: "string" },
      { indexed: false, name: "requestedAmount", type: "uint256" },
    ],
    name: "ClaimSubmitted",
    type: "event",
  },
]

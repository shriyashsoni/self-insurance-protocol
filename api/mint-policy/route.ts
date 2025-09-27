import { type NextRequest, NextResponse } from "next/server"
import { getCeloNetwork, getContractAddresses } from "@/lib/deployment/celo-config"

export async function POST(request: NextRequest) {
  try {
    const { policyType, premium, payout, duration, userAddress } = await request.json()

    console.log("[v0] Minting policy NFT for:", policyType)

    const network = getCeloNetwork(true) // Use testnet
    const contracts = getContractAddresses(true)

    // Simulate NFT minting (replace with actual contract call)
    const tokenId = Date.now() + Math.floor(Math.random() * 1000)
    const transactionHash = `0x${Math.random().toString(16).substr(2, 64)}`

    // In production, this would interact with the deployed smart contract
    const policyNFT = {
      tokenId,
      transactionHash,
      policyType,
      premium,
      payout,
      duration,
      userAddress,
      contractAddress: contracts.insurancePolicy,
      network: network.name,
    }

    return NextResponse.json(policyNFT)
  } catch (error) {
    console.error("[v0] Policy minting API error:", error)
    return NextResponse.json({ error: "Minting failed" }, { status: 500 })
  }
}

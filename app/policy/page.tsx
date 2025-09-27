"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useWallet } from "@/lib/wallet/wallet-context"
import { useAuth } from "@/lib/auth/auth-context"
import { Shield, Clock, DollarSign, AlertTriangle } from "lucide-react"
import { supabase } from "@/lib/supabase/client"

interface PolicyType {
  id: string
  name: string
  description: string
  premium: number
  payout: number
  duration: number
  riskLevel: "low" | "medium" | "high"
}

const policyTypes: PolicyType[] = [
  {
    id: "flight",
    name: "Flight Delay Insurance",
    description: "Coverage for flight delays over 2 hours",
    premium: 25,
    payout: 500,
    duration: 30,
    riskLevel: "low",
  },
  {
    id: "weather",
    name: "Weather Protection",
    description: "Coverage for extreme weather events",
    premium: 50,
    payout: 1000,
    duration: 90,
    riskLevel: "medium",
  },
  {
    id: "health",
    name: "Health Emergency",
    description: "Coverage for unexpected health emergencies",
    premium: 100,
    payout: 2500,
    duration: 365,
    riskLevel: "high",
  },
]

export default function PolicyPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { account, isConnected, connectWallet } = useWallet()
  const [selectedPolicy, setSelectedPolicy] = useState<PolicyType | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [userPolicies, setUserPolicies] = useState<any[]>([])

  useEffect(() => {
    if (!user) {
      router.push("/auth/login")
      return
    }

    // Load user's existing policies
    loadUserPolicies()
  }, [user])

  const loadUserPolicies = async () => {
    try {
      const { data: policies, error } = await supabase
        .from("policies")
        .select("*")
        .eq("user_id", user.id)
        .eq("active", true)

      if (error) throw error
      setUserPolicies(policies || [])
      console.log("[v0] Loaded user policies:", policies?.length || 0)
    } catch (error) {
      console.error("[v0] Failed to load user policies:", error)
    }
  }

  const handlePolicyPurchase = async () => {
    if (!selectedPolicy || !isConnected || !account) {
      return
    }

    setIsLoading(true)
    try {
      console.log("[v0] Purchasing policy:", selectedPolicy.id)

      // Step 1: Verify user identity (Self SDK integration)
      const identityVerified = await verifyUserIdentity()
      if (!identityVerified) {
        router.push("/verification")
        return
      }

      // Step 2: Process payment and mint policy NFT
      const policyNFT = await mintPolicyNFT(selectedPolicy)

      // Step 3: Store policy in database
      await storePolicyInDatabase(policyNFT)

      // Step 4: Set up oracle monitoring
      await setupOracleMonitoring(selectedPolicy)

      console.log("[v0] Policy purchased successfully")
      router.push("/dashboard")
    } catch (error) {
      console.error("[v0] Policy purchase failed:", error)
      router.push("/dashboard")
    } finally {
      setIsLoading(false)
    }
  }

  const verifyUserIdentity = async (): Promise<boolean> => {
    try {
      const response = await fetch("/api/verify-identity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, walletAddress: account }),
      })

      const result = await response.json()
      console.log("[v0] Identity verification result:", result.verified)
      return result.verified
    } catch (error) {
      console.error("[v0] Identity verification failed:", error)
      return false
    }
  }

  const mintPolicyNFT = async (policy: PolicyType) => {
    try {
      const response = await fetch("/api/mint-policy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          policyType: policy.id,
          premium: policy.premium,
          payout: policy.payout,
          duration: policy.duration,
          userAddress: account,
        }),
      })

      const result = await response.json()
      console.log("[v0] Policy NFT minted:", result.tokenId)
      return result
    } catch (error) {
      console.error("[v0] NFT minting failed:", error)
      throw error
    }
  }

  const storePolicyInDatabase = async (policyNFT: any) => {
    try {
      const { data, error } = await supabase
        .from("policies")
        .insert({
          user_id: user.id,
          policy_type: selectedPolicy?.id,
          premium: selectedPolicy?.premium,
          payout: selectedPolicy?.payout,
          duration: selectedPolicy?.duration,
          token_id: policyNFT.tokenId,
          wallet_address: account,
          active: true,
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + (selectedPolicy?.duration || 0) * 24 * 60 * 60 * 1000).toISOString(),
        })
        .select()
        .single()

      if (error) throw error
      console.log("[v0] Policy stored in database:", data.id)
      return data
    } catch (error) {
      console.error("[v0] Database storage failed:", error)
      throw error
    }
  }

  const setupOracleMonitoring = async (policy: PolicyType) => {
    try {
      const response = await fetch("/api/setup-oracle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          policyType: policy.id,
          userAddress: account,
          monitoringParams: getMonitoringParams(policy.id),
        }),
      })

      const result = await response.json()
      console.log("[v0] Oracle monitoring setup:", result.success)
    } catch (error) {
      console.error("[v0] Oracle setup failed:", error)
      throw error
    }
  }

  const getMonitoringParams = (policyType: string) => {
    switch (policyType) {
      case "flight":
        return { type: "flight_delay", threshold: 120 } // 2 hours
      case "weather":
        return { type: "extreme_weather", severity: "high" }
      case "health":
        return { type: "health_emergency", coverage: "emergency" }
      default:
        return {}
    }
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case "low":
        return "bg-green-100 text-green-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "high":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Insurance Policies</h1>
          <p className="text-muted-foreground">Purchase parametric insurance policies with automatic payouts</p>
        </div>

        {!isConnected && (
          <Card className="mb-8 border-orange-200 bg-orange-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="font-medium text-orange-900">Wallet Required</p>
                  <p className="text-sm text-orange-700">Connect your wallet to purchase insurance policies</p>
                </div>
                <Button onClick={connectWallet} className="ml-auto">
                  Connect Wallet
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div>
            <h2 className="text-xl font-semibold mb-4">Available Policies</h2>
            <div className="space-y-4">
              {policyTypes.map((policy) => (
                <Card
                  key={policy.id}
                  className={`cursor-pointer transition-all ${
                    selectedPolicy?.id === policy.id ? "ring-2 ring-primary border-primary" : "hover:shadow-md"
                  }`}
                  onClick={() => setSelectedPolicy(policy)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{policy.name}</CardTitle>
                        <CardDescription className="mt-1">{policy.description}</CardDescription>
                      </div>
                      <Badge className={getRiskColor(policy.riskLevel)}>{policy.riskLevel} risk</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">${policy.premium}</p>
                          <p className="text-muted-foreground">Premium</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">${policy.payout}</p>
                          <p className="text-muted-foreground">Payout</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{policy.duration}d</p>
                          <p className="text-muted-foreground">Duration</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Policy Details</h2>
            {selectedPolicy ? (
              <Card>
                <CardHeader>
                  <CardTitle>{selectedPolicy.name}</CardTitle>
                  <CardDescription>{selectedPolicy.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Premium</Label>
                      <p className="text-2xl font-bold">${selectedPolicy.premium}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Max Payout</Label>
                      <p className="text-2xl font-bold">${selectedPolicy.payout}</p>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <Label className="text-sm font-medium">Coverage Period</Label>
                    <p className="text-lg">{selectedPolicy.duration} days</p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Risk Level</Label>
                    <Badge className={getRiskColor(selectedPolicy.riskLevel)}>{selectedPolicy.riskLevel} risk</Badge>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Policy Terms</Label>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Automatic payout when conditions are met</li>
                      <li>• Oracle-verified event triggers</li>
                      <li>• No claim filing required</li>
                      <li>• Instant settlement via smart contract</li>
                    </ul>
                  </div>

                  <Button
                    onClick={handlePolicyPurchase}
                    disabled={!isConnected || isLoading}
                    className="w-full"
                    size="lg"
                  >
                    {isLoading ? "Processing..." : `Purchase for $${selectedPolicy.premium}`}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center text-muted-foreground">
                    <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Select a policy to view details</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {userPolicies.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Your Active Policies</h2>
            <div className="grid gap-4">
              {userPolicies.map((policy, index) => (
                <Card key={index}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{policy.name}</h3>
                        <p className="text-sm text-muted-foreground">Expires: {policy.expires_at}</p>
                      </div>
                      <Badge variant="outline">Active</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

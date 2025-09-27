"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Loader2, Shield, DollarSign, Calendar, AlertTriangle, Wallet } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useWallet } from "@/lib/wallet/wallet-context"
import { toast } from "sonner"

interface PolicyPurchaseModalProps {
  isOpen: boolean
  onClose: () => void
  policy: {
    id: string
    name: string
    type: string
    premium: number
    coverage: number
    duration: string
    conditions: string[]
  } | null
  onPurchaseComplete: () => void
}

export function PolicyPurchaseModal({ isOpen, onClose, policy, onPurchaseComplete }: PolicyPurchaseModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()
  const { isConnected, address, balance, chainId, connect } = useWallet()

  if (!policy) return null

  const isCeloNetwork = chainId === 42220 || chainId === 44787
  const hasInsufficientBalance = balance && Number.parseFloat(balance) < policy.premium

  const handlePurchase = async () => {
    if (!isConnected) {
      await connect()
      return
    }

    if (!isCeloNetwork) {
      setError("Please switch to Celo network to purchase policies")
      return
    }

    if (hasInsufficientBalance) {
      setError("Insufficient balance to purchase this policy")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("User not authenticated")

      // Check if user is verified
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("self_verification_status, kyc_verified")
        .eq("id", user.id)
        .single()

      if (userError) throw userError
      if (userData.self_verification_status !== "verified" || !userData.kyc_verified) {
        setError("Please complete identity verification first")
        setTimeout(() => {
          window.location.href = "/verification"
        }, 2000)
        return
      }

      // In a real implementation, this would:
      // 1. Call smart contract to approve cUSD spending
      // 2. Call insurance contract to purchase policy
      // 3. Mint SBT policy token
      // 4. Store transaction hashes

      // Mock blockchain transaction
      console.log("[v0] Initiating blockchain transaction for policy purchase")

      // Simulate transaction delay
      await new Promise((resolve) => setTimeout(resolve, 3000))

      const startDate = new Date()
      const endDate = new Date()
      endDate.setMonth(endDate.getMonth() + Number.parseInt(policy.duration.split(" ")[0]))

      const policyData = {
        user_id: user.id,
        policy_type: policy.type,
        policy_name: policy.name,
        premium_amount: policy.premium,
        coverage_amount: policy.coverage,
        policy_terms: {
          conditions: policy.conditions,
          duration: policy.duration,
        },
        oracle_conditions: {
          type: policy.type,
          triggers: policy.conditions,
        },
        policy_status: "active",
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        nft_token_id: "sbt_" + Date.now(),
        contract_address: "0x" + Math.random().toString(16).substr(2, 40),
      }

      const { data: newPolicy, error: policyError } = await supabase
        .from("insurance_policies")
        .insert(policyData)
        .select()
        .single()

      if (policyError) throw policyError

      // Update user wallet address
      if (address) {
        await supabase.from("users").update({ wallet_address: address }).eq("id", user.id)
      }

      toast.success("Policy purchased successfully!")
      onPurchaseComplete()
      onClose()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Purchase failed"
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-card-foreground">Purchase Insurance Policy</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Review and confirm your policy purchase
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">{policy.name}</h3>
              <Badge variant="secondary" className="bg-secondary text-secondary-foreground capitalize">
                {policy.type}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <DollarSign className="h-4 w-4" />
                  <span>Premium</span>
                </div>
                <p className="text-lg font-semibold text-foreground">${policy.premium}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Shield className="h-4 w-4" />
                  <span>Coverage</span>
                </div>
                <p className="text-lg font-semibold text-foreground">${policy.coverage.toLocaleString()}</p>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Duration</span>
              </div>
              <p className="text-sm text-foreground">{policy.duration}</p>
            </div>
          </div>

          <Separator className="bg-border" />

          {/* Wallet Status */}
          <div className="space-y-3">
            <h4 className="font-medium text-foreground">Wallet Status</h4>

            {!isConnected ? (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                <Wallet className="h-4 w-4 text-orange-400" />
                <span className="text-sm text-orange-400">Wallet not connected</span>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Connected Address:</span>
                  <span className="text-foreground font-mono">
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Balance:</span>
                  <span className="text-foreground">{balance || "0.0000"} CELO</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Network:</span>
                  <Badge
                    className={
                      isCeloNetwork
                        ? "bg-accent/10 text-accent border-accent/20"
                        : "bg-destructive/10 text-destructive border-destructive/20"
                    }
                  >
                    {isCeloNetwork ? "Celo" : "Unsupported"}
                  </Badge>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span className="text-sm text-destructive">{error}</span>
            </div>
          )}

          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <h4 className="font-medium text-foreground">Transaction Details:</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Premium payment will be processed in cUSD</li>
              <li>• Policy will be minted as a non-transferable SBT token</li>
              <li>• Payouts are automatic based on oracle data</li>
              <li>• Policy becomes active immediately after purchase</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1 border-border text-foreground bg-transparent">
              Cancel
            </Button>
            <Button
              onClick={handlePurchase}
              disabled={isLoading || (!isConnected && !isLoading)}
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : !isConnected ? (
                "Connect Wallet"
              ) : (
                `Purchase for $${policy.premium}`
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Shield, CheckCircle, AlertCircle, ExternalLink } from "lucide-react"
import { useSelf } from "@/lib/self-sdk/self-context"
import { useWallet } from "@/lib/wallet/wallet-context"

interface SelfVerificationCardProps {
  onVerificationComplete?: (data: any) => void
}

export function SelfVerificationCard({ onVerificationComplete }: SelfVerificationCardProps) {
  const [isVerifying, setIsVerifying] = useState(false)
  const { session, startVerification, verifyProof, error: selfError } = useSelf()
  const { isConnected, address } = useWallet()

  const handleStartVerification = async () => {
    if (!isConnected || !address) {
      return
    }

    setIsVerifying(true)

    try {
      const verificationConfig = {
        disclosures: ["country", "age_range", "sanctions_check", "document_type"],
        redirectUrl: `${window.location.origin}/verification/callback`,
      }

      console.log("[v0] Starting Self Protocol verification...")

      // Start the verification process
      const verificationUrl = await startVerification(verificationConfig)

      // For demo purposes, simulate successful verification after 3 seconds
      setTimeout(async () => {
        try {
          const mockProof = {
            country: "US",
            ageRange: "25-35",
            sanctionsCheck: "clear",
            documentType: "passport",
            nullifier: `nullifier_${Date.now()}`,
            userIdentifier: `user_${Date.now()}`,
          }

          const result = await verifyProof(mockProof)

          if (onVerificationComplete) {
            onVerificationComplete(result)
          }

          setIsVerifying(false)
        } catch (error) {
          console.error("[v0] Verification error:", error)
          setIsVerifying(false)
        }
      }, 3000)
    } catch (error) {
      console.error("[v0] Failed to start verification:", error)
      setIsVerifying(false)
    }
  }

  if (!isConnected) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            <CardTitle className="text-sm">Wallet Required</CardTitle>
          </div>
          <CardDescription className="text-xs">Connect your wallet first to verify your identity</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (session?.isAuthenticated) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <CardTitle className="text-sm">Self Protocol Connected</CardTitle>
          </div>
          <CardDescription className="text-xs">DID: {session.did}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleStartVerification} disabled={isVerifying} className="w-full" size="sm">
            {isVerifying ? (
              <>
                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                Verifying Identity...
              </>
            ) : (
              <>
                <Shield className="mr-2 h-3 w-3" />
                Start KYC Verification
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-500" />
          <CardTitle className="text-sm">Self Protocol</CardTitle>
        </div>
        <CardDescription className="text-xs">Privacy-preserving identity verification</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {selfError && (
          <div className="p-2 rounded bg-red-50 border border-red-200">
            <p className="text-xs text-red-600">{selfError}</p>
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-3 w-3 text-green-500" />
            <span className="text-xs">Zero-knowledge proofs</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-3 w-3 text-green-500" />
            <span className="text-xs">No data stored on-chain</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-3 w-3 text-green-500" />
            <span className="text-xs">Compliance ready</span>
          </div>
        </div>

        <Button onClick={handleStartVerification} disabled={isVerifying} className="w-full" size="sm">
          {isVerifying ? (
            <>
              <Loader2 className="mr-2 h-3 w-3 animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <ExternalLink className="mr-2 h-3 w-3" />
              Connect Self Protocol
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}

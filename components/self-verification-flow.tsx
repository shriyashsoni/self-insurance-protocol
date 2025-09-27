"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Shield, CheckCircle, XCircle } from "lucide-react"
import { SELF_CONFIG, type SelfVerificationResult } from "@/lib/self-sdk/self-config"
import { useWallet } from "@/lib/wallet/wallet-context"

interface SelfVerificationFlowProps {
  onVerificationComplete?: (result: SelfVerificationResult) => void
  requiredForPurchase?: boolean
}

export function SelfVerificationFlow({
  onVerificationComplete,
  requiredForPurchase = false,
}: SelfVerificationFlowProps) {
  const { address, isConnected } = useWallet()
  const [verificationStatus, setVerificationStatus] = useState<SelfVerificationResult>({
    status: "not_started",
  })
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (address) {
      checkExistingVerification()
    }
  }, [address])

  const checkExistingVerification = async () => {
    if (!address) return

    try {
      const response = await fetch(`/api/verification/status?address=${address}`)
      if (response.ok) {
        const result = await response.json()
        setVerificationStatus(result)
        if (result.status === "completed" && onVerificationComplete) {
          onVerificationComplete(result)
        }
      }
    } catch (error) {
      console.error("Failed to check verification status:", error)
    }
  }

  const startVerification = async () => {
    if (!address || !isConnected) return

    setIsLoading(true)
    setVerificationStatus({ status: "in_progress" })

    try {
      const response = await fetch("/api/verification/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address,
          config: SELF_CONFIG.verificationConfig,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to start verification")
      }

      const { verificationUrl, sessionId } = await response.json()

      const verificationWindow = window.open(
        verificationUrl,
        "self-verification",
        "width=400,height=600,scrollbars=yes,resizable=yes",
      )

      const pollInterval = setInterval(async () => {
        try {
          const statusResponse = await fetch(`/api/verification/status?sessionId=${sessionId}`)
          if (statusResponse.ok) {
            const result = await statusResponse.json()

            if (result.status === "completed" || result.status === "failed") {
              clearInterval(pollInterval)
              setVerificationStatus(result)
              setIsLoading(false)

              if (verificationWindow) {
                verificationWindow.close()
              }

              if (result.status === "completed" && onVerificationComplete) {
                onVerificationComplete(result)
              }
            }
          }
        } catch (error) {
          console.error("Polling error:", error)
        }
      }, 2000)

      const checkClosed = setInterval(() => {
        if (verificationWindow?.closed) {
          clearInterval(pollInterval)
          clearInterval(checkClosed)
          setIsLoading(false)
          if (verificationStatus.status === "in_progress") {
            setVerificationStatus({ status: "not_started" })
          }
        }
      }, 1000)
    } catch (error) {
      console.error("Verification error:", error)
      setVerificationStatus({
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
      })
      setIsLoading(false)
    }
  }

  const getStatusIcon = () => {
    switch (verificationStatus.status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-400" />
      case "failed":
        return <XCircle className="h-5 w-5 text-red-400" />
      case "in_progress":
        return <Loader2 className="h-5 w-5 text-blue-400 animate-spin" />
      default:
        return <Shield className="h-5 w-5 text-muted-foreground" />
    }
  }

  const getStatusBadge = () => {
    switch (verificationStatus.status) {
      case "completed":
        return (
          <Badge variant="default" className="bg-green-500/20 text-green-400 border-green-500/30">
            Verified
          </Badge>
        )
      case "failed":
        return <Badge variant="outline">Ready to Verify</Badge>
      case "in_progress":
        return <Badge variant="secondary">In Progress</Badge>
      default:
        return <Badge variant="outline">Ready to Verify</Badge>
    }
  }

  if (!isConnected) {
    return (
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Identity Verification
          </CardTitle>
          <CardDescription>Connect your wallet to start identity verification</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            Identity Verification
          </div>
          {getStatusBadge()}
        </CardTitle>
        <CardDescription>
          {verificationStatus.status === "completed"
            ? "Your identity has been verified using Self Protocol"
            : "Ready to start verification process"}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {verificationStatus.status === "completed" && verificationStatus.attributes && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Verified Attributes:</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {verificationStatus.attributes.age && <div>Age: {verificationStatus.attributes.age}+</div>}
              {verificationStatus.attributes.country && <div>Country: {verificationStatus.attributes.country}</div>}
              {verificationStatus.attributes.isOfacClear && <div className="text-green-400">✓ OFAC Clear</div>}
              {verificationStatus.attributes.hasPassport && <div className="text-green-400">✓ Passport Verified</div>}
            </div>
          </div>
        )}

        {verificationStatus.status !== "completed" && (
          <Button onClick={startVerification} disabled={isLoading || !isConnected} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <Shield className="mr-2 h-4 w-4" />
                {verificationStatus.status === "failed" ? "Retry Verification" : "Start Verification"}
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

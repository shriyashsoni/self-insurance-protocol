"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Shield, CheckCircle, QrCode } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface VerificationStatus {
  isVerified: boolean
  verificationData?: {
    country: string
    ageRange: string
    kycStatus: string
    documentType: string
  }
  nullifier?: string
}

export function IdentityVerification() {
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>({ isVerified: false })
  const [isLoading, setIsLoading] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkVerificationStatus()
  }, [])

  const checkVerificationStatus = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data: userData, error } = await supabase
        .from("users")
        .select("self_verification_status, self_verification_data, country_code, kyc_verified")
        .eq("id", user.id)
        .single()

      if (error) throw error

      if (userData?.self_verification_status === "verified") {
        setVerificationStatus({
          isVerified: true,
          verificationData: {
            country: userData.country_code || "Unknown",
            ageRange: userData.self_verification_data?.ageRange || "Unknown",
            kycStatus: userData.kyc_verified ? "Verified" : "Pending",
            documentType: userData.self_verification_data?.documentType || "Unknown",
          },
        })
      }
    } catch (error) {
      console.error("Error checking verification status:", error)
    }
  }

  const startVerification = async () => {
    setIsLoading(true)
    setShowQR(true)

    try {
      // Initialize Self SDK verification flow
      // This would integrate with the actual Self SDK
      const verificationConfig = {
        disclosures: ["country", "age_range", "sanctions_check", "document_type"],
        redirectUrl: `${window.location.origin}/verification/callback`,
      }

      // Mock Self SDK integration - in real implementation, this would use Self SDK
      console.log("[v0] Starting Self SDK verification with config:", verificationConfig)

      // Simulate verification process
      setTimeout(async () => {
        await handleVerificationSuccess({
          country: "US",
          ageRange: "25-35",
          sanctionsCheck: "clear",
          documentType: "passport",
          nullifier: "mock_nullifier_" + Date.now(),
        })
      }, 3000)
    } catch (error) {
      setIsLoading(false)
      setShowQR(false)
    }
  }

  const handleVerificationSuccess = async (verificationData: any) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("User not authenticated")

      // Update user verification status in database
      const { error } = await supabase
        .from("users")
        .update({
          self_verification_status: "verified",
          self_verification_data: verificationData,
          country_code: verificationData.country,
          kyc_verified: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      if (error) throw error

      setVerificationStatus({
        isVerified: true,
        verificationData: {
          country: verificationData.country,
          ageRange: verificationData.ageRange,
          kycStatus: "Verified",
          documentType: verificationData.documentType,
        },
        nullifier: verificationData.nullifier,
      })

      setIsLoading(false)
      setShowQR(false)

      // Redirect to policy purchase page
      router.push("/policies")
    } catch (error) {
      setIsLoading(false)
      setShowQR(false)
    }
  }

  if (verificationStatus.isVerified) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-6 w-6 text-accent" />
            <CardTitle className="text-foreground">Identity Verified</CardTitle>
          </div>
          <CardDescription className="text-muted-foreground">
            Your identity has been successfully verified using Self Protocol
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Country</p>
              <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
                {verificationStatus.verificationData?.country}
              </Badge>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Age Range</p>
              <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
                {verificationStatus.verificationData?.ageRange}
              </Badge>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">KYC Status</p>
              <Badge variant="default" className="bg-accent text-accent-foreground">
                {verificationStatus.verificationData?.kycStatus}
              </Badge>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Document Type</p>
              <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
                {verificationStatus.verificationData?.documentType}
              </Badge>
            </div>
          </div>
          <Button
            onClick={() => router.push("/policies")}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Continue to Insurance Policies
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          <CardTitle className="text-foreground">Identity Verification</CardTitle>
        </div>
        <CardDescription className="text-muted-foreground">
          Verify your identity using Self Protocol to access parametric insurance policies
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">What we'll verify:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-card border border-border">
              <CheckCircle className="h-4 w-4 text-accent" />
              <span className="text-sm text-foreground">Country of residence</span>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-card border border-border">
              <CheckCircle className="h-4 w-4 text-accent" />
              <span className="text-sm text-foreground">Age verification</span>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-card border border-border">
              <CheckCircle className="h-4 w-4 text-accent" />
              <span className="text-sm text-foreground">Sanctions screening</span>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-card border border-border">
              <CheckCircle className="h-4 w-4 text-accent" />
              <span className="text-sm text-foreground">Document authenticity</span>
            </div>
          </div>
        </div>

        {showQR ? (
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="p-8 bg-card border border-border rounded-lg">
                <QrCode className="h-32 w-32 text-muted-foreground" />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Scan QR code with Self app</p>
              <p className="text-xs text-muted-foreground">
                Open the Self app on your mobile device and scan this QR code to begin verification
              </p>
            </div>
            {isLoading && (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">Processing verification...</span>
              </div>
            )}
          </div>
        ) : (
          <Button
            onClick={startVerification}
            disabled={isLoading}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Starting Verification...
              </>
            ) : (
              "Start Identity Verification"
            )}
          </Button>
        )}

        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Your personal data is processed privately using zero-knowledge proofs</p>
          <p>• No personal information is stored on the blockchain</p>
          <p>• Verification is powered by Self Protocol's privacy-preserving technology</p>
        </div>
      </CardContent>
    </Card>
  )
}

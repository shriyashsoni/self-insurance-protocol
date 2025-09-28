"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2, Shield, CheckCircle, XCircle, QrCode, Plane, MapPin, FileCheck } from "lucide-react"
import { useWallet } from "@/lib/wallet/wallet-context"
import { selfTravelSDK, type VerificationSession, type TravelCredential } from "@/lib/self-sdk/selftravel-integration"
import { motion, AnimatePresence } from "framer-motion"

interface SelfTravelVerificationFlowProps {
  onVerificationComplete?: (credentials: TravelCredential[]) => void
  requiredForTravel?: boolean
}

export function SelfTravelVerificationFlow({
  onVerificationComplete,
  requiredForTravel = false,
}: SelfTravelVerificationFlowProps) {
  const { address, isConnected } = useWallet()
  const [verificationSession, setVerificationSession] = useState<VerificationSession | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showQRModal, setShowQRModal] = useState(false)

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
        const session = await response.json()
        setVerificationSession(session)
        if (session.status === "completed" && session.credentials && onVerificationComplete) {
          onVerificationComplete(session.credentials)
        }
      }
    } catch (error) {
      console.error("Failed to check verification status:", error)
    }
  }

  const startVerification = async () => {
    if (!address || !isConnected) return

    setIsLoading(true)

    try {
      const session = await selfTravelSDK.createVerificationSession(address, address)
      setVerificationSession(session)
      setShowQRModal(true)

      const pollInterval = setInterval(async () => {
        try {
          const updatedSession = await selfTravelSDK.checkVerificationStatus(session.id)
          setVerificationSession(updatedSession)

          if (updatedSession.status === "completed" || updatedSession.status === "failed") {
            clearInterval(pollInterval)
            setIsLoading(false)
            setShowQRModal(false)

            if (updatedSession.status === "completed" && updatedSession.credentials && onVerificationComplete) {
              onVerificationComplete(updatedSession.credentials)
            }
          }
        } catch (error) {
          console.error("Polling error:", error)
        }
      }, 3000)

      setTimeout(() => {
        clearInterval(pollInterval)
        setIsLoading(false)
        setShowQRModal(false)
      }, 300000)
    } catch (error) {
      console.error("Verification error:", error)
      setIsLoading(false)
    }
  }

  const openSelfApp = () => {
    if (verificationSession?.deepLink) {
      window.open(verificationSession.deepLink, "_blank")
    }
  }

  const getStatusIcon = () => {
    switch (verificationSession?.status) {
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
    switch (verificationSession?.status) {
      case "completed":
        return (
          <Badge variant="default" className="bg-green-500/20 text-green-400 border-green-500/30">
            Travel Ready
          </Badge>
        )
      case "failed":
        return <Badge variant="destructive">Verification Failed</Badge>
      case "in_progress":
        return <Badge variant="secondary">Verifying...</Badge>
      default:
        return <Badge variant="outline">Not Verified</Badge>
    }
  }

  const getCredentialIcon = (type: string) => {
    switch (type) {
      case "passport":
        return <FileCheck className="h-4 w-4 text-blue-400" />
      case "travel_pass":
        return <Plane className="h-4 w-4 text-green-400" />
      case "visa":
        return <MapPin className="h-4 w-4 text-purple-400" />
      case "vaccination":
        return <Shield className="h-4 w-4 text-orange-400" />
      default:
        return <FileCheck className="h-4 w-4 text-muted-foreground" />
    }
  }

  if (!isConnected) {
    return (
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Travel Identity Verification
          </CardTitle>
          <CardDescription>Connect your wallet to start travel identity verification</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <>
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              Travel Identity Verification
            </div>
            {getStatusBadge()}
          </CardTitle>
          <CardDescription>
            {verificationSession?.status === "completed"
              ? "Your travel identity has been verified using Self Protocol"
              : "Verify your identity to access travel credentials and services"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {verificationSession?.status === "completed" && verificationSession.credentials && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">Travel Credentials:</h4>
              <div className="grid gap-2">
                {verificationSession.credentials.map((credential) => (
                  <div
                    key={credential.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border/50"
                  >
                    <div className="flex items-center gap-3">
                      {getCredentialIcon(credential.type)}
                      <div>
                        <div className="text-sm font-medium capitalize">{credential.type.replace("_", " ")}</div>
                        <div className="text-xs text-muted-foreground">
                          Issued by {credential.issuer.split(":").pop()}
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      Valid
                    </Badge>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {verificationSession?.status !== "completed" && (
            <div className="space-y-3">
              <Button onClick={startVerification} disabled={isLoading || !isConnected} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Starting Verification...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    {verificationSession?.status === "failed" ? "Retry Verification" : "Start Travel Verification"}
                  </>
                )}
              </Button>

              {requiredForTravel && (
                <p className="text-xs text-muted-foreground text-center">
                  Travel verification is required to access premium travel services and credentials
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showQRModal} onOpenChange={setShowQRModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Verify with Self App
            </DialogTitle>
            <DialogDescription>
              Scan the QR code with your Self app or tap the button to open the app directly
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <AnimatePresence>
              {verificationSession?.qrCode && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex justify-center p-4 bg-white rounded-lg"
                >
                  <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                    <QrCode className="h-16 w-16 text-gray-400" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex flex-col gap-2">
              <Button onClick={openSelfApp} variant="outline" className="w-full bg-transparent">
                <Plane className="mr-2 h-4 w-4" />
                Open Self App
              </Button>
              <Button onClick={() => setShowQRModal(false)} variant="ghost" className="w-full">
                Cancel
              </Button>
            </div>

            {verificationSession?.status === "in_progress" && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Waiting for verification...
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

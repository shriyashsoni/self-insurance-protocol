"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { WalletConnect } from "@/components/wallet-connect"
import { SelfVerificationCard } from "@/components/self-verification-card"
import { useWallet } from "@/lib/wallet/wallet-context"
import { createClient } from "@/lib/supabase/client"
import { CheckCircle, ArrowRight, Shield, Zap, Lock } from "lucide-react"

export default function ConnectWalletPage() {
  const { isConnected, address } = useWallet()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [verificationComplete, setVerificationComplete] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (isConnected && address && user && verificationComplete) {
      setTimeout(() => {
        router.push("/dashboard")
      }, 2000)
    }
  }, [isConnected, address, user, verificationComplete, router])

  const checkAuth = async () => {
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      setUser(user)
    } catch (error) {
      console.error("[v0] Auth check error:", error)
      router.push("/auth/login")
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerificationComplete = (verificationData: any) => {
    console.log("[v0] Verification completed:", verificationData)
    setVerificationComplete(true)
  }

  const handleContinue = () => {
    router.push("/dashboard")
  }

  if (isLoading) {
    return (
      <div className="flex min-h-svh w-full items-center justify-center p-6 bg-background">
        <div className="animate-pulse">Loading...</div>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 bg-background">
      <div className="w-full max-w-4xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center">
            <div className="p-3 rounded-full bg-primary/10 border border-primary/20">
              <Shield className="h-8 w-8 text-primary" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-balance mb-2">Welcome to Insurance Protocol</h1>
            <p className="text-muted-foreground text-lg">
              Connect your wallet and verify your identity to start purchasing parametric insurance policies
            </p>
          </div>
        </div>

        {/* User Info */}
        {user && (
          <Card className="bg-card/50 border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-400" />
                <div>
                  <p className="font-medium">Logged in as</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Connection Flow */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Wallet Connection */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Step 1: Connect Wallet</h2>
            <WalletConnect />
          </div>

          {/* Self Protocol Verification */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Step 2: Verify Identity</h2>
            <SelfVerificationCard onVerificationComplete={handleVerificationComplete} />
          </div>
        </div>

        {/* Features Overview */}
        {!isConnected && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-card/30 border-border/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-2">
                  <Zap className="h-5 w-5 text-yellow-400" />
                  <h3 className="font-medium">Instant Payouts</h3>
                </div>
                <p className="text-sm text-muted-foreground">Automated payouts triggered by oracle data</p>
              </CardContent>
            </Card>

            <Card className="bg-card/30 border-border/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-2">
                  <Lock className="h-5 w-5 text-blue-400" />
                  <h3 className="font-medium">Privacy First</h3>
                </div>
                <p className="text-sm text-muted-foreground">Self Protocol ensures your data stays private</p>
              </CardContent>
            </Card>

            <Card className="bg-card/30 border-border/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-2">
                  <Shield className="h-5 w-5 text-green-400" />
                  <h3 className="font-medium">Decentralized</h3>
                </div>
                <p className="text-sm text-muted-foreground">Built on Celo blockchain for transparency</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Success State */}
        {isConnected && address && verificationComplete && (
          <Card className="bg-green-500/10 border-green-500/20">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <CheckCircle className="h-12 w-12 text-green-400 mx-auto" />
                <div>
                  <h3 className="text-lg font-medium text-green-400">Setup Complete!</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Wallet connected and identity verified. Redirecting to your dashboard...
                  </p>
                </div>
                <Button onClick={handleContinue} className="bg-primary text-primary-foreground hover:bg-primary/90">
                  Continue to Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Skip Option */}
        {!isConnected && (
          <div className="text-center">
            <Button variant="ghost" onClick={handleContinue} className="text-muted-foreground hover:text-foreground">
              Skip for now (limited functionality)
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

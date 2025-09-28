"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield, Zap, Globe, Lock, ArrowRight, CheckCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useWallet } from "@/lib/wallet/wallet-context"
import { Navigation } from "@/components/navigation"

export default function HomePage() {
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { isConnected } = useWallet()
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    setUser(user)
    setIsLoading(false)

    // Previously redirected to /connect-wallet or /dashboard automatically
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero Section */}
      <section className="relative py-20 px-6 md:px-10">
        <div className="max-w-7xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
              Powered by Self Protocol & Blockchain Oracles
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold text-foreground leading-tight">
              The complete platform to <span className="text-primary">secure your future</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Privacy-preserving parametric insurance powered by blockchain technology. Verify your identity securely
              and get instant payouts when conditions are met.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Link href="/auth/sign-up">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-border text-foreground bg-transparent">
              <Link href="/policies">Explore Policies</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-6 md:px-10 border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center space-y-2">
              <div className="text-3xl font-bold text-foreground">$2.5M</div>
              <div className="text-sm text-muted-foreground">Total Coverage</div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-3xl font-bold text-foreground">98%</div>
              <div className="text-sm text-muted-foreground">Payout Accuracy</div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-3xl font-bold text-foreground">5min</div>
              <div className="text-sm text-muted-foreground">Claim Processing</div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-3xl font-bold text-foreground">24/7</div>
              <div className="text-sm text-muted-foreground">Oracle Monitoring</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 md:px-10">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-bold text-foreground">Faster protection. More innovation.</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              The platform for instant parametric insurance. Let blockchain oracles handle verification while you focus
              on what matters most.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="bg-card border-border">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-card-foreground">Privacy-First Verification</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground">
                  Verify your identity using Self Protocol's zero-knowledge proofs. No personal data stored on-chain,
                  maximum privacy protection.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-accent/10 border border-accent/20">
                    <Zap className="h-6 w-6 text-accent" />
                  </div>
                  <CardTitle className="text-card-foreground">Instant Payouts</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground">
                  Automatic claim processing powered by Chainlink and Pyth oracles. Get paid instantly when conditions
                  are met.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <Globe className="h-6 w-6 text-blue-400" />
                  </div>
                  <CardTitle className="text-card-foreground">Global Coverage</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground">
                  Flight delays, weather events, health emergencies - comprehensive parametric insurance for global
                  risks.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/20">
                    <Lock className="h-6 w-6 text-green-400" />
                  </div>
                  <CardTitle className="text-card-foreground">Blockchain Security</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground">
                  Policies minted as Soulbound Tokens (SBTs) on Celo blockchain. Transparent, immutable, and secure.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
                    <CheckCircle className="h-6 w-6 text-purple-400" />
                  </div>
                  <CardTitle className="text-card-foreground">No Claims Process</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground">
                  Skip traditional claims paperwork. Oracle data automatically triggers payouts when parametric
                  conditions are met.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/20">
                    <ArrowRight className="h-6 w-6 text-orange-400" />
                  </div>
                  <CardTitle className="text-card-foreground">Easy Integration</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground">
                  Simple wallet connection, Self SDK verification, and policy purchase. Get protected in minutes, not
                  days.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 md:px-10 border-t border-border">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl font-bold text-foreground">Ready to secure your future?</h2>
            <p className="text-xl text-muted-foreground">
              Join thousands of users who trust our parametric insurance platform for instant, transparent, and secure
              coverage.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Link href="/auth/sign-up">
                Start Verification
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-border text-foreground bg-transparent">
              <Link href="/policies">View All Policies</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}

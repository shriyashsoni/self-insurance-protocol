"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield, Zap, Globe, ArrowRight, Calendar, Heart, Plane, CloudRain, Building, Luggage } from "lucide-react"
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

      <section className="bg-primary text-primary-foreground py-3 px-6 text-center">
        <div className="max-w-7xl mx-auto">
          <p className="text-sm font-medium">
            {"✈️ New: Travel Insurance Protocol now live! Protect your trips from unexpected disruptions "}
            <Link href="/policies" className="underline hover:no-underline">
              Get covered now
            </Link>
          </p>
        </div>
      </section>

      <section className="relative py-20 px-6 md:px-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left side - Text content */}
            <div className="space-y-8">
              <div className="space-y-4">
                <Badge variant="secondary" className="bg-accent/10 text-accent-foreground border-accent/20">
                  Powered by Smart Contracts & Chainlink Oracles
                </Badge>
                <h1 className="text-5xl md:text-6xl font-bold text-foreground leading-tight text-balance">
                  Protect your travels with <span className="text-primary">smart insurance</span>
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl leading-relaxed text-pretty">
                  Get automated payouts when weather, flight delays, or travel disruptions affect your trip.
                  Blockchain-powered protection that actually works.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
                  <Link href="/auth/sign-up">
                    Get started—it's free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="border-border text-foreground bg-transparent">
                  <Link href="/policies">View coverage options</Link>
                </Button>
              </div>
            </div>

            <div className="relative">
              <div className="travel-card max-w-md mx-auto">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-foreground">Travel Protection</h3>
                    <Badge className="bg-accent text-accent-foreground">+150% coverage</Badge>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Plane className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Flight Protection</p>
                        <p className="text-xs text-muted-foreground">{"Delays > 4hrs trigger payout"}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                      <div className="p-2 bg-accent/10 rounded-lg">
                        <CloudRain className="h-5 w-5 text-accent" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Weather Coverage</p>
                        <p className="text-xs text-muted-foreground">Severe weather protection</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                      <div className="p-2 bg-chart-4/10 rounded-lg">
                        <Luggage className="h-5 w-5" style={{ color: "oklch(0.6 0.15 330)" }} />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Baggage Insurance</p>
                        <p className="text-xs text-muted-foreground">Lost & delayed baggage</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Premium</span>
                      <span className="font-semibold">0.01 ETH</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Coverage</span>
                      <span className="font-semibold text-primary">0.15 ETH</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-6 md:px-10 border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="travel-stat">
              <div className="travel-stat-number">0.01 ETH</div>
              <div className="travel-stat-label">Starting Premium</div>
            </div>
            <div className="travel-stat">
              <div className="travel-stat-number">24/7</div>
              <div className="travel-stat-label">Oracle Monitoring</div>
            </div>
            <div className="travel-stat">
              <div className="travel-stat-number">Instant</div>
              <div className="travel-stat-label">Automated Payouts</div>
            </div>
            <div className="travel-stat">
              <div className="travel-stat-number">100%</div>
              <div className="travel-stat-label">Blockchain Secured</div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-6 md:px-10">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-bold text-foreground text-balance">How travel insurance works</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto text-pretty">
              Four simple steps to protect your trip from unexpected disruptions
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="travel-card text-center">
              <CardHeader>
                <div className="flex justify-center mb-4">
                  <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                    <Calendar className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <CardTitle className="text-card-foreground">1. Plan Your Trip</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground">
                  Set your travel dates, destination, and trip type. Our smart contracts handle the rest.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="travel-card text-center">
              <CardHeader>
                <div className="flex justify-center mb-4">
                  <div className="p-3 rounded-lg bg-accent/10 border border-accent/20">
                    <Shield className="h-8 w-8 text-accent" />
                  </div>
                </div>
                <CardTitle className="text-card-foreground">2. Choose Coverage</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground">
                  Select flight, weather, baggage, or comprehensive protection based on your travel needs.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="travel-card text-center">
              <CardHeader>
                <div className="flex justify-center mb-4">
                  <div className="p-3 rounded-lg bg-chart-4/10 border border-chart-4/20">
                    <Zap className="h-8 w-8" style={{ color: "oklch(0.6 0.15 330)" }} />
                  </div>
                </div>
                <CardTitle className="text-card-foreground">3. Oracle Monitoring</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground">
                  Chainlink oracles automatically monitor flights, weather, and travel conditions 24/7.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="travel-card text-center">
              <CardHeader>
                <div className="flex justify-center mb-4">
                  <div className="p-3 rounded-lg bg-chart-3/10 border border-chart-3/20">
                    <Plane className="h-8 w-8" style={{ color: "oklch(0.6 0.2 160)" }} />
                  </div>
                </div>
                <CardTitle className="text-card-foreground">4. Get Paid</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground">
                  Automatic payouts when conditions are met. No paperwork, no waiting, no hassle.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-20 px-6 md:px-10 border-t border-border">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-bold text-foreground text-balance">Complete travel protection</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto text-pretty">
              Comprehensive coverage for every type of travel, from business trips to family vacations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="travel-card">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                    <Plane className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-card-foreground">Flight Protection</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground">
                  Flight delays, cancellations, or missed connections that disrupt your travel plans.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="travel-card">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-accent/10 border border-accent/20">
                    <CloudRain className="h-6 w-6 text-accent" />
                  </div>
                  <CardTitle className="text-card-foreground">Weather Coverage</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground">
                  Severe weather conditions that force trip cancellations or significant delays.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="travel-card">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-chart-4/10 border border-chart-4/20">
                    <Luggage className="h-6 w-6" style={{ color: "oklch(0.6 0.15 330)" }} />
                  </div>
                  <CardTitle className="text-card-foreground">Baggage Insurance</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground">
                  Lost, stolen, or delayed baggage that affects your travel experience.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="travel-card">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-chart-3/10 border border-chart-3/20">
                    <Heart className="h-6 w-6" style={{ color: "oklch(0.6 0.2 160)" }} />
                  </div>
                  <CardTitle className="text-card-foreground">Medical Coverage</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground">
                  Medical emergencies or illness that prevent you from traveling or continuing your trip.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="travel-card">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-chart-5/10 border border-chart-5/20">
                    <Building className="h-6 w-6" style={{ color: "oklch(0.5 0.15 180)" }} />
                  </div>
                  <CardTitle className="text-card-foreground">Accommodation Protection</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground">
                  Hotel cancellations, overbooking, or accommodation issues that affect your stay.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="travel-card">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                    <Globe className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-card-foreground">Comprehensive Plans</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground">
                  All-in-one protection combining flight, weather, baggage, and medical coverage for complete peace of
                  mind.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-20 px-6 md:px-10 border-t border-border">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl font-bold text-foreground text-balance">Ready to protect your travels?</h2>
            <p className="text-xl text-muted-foreground text-pretty">
              Join thousands who trust blockchain-powered insurance to keep their trips safe from unexpected
              disruptions.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Link href="/auth/sign-up">
                Start protecting travels
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-border text-foreground bg-transparent">
              <Link href="/policies">View all coverage options</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}

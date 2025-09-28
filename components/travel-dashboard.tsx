"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Plane, Shield, MapPin, FileCheck, Clock, QrCode, Eye, AlertCircle, CheckCircle } from "lucide-react"
import { SelfTravelVerificationFlow } from "@/components/selftravel-verification-flow"
import { motion, AnimatePresence } from "framer-motion"
import { useWallet } from "@/lib/wallet/wallet-context"
import type { TravelCredential } from "@/lib/self-sdk/selftravel-integration"

interface TravelPolicy {
  id: string
  name: string
  type: string
  status: "active" | "expired" | "claimed"
  premium: number
  coverage: number
  startDate: string
  endDate: string
  claimStatus?: "none" | "pending" | "approved" | "paid"
}

interface TravelDashboardProps {
  userId?: string
}

export function TravelDashboard({ userId }: TravelDashboardProps) {
  const { address, isConnected } = useWallet()
  const [credentials, setCredentials] = useState<TravelCredential[]>([])
  const [policies, setPolicies] = useState<TravelPolicy[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [verificationComplete, setVerificationComplete] = useState(false)

  useEffect(() => {
    if (isConnected && address) {
      loadDashboardData()
    }
  }, [isConnected, address])

  const loadDashboardData = async () => {
    try {
      setIsLoading(true)
      // Load user's travel policies
      const policiesResponse = await fetch(`/api/policies/user?address=${address}`)
      if (policiesResponse.ok) {
        const userPolicies = await policiesResponse.json()
        setPolicies(userPolicies)
      }

      // Check verification status
      const verificationResponse = await fetch(`/api/verification/status?address=${address}`)
      if (verificationResponse.ok) {
        const verificationData = await verificationResponse.json()
        if (verificationData.status === "completed" && verificationData.credentials) {
          setCredentials(verificationData.credentials)
          setVerificationComplete(true)
        }
      }
    } catch (error) {
      console.error("Failed to load dashboard data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerificationComplete = (newCredentials: TravelCredential[]) => {
    setCredentials(newCredentials)
    setVerificationComplete(true)
    loadDashboardData() // Refresh dashboard data
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

  const getPolicyStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      case "expired":
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
      case "claimed":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30"
      default:
        return "bg-muted/20 text-muted-foreground border-muted/30"
    }
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Plane className="h-6 w-6 text-primary" />
              Travel Dashboard
            </CardTitle>
            <CardDescription>Connect your wallet to access your travel credentials and policies</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">Connect Wallet</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-foreground">Travel Dashboard</h1>
          <p className="text-xl text-muted-foreground">
            Manage your travel credentials, policies, and claims in one secure place
          </p>
        </div>

        {!verificationComplete && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <SelfTravelVerificationFlow onVerificationComplete={handleVerificationComplete} requiredForTravel={true} />
          </motion.div>
        )}

        <Tabs defaultValue="credentials" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-muted/20">
            <TabsTrigger value="credentials" className="data-[state=active]:bg-primary/20">
              Credentials
            </TabsTrigger>
            <TabsTrigger value="policies" className="data-[state=active]:bg-primary/20">
              Policies
            </TabsTrigger>
            <TabsTrigger value="claims" className="data-[state=active]:bg-primary/20">
              Claims
            </TabsTrigger>
            <TabsTrigger value="activity" className="data-[state=active]:bg-primary/20">
              Activity
            </TabsTrigger>
          </TabsList>

          <TabsContent value="credentials" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {credentials.map((credential, index) => (
                  <motion.div
                    key={credential.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="credential-card">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {getCredentialIcon(credential.type)}
                            <div>
                              <CardTitle className="text-lg capitalize">{credential.type.replace("_", " ")}</CardTitle>
                              <CardDescription className="text-sm">
                                Issued by {credential.issuer.split(":").pop()}
                              </CardDescription>
                            </div>
                          </div>
                          <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Valid
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-foreground">Verified Claims:</p>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            {Object.entries(credential.claims).map(([key, value]) => (
                              <div key={key} className="flex items-center gap-1">
                                <div className="w-1 h-1 rounded-full bg-accent" />
                                <span className="text-muted-foreground">
                                  {key.replace("_", " ")}: {value?.toString()}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <Separator className="bg-border/50" />
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                            <QrCode className="h-3 w-3 mr-1" />
                            Present
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>

              {credentials.length === 0 && verificationComplete && (
                <div className="col-span-full text-center py-12">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No travel credentials found</p>
                  <Button variant="outline" className="mt-4 bg-transparent">
                    Add Credential
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="policies" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {policies.map((policy, index) => (
                <motion.div
                  key={policy.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="bg-card/50 border-border/50">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{policy.name}</CardTitle>
                        <Badge variant="outline" className={getPolicyStatusColor(policy.status)}>
                          {policy.status}
                        </Badge>
                      </div>
                      <CardDescription>
                        {policy.startDate} - {policy.endDate}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Premium Paid</p>
                          <p className="text-sm font-semibold">{policy.premium} ETH</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Coverage</p>
                          <p className="text-sm font-semibold text-accent">{policy.coverage} ETH</p>
                        </div>
                      </div>
                      {policy.claimStatus && policy.claimStatus !== "none" && (
                        <div className="space-y-2">
                          <p className="text-xs text-muted-foreground">Claim Status</p>
                          <Badge variant="outline" className="text-xs">
                            {policy.claimStatus}
                          </Badge>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                          View Details
                        </Button>
                        {policy.status === "active" && (
                          <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                            File Claim
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}

              {policies.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <Plane className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No travel policies found</p>
                  <Button variant="outline" className="mt-4 bg-transparent">
                    Browse Policies
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="claims" className="space-y-6">
            <div className="text-center py-12">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No claims submitted yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Claims are automatically processed when oracle conditions are met
              </p>
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <div className="text-center py-12">
              <FileCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No recent activity</p>
              <p className="text-sm text-muted-foreground mt-2">
                Your credential presentations and policy interactions will appear here
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

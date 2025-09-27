"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  Shield,
  Plane,
  Cloud,
  Heart,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  TrendingUp,
  MapPin,
  Activity,
} from "lucide-react"
import { useWallet } from "@/lib/wallet/wallet-context"
import { OracleStatus } from "@/components/oracle-status"
import { TransactionStatus } from "@/components/transaction-status"
import { formatDistanceToNow } from "date-fns"

interface DashboardStats {
  totalPolicies: number
  activePolicies: number
  totalPremiumsPaid: number
  totalPayoutsReceived: number
  pendingClaims: number
}

interface UserPolicy {
  id: string
  type: "flight" | "weather" | "health"
  title: string
  premium: number
  payout: number
  status: "active" | "expired" | "claimed" | "pending"
  purchasedAt: Date
  expiresAt: Date
  conditions: string
  location?: string
  claimAmount?: number
  claimDate?: Date
}

interface ClaimHistory {
  id: string
  policyId: string
  policyTitle: string
  amount: number
  status: "pending" | "approved" | "rejected" | "paid"
  submittedAt: Date
  processedAt?: Date
  reason?: string
}

export function DashboardClient() {
  const { address, isConnected } = useWallet()
  const [stats, setStats] = useState<DashboardStats>({
    totalPolicies: 0,
    activePolicies: 0,
    totalPremiumsPaid: 0,
    totalPayoutsReceived: 0,
    pendingClaims: 0,
  })
  const [policies, setPolicies] = useState<UserPolicy[]>([])
  const [claims, setClaims] = useState<ClaimHistory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  // const [verificationStatus, setVerificationStatus] = useState<string>("not_started")

  useEffect(() => {
    if (address && isConnected) {
      loadDashboardData()
    }
  }, [address, isConnected])

  const loadDashboardData = async () => {
    if (!address) return

    setIsLoading(true)
    try {
      // Load user policies and claims
      const [policiesRes, claimsRes] = await Promise.all([
        fetch(`/api/policies/user?address=${address}`),
        fetch(`/api/claims/user?address=${address}`),
        // fetch(`/api/verification/status?address=${address}`),
      ])

      if (policiesRes.ok) {
        const userPolicies = await policiesRes.json()
        setPolicies(userPolicies)

        // Calculate stats
        const totalPolicies = userPolicies.length
        const activePolicies = userPolicies.filter((p: UserPolicy) => p.status === "active").length
        const totalPremiumsPaid = userPolicies.reduce((sum: number, p: UserPolicy) => sum + p.premium, 0)
        const totalPayoutsReceived = userPolicies
          .filter((p: UserPolicy) => p.status === "claimed")
          .reduce((sum: number, p: UserPolicy) => sum + (p.claimAmount || 0), 0)

        setStats((prev) => ({
          ...prev,
          totalPolicies,
          activePolicies,
          totalPremiumsPaid,
          totalPayoutsReceived,
        }))
      }

      if (claimsRes.ok) {
        const userClaims = await claimsRes.json()
        setClaims(userClaims)

        const pendingClaims = userClaims.filter((c: ClaimHistory) => c.status === "pending").length
        setStats((prev) => ({ ...prev, pendingClaims }))
      }

      // if (verificationRes.ok) {
      //   const verification = await verificationRes.json()
      //   setVerificationStatus(verification.status)
      // }
    } catch (error) {
      console.error("Failed to load dashboard data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getPolicyIcon = (type: string) => {
    switch (type) {
      case "flight":
        return <Plane className="h-5 w-5" />
      case "weather":
        return <Cloud className="h-5 w-5" />
      case "health":
        return <Heart className="h-5 w-5" />
      default:
        return <Shield className="h-5 w-5" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      case "expired":
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
      case "claimed":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30"
      case "pending":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
    }
  }

  const getClaimStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
      case "paid":
        return <CheckCircle className="h-4 w-4 text-green-400" />
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-400" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-400" />
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-400" />
    }
  }

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <CardTitle>Connect Your Wallet</CardTitle>
            <CardDescription>Connect your wallet to view your insurance dashboard</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  // if (verificationStatus !== "completed") {
  //   return (
  //     <div className="space-y-6">
  //       <SelfVerificationFlow
  //         onVerificationComplete={() => setVerificationStatus("completed")}
  //         requiredForPurchase={true}
  //       />
  //     </div>
  //   )
  // }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Policies</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPolicies}</div>
            <p className="text-xs text-muted-foreground">{stats.activePolicies} active</p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Premiums Paid</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalPremiumsPaid.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Total invested</p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payouts Received</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">${stats.totalPayoutsReceived.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Claims processed</p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Claims</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-400">{stats.pendingClaims}</div>
            <p className="text-xs text-muted-foreground">Under review</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Content */}
      <Tabs defaultValue="policies" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="policies">My Policies</TabsTrigger>
          <TabsTrigger value="claims">Claims History</TabsTrigger>
          <TabsTrigger value="oracles">Oracle Status</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="policies" className="space-y-6">
          {policies.length === 0 ? (
            <Card className="border-border/50">
              <CardHeader className="text-center">
                <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <CardTitle>No Policies Yet</CardTitle>
                <CardDescription>You haven't purchased any insurance policies yet</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Button asChild>
                  <a href="/policies">Browse Policies</a>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {policies.map((policy) => (
                <Card key={policy.id} className="border-border/50">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getPolicyIcon(policy.type)}
                        <CardTitle className="text-lg">{policy.title}</CardTitle>
                      </div>
                      <Badge className={getStatusColor(policy.status)}>{policy.status}</Badge>
                    </div>
                    <CardDescription>{policy.conditions}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Premium Paid</div>
                        <div className="font-medium">${policy.premium}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Payout Amount</div>
                        <div className="font-medium">${policy.payout}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Purchased</div>
                        <div className="font-medium">
                          {formatDistanceToNow(policy.purchasedAt, { addSuffix: true })}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Expires</div>
                        <div className="font-medium">{formatDistanceToNow(policy.expiresAt, { addSuffix: true })}</div>
                      </div>
                    </div>

                    {policy.location && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        {policy.location}
                      </div>
                    )}

                    {policy.status === "active" && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Time remaining</span>
                          <span>{formatDistanceToNow(policy.expiresAt)}</span>
                        </div>
                        <Progress
                          value={Math.max(
                            0,
                            Math.min(
                              100,
                              ((policy.expiresAt.getTime() - Date.now()) /
                                (policy.expiresAt.getTime() - policy.purchasedAt.getTime())) *
                                100,
                            ),
                          )}
                          className="h-2"
                        />
                      </div>
                    )}

                    {policy.status === "claimed" && policy.claimAmount && (
                      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
                          <CheckCircle className="h-4 w-4" />
                          Claim Paid: ${policy.claimAmount}
                        </div>
                        {policy.claimDate && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Processed {formatDistanceToNow(policy.claimDate, { addSuffix: true })}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="claims" className="space-y-6">
          {claims.length === 0 ? (
            <Card className="border-border/50">
              <CardHeader className="text-center">
                <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <CardTitle>No Claims History</CardTitle>
                <CardDescription>You haven't submitted any claims yet</CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <div className="space-y-4">
              {claims.map((claim) => (
                <Card key={claim.id} className="border-border/50">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{claim.policyTitle}</CardTitle>
                        <CardDescription>
                          Submitted {formatDistanceToNow(claim.submittedAt, { addSuffix: true })}
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2 mb-1">
                          {getClaimStatusIcon(claim.status)}
                          <Badge className={getStatusColor(claim.status)}>{claim.status}</Badge>
                        </div>
                        <div className="text-lg font-bold">${claim.amount}</div>
                      </div>
                    </div>
                  </CardHeader>
                  {claim.reason && (
                    <CardContent>
                      <div className="text-sm text-muted-foreground">
                        <strong>Reason:</strong> {claim.reason}
                      </div>
                      {claim.processedAt && (
                        <div className="text-sm text-muted-foreground mt-1">
                          Processed {formatDistanceToNow(claim.processedAt, { addSuffix: true })}
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="oracles" className="space-y-6">
          <OracleStatus />
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your latest transactions and policy updates</CardDescription>
            </CardHeader>
            <CardContent>
              <TransactionStatus />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

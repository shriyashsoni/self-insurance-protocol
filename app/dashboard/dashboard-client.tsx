"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Shield, Plane, Cloud, Heart, Clock, CheckCircle, XCircle, AlertTriangle, Activity } from "lucide-react"
import { useWallet } from "@/lib/wallet/wallet-context"
import { OracleStatus } from "@/components/oracle-status"
import { TransactionStatus } from "@/components/transaction-status"
import { formatDistanceToNow } from "date-fns"
import { PolicyManagementCard } from "@/components/policy-management-card"
import { PolicyQuickActions } from "@/components/policy-quick-actions"

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
  const [filteredPolicies, setFilteredPolicies] = useState<UserPolicy[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")

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

  useEffect(() => {
    let filtered = policies

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (policy) =>
          policy.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          policy.conditions.toLowerCase().includes(searchTerm.toLowerCase()) ||
          policy.location?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Apply status filter
    if (filterType !== "all") {
      filtered = filtered.filter((policy) => policy.status === filterType)
    }

    setFilteredPolicies(filtered)
  }, [policies, searchTerm, filterType])

  const handleViewDetails = (policyId: string) => {
    console.log("[v0] Viewing policy details:", policyId)
    // Navigate to policy details page
  }

  const handleFileClaim = (policyId: string) => {
    console.log("[v0] Filing claim for policy:", policyId)
    // Open claim filing modal
  }

  const handleRenewPolicy = (policyId: string) => {
    console.log("[v0] Renewing policy:", policyId)
    // Open policy renewal flow
  }

  const handleNewPolicy = () => {
    window.location.href = "/policies"
  }

  const handleSearch = (term: string) => {
    setSearchTerm(term)
  }

  const handleFilter = (filter: string) => {
    setFilterType(filter)
  }

  const handleExport = () => {
    console.log("[v0] Exporting policy data")
    // Export policies to CSV/PDF
  }

  const handleNotifications = () => {
    console.log("[v0] Opening notifications")
    // Show notifications panel
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

  return (
    <div className="space-y-6">
      <PolicyQuickActions
        stats={{
          totalPolicies: stats.totalPolicies,
          activePolicies: stats.activePolicies,
          expiringPolicies: policies.filter(
            (p) => p.status === "active" && p.expiresAt.getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000, // 7 days
          ).length,
          pendingClaims: stats.pendingClaims,
        }}
        onNewPolicy={handleNewPolicy}
        onSearch={handleSearch}
        onFilter={handleFilter}
        onExport={handleExport}
        onNotifications={handleNotifications}
      />

      {/* Main Dashboard Content */}
      <Tabs defaultValue="policies" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="policies">My Policies</TabsTrigger>
          <TabsTrigger value="claims">Claims History</TabsTrigger>
          <TabsTrigger value="oracles">Oracle Status</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="policies" className="space-y-6">
          {filteredPolicies.length === 0 ? (
            <Card className="border-border/50">
              <CardHeader className="text-center">
                <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <CardTitle>{policies.length === 0 ? "No Policies Yet" : "No Matching Policies"}</CardTitle>
                <CardDescription>
                  {policies.length === 0
                    ? "You haven't purchased any insurance policies yet"
                    : "No policies match your current search or filter criteria"}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                {policies.length === 0 ? (
                  <Button onClick={handleNewPolicy}>Browse Policies</Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm("")
                      setFilterType("all")
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredPolicies.map((policy) => (
                <PolicyManagementCard
                  key={policy.id}
                  policy={policy}
                  onViewDetails={handleViewDetails}
                  onFileClaim={handleFileClaim}
                  onRenew={handleRenewPolicy}
                />
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

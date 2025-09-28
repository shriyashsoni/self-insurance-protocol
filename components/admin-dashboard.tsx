"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Users,
  FileText,
  Shield,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  DollarSign,
  Eye,
  Edit,
  Calendar,
  MapPin,
  Activity,
  BarChart3,
  PieChart,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface AdminStats {
  totalPolicies: number
  activePolicies: number
  totalClaims: number
  pendingClaims: number
  totalPayouts: number
  totalUsers: number
}

interface ClaimReview {
  id: string
  policy_id: string
  user_id: string
  claim_type: string
  claim_reason: string
  claim_amount: number
  status: string
  submitted_at: string
  evidence_data?: any
  policy?: {
    policy_name: string
    birthday_date: string
    celebration_location: string
    user_email?: string
  }
}

const claimReviewSchema = z.object({
  status: z.enum(["approved", "rejected", "investigating"]),
  rejection_reason: z.string().optional(),
  admin_notes: z.string().optional(),
})

type ClaimReviewValues = z.infer<typeof claimReviewSchema>

export function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats>({
    totalPolicies: 0,
    activePolicies: 0,
    totalClaims: 0,
    pendingClaims: 0,
    totalPayouts: 0,
    totalUsers: 0,
  })
  const [claims, setClaims] = useState<ClaimReview[]>([])
  const [policies, setPolicies] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedClaim, setSelectedClaim] = useState<ClaimReview | null>(null)
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false)

  const form = useForm<ClaimReviewValues>({
    resolver: zodResolver(claimReviewSchema),
    defaultValues: {
      status: "investigating",
      rejection_reason: "",
      admin_notes: "",
    },
  })

  useEffect(() => {
    fetchAdminData()
  }, [])

  const fetchAdminData = async () => {
    try {
      await Promise.all([fetchStats(), fetchClaims(), fetchPolicies(), fetchUsers()])
    } catch (error) {
      console.error("Error fetching admin data:", error)
      toast.error("Failed to load admin data")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const supabase = createClient()

      const [
        { count: totalPolicies },
        { count: activePolicies },
        { count: totalClaims },
        { count: pendingClaims },
        { data: payoutData },
        { count: totalUsers },
      ] = await Promise.all([
        supabase.from("insurance_policies").select("*", { count: "exact", head: true }),
        supabase.from("insurance_policies").select("*", { count: "exact", head: true }).eq("policy_status", "active"),
        supabase.from("birthday_claims").select("*", { count: "exact", head: true }),
        supabase.from("birthday_claims").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("birthday_claims").select("claim_amount").eq("status", "paid"),
        supabase.from("users").select("*", { count: "exact", head: true }),
      ])

      const totalPayouts = payoutData?.reduce((sum, claim) => sum + Number(claim.claim_amount), 0) || 0

      setStats({
        totalPolicies: totalPolicies || 0,
        activePolicies: activePolicies || 0,
        totalClaims: totalClaims || 0,
        pendingClaims: pendingClaims || 0,
        totalPayouts,
        totalUsers: totalUsers || 0,
      })
    } catch (error) {
      console.error("Error fetching stats:", error)
    }
  }

  const fetchClaims = async () => {
    try {
      const supabase = createClient()

      const { data, error } = await supabase
        .from("birthday_claims")
        .select(`
          *,
          birthday_policies!inner(
            policy_id,
            birthday_date,
            celebration_location,
            insurance_policies!inner(
              policy_name
            ),
            users!inner(
              id
            )
          )
        `)
        .order("submitted_at", { ascending: false })
        .limit(50)

      if (error) throw error

      setClaims(data || [])
    } catch (error) {
      console.error("Error fetching claims:", error)
    }
  }

  const fetchPolicies = async () => {
    try {
      const supabase = createClient()

      const { data, error } = await supabase
        .from("insurance_policies")
        .select(`
          *,
          birthday_policies(
            birthday_date,
            celebration_location,
            celebration_type
          ),
          users(
            id,
            wallet_address
          )
        `)
        .order("created_at", { ascending: false })
        .limit(50)

      if (error) throw error

      setPolicies(data || [])
    } catch (error) {
      console.error("Error fetching policies:", error)
    }
  }

  const fetchUsers = async () => {
    try {
      const supabase = createClient()

      const { data, error } = await supabase
        .from("users")
        .select(`
          *,
          insurance_policies(count),
          birthday_claims(count)
        `)
        .order("created_at", { ascending: false })
        .limit(50)

      if (error) throw error

      setUsers(data || [])
    } catch (error) {
      console.error("Error fetching users:", error)
    }
  }

  const handleClaimReview = async (values: ClaimReviewValues) => {
    if (!selectedClaim) return

    try {
      const supabase = createClient()

      const updateData: any = {
        status: values.status,
        processed_at: new Date().toISOString(),
      }

      if (values.rejection_reason) {
        updateData.rejection_reason = values.rejection_reason
      }

      if (values.admin_notes) {
        updateData.admin_notes = values.admin_notes
      }

      // If approved, simulate payout
      if (values.status === "approved") {
        const mockTransactionHash = `0x${Math.random().toString(16).substr(2, 64)}`
        updateData.payout_transaction_hash = mockTransactionHash
        updateData.status = "paid"
      }

      const { error } = await supabase.from("birthday_claims").update(updateData).eq("id", selectedClaim.id)

      if (error) throw error

      toast.success(`Claim ${values.status} successfully`)
      setIsReviewDialogOpen(false)
      setSelectedClaim(null)
      form.reset()
      fetchClaims()
      fetchStats()
    } catch (error) {
      console.error("Error updating claim:", error)
      toast.error("Failed to update claim")
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        )
      case "investigating":
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            <Eye className="h-3 w-3 mr-1" />
            Investigating
          </Badge>
        )
      case "approved":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        )
      case "rejected":
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        )
      case "paid":
        return (
          <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
            <DollarSign className="h-3 w-3 mr-1" />
            Paid
          </Badge>
        )
      case "active":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <Activity className="h-3 w-3 mr-1" />
            Active
          </Badge>
        )
      case "expired":
        return (
          <Badge variant="secondary" className="bg-gray-100 text-gray-800">
            <Clock className="h-3 w-3 mr-1" />
            Expired
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Admin Dashboard</h2>
          <p className="text-muted-foreground">Manage birthday insurance protocol operations</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="birthday-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Policies</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPolicies}</div>
            <p className="text-xs text-muted-foreground">{stats.activePolicies} active policies</p>
          </CardContent>
        </Card>

        <Card className="birthday-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Claims</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClaims}</div>
            <p className="text-xs text-muted-foreground">{stats.pendingClaims} pending review</p>
          </CardContent>
        </Card>

        <Card className="birthday-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payouts</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPayouts.toFixed(4)} ETH</div>
            <p className="text-xs text-muted-foreground">Automated + manual payouts</p>
          </CardContent>
        </Card>

        <Card className="birthday-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">Registered users</p>
          </CardContent>
        </Card>

        <Card className="birthday-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Claim Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalPolicies > 0 ? ((stats.totalClaims / stats.totalPolicies) * 100).toFixed(1) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Claims per policy</p>
          </CardContent>
        </Card>

        <Card className="birthday-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Healthy</div>
            <p className="text-xs text-muted-foreground">All systems operational</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="claims" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="claims">Claims Review</TabsTrigger>
          <TabsTrigger value="policies">Policy Management</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="claims" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Claims Requiring Review</h3>
            <Badge variant="secondary">{claims.filter((c) => c.status === "pending").length} pending</Badge>
          </div>

          <div className="grid gap-4">
            {claims.map((claim) => (
              <Card key={claim.id} className="birthday-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {claim.policy?.policy_name || "Birthday Insurance Claim"}
                      </CardTitle>
                      <CardDescription className="flex items-center space-x-4 mt-1">
                        <span className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(claim.policy?.birthday_date || "").toLocaleDateString()}
                        </span>
                        <span className="flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {claim.policy?.celebration_location}
                        </span>
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(claim.status)}
                      {claim.status === "pending" && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedClaim(claim)
                            setIsReviewDialogOpen(true)
                          }}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Review
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-sm text-foreground mb-1">Claim Type:</h4>
                      <p className="text-sm text-muted-foreground capitalize">{claim.claim_type.replace("_", " ")}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-foreground mb-1">Reason:</h4>
                      <p className="text-sm text-muted-foreground">{claim.claim_reason}</p>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Submitted: {new Date(claim.submitted_at).toLocaleDateString()}
                      </span>
                      <span className="font-semibold text-foreground">{claim.claim_amount} ETH</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="policies" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Recent Policies</h3>
            <Badge variant="secondary">{stats.activePolicies} active</Badge>
          </div>

          <div className="grid gap-4">
            {policies.map((policy) => (
              <Card key={policy.id} className="birthday-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{policy.policy_name}</CardTitle>
                      <CardDescription className="flex items-center space-x-4 mt-1">
                        <span>User: {policy.users?.wallet_address?.slice(0, 8)}...</span>
                        <span>Premium: {policy.premium_amount} ETH</span>
                        <span>Coverage: {policy.coverage_amount} ETH</span>
                      </CardDescription>
                    </div>
                    {getStatusBadge(policy.policy_status)}
                  </div>
                </CardHeader>
                <CardContent>
                  {policy.birthday_policies?.[0] && (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(policy.birthday_policies[0].birthday_date).toLocaleDateString()}
                        </span>
                        <span className="flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {policy.birthday_policies[0].celebration_location}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground capitalize">
                        Type: {policy.birthday_policies[0].celebration_type}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">User Management</h3>
            <Badge variant="secondary">{stats.totalUsers} total users</Badge>
          </div>

          <div className="grid gap-4">
            {users.map((user) => (
              <Card key={user.id} className="birthday-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {user.wallet_address ? `${user.wallet_address.slice(0, 8)}...` : "No wallet"}
                      </CardTitle>
                      <CardDescription>Joined: {new Date(user.created_at).toLocaleDateString()}</CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      {user.kyc_verified && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          KYC Verified
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                    <span>Age: {user.age || "Not provided"}</span>
                    <span>Country: {user.country_code || "Not provided"}</span>
                    <span>Policies: {user.insurance_policies?.length || 0}</span>
                    <span>Claims: {user.birthday_claims?.length || 0}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="birthday-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Policy Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Active Policies</span>
                    <span className="font-semibold">{stats.activePolicies}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Expired Policies</span>
                    <span className="font-semibold">{stats.totalPolicies - stats.activePolicies}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="birthday-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PieChart className="h-5 w-5 mr-2" />
                  Claims Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Pending Claims</span>
                    <span className="font-semibold">{stats.pendingClaims}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Processed Claims</span>
                    <span className="font-semibold">{stats.totalClaims - stats.pendingClaims}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Claim Review Dialog */}
      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Claim</DialogTitle>
            <DialogDescription>Review and update the status of this birthday insurance claim.</DialogDescription>
          </DialogHeader>

          {selectedClaim && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">Claim Details</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <strong>Policy:</strong> {selectedClaim.policy?.policy_name}
                  </div>
                  <div>
                    <strong>Type:</strong> {selectedClaim.claim_type.replace("_", " ")}
                  </div>
                  <div>
                    <strong>Amount:</strong> {selectedClaim.claim_amount} ETH
                  </div>
                  <div>
                    <strong>Reason:</strong> {selectedClaim.claim_reason}
                  </div>
                  {selectedClaim.evidence_data && (
                    <div>
                      <strong>Evidence:</strong> {JSON.stringify(selectedClaim.evidence_data, null, 2)}
                    </div>
                  )}
                </div>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleClaimReview)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Decision</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select claim status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="approved">Approve Claim</SelectItem>
                            <SelectItem value="rejected">Reject Claim</SelectItem>
                            <SelectItem value="investigating">Needs More Investigation</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {form.watch("status") === "rejected" && (
                    <FormField
                      control={form.control}
                      name="rejection_reason"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rejection Reason</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Explain why this claim is being rejected..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="admin_notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Admin Notes (Optional)</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Add any internal notes about this claim..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-4">
                    <Button type="button" variant="outline" onClick={() => setIsReviewDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Update Claim</Button>
                  </div>
                </form>
              </Form>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

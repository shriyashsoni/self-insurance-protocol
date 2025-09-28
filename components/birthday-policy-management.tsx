"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import {
  Calendar,
  MapPin,
  DollarSign,
  Shield,
  Clock,
  Gift,
  AlertTriangle,
  XCircle,
  Eye,
  Plus,
  Search,
  Filter,
} from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth/auth-context"
import { useWallet } from "@/lib/wallet/wallet-context"
import { toast } from "sonner"

interface BirthdayPolicy {
  id: string
  policy_name: string
  policy_type: string
  premium_amount: number
  coverage_amount: number
  policy_status: "active" | "expired" | "claimed" | "cancelled"
  start_date: string
  end_date: string
  birthday_policies: {
    birthday_date: string
    celebration_location: string
    celebration_type: string
    guest_count: number
    weather_protection: boolean
    venue_protection: boolean
    travel_protection: boolean
    health_protection: boolean
  }[]
  claims?: {
    id: string
    claim_status: string
    claim_amount: number
    created_at: string
  }[]
}

const policyTypes = [
  { value: "basic", label: "Basic Birthday Protection", premium: 0.01, coverage: 0.1 },
  { value: "premium", label: "Premium Birthday Coverage", premium: 0.025, coverage: 0.25 },
  { value: "deluxe", label: "Deluxe Birthday Insurance", premium: 0.05, coverage: 0.5 },
  { value: "ultimate", label: "Ultimate Birthday Protection", premium: 0.1, coverage: 1.0 },
]

const celebrationTypes = [
  "House Party",
  "Restaurant Dinner",
  "Outdoor Picnic",
  "Beach Party",
  "Club Event",
  "Venue Rental",
  "Travel Celebration",
  "Family Gathering",
]

export function BirthdayPolicyManagement() {
  const { user } = useAuth()
  const { account, isConnected } = useWallet()
  const [policies, setPolicies] = useState<BirthdayPolicy[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedPolicy, setSelectedPolicy] = useState<BirthdayPolicy | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    policy_name: "",
    policy_type: "basic",
    birthday_date: "",
    celebration_location: "",
    celebration_type: "",
    guest_count: 10,
    weather_protection: true,
    venue_protection: true,
    travel_protection: false,
    health_protection: false,
  })

  useEffect(() => {
    if (user) {
      loadUserPolicies()
    }
  }, [user])

  const loadUserPolicies = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("insurance_policies")
        .select(`
          *,
          birthday_policies (*),
          claims (id, claim_status, claim_amount, created_at)
        `)
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      setPolicies(data || [])
    } catch (error) {
      console.error("Failed to load policies:", error)
      toast.error("Failed to load your policies")
    } finally {
      setLoading(false)
    }
  }

  const createPolicy = async () => {
    if (!user || !isConnected) {
      toast.error("Please connect your wallet first")
      return
    }

    try {
      const selectedType = policyTypes.find((t) => t.value === formData.policy_type)
      if (!selectedType) return

      // Calculate policy dates
      const startDate = new Date()
      const endDate = new Date(formData.birthday_date)
      endDate.setDate(endDate.getDate() + 30) // 30 days after birthday

      // Create insurance policy
      const { data: policyData, error: policyError } = await supabase
        .from("insurance_policies")
        .insert({
          user_id: user.id,
          policy_name: formData.policy_name,
          policy_type: formData.policy_type,
          premium_amount: selectedType.premium,
          coverage_amount: selectedType.coverage,
          policy_status: "active",
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          policy_terms: {
            weather_protection: formData.weather_protection,
            venue_protection: formData.venue_protection,
            travel_protection: formData.travel_protection,
            health_protection: formData.health_protection,
          },
        })
        .select()
        .single()

      if (policyError) throw policyError

      // Create birthday policy details
      const { error: birthdayError } = await supabase.from("birthday_policies").insert({
        policy_id: policyData.id,
        birthday_date: formData.birthday_date,
        celebration_location: formData.celebration_location,
        celebration_type: formData.celebration_type,
        guest_count: formData.guest_count,
        weather_protection: formData.weather_protection,
        venue_protection: formData.venue_protection,
        travel_protection: formData.travel_protection,
        health_protection: formData.health_protection,
      })

      if (birthdayError) throw birthdayError

      toast.success("Birthday insurance policy created successfully!")
      setShowCreateForm(false)
      loadUserPolicies()

      // Reset form
      setFormData({
        policy_name: "",
        policy_type: "basic",
        birthday_date: "",
        celebration_location: "",
        celebration_type: "",
        guest_count: 10,
        weather_protection: true,
        venue_protection: true,
        travel_protection: false,
        health_protection: false,
      })
    } catch (error) {
      console.error("Failed to create policy:", error)
      toast.error("Failed to create policy")
    }
  }

  const cancelPolicy = async (policyId: string) => {
    try {
      const { error } = await supabase
        .from("insurance_policies")
        .update({ policy_status: "cancelled" })
        .eq("id", policyId)

      if (error) throw error
      toast.success("Policy cancelled successfully")
      loadUserPolicies()
    } catch (error) {
      console.error("Failed to cancel policy:", error)
      toast.error("Failed to cancel policy")
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200"
      case "expired":
        return "bg-gray-100 text-gray-800 border-gray-200"
      case "claimed":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getDaysUntilBirthday = (birthdayDate: string) => {
    const today = new Date()
    const birthday = new Date(birthdayDate)
    const diffTime = birthday.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const filteredPolicies = policies.filter((policy) => {
    const matchesSearch =
      policy.policy_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      policy.birthday_policies?.[0]?.celebration_location.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || policy.policy_status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading your birthday insurance policies...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Birthday Insurance Policies</h2>
          <p className="text-muted-foreground">Manage your birthday celebration protection</p>
        </div>
        <Button onClick={() => setShowCreateForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create New Policy
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search policies by name or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="claimed">Claimed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="policies" className="space-y-6">
        <TabsList>
          <TabsTrigger value="policies">My Policies</TabsTrigger>
          <TabsTrigger value="create">Create Policy</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="policies" className="space-y-4">
          {filteredPolicies.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <Gift className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                  <div>
                    <h3 className="text-lg font-semibold">No Birthday Policies Found</h3>
                    <p className="text-muted-foreground">
                      Create your first birthday insurance policy to protect your special day
                    </p>
                  </div>
                  <Button onClick={() => setShowCreateForm(true)}>Create Your First Policy</Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredPolicies.map((policy) => {
                const birthdayDetails = policy.birthday_policies?.[0]
                const daysUntil = birthdayDetails ? getDaysUntilBirthday(birthdayDetails.birthday_date) : 0
                const activeClaims = policy.claims?.filter((c) => c.claim_status === "pending").length || 0

                return (
                  <Card key={policy.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-lg">{policy.policy_name}</CardTitle>
                          <CardDescription className="flex items-center gap-4">
                            {birthdayDetails && (
                              <>
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  {new Date(birthdayDetails.birthday_date).toLocaleDateString()}
                                </span>
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-4 w-4" />
                                  {birthdayDetails.celebration_location}
                                </span>
                              </>
                            )}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(policy.policy_status)}>{policy.policy_status}</Badge>
                          {daysUntil > 0 && daysUntil <= 30 && (
                            <Badge variant="outline" className="text-orange-600 border-orange-200">
                              {daysUntil} days left
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <DollarSign className="h-4 w-4" />
                            <span>Premium</span>
                          </div>
                          <p className="font-semibold">{policy.premium_amount} ETH</p>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Shield className="h-4 w-4" />
                            <span>Coverage</span>
                          </div>
                          <p className="font-semibold">{policy.coverage_amount} ETH</p>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Gift className="h-4 w-4" />
                            <span>Guests</span>
                          </div>
                          <p className="font-semibold">{birthdayDetails?.guest_count || 0}</p>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>Type</span>
                          </div>
                          <p className="font-semibold capitalize">{birthdayDetails?.celebration_type || "N/A"}</p>
                        </div>
                      </div>

                      {birthdayDetails && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Protection Coverage</Label>
                          <div className="flex flex-wrap gap-2">
                            {birthdayDetails.weather_protection && (
                              <Badge variant="secondary">Weather Protection</Badge>
                            )}
                            {birthdayDetails.venue_protection && <Badge variant="secondary">Venue Protection</Badge>}
                            {birthdayDetails.travel_protection && <Badge variant="secondary">Travel Protection</Badge>}
                            {birthdayDetails.health_protection && <Badge variant="secondary">Health Protection</Badge>}
                          </div>
                        </div>
                      )}

                      {activeClaims > 0 && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center gap-2 text-blue-800">
                            <AlertTriangle className="h-4 w-4" />
                            <span className="text-sm font-medium">
                              {activeClaims} pending claim{activeClaims > 1 ? "s" : ""}
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedPolicy(policy)}
                          className="flex items-center gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          View Details
                        </Button>
                        {policy.policy_status === "active" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => cancelPolicy(policy.id)}
                            className="flex items-center gap-2 text-red-600 hover:text-red-700"
                          >
                            <XCircle className="h-4 w-4" />
                            Cancel
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="create" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Create New Birthday Insurance Policy</CardTitle>
              <CardDescription>Protect your birthday celebration from unexpected disruptions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="policy_name">Policy Name</Label>
                    <Input
                      id="policy_name"
                      placeholder="My 30th Birthday Protection"
                      value={formData.policy_name}
                      onChange={(e) => setFormData({ ...formData, policy_name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="policy_type">Policy Type</Label>
                    <Select
                      value={formData.policy_type}
                      onValueChange={(value) => setFormData({ ...formData, policy_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {policyTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label} - {type.premium} ETH premium
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="birthday_date">Birthday Date</Label>
                    <Input
                      id="birthday_date"
                      type="date"
                      value={formData.birthday_date}
                      onChange={(e) => setFormData({ ...formData, birthday_date: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="celebration_location">Celebration Location</Label>
                    <Input
                      id="celebration_location"
                      placeholder="New York, NY"
                      value={formData.celebration_location}
                      onChange={(e) => setFormData({ ...formData, celebration_location: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="celebration_type">Celebration Type</Label>
                    <Select
                      value={formData.celebration_type}
                      onValueChange={(value) => setFormData({ ...formData, celebration_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select celebration type" />
                      </SelectTrigger>
                      <SelectContent>
                        {celebrationTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="guest_count">Expected Guest Count</Label>
                    <Input
                      id="guest_count"
                      type="number"
                      min="1"
                      max="500"
                      value={formData.guest_count}
                      onChange={(e) => setFormData({ ...formData, guest_count: Number.parseInt(e.target.value) || 10 })}
                    />
                  </div>

                  <div className="space-y-3">
                    <Label>Protection Coverage</Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="weather_protection"
                          checked={formData.weather_protection}
                          onChange={(e) => setFormData({ ...formData, weather_protection: e.target.checked })}
                          className="rounded border-gray-300"
                        />
                        <Label htmlFor="weather_protection" className="text-sm">
                          Weather Protection
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="venue_protection"
                          checked={formData.venue_protection}
                          onChange={(e) => setFormData({ ...formData, venue_protection: e.target.checked })}
                          className="rounded border-gray-300"
                        />
                        <Label htmlFor="venue_protection" className="text-sm">
                          Venue Protection
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="travel_protection"
                          checked={formData.travel_protection}
                          onChange={(e) => setFormData({ ...formData, travel_protection: e.target.checked })}
                          className="rounded border-gray-300"
                        />
                        <Label htmlFor="travel_protection" className="text-sm">
                          Travel Protection
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="health_protection"
                          checked={formData.health_protection}
                          onChange={(e) => setFormData({ ...formData, health_protection: e.target.checked })}
                          className="rounded border-gray-300"
                        />
                        <Label htmlFor="health_protection" className="text-sm">
                          Health Protection
                        </Label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Policy Summary</h3>
                {formData.policy_type && (
                  <div className="p-4 bg-muted rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span>Premium:</span>
                      <span className="font-semibold">
                        {policyTypes.find((t) => t.value === formData.policy_type)?.premium} ETH
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Coverage:</span>
                      <span className="font-semibold">
                        {policyTypes.find((t) => t.value === formData.policy_type)?.coverage} ETH
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Coverage Period:</span>
                      <span className="font-semibold">30 days from birthday</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={createPolicy}
                  disabled={
                    !formData.policy_name || !formData.birthday_date || !formData.celebration_location || !isConnected
                  }
                  className="flex-1"
                >
                  Create Policy
                </Button>
                <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Policies</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{policies.length}</div>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Active Policies</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{policies.filter((p) => p.policy_status === "active").length}</div>
                <p className="text-xs text-muted-foreground">Currently active</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Coverage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {policies.reduce((sum, p) => sum + p.coverage_amount, 0).toFixed(2)} ETH
                </div>
                <p className="text-xs text-muted-foreground">Total protection</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Policy Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {["active", "expired", "claimed", "cancelled"].map((status) => {
                  const count = policies.filter((p) => p.policy_status === status).length
                  const percentage = policies.length > 0 ? (count / policies.length) * 100 : 0
                  return (
                    <div key={status} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="capitalize">{status}</span>
                        <span>
                          {count} ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

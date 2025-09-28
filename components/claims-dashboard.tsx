"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  DollarSign,
  Calendar,
  MapPin,
  CloudRain,
  Building,
  Plane,
  Heart,
  AlertTriangle,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useWallet } from "@/lib/wallet/wallet-context"
import { toast } from "sonner"

interface Claim {
  id: string
  policy_id: string
  claim_type: string
  claim_reason: string
  claim_amount: number
  status: string
  submitted_at: string
  processed_at?: string
  evidence_data?: any
  weather_data?: any
  venue_confirmation?: string
  medical_documentation?: string
  payout_transaction_hash?: string
  policy?: {
    policy_name: string
    birthday_date: string
    celebration_location: string
    celebration_type: string
  }
}

const claimFormSchema = z.object({
  policy_id: z.string().min(1, "Please select a policy"),
  claim_type: z.enum(["weather_cancellation", "venue_unavailable", "illness", "travel_disruption", "other"]),
  claim_reason: z.string().min(10, "Please provide a detailed reason (minimum 10 characters)"),
  evidence_description: z.string().optional(),
  weather_details: z.string().optional(),
  venue_details: z.string().optional(),
  medical_details: z.string().optional(),
  travel_details: z.string().optional(),
})

type ClaimFormValues = z.infer<typeof claimFormSchema>

export function ClaimsDashboard() {
  const [claims, setClaims] = useState<Claim[]>([])
  const [policies, setPolicies] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { address } = useWallet()

  const form = useForm<ClaimFormValues>({
    resolver: zodResolver(claimFormSchema),
    defaultValues: {
      claim_reason: "",
      evidence_description: "",
    },
  })

  useEffect(() => {
    if (address) {
      fetchClaims()
      fetchPolicies()
    }
  }, [address])

  const fetchClaims = async () => {
    try {
      const supabase = createClient()
      const { data: user } = await supabase.auth.getUser()

      if (!user.user) return

      const { data, error } = await supabase
        .from("birthday_claims")
        .select(`
          *,
          birthday_policies!inner(
            policy_id,
            birthday_date,
            celebration_location,
            celebration_type,
            insurance_policies!inner(
              policy_name
            )
          )
        `)
        .eq("user_id", user.user.id)
        .order("submitted_at", { ascending: false })

      if (error) throw error

      setClaims(data || [])
    } catch (error) {
      console.error("Error fetching claims:", error)
      toast.error("Failed to load claims")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchPolicies = async () => {
    try {
      const supabase = createClient()
      const { data: user } = await supabase.auth.getUser()

      if (!user.user) return

      const { data, error } = await supabase
        .from("birthday_policies")
        .select(`
          policy_id,
          birthday_date,
          celebration_location,
          celebration_type,
          insurance_policies!inner(
            id,
            policy_name,
            policy_status
          )
        `)
        .eq("user_id", user.user.id)
        .eq("insurance_policies.policy_status", "active")

      if (error) throw error

      setPolicies(data || [])
    } catch (error) {
      console.error("Error fetching policies:", error)
      toast.error("Failed to load policies")
    }
  }

  const onSubmit = async (values: ClaimFormValues) => {
    setIsSubmitting(true)
    try {
      const supabase = createClient()
      const { data: user } = await supabase.auth.getUser()

      if (!user.user) {
        toast.error("Please log in to submit a claim")
        return
      }

      // Calculate claim amount based on policy coverage
      const selectedPolicy = policies.find((p) => p.policy_id === values.policy_id)
      if (!selectedPolicy) {
        toast.error("Selected policy not found")
        return
      }

      // Get policy coverage amount
      const { data: policyData, error: policyError } = await supabase
        .from("insurance_policies")
        .select("coverage_amount")
        .eq("id", values.policy_id)
        .single()

      if (policyError) throw policyError

      const evidence_data = {
        description: values.evidence_description,
        weather_details: values.weather_details,
        venue_details: values.venue_details,
        medical_details: values.medical_details,
        travel_details: values.travel_details,
        submitted_at: new Date().toISOString(),
      }

      const { error } = await supabase.from("birthday_claims").insert({
        policy_id: values.policy_id,
        user_id: user.user.id,
        claim_type: values.claim_type,
        claim_reason: values.claim_reason,
        evidence_data,
        claim_amount: policyData.coverage_amount,
        status: "pending",
      })

      if (error) throw error

      toast.success("Claim submitted successfully!")
      setIsDialogOpen(false)
      form.reset()
      fetchClaims()
    } catch (error) {
      console.error("Error submitting claim:", error)
      toast.error("Failed to submit claim")
    } finally {
      setIsSubmitting(false)
    }
  }

  const getClaimTypeIcon = (type: string) => {
    switch (type) {
      case "weather_cancellation":
        return <CloudRain className="h-4 w-4" />
      case "venue_unavailable":
        return <Building className="h-4 w-4" />
      case "illness":
        return <Heart className="h-4 w-4" />
      case "travel_disruption":
        return <Plane className="h-4 w-4" />
      default:
        return <AlertTriangle className="h-4 w-4" />
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
            <FileText className="h-3 w-3 mr-1" />
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
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-32 bg-muted rounded"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Claims Dashboard</h2>
          <p className="text-muted-foreground">Manage your birthday insurance claims</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              <FileText className="h-4 w-4 mr-2" />
              Submit New Claim
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Submit Birthday Insurance Claim</DialogTitle>
              <DialogDescription>
                Provide details about your claim. Our team will review and process it within 24-48 hours.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="policy_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Policy</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a policy to claim against" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {policies.map((policy) => (
                            <SelectItem key={policy.policy_id} value={policy.policy_id}>
                              {policy.insurance_policies.policy_name} - {policy.celebration_location}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="claim_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Claim Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select the type of claim" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="weather_cancellation">Weather Cancellation</SelectItem>
                          <SelectItem value="venue_unavailable">Venue Unavailable</SelectItem>
                          <SelectItem value="illness">Illness/Medical Emergency</SelectItem>
                          <SelectItem value="travel_disruption">Travel Disruption</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="claim_reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Detailed Reason</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Provide a detailed explanation of what happened and why you're submitting this claim..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Be as specific as possible. Include dates, times, and circumstances.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.watch("claim_type") === "weather_cancellation" && (
                  <FormField
                    control={form.control}
                    name="weather_details"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Weather Details</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe the weather conditions that affected your celebration..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {form.watch("claim_type") === "venue_unavailable" && (
                  <FormField
                    control={form.control}
                    name="venue_details"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Venue Details</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Explain the venue issue and any communication you received..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {form.watch("claim_type") === "illness" && (
                  <FormField
                    control={form.control}
                    name="medical_details"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Medical Details</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe the medical situation (medical documentation may be required)..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {form.watch("claim_type") === "travel_disruption" && (
                  <FormField
                    control={form.control}
                    name="travel_details"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Travel Details</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Provide flight numbers, cancellation notices, or other travel disruption details..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="evidence_description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Supporting Evidence</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe any photos, documents, or other evidence you have to support your claim..."
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        List any supporting documents, photos, receipts, or communications you can provide.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Submitting..." : "Submit Claim"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All Claims</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="investigating">Investigating</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="paid">Paid</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {claims.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No Claims Yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  You haven't submitted any claims. If something goes wrong with your birthday celebration, you can
                  submit a claim here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {claims.map((claim) => (
                <Card key={claim.id} className="birthday-card">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getClaimTypeIcon(claim.claim_type)}
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
                      </div>
                      {getStatusBadge(claim.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-sm text-foreground mb-1">Claim Reason:</h4>
                        <p className="text-sm text-muted-foreground">{claim.claim_reason}</p>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-4">
                          <span className="text-muted-foreground">
                            Submitted: {new Date(claim.submitted_at).toLocaleDateString()}
                          </span>
                          {claim.processed_at && (
                            <span className="text-muted-foreground">
                              Processed: {new Date(claim.processed_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <div className="font-semibold text-foreground">{claim.claim_amount} ETH</div>
                      </div>

                      {claim.payout_transaction_hash && (
                        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-1">
                            Payout Completed
                          </p>
                          <p className="text-xs text-green-600 dark:text-green-300 font-mono">
                            TX: {claim.payout_transaction_hash}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {["pending", "investigating", "approved", "paid"].map((status) => (
          <TabsContent key={status} value={status} className="space-y-4">
            <div className="grid gap-4">
              {claims
                .filter((claim) => claim.status === status)
                .map((claim) => (
                  <Card key={claim.id} className="birthday-card">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {getClaimTypeIcon(claim.claim_type)}
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
                        </div>
                        {getStatusBadge(claim.status)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium text-sm text-foreground mb-1">Claim Reason:</h4>
                          <p className="text-sm text-muted-foreground">{claim.claim_reason}</p>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center space-x-4">
                            <span className="text-muted-foreground">
                              Submitted: {new Date(claim.submitted_at).toLocaleDateString()}
                            </span>
                            {claim.processed_at && (
                              <span className="text-muted-foreground">
                                Processed: {new Date(claim.processed_at).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          <div className="font-semibold text-foreground">{claim.claim_amount} ETH</div>
                        </div>

                        {claim.payout_transaction_hash && (
                          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-1">
                              Payout Completed
                            </p>
                            <p className="text-xs text-green-600 dark:text-green-300 font-mono">
                              TX: {claim.payout_transaction_hash}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
            {claims.filter((claim) => claim.status === status).length === 0 && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    No {status.charAt(0).toUpperCase() + status.slice(1)} Claims
                  </h3>
                  <p className="text-muted-foreground text-center">You don't have any claims with {status} status.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

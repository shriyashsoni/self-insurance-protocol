"use client"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, MapPin, DollarSign, Shield, Clock, Gift, Users, FileText } from "lucide-react"

interface PolicyDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  policy: any
}

export function PolicyDetailsModal({ isOpen, onClose, policy }: PolicyDetailsModalProps) {
  if (!policy) return null

  const birthdayDetails = policy.birthday_policies?.[0]
  const claims = policy.claims || []

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

  const getClaimStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{policy.policy_name}</span>
            <Badge className={getStatusColor(policy.policy_status)}>{policy.policy_status}</Badge>
          </DialogTitle>
          <DialogDescription>Detailed information about your birthday insurance policy</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="coverage">Coverage</TabsTrigger>
            <TabsTrigger value="claims">Claims</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Gift className="h-5 w-5" />
                    Celebration Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {birthdayDetails && (
                    <>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Birthday Date:</span>
                        <span className="font-medium">
                          {new Date(birthdayDetails.birthday_date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Location:</span>
                        <span className="font-medium">{birthdayDetails.celebration_location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Expected Guests:</span>
                        <span className="font-medium">{birthdayDetails.guest_count}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Type:</span>
                        <span className="font-medium">{birthdayDetails.celebration_type}</span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Policy Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Premium:</span>
                    <span className="font-medium">{policy.premium_amount} ETH</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Coverage:</span>
                    <span className="font-medium">{policy.coverage_amount} ETH</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Start Date:</span>
                    <span className="font-medium">{new Date(policy.start_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">End Date:</span>
                    <span className="font-medium">{new Date(policy.end_date).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="coverage" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Protection Coverage</CardTitle>
                <CardDescription>Your policy covers the following types of disruptions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {birthdayDetails && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div
                      className={`p-4 rounded-lg border ${birthdayDetails.weather_protection ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"}`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className={`w-3 h-3 rounded-full ${birthdayDetails.weather_protection ? "bg-green-500" : "bg-gray-400"}`}
                        />
                        <span className="font-medium">Weather Protection</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Coverage for severe weather events that disrupt your celebration
                      </p>
                    </div>

                    <div
                      className={`p-4 rounded-lg border ${birthdayDetails.venue_protection ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"}`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className={`w-3 h-3 rounded-full ${birthdayDetails.venue_protection ? "bg-green-500" : "bg-gray-400"}`}
                        />
                        <span className="font-medium">Venue Protection</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Coverage for venue cancellations or unavailability
                      </p>
                    </div>

                    <div
                      className={`p-4 rounded-lg border ${birthdayDetails.travel_protection ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"}`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className={`w-3 h-3 rounded-full ${birthdayDetails.travel_protection ? "bg-green-500" : "bg-gray-400"}`}
                        />
                        <span className="font-medium">Travel Protection</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Coverage for travel disruptions affecting your celebration
                      </p>
                    </div>

                    <div
                      className={`p-4 rounded-lg border ${birthdayDetails.health_protection ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"}`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className={`w-3 h-3 rounded-full ${birthdayDetails.health_protection ? "bg-green-500" : "bg-gray-400"}`}
                        />
                        <span className="font-medium">Health Protection</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Coverage for health emergencies that prevent celebration
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="claims" className="space-y-4">
            {claims.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center space-y-4">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                    <div>
                      <h3 className="text-lg font-semibold">No Claims Filed</h3>
                      <p className="text-muted-foreground">You haven't filed any claims for this policy yet</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {claims.map((claim: any, index: number) => (
                  <Card key={claim.id || index}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Claim #{claim.id}</CardTitle>
                        <Badge className={getClaimStatusColor(claim.claim_status)}>{claim.claim_status}</Badge>
                      </div>
                      <CardDescription>Filed on {new Date(claim.created_at).toLocaleDateString()}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <span>Claim Amount:</span>
                        <span className="font-semibold">{claim.claim_amount} ETH</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="documents" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Policy Documents</CardTitle>
                <CardDescription>Important documents related to your policy</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <FileText className="h-4 w-4 mr-2" />
                    Policy Certificate
                  </Button>
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <FileText className="h-4 w-4 mr-2" />
                    Terms and Conditions
                  </Button>
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <FileText className="h-4 w-4 mr-2" />
                    Coverage Summary
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

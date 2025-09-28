"use client"

import { useState } from "react"
import { PolicyCard } from "@/components/policy-card"
import { PolicyPurchaseModal } from "@/components/policy-purchase-modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter } from "lucide-react"

const availablePolicies = [
  {
    id: "flight-delay-basic",
    name: "Flight Delay Protection",
    type: "flight" as const,
    description: "Get compensated for flight delays over 2 hours",
    premium: 25,
    coverage: 500,
    duration: "1 month",
    region: "Global",
    conditions: [
      "Flight delay > 2 hours",
      "Weather-related cancellations",
      "Mechanical issues coverage",
      "Automatic payout via oracle",
    ],
  },
  {
    id: "weather-crop-basic",
    name: "Weather Crop Insurance",
    type: "weather" as const,
    description: "Protect your crops against extreme weather events",
    premium: 150,
    coverage: 5000,
    duration: "6 months",
    region: "North America",
    conditions: [
      "Rainfall below 50% of average",
      "Temperature extremes",
      "Hail damage coverage",
      "Satellite data verification",
    ],
  },
  {
    id: "health-emergency-basic",
    name: "Health Emergency Coverage",
    type: "health" as const,
    description: "Emergency medical expense coverage abroad",
    premium: 75,
    coverage: 10000,
    duration: "3 months",
    region: "Worldwide",
    conditions: ["Emergency hospitalization", "Medical evacuation", "Prescription coverage", "24/7 claim processing"],
  },
  {
    id: "flight-premium",
    name: "Premium Flight Protection",
    type: "flight" as const,
    description: "Comprehensive flight protection with higher coverage",
    premium: 50,
    coverage: 1500,
    duration: "3 months",
    region: "Global",
    conditions: ["Flight delay > 1 hour", "Baggage delay coverage", "Trip cancellation", "Premium customer support"],
  },
  {
    id: "weather-hurricane",
    name: "Hurricane Protection",
    type: "weather" as const,
    description: "Specialized coverage for hurricane damage",
    premium: 200,
    coverage: 15000,
    duration: "12 months",
    region: "Atlantic Coast",
    conditions: ["Category 2+ hurricane", "Wind speed > 96 mph", "Storm surge damage", "NOAA data verification"],
  },
  {
    id: "health-travel",
    name: "Travel Health Plus",
    type: "health" as const,
    description: "Comprehensive health coverage for travelers",
    premium: 120,
    coverage: 25000,
    duration: "6 months",
    region: "International",
    conditions: [
      "Emergency medical treatment",
      "Dental emergency coverage",
      "Mental health support",
      "Telemedicine access",
    ],
  },
]

export function PoliciesClient() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedType, setSelectedType] = useState<string>("all")
  const [selectedPolicy, setSelectedPolicy] = useState<(typeof availablePolicies)[0] | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const filteredPolicies = availablePolicies.filter((policy) => {
    const matchesSearch =
      policy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      policy.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = selectedType === "all" || policy.type === selectedType
    return matchesSearch && matchesType
  })

  const handlePurchase = (policyId: string) => {
    const policy = availablePolicies.find((p) => p.id === policyId)
    if (policy) {
      setSelectedPolicy(policy)
      setIsModalOpen(true)
    }
  }

  const handlePurchaseComplete = () => {
    // Refresh policies or redirect to dashboard
    console.log("[v0] Policy purchase completed")
  }

  return (
    <div className="min-h-screen bg-background p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">Insurance Policies</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Choose from our parametric insurance policies powered by blockchain oracles and Self Protocol verification
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search policies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-input border-border text-foreground"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-40 bg-input border-border text-foreground">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="all" className="text-popover-foreground">
                  All Types
                </SelectItem>
                <SelectItem value="flight" className="text-popover-foreground">
                  Flight
                </SelectItem>
                <SelectItem value="weather" className="text-popover-foreground">
                  Weather
                </SelectItem>
                <SelectItem value="health" className="text-popover-foreground">
                  Health
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPolicies.map((policy) => (
            <PolicyCard key={policy.id} policy={policy} onPurchase={handlePurchase} isLoading={isLoading} />
          ))}
        </div>

        {filteredPolicies.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No policies found matching your criteria.</p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("")
                setSelectedType("all")
              }}
              className="mt-4 border-border text-foreground"
            >
              Clear Filters
            </Button>
          </div>
        )}

        <PolicyPurchaseModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          policy={selectedPolicy}
          onPurchaseComplete={handlePurchaseComplete}
        />
      </div>
    </div>
  )
}

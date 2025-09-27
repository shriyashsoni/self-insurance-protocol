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
    id: "travel-delay-showcase",
    name: "Travel Delay Protection",
    type: "travel" as const,
    description: "Get compensated for travel delays and cancellations",
    premium: 0.01, // 0.01 ETH premium
    coverage: 0.1, // 0.1 ETH coverage for showcase
    duration: "1 trip",
    region: "Global",
    conditions: [
      "Flight delay > 2 hours",
      "Train/bus delay > 1 hour",
      "Weather-related cancellations",
      "Automatic payout via oracle",
    ],
  },
  {
    id: "travel-medical-showcase",
    name: "Travel Medical Emergency",
    type: "medical" as const,
    description: "Emergency medical coverage while traveling abroad",
    premium: 0.015, // 0.015 ETH premium
    coverage: 0.1, // 0.1 ETH coverage for showcase
    duration: "30 days",
    region: "Worldwide",
    conditions: ["Emergency hospitalization", "Medical evacuation", "Prescription coverage", "24/7 claim processing"],
  },
  {
    id: "baggage-protection-showcase",
    name: "Baggage Protection",
    type: "baggage" as const,
    description: "Protection against lost, stolen, or delayed baggage",
    premium: 0.005, // 0.005 ETH premium
    coverage: 0.1, // 0.1 ETH coverage for showcase
    duration: "1 trip",
    region: "Global",
    conditions: [
      "Baggage delay > 12 hours",
      "Lost or stolen items",
      "Damaged luggage coverage",
      "Instant verification via airline APIs",
    ],
  },
  {
    id: "trip-cancellation-showcase",
    name: "Trip Cancellation Insurance",
    type: "cancellation" as const,
    description: "Coverage for non-refundable trip expenses",
    premium: 0.02, // 0.02 ETH premium
    coverage: 0.1, // 0.1 ETH coverage for showcase
    duration: "1 trip",
    region: "International",
    conditions: ["Illness or injury", "Natural disasters", "Travel advisories", "Verifiable credential required"],
  },
  {
    id: "weather-travel-showcase",
    name: "Weather Travel Disruption",
    type: "weather" as const,
    description: "Protection against weather-related travel disruptions",
    premium: 0.008, // 0.008 ETH premium
    coverage: 0.1, // 0.1 ETH coverage for showcase
    duration: "1 trip",
    region: "Global",
    conditions: [
      "Severe weather warnings",
      "Airport closures",
      "Natural disaster declarations",
      "Real-time weather oracle data",
    ],
  },
  {
    id: "visa-rejection-showcase",
    name: "Visa Rejection Coverage",
    type: "visa" as const,
    description: "Reimbursement for visa rejection expenses",
    premium: 0.012, // 0.012 ETH premium
    coverage: 0.1, // 0.1 ETH coverage for showcase
    duration: "Application period",
    region: "International",
    conditions: [
      "Visa application rejection",
      "Embassy fee reimbursement",
      "Document preparation costs",
      "Government API verification",
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
    console.log("[v0] Travel policy purchase completed")
  }

  return (
    <div className="min-h-screen bg-background p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground text-balance">Travel Insurance Policies</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto text-pretty">
            Showcase travel insurance policies with 0.1 ETH coverage, powered by Self Protocol verification and
            blockchain oracles
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search travel policies..."
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
                <SelectItem value="travel" className="text-popover-foreground">
                  Travel
                </SelectItem>
                <SelectItem value="medical" className="text-popover-foreground">
                  Medical
                </SelectItem>
                <SelectItem value="baggage" className="text-popover-foreground">
                  Baggage
                </SelectItem>
                <SelectItem value="cancellation" className="text-popover-foreground">
                  Cancellation
                </SelectItem>
                <SelectItem value="weather" className="text-popover-foreground">
                  Weather
                </SelectItem>
                <SelectItem value="visa" className="text-popover-foreground">
                  Visa
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
            <p className="text-muted-foreground">No travel policies found matching your criteria.</p>
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

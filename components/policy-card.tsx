"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Shield, Clock, DollarSign, MapPin, Plane, CloudRain, Heart } from "lucide-react"

interface PolicyCardProps {
  policy: {
    id: string
    name: string
    type: "flight" | "weather" | "health"
    description: string
    premium: number
    coverage: number
    duration: string
    region?: string
    conditions: string[]
  }
  onPurchase: (policyId: string) => void
  isLoading?: boolean
}

const policyIcons = {
  flight: Plane,
  weather: CloudRain,
  health: Heart,
}

const policyColors = {
  flight: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  weather: "bg-green-500/10 text-green-400 border-green-500/20",
  health: "bg-red-500/10 text-red-400 border-red-500/20",
}

export function PolicyCard({ policy, onPurchase, isLoading }: PolicyCardProps) {
  const Icon = policyIcons[policy.type]
  const colorClass = policyColors[policy.type]

  return (
    <Card className="bg-card border-border hover:border-primary/50 transition-colors">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg border ${colorClass}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg text-card-foreground">{policy.name}</CardTitle>
              <CardDescription className="text-muted-foreground">{policy.description}</CardDescription>
            </div>
          </div>
          <Badge variant="secondary" className="bg-secondary text-secondary-foreground capitalize">
            {policy.type}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              <span>Premium</span>
            </div>
            <p className="text-lg font-semibold text-foreground">${policy.premium}</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4" />
              <span>Coverage</span>
            </div>
            <p className="text-lg font-semibold text-foreground">${policy.coverage.toLocaleString()}</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Duration: {policy.duration}</span>
          </div>
          {policy.region && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>Region: {policy.region}</span>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Coverage Conditions:</p>
          <div className="space-y-1">
            {policy.conditions.map((condition, index) => (
              <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                <span>{condition}</span>
              </div>
            ))}
          </div>
        </div>

        <Button
          onClick={() => onPurchase(policy.id)}
          disabled={isLoading}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {isLoading ? "Processing..." : `Purchase for $${policy.premium}`}
        </Button>
      </CardContent>
    </Card>
  )
}

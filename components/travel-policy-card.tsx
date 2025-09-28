"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Plane, Shield, MapPin, Clock, Zap, FileCheck } from "lucide-react"
import { motion } from "framer-motion"

interface TravelPolicy {
  id: string
  name: string
  type: "travel" | "medical" | "baggage" | "cancellation" | "weather" | "visa"
  description: string
  premium: number // ETH amount
  coverage: number // ETH amount
  duration: string
  region: string
  conditions: string[]
}

interface TravelPolicyCardProps {
  policy: TravelPolicy
  onPurchase: (policyId: string) => void
  isLoading?: boolean
}

const getPolicyIcon = (type: string) => {
  switch (type) {
    case "travel":
      return <Plane className="h-5 w-5 text-blue-400" />
    case "medical":
      return <Shield className="h-5 w-5 text-red-400" />
    case "baggage":
      return <FileCheck className="h-5 w-5 text-orange-400" />
    case "cancellation":
      return <Clock className="h-5 w-5 text-purple-400" />
    case "weather":
      return <Zap className="h-5 w-5 text-teal-400" />
    case "visa":
      return <MapPin className="h-5 w-5 text-green-400" />
    default:
      return <Shield className="h-5 w-5 text-muted-foreground" />
  }
}

const getPolicyBadgeColor = (type: string) => {
  switch (type) {
    case "travel":
      return "bg-blue-500/20 text-blue-400 border-blue-500/30"
    case "medical":
      return "bg-red-500/20 text-red-400 border-red-500/30"
    case "baggage":
      return "bg-orange-500/20 text-orange-400 border-orange-500/30"
    case "cancellation":
      return "bg-purple-500/20 text-purple-400 border-purple-500/30"
    case "weather":
      return "bg-teal-500/20 text-teal-400 border-teal-500/30"
    case "visa":
      return "bg-green-500/20 text-green-400 border-green-500/30"
    default:
      return "bg-muted/20 text-muted-foreground border-muted/30"
  }
}

export function TravelPolicyCard({ policy, onPurchase, isLoading = false }: TravelPolicyCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -4 }}
      className="h-full"
    >
      <Card className="h-full bg-card/50 border-border/50 backdrop-blur-sm hover:bg-card/70 transition-all duration-300">
        <CardHeader className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {getPolicyIcon(policy.type)}
              <div>
                <CardTitle className="text-lg text-card-foreground">{policy.name}</CardTitle>
                <CardDescription className="text-sm text-muted-foreground mt-1">
                  {policy.region} • {policy.duration}
                </CardDescription>
              </div>
            </div>
            <Badge variant="outline" className={getPolicyBadgeColor(policy.type)}>
              {policy.type.charAt(0).toUpperCase() + policy.type.slice(1)}
            </Badge>
          </div>

          <CardDescription className="text-muted-foreground leading-relaxed">{policy.description}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Premium</p>
              <p className="text-lg font-semibold text-foreground">{policy.premium} ETH</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Coverage</p>
              <p className="text-lg font-semibold text-accent">{policy.coverage} ETH</p>
            </div>
          </div>

          <Separator className="bg-border/50" />

          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">Coverage Includes:</p>
            <ul className="space-y-2">
              {policy.conditions.slice(0, 3).map((condition, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent mt-2 flex-shrink-0" />
                  {condition}
                </li>
              ))}
              {policy.conditions.length > 3 && (
                <li className="text-sm text-muted-foreground/70">+{policy.conditions.length - 3} more conditions</li>
              )}
            </ul>
          </div>

          <Button
            onClick={() => onPurchase(policy.id)}
            disabled={isLoading}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isLoading ? "Processing..." : `Purchase for ${policy.premium} ETH`}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  )
}

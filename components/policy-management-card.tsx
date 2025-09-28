"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Shield, Clock, MapPin, AlertTriangle, CheckCircle, FileText, ExternalLink, MoreHorizontal } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface PolicyManagementCardProps {
  policy: {
    id: string
    type: string
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
    contractAddress?: string
    tokenId?: string
  }
  onViewDetails?: (policyId: string) => void
  onFileClaim?: (policyId: string) => void
  onRenew?: (policyId: string) => void
}

export function PolicyManagementCard({ policy, onViewDetails, onFileClaim, onRenew }: PolicyManagementCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <Shield className="h-4 w-4" />
      case "expired":
        return <Clock className="h-4 w-4" />
      case "claimed":
        return <CheckCircle className="h-4 w-4" />
      case "pending":
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <Shield className="h-4 w-4" />
    }
  }

  const timeRemaining =
    policy.status === "active"
      ? Math.max(
          0,
          Math.min(
            100,
            ((policy.expiresAt.getTime() - Date.now()) / (policy.expiresAt.getTime() - policy.purchasedAt.getTime())) *
              100,
          ),
        )
      : 0

  const canFileClaim = policy.status === "active" && !policy.claimAmount
  const canRenew = policy.status === "expired" || (policy.status === "active" && timeRemaining < 20)

  return (
    <Card className="border-border/50 hover:border-primary/30 transition-colors">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {getStatusIcon(policy.status)}
              <div>
                <CardTitle className="text-lg">{policy.title}</CardTitle>
                <CardDescription className="text-sm">Policy #{policy.id.slice(0, 8)}...</CardDescription>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(policy.status)}>{policy.status}</Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onViewDetails?.(policy.id)}>
                  <FileText className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                {policy.contractAddress && (
                  <DropdownMenuItem
                    onClick={() => window.open(`https://celoscan.io/address/${policy.contractAddress}`, "_blank")}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View on Explorer
                  </DropdownMenuItem>
                )}
                {canFileClaim && (
                  <DropdownMenuItem onClick={() => onFileClaim?.(policy.id)}>
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    File Claim
                  </DropdownMenuItem>
                )}
                {canRenew && (
                  <DropdownMenuItem onClick={() => onRenew?.(policy.id)}>
                    <Shield className="mr-2 h-4 w-4" />
                    Renew Policy
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Key Metrics */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Premium</div>
            <div className="text-lg font-semibold">${policy.premium}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Coverage</div>
            <div className="text-lg font-semibold">${policy.payout}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted-foreground">ROI</div>
            <div className="text-lg font-semibold text-green-400">
              {((policy.payout / policy.premium - 1) * 100).toFixed(0)}%
            </div>
          </div>
        </div>

        <Separator />

        {/* Timeline */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Purchased</span>
            <span>{formatDistanceToNow(policy.purchasedAt, { addSuffix: true })}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Expires</span>
            <span>{formatDistanceToNow(policy.expiresAt, { addSuffix: true })}</span>
          </div>

          {policy.status === "active" && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Time remaining</span>
                <span>{formatDistanceToNow(policy.expiresAt)}</span>
              </div>
              <Progress value={timeRemaining} className="h-2" />
            </div>
          )}
        </div>

        {/* Location */}
        {policy.location && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            {policy.location}
          </div>
        )}

        {/* Claim Information */}
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

        {/* Expandable Details */}
        <div className="space-y-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full justify-between"
          >
            <span>Policy Details</span>
            <span className={`transform transition-transform ${isExpanded ? "rotate-180" : ""}`}>▼</span>
          </Button>

          {isExpanded && (
            <div className="space-y-3 pt-2 border-t border-border/50">
              <div>
                <div className="text-sm font-medium mb-1">Coverage Conditions</div>
                <div className="text-sm text-muted-foreground">{policy.conditions}</div>
              </div>

              {policy.tokenId && (
                <div>
                  <div className="text-sm font-medium mb-1">NFT Token ID</div>
                  <div className="text-sm text-muted-foreground font-mono">{policy.tokenId}</div>
                </div>
              )}

              {policy.contractAddress && (
                <div>
                  <div className="text-sm font-medium mb-1">Contract Address</div>
                  <div className="text-sm text-muted-foreground font-mono">
                    {policy.contractAddress.slice(0, 10)}...{policy.contractAddress.slice(-8)}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          {canFileClaim && (
            <Button variant="outline" size="sm" onClick={() => onFileClaim?.(policy.id)} className="flex-1">
              <AlertTriangle className="mr-2 h-4 w-4" />
              File Claim
            </Button>
          )}
          {canRenew && (
            <Button variant="outline" size="sm" onClick={() => onRenew?.(policy.id)} className="flex-1">
              <Shield className="mr-2 h-4 w-4" />
              Renew
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => onViewDetails?.(policy.id)} className="flex-1">
            <FileText className="mr-2 h-4 w-4" />
            Details
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

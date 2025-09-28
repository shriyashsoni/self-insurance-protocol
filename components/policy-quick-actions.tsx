"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Search, Filter, Download, Bell, TrendingUp, Shield, Clock, AlertTriangle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface PolicyQuickActionsProps {
  stats: {
    totalPolicies: number
    activePolicies: number
    expiringPolicies: number
    pendingClaims: number
  }
  onNewPolicy?: () => void
  onSearch?: (term: string) => void
  onFilter?: (filter: string) => void
  onExport?: () => void
  onNotifications?: () => void
}

export function PolicyQuickActions({
  stats,
  onNewPolicy,
  onSearch,
  onFilter,
  onExport,
  onNotifications,
}: PolicyQuickActionsProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedFilter, setSelectedFilter] = useState("all")

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    onSearch?.(value)
  }

  const handleFilter = (value: string) => {
    setSelectedFilter(value)
    onFilter?.(value)
  }

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <Shield className="h-4 w-4 text-blue-400" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Active Policies</div>
                <div className="text-xl font-bold">{stats.activePolicies}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <Clock className="h-4 w-4 text-yellow-400" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Expiring Soon</div>
                <div className="text-xl font-bold">{stats.expiringPolicies}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/20">
                <AlertTriangle className="h-4 w-4 text-orange-400" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Pending Claims</div>
                <div className="text-xl font-bold">{stats.pendingClaims}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/20">
                <TrendingUp className="h-4 w-4 text-green-400" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Total Policies</div>
                <div className="text-xl font-bold">{stats.totalPolicies}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Bar */}
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Policy Management</CardTitle>
              <CardDescription>Manage your insurance policies and claims</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={onNotifications}>
                <Bell className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={onExport}>
                <Download className="h-4 w-4" />
                Export
              </Button>
              <Button onClick={onNewPolicy} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                New Policy
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search policies..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={selectedFilter} onValueChange={handleFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Policies</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="claimed">Claimed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      {(stats.expiringPolicies > 0 || stats.pendingClaims > 0) && (
        <Card className="border-yellow-500/20 bg-yellow-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-yellow-400" />
              <div className="flex-1">
                <div className="font-medium text-foreground">Action Required</div>
                <div className="text-sm text-muted-foreground">
                  {stats.expiringPolicies > 0 && `${stats.expiringPolicies} policies expiring soon. `}
                  {stats.pendingClaims > 0 && `${stats.pendingClaims} claims pending review.`}
                </div>
              </div>
              <Button variant="outline" size="sm">
                View All
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

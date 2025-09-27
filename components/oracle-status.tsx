"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Activity, Clock, CheckCircle, AlertCircle, RefreshCw } from "lucide-react"

interface OracleStatus {
  name: string
  status: "active" | "inactive" | "error"
  lastUpdate: string
  dataFeeds: number
  uptime: string
}

const mockOracleData: OracleStatus[] = [
  {
    name: "Chainlink Flight Data",
    status: "active",
    lastUpdate: "2 minutes ago",
    dataFeeds: 1250,
    uptime: "99.9%",
  },
  {
    name: "Chainlink Weather",
    status: "active",
    lastUpdate: "1 minute ago",
    dataFeeds: 850,
    uptime: "99.8%",
  },
  {
    name: "Pyth Price Feeds",
    status: "active",
    lastUpdate: "30 seconds ago",
    dataFeeds: 2100,
    uptime: "99.95%",
  },
  {
    name: "RedStone Health Data",
    status: "inactive",
    lastUpdate: "15 minutes ago",
    dataFeeds: 45,
    uptime: "98.2%",
  },
]

export function OracleStatus() {
  const [oracles, setOracles] = useState<OracleStatus[]>(mockOracleData)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const refreshOracleStatus = async () => {
    setIsRefreshing(true)

    // Simulate API call to refresh oracle status
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Update last update times
    const updatedOracles = oracles.map((oracle) => ({
      ...oracle,
      lastUpdate: oracle.status === "active" ? "Just now" : oracle.lastUpdate,
    }))

    setOracles(updatedOracles)
    setIsRefreshing(false)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4 text-accent" />
      case "inactive":
        return <Clock className="h-4 w-4 text-muted-foreground" />
      case "error":
        return <AlertCircle className="h-4 w-4 text-destructive" />
      default:
        return <Activity className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-accent/10 text-accent border-accent/20"
      case "inactive":
        return "bg-muted text-muted-foreground border-muted"
      case "error":
        return "bg-destructive/10 text-destructive border-destructive/20"
      default:
        return "bg-muted text-muted-foreground border-muted"
    }
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-card-foreground">Oracle Network Status</CardTitle>
            <CardDescription className="text-muted-foreground">
              Real-time monitoring of parametric insurance oracles
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshOracleStatus}
            disabled={isRefreshing}
            className="border-border text-foreground bg-transparent"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {oracles.map((oracle, index) => (
          <div key={oracle.name}>
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
              <div className="flex items-center gap-3">
                {getStatusIcon(oracle.status)}
                <div>
                  <h4 className="font-medium text-foreground">{oracle.name}</h4>
                  <p className="text-sm text-muted-foreground">Last update: {oracle.lastUpdate}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">{oracle.dataFeeds}</p>
                  <p className="text-xs text-muted-foreground">Data feeds</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">{oracle.uptime}</p>
                  <p className="text-xs text-muted-foreground">Uptime</p>
                </div>
                <Badge className={getStatusColor(oracle.status)}>{oracle.status}</Badge>
              </div>
            </div>
            {index < oracles.length - 1 && <Separator className="bg-border" />}
          </div>
        ))}

        <div className="mt-6 p-4 rounded-lg bg-primary/5 border border-primary/20">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="h-4 w-4 text-primary" />
            <h4 className="font-medium text-foreground">Network Health</h4>
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Active Oracles</p>
              <p className="font-semibold text-foreground">
                {oracles.filter((o) => o.status === "active").length}/{oracles.length}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Total Data Feeds</p>
              <p className="font-semibold text-foreground">
                {oracles.reduce((sum, o) => sum + o.dataFeeds, 0).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Avg Uptime</p>
              <p className="font-semibold text-foreground">99.7%</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  Activity,
  CloudRain,
  Building,
  Plane,
  Heart,
  CheckCircle,
  AlertTriangle,
  Clock,
  Zap,
  BarChart3,
  RefreshCw,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface OracleMonitoring {
  id: string
  policy_id: string
  monitoring_type: string
  status: string
  last_check_at: string
  monitoring_params: any
  policy?: {
    birthday_date: string
    celebration_location: string
    policy_name: string
  }
}

interface OracleEvent {
  id: string
  policy_id: string
  event_type: string
  condition_met: boolean
  payout_triggered: boolean
  event_data: any
  created_at: string
}

export function OracleMonitoringDashboard() {
  const [monitoringData, setMonitoringData] = useState<OracleMonitoring[]>([])
  const [oracleEvents, setOracleEvents] = useState<OracleEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    fetchMonitoringData()
    fetchOracleEvents()
  }, [])

  const fetchMonitoringData = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("oracle_monitoring")
        .select(`
          *,
          birthday_policies!inner(
            birthday_date,
            celebration_location,
            insurance_policies!inner(
              policy_name
            )
          )
        `)
        .eq("monitoring_type", "birthday_insurance")
        .order("last_check_at", { ascending: false })

      if (error) throw error

      setMonitoringData(data || [])
    } catch (error) {
      console.error("Error fetching monitoring data:", error)
      toast.error("Failed to load monitoring data")
    }
  }

  const fetchOracleEvents = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("oracle_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50)

      if (error) throw error

      setOracleEvents(data || [])
    } catch (error) {
      console.error("Error fetching oracle events:", error)
      toast.error("Failed to load oracle events")
    } finally {
      setIsLoading(false)
    }
  }

  const triggerManualEvaluation = async (policyId: string) => {
    setIsRefreshing(true)
    try {
      const response = await fetch("/api/oracle/birthday-monitor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          policy_id: policyId,
          action: "evaluate_single",
        }),
      })

      if (!response.ok) throw new Error("Failed to trigger evaluation")

      const result = await response.json()
      toast.success("Oracle evaluation completed")

      // Refresh data
      await fetchMonitoringData()
      await fetchOracleEvents()
    } catch (error) {
      console.error("Error triggering evaluation:", error)
      toast.error("Failed to trigger oracle evaluation")
    } finally {
      setIsRefreshing(false)
    }
  }

  const startContinuousMonitoring = async () => {
    setIsRefreshing(true)
    try {
      const response = await fetch("/api/oracle/birthday-monitor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start_monitoring" }),
      })

      if (!response.ok) throw new Error("Failed to start monitoring")

      toast.success("Continuous monitoring started")
      await fetchMonitoringData()
    } catch (error) {
      console.error("Error starting monitoring:", error)
      toast.error("Failed to start continuous monitoring")
    } finally {
      setIsRefreshing(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <Activity className="h-3 w-3 mr-1" />
            Active
          </Badge>
        )
      case "paused":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            Paused
          </Badge>
        )
      case "error":
        return (
          <Badge variant="destructive">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Error
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case "weather_evaluation":
        return <CloudRain className="h-4 w-4" />
      case "venue_evaluation":
        return <Building className="h-4 w-4" />
      case "travel_evaluation":
        return <Plane className="h-4 w-4" />
      case "health_evaluation":
        return <Heart className="h-4 w-4" />
      default:
        return <Zap className="h-4 w-4" />
    }
  }

  const getDaysUntilBirthday = (birthdayDate: string) => {
    const birthday = new Date(birthdayDate)
    const today = new Date()
    const diffTime = birthday.getTime() - today.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Oracle Monitoring</h2>
          <p className="text-muted-foreground">Real-time monitoring of birthday insurance conditions</p>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={startContinuousMonitoring}
            disabled={isRefreshing}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isRefreshing ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Activity className="h-4 w-4 mr-2" />}
            Start Monitoring
          </Button>
        </div>
      </div>

      <Tabs defaultValue="monitoring" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="monitoring">Active Monitoring</TabsTrigger>
          <TabsTrigger value="events">Oracle Events</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="monitoring" className="space-y-4">
          <div className="grid gap-4">
            {monitoringData.map((monitoring) => {
              const daysUntil = getDaysUntilBirthday(monitoring.policy?.birthday_date || "")
              const progressValue = Math.max(0, Math.min(100, ((7 - daysUntil) / 7) * 100))

              return (
                <Card key={monitoring.id} className="birthday-card">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{monitoring.policy?.policy_name || "Birthday Policy"}</CardTitle>
                        <CardDescription>
                          {monitoring.policy?.celebration_location} • {daysUntil} days until birthday
                        </CardDescription>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(monitoring.status)}
                        <Button
                          size="sm"
                          onClick={() => triggerManualEvaluation(monitoring.policy_id)}
                          disabled={isRefreshing}
                        >
                          <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? "animate-spin" : ""}`} />
                          Evaluate
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Monitoring Progress</span>
                          <span>{Math.round(progressValue)}%</span>
                        </div>
                        <Progress value={progressValue} className="h-2" />
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Last Check:</span>
                          <div className="font-medium">{new Date(monitoring.last_check_at).toLocaleString()}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Frequency:</span>
                          <div className="font-medium">
                            {monitoring.monitoring_params?.monitoring_frequency || "Hourly"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {monitoringData.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Activity className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No Active Monitoring</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Start monitoring birthday policies to track oracle conditions automatically.
                </p>
                <Button onClick={startContinuousMonitoring} disabled={isRefreshing}>
                  Start Monitoring
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <div className="grid gap-4">
            {oracleEvents.map((event) => (
              <Card key={event.id} className="birthday-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getEventIcon(event.event_type)}
                      <div>
                        <CardTitle className="text-lg capitalize">{event.event_type.replace("_", " ")}</CardTitle>
                        <CardDescription>{new Date(event.created_at).toLocaleString()}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {event.condition_met ? (
                        <Badge variant="secondary" className="bg-red-100 text-red-800">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Condition Met
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Normal
                        </Badge>
                      )}
                      {event.payout_triggered && (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                          <Zap className="h-3 w-3 mr-1" />
                          Payout Triggered
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    <pre className="whitespace-pre-wrap">{JSON.stringify(event.event_data, null, 2)}</pre>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="birthday-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Monitoring Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Active Policies</span>
                    <span className="font-semibold">{monitoringData.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Oracle Events</span>
                    <span className="font-semibold">{oracleEvents.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Conditions Met</span>
                    <span className="font-semibold">{oracleEvents.filter((e) => e.condition_met).length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="birthday-card">
              <CardHeader>
                <CardTitle>System Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Oracle Uptime</span>
                    <span className="font-semibold text-green-600">99.9%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Avg Response Time</span>
                    <span className="font-semibold">1.2s</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Data Sources</span>
                    <span className="font-semibold">4 Active</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="birthday-card">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {oracleEvents.slice(0, 3).map((event) => (
                    <div key={event.id} className="text-sm">
                      <div className="font-medium">{event.event_type.replace("_", " ")}</div>
                      <div className="text-muted-foreground">{new Date(event.created_at).toLocaleTimeString()}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

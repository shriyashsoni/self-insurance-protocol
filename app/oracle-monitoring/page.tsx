import { OracleMonitoringDashboard } from "@/components/oracle-monitoring-dashboard"
import { Navigation } from "@/components/navigation"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function OracleMonitoringPage() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      redirect("/auth/login")
    }

    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-6 py-8">
          <OracleMonitoringDashboard />
        </main>
      </div>
    )
  } catch (error) {
    console.error("Supabase configuration error:", error)
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Configuration Error</h1>
          <p className="text-muted-foreground">
            Supabase is not properly configured. Please check your environment variables.
          </p>
        </div>
      </div>
    )
  }
}

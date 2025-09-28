import { AdminDashboard } from "@/components/admin-dashboard"
import { Navigation } from "@/components/navigation"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function AdminPage() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      redirect("/auth/login")
    }

    // In a real implementation, you would check if the user has admin privileges
    // For now, we'll allow any authenticated user to access the admin dashboard
    // You might want to add an admin role check here

    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-6 py-8">
          <AdminDashboard />
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

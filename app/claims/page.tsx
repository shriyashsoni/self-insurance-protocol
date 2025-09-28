import { ClaimsDashboard } from "@/components/claims-dashboard"
import { Navigation } from "@/components/navigation"

export default function ClaimsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-6 py-8">
        <ClaimsDashboard />
      </main>
    </div>
  )
}

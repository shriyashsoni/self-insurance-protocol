import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { IdentityVerification } from "@/components/identity-verification"

export default async function VerificationPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  return (
    <div className="min-h-screen bg-background p-6 md:p-10">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">Identity Verification</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Secure your access to parametric insurance with privacy-preserving identity verification
          </p>
        </div>
        <IdentityVerification />
      </div>
    </div>
  )
}

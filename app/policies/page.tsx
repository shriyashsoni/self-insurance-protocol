import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { PoliciesClient } from "./policies-client"

export default async function PoliciesPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  // Check if user is verified
  const { data: userData } = await supabase
    .from("users")
    .select("self_verification_status, kyc_verified")
    .eq("id", data.user.id)
    .single()

  if (!userData?.self_verification_status || userData.self_verification_status !== "verified") {
    redirect("/verification")
  }

  return <PoliciesClient />
}

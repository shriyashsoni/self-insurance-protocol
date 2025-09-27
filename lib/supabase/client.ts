import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Missing Supabase environment variables. Using placeholder values.")
    return createBrowserClient("https://placeholder.supabase.co", "placeholder-key")
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

export { createBrowserClient }

export const supabase = (() => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Missing Supabase environment variables. Using placeholder values.")
    return createBrowserClient("https://placeholder.supabase.co", "placeholder-key")
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
})()

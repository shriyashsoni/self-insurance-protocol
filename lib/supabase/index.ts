// Client-side exports only
export { createClient as createBrowserClient } from "./client"
export { supabase } from "./client"

// Note: Server-side functions should be imported directly from "./server"
// to avoid bundling server-only code in client components

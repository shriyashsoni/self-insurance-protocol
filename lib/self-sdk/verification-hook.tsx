"use client"

import { useState, useCallback } from "react"
import { createBrowserClient } from "@supabase/ssr"

export interface VerificationSession {
  id: string
  status: "pending" | "completed" | "failed"
  qrCode?: string
  proofData?: any
  createdAt: string
  updatedAt: string
}

export interface UseVerificationResult {
  session: VerificationSession | null
  isLoading: boolean
  error: string | null
  startVerification: () => Promise<void>
  checkStatus: () => Promise<void>
  resetVerification: () => void
}

export function useVerification(): UseVerificationResult {
  const [session, setSession] = useState<VerificationSession | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const startVerification = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        throw new Error("User not authenticated")
      }

      // Start verification session
      const response = await fetch("/api/verification/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to start verification")
      }

      const data = await response.json()
      setSession(data.session)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred")
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  const checkStatus = useCallback(async () => {
    if (!session?.id) return

    try {
      const response = await fetch(`/api/verification/status?sessionId=${session.id}`)

      if (!response.ok) {
        throw new Error("Failed to check verification status")
      }

      const data = await response.json()
      setSession(data.session)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to check status")
    }
  }, [session?.id])

  const resetVerification = useCallback(() => {
    setSession(null)
    setError(null)
    setIsLoading(false)
  }, [])

  return {
    session,
    isLoading,
    error,
    startVerification,
    checkStatus,
    resetVerification,
  }
}

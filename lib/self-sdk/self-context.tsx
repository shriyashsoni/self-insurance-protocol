"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { createSelfClient, type SelfSession, type VerificationResult } from "./self-client"
import { useWallet } from "@/lib/wallet/wallet-context"

interface SelfContextType {
  session: SelfSession | null
  isLoading: boolean
  error: string | null
  authenticate: () => Promise<void>
  startVerification: (config: { disclosures: string[]; redirectUrl: string }) => Promise<string>
  verifyProof: (proof: any) => Promise<VerificationResult>
  disconnect: () => void
}

const SelfContext = createContext<SelfContextType | undefined>(undefined)

export function SelfProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SelfSession | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { address, isConnected } = useWallet()

  const selfClient = createSelfClient()

  useEffect(() => {
    if (isConnected && address && !session) {
      authenticate()
    }
  }, [isConnected, address])

  const authenticate = async () => {
    if (!address) {
      setError("Wallet not connected")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const newSession = await selfClient.authenticate(address)
      setSession(newSession)
    } catch (err: any) {
      setError(err.message || "Authentication failed")
      console.error("[v0] Self authentication error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const startVerification = async (config: { disclosures: string[]; redirectUrl: string }) => {
    setIsLoading(true)
    setError(null)

    try {
      const verificationUrl = await selfClient.startVerification(config)
      return verificationUrl
    } catch (err: any) {
      setError(err.message || "Failed to start verification")
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const verifyProof = async (proof: any) => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await selfClient.verifyProof(proof)
      return result
    } catch (err: any) {
      setError(err.message || "Failed to verify proof")
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const disconnect = () => {
    selfClient.disconnect()
    setSession(null)
    setError(null)
  }

  const contextValue: SelfContextType = {
    session,
    isLoading,
    error,
    authenticate,
    startVerification,
    verifyProof,
    disconnect,
  }

  return <SelfContext.Provider value={contextValue}>{children}</SelfContext.Provider>
}

export function useSelf() {
  const context = useContext(SelfContext)
  if (context === undefined) {
    throw new Error("useSelf must be used within a SelfProvider")
  }
  return context
}

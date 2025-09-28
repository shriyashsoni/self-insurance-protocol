import type React from "react"
import type { Metadata } from "next"
import { Inter, Merriweather } from "next/font/google"
import "./globals.css"
import { WalletProvider } from "@/lib/wallet/wallet-context"
import { AuthProvider } from "@/lib/auth/auth-context"
import { Toaster } from "sonner"
import { SelfProvider } from "@/lib/self-sdk/self-context"

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
})

const merriweather = Merriweather({
  variable: "--font-merriweather",
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"],
  display: "swap",
})

export const metadata: Metadata = {
  title: "Travel Insurance Protocol - Protect Your Journeys",
  description:
    "Smart contract-powered travel insurance that automatically pays out when flight delays, weather, or travel disruptions affect your trip. Blockchain protection that actually works.",
  keywords: [
    "travel insurance",
    "flight protection",
    "blockchain insurance",
    "smart contracts",
    "weather insurance",
    "baggage protection",
    "automated payouts",
    "DeFi insurance",
    "Chainlink oracles",
    "trip protection",
  ],
  authors: [{ name: "Travel Insurance Protocol" }],
  creator: "Travel Insurance Protocol",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://travel-insurance-protocol.vercel.app",
    title: "Travel Insurance Protocol - Protect Your Journeys",
    description:
      "Smart contract-powered travel insurance that automatically pays out when flight delays, weather, or travel disruptions affect your trip.",
    siteName: "Travel Insurance Protocol",
  },
  twitter: {
    card: "summary_large_image",
    title: "Travel Insurance Protocol - Protect Your Journeys",
    description:
      "Smart contract-powered travel insurance that automatically pays out when flight delays, weather, or travel disruptions affect your trip.",
    creator: "@travelprotocol",
  },
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${merriweather.variable} antialiased`}>
      <body className="bg-background text-foreground">
        <AuthProvider>
          <WalletProvider>
            <SelfProvider>
              {children}
              <Toaster
                position="top-right"
                toastOptions={{
                  style: {
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    color: "hsl(var(--card-foreground))",
                  },
                }}
              />
            </SelfProvider>
          </WalletProvider>
        </AuthProvider>
      </body>
    </html>
  )
}

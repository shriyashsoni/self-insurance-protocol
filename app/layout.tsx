import type React from "react"
import type { Metadata } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import "./globals.css"
import { WalletProvider } from "@/lib/wallet/wallet-context"
import { AuthProvider } from "@/lib/auth/auth-context"
import { Toaster } from "sonner"

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
})

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Parametric Insurance Protocol",
  description: "Privacy-preserving parametric insurance powered by Self Protocol and blockchain oracles",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}>
      <body className="bg-background text-foreground">
        <AuthProvider>
          <WalletProvider>
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
          </WalletProvider>
        </AuthProvider>
      </body>
    </html>
  )
}

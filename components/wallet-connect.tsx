"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Wallet, Copy, ExternalLink, AlertCircle, CheckCircle, Loader2, RefreshCw } from "lucide-react"
import { useWallet } from "@/lib/wallet/wallet-context"
import { toast } from "sonner"

export function WalletConnect() {
  const {
    isConnected,
    address,
    balance,
    chainId,
    isConnecting,
    error,
    walletType,
    connect,
    disconnect,
    switchToCelo,
    getBalance,
  } = useWallet()

  const [isRefreshing, setIsRefreshing] = useState(false)
  const [connectingWallet, setConnectingWallet] = useState<string | null>(null)

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  const copyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address)
      toast.success("Address copied to clipboard")
    }
  }

  const refreshBalance = async () => {
    setIsRefreshing(true)
    await getBalance()
    setIsRefreshing(false)
    toast.success("Balance refreshed")
  }

  const getNetworkName = (chainId: number | null) => {
    switch (chainId) {
      case 42220:
        return "Celo Mainnet"
      case 44787:
        return "Celo Alfajores"
      case 1:
        return "Ethereum Mainnet"
      case 137:
        return "Polygon"
      default:
        return "Unknown Network"
    }
  }

  const isCeloNetwork = chainId === 42220 || chainId === 44787

  const handleWalletConnect = async (type: "metamask" | "coinbase" | "walletconnect") => {
    setConnectingWallet(type)
    try {
      await connect(type)
    } finally {
      setConnectingWallet(null)
    }
  }

  const getWalletName = (type: string | null) => {
    switch (type) {
      case "metamask":
        return "MetaMask"
      case "coinbase":
        return "Coinbase Wallet"
      case "walletconnect":
        return "WalletConnect"
      default:
        return "Unknown Wallet"
    }
  }

  if (!isConnected) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
              <Wallet className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-card-foreground">Connect Wallet</CardTitle>
              <CardDescription className="text-muted-foreground">
                Choose your preferred wallet to purchase insurance policies
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <span className="text-sm text-destructive">{error}</span>
            </div>
          )}

          <div className="space-y-3">
            <Button
              onClick={() => handleWalletConnect("metamask")}
              disabled={isConnecting}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 justify-start"
            >
              {connectingWallet === "metamask" ? (
                <>
                  <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                  Connecting MetaMask...
                </>
              ) : (
                <>
                  <div className="mr-3 h-5 w-5 rounded bg-orange-500 flex items-center justify-center">
                    <span className="text-xs font-bold text-white">M</span>
                  </div>
                  Connect with MetaMask
                </>
              )}
            </Button>

            <Button
              onClick={() => handleWalletConnect("coinbase")}
              disabled={isConnecting}
              variant="outline"
              className="w-full border-border text-foreground bg-transparent hover:bg-muted justify-start"
            >
              {connectingWallet === "coinbase" ? (
                <>
                  <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                  Connecting Coinbase...
                </>
              ) : (
                <>
                  <div className="mr-3 h-5 w-5 rounded bg-blue-500 flex items-center justify-center">
                    <span className="text-xs font-bold text-white">C</span>
                  </div>
                  Connect with Coinbase Wallet
                </>
              )}
            </Button>

            <Button
              onClick={() => handleWalletConnect("walletconnect")}
              disabled={isConnecting}
              variant="outline"
              className="w-full border-border text-foreground bg-transparent hover:bg-muted justify-start"
            >
              {connectingWallet === "walletconnect" ? (
                <>
                  <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                  Connecting WalletConnect...
                </>
              ) : (
                <>
                  <div className="mr-3 h-5 w-5 rounded bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center">
                    <span className="text-xs font-bold text-white">W</span>
                  </div>
                  Connect with WalletConnect
                </>
              )}
            </Button>
          </div>

          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Choose your preferred wallet from the options above</p>
            <p>• We'll help you switch to Celo network automatically</p>
            <p>• Your wallet will be used for premium payments and payouts</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent/10 border border-accent/20">
              <CheckCircle className="h-6 w-6 text-accent" />
            </div>
            <div>
              <CardTitle className="text-card-foreground">{getWalletName(walletType)} Connected</CardTitle>
              <CardDescription className="text-muted-foreground">Ready to purchase insurance policies</CardDescription>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={disconnect}
            className="border-border text-foreground bg-transparent"
          >
            Disconnect
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
            <div>
              <p className="text-sm font-medium text-foreground">Address</p>
              <p className="text-sm text-muted-foreground">{formatAddress(address!)}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={copyAddress} className="h-8 w-8 p-0">
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  window.open(`https://alfajores-blockscout.celo-testnet.org/address/${address}`, "_blank")
                }
                className="h-8 w-8 p-0"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
            <div>
              <p className="text-sm font-medium text-foreground">Balance</p>
              <p className="text-sm text-muted-foreground">{balance || "0.0000"} CELO</p>
            </div>
            <Button variant="ghost" size="sm" onClick={refreshBalance} disabled={isRefreshing} className="h-8 w-8 p-0">
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            </Button>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
            <div>
              <p className="text-sm font-medium text-foreground">Network</p>
              <p className="text-sm text-muted-foreground">{getNetworkName(chainId)}</p>
            </div>
            <Badge
              className={
                isCeloNetwork
                  ? "bg-accent/10 text-accent border-accent/20"
                  : "bg-destructive/10 text-destructive border-destructive/20"
              }
            >
              {isCeloNetwork ? "Supported" : "Unsupported"}
            </Badge>
          </div>
        </div>

        {!isCeloNetwork && (
          <>
            <Separator className="bg-border" />
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                <AlertCircle className="h-4 w-4 text-orange-400" />
                <span className="text-sm text-orange-400">Please switch to Celo network to use insurance features</span>
              </div>
              <Button onClick={switchToCelo} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                Switch to Celo Network
              </Button>
            </div>
          </>
        )}

        {isCeloNetwork && (
          <div className="p-3 rounded-lg bg-accent/5 border border-accent/20">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-accent" />
              <p className="text-sm font-medium text-foreground">Ready for Insurance</p>
            </div>
            <p className="text-xs text-muted-foreground">
              Your wallet is connected to Celo network and ready to purchase parametric insurance policies.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

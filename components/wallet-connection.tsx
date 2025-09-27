"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Wallet, ExternalLink, Copy, CheckCircle, AlertTriangle, Zap } from "lucide-react"
import {
  walletManager,
  formatAddress,
  formatBalance,
  getExplorerUrl,
  type WalletInfo,
  type NetworkConfig,
} from "@/lib/web3/wallet-connection"
import { toast } from "sonner"

export function WalletConnection() {
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isNetworkDialogOpen, setIsNetworkDialogOpen] = useState(false)
  const [supportedNetworks, setSupportedNetworks] = useState<NetworkConfig[]>([])

  useEffect(() => {
    // Check if wallet is already connected
    checkWalletConnection()
    setSupportedNetworks(walletManager.getSupportedNetworks())
  }, [])

  const checkWalletConnection = async () => {
    try {
      const info = walletManager.getWalletInfo()
      if (info?.isConnected) {
        setWalletInfo(info)
      }
    } catch (error) {
      console.error("Failed to check wallet connection:", error)
    }
  }

  const handleConnectWallet = async () => {
    setIsConnecting(true)
    try {
      const info = await walletManager.connectWallet()
      setWalletInfo(info)
      toast.success("Wallet connected successfully!")
    } catch (error) {
      console.error("Wallet connection failed:", error)
      toast.error(error.message || "Failed to connect wallet")
    } finally {
      setIsConnecting(false)
    }
  }

  const handleDisconnectWallet = async () => {
    try {
      await walletManager.disconnectWallet()
      setWalletInfo(null)
      toast.success("Wallet disconnected")
    } catch (error) {
      console.error("Wallet disconnection failed:", error)
      toast.error("Failed to disconnect wallet")
    }
  }

  const handleSwitchNetwork = async (chainId: number) => {
    try {
      await walletManager.switchNetwork(chainId)
      const info = walletManager.getWalletInfo()
      setWalletInfo(info)
      setIsNetworkDialogOpen(false)
      toast.success("Network switched successfully!")
    } catch (error) {
      console.error("Network switch failed:", error)
      toast.error(error.message || "Failed to switch network")
    }
  }

  const copyAddress = async () => {
    if (walletInfo?.address) {
      await navigator.clipboard.writeText(walletInfo.address)
      toast.success("Address copied to clipboard")
    }
  }

  const getNetworkBadge = (chainId: number) => {
    const network = supportedNetworks.find((n) => n.chainId === chainId)
    if (!network) {
      return (
        <Badge variant="destructive">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Unsupported Network
        </Badge>
      )
    }

    const isMainnet = chainId === 1 || chainId === 137
    return (
      <Badge variant={isMainnet ? "default" : "secondary"}>
        <Zap className="h-3 w-3 mr-1" />
        {network.name}
      </Badge>
    )
  }

  if (!walletInfo?.isConnected) {
    return (
      <Card className="birthday-card">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center">
            <Wallet className="h-6 w-6 mr-2" />
            Connect Wallet
          </CardTitle>
          <CardDescription>Connect your Web3 wallet to create and manage birthday insurance policies</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button
            onClick={handleConnectWallet}
            disabled={isConnecting}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isConnecting ? "Connecting..." : "Connect Wallet"}
          </Button>
          <p className="text-sm text-muted-foreground mt-4">Supports MetaMask, WalletConnect, and other Web3 wallets</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="birthday-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
            Wallet Connected
          </CardTitle>
          <div className="flex items-center space-x-2">
            {getNetworkBadge(walletInfo.chainId)}
            <Dialog open={isNetworkDialogOpen} onOpenChange={setIsNetworkDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  Switch Network
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Switch Network</DialogTitle>
                  <DialogDescription>
                    Select a network to switch to. Birthday insurance is available on multiple chains.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  {supportedNetworks.map((network) => (
                    <Card
                      key={network.chainId}
                      className={`cursor-pointer transition-colors ${
                        network.chainId === walletInfo.chainId
                          ? "border-primary bg-primary/5"
                          : "hover:border-primary/50"
                      }`}
                      onClick={() => handleSwitchNetwork(network.chainId)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold">{network.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {network.nativeCurrency.symbol} • Chain ID: {network.chainId}
                            </p>
                          </div>
                          {network.chainId === walletInfo.chainId && <CheckCircle className="h-5 w-5 text-green-600" />}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Address:</span>
            <div className="flex items-center space-x-2">
              <code className="text-sm font-mono bg-muted px-2 py-1 rounded">{formatAddress(walletInfo.address)}</code>
              <Button variant="ghost" size="sm" onClick={copyAddress}>
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const explorerUrl = getExplorerUrl(walletInfo.chainId, walletInfo.address)
                  if (explorerUrl) {
                    window.open(explorerUrl.replace("/tx/", "/address/"), "_blank")
                  }
                }}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Balance:</span>
            <span className="font-semibold">
              {formatBalance(walletInfo.balance)}{" "}
              {supportedNetworks.find((n) => n.chainId === walletInfo.chainId)?.nativeCurrency.symbol || "ETH"}
            </span>
          </div>

          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleDisconnectWallet} className="flex-1 bg-transparent">
              Disconnect
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

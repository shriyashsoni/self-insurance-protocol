"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

export interface WalletState {
  isConnected: boolean
  address: string | null
  balance: string | null
  chainId: number | null
  isConnecting: boolean
  error: string | null
  walletType: "metamask" | "walletconnect" | "coinbase" | null
}

export interface WalletContextType extends WalletState {
  connect: (walletType?: "metamask" | "walletconnect" | "coinbase") => Promise<void>
  disconnect: () => void
  switchToCelo: () => Promise<void>
  getBalance: () => Promise<void>
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

// Celo network configuration
const CELO_MAINNET = {
  chainId: "0xa4ec", // 42220 in hex
  chainName: "Celo Mainnet",
  nativeCurrency: {
    name: "CELO",
    symbol: "CELO",
    decimals: 18,
  },
  rpcUrls: ["https://forno.celo.org"],
  blockExplorerUrls: ["https://explorer.celo.org"],
}

const CELO_ALFAJORES = {
  chainId: "0xaef3", // 44787 in hex
  chainName: "Celo Alfajores Testnet",
  nativeCurrency: {
    name: "CELO",
    symbol: "CELO",
    decimals: 18,
  },
  rpcUrls: ["https://alfajores-forno.celo-testnet.org"],
  blockExplorerUrls: ["https://alfajores-blockscout.celo-testnet.org"],
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [walletState, setWalletState] = useState<WalletState>({
    isConnected: false,
    address: null,
    balance: null,
    chainId: null,
    isConnecting: false,
    error: null,
    walletType: null,
  })

  useEffect(() => {
    checkConnection()
  }, [])

  useEffect(() => {
    if (typeof window !== "undefined" && window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnect()
        } else {
          setWalletState((prev) => ({
            ...prev,
            address: accounts[0],
            isConnected: true,
          }))
          getBalance()
        }
      }

      const handleChainChanged = (chainId: string) => {
        setWalletState((prev) => ({
          ...prev,
          chainId: Number.parseInt(chainId, 16),
        }))
      }

      window.ethereum.on("accountsChanged", handleAccountsChanged)
      window.ethereum.on("chainChanged", handleChainChanged)

      return () => {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged)
        window.ethereum.removeListener("chainChanged", handleChainChanged)
      }
    }
  }, [])

  const checkConnection = async () => {
    if (typeof window !== "undefined" && window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: "eth_accounts" })
        const chainId = await window.ethereum.request({ method: "eth_chainId" })

        if (accounts.length > 0) {
          let walletType: "metamask" | "coinbase" | null = null
          if (window.ethereum.isMetaMask) {
            walletType = "metamask"
          } else if (window.ethereum.isCoinbaseWallet) {
            walletType = "coinbase"
          }

          setWalletState((prev) => ({
            ...prev,
            isConnected: true,
            address: accounts[0],
            chainId: Number.parseInt(chainId, 16),
            walletType,
          }))
          await getBalance()
        }
      } catch (error) {
        console.error("[v0] Error checking wallet connection:", error)
      }
    }
  }

  const connect = async (walletType: "metamask" | "walletconnect" | "coinbase" = "metamask") => {
    setWalletState((prev) => ({
      ...prev,
      isConnecting: true,
      error: null,
    }))

    try {
      if (walletType === "metamask") {
        await connectMetaMask()
      } else if (walletType === "coinbase") {
        await connectCoinbase()
      } else if (walletType === "walletconnect") {
        await connectWalletConnect()
      }
    } catch (error: any) {
      setWalletState((prev) => ({
        ...prev,
        isConnecting: false,
        error: error.message || `Failed to connect ${walletType}`,
      }))
    }
  }

  const connectMetaMask = async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      throw new Error("MetaMask is not installed. Please install MetaMask to continue.")
    }

    if (!window.ethereum.isMetaMask) {
      throw new Error("Please use MetaMask to connect.")
    }

    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    })

    const chainId = await window.ethereum.request({ method: "eth_chainId" })

    setWalletState((prev) => ({
      ...prev,
      isConnected: true,
      address: accounts[0],
      chainId: Number.parseInt(chainId, 16),
      isConnecting: false,
      walletType: "metamask",
    }))

    await getBalance()

    const celoChainId = Number.parseInt(CELO_ALFAJORES.chainId, 16)
    if (Number.parseInt(chainId, 16) !== celoChainId) {
      await switchToCelo()
    }
  }

  const connectCoinbase = async () => {
    if (typeof window === "undefined" || !window.ethereum?.isCoinbaseWallet) {
      throw new Error("Coinbase Wallet is not installed. Please install Coinbase Wallet to continue.")
    }

    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    })

    const chainId = await window.ethereum.request({ method: "eth_chainId" })

    setWalletState((prev) => ({
      ...prev,
      isConnected: true,
      address: accounts[0],
      chainId: Number.parseInt(chainId, 16),
      isConnecting: false,
      walletType: "coinbase",
    }))

    await getBalance()

    const celoChainId = Number.parseInt(CELO_ALFAJORES.chainId, 16)
    if (Number.parseInt(chainId, 16) !== celoChainId) {
      await switchToCelo()
    }
  }

  const connectWalletConnect = async () => {
    throw new Error("WalletConnect integration coming soon. Please use MetaMask or Coinbase Wallet for now.")
  }

  const disconnect = () => {
    setWalletState({
      isConnected: false,
      address: null,
      balance: null,
      chainId: null,
      isConnecting: false,
      error: null,
      walletType: null,
    })
  }

  const switchToCelo = async () => {
    if (typeof window === "undefined" || !window.ethereum) return

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: CELO_ALFAJORES.chainId }],
      })
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [CELO_ALFAJORES],
          })
        } catch (addError) {
          console.error("[v0] Error adding Celo network:", addError)
          setWalletState((prev) => ({
            ...prev,
            error: "Failed to add Celo network to wallet",
          }))
        }
      } else {
        console.error("[v0] Error switching to Celo:", switchError)
        setWalletState((prev) => ({
          ...prev,
          error: "Failed to switch to Celo network",
        }))
      }
    }
  }

  const getBalance = async () => {
    if (typeof window === "undefined" || !window.ethereum || !walletState.address) return

    try {
      const balance = await window.ethereum.request({
        method: "eth_getBalance",
        params: [walletState.address, "latest"],
      })

      const balanceInEther = (Number.parseInt(balance, 16) / Math.pow(10, 18)).toFixed(4)

      setWalletState((prev) => ({
        ...prev,
        balance: balanceInEther,
      }))
    } catch (error) {
      console.error("[v0] Error getting balance:", error)
    }
  }

  const contextValue: WalletContextType = {
    ...walletState,
    connect,
    disconnect,
    switchToCelo,
    getBalance,
  }

  return <WalletContext.Provider value={contextValue}>{children}</WalletContext.Provider>
}

export function useWallet() {
  const context = useContext(WalletContext)
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider")
  }
  return context
}

declare global {
  interface Window {
    ethereum?: any & {
      isMetaMask?: boolean
      isCoinbaseWallet?: boolean
    }
  }
}

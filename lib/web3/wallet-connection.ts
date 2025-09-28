// Web3 Wallet Connection and Management for Birthday Insurance
// Handles MetaMask, WalletConnect, and other wallet integrations

import { ethers } from "ethers"
import { BirthdayInsuranceContract } from "@/lib/contracts/birthday-insurance-contract"

export interface WalletInfo {
  address: string
  balance: string
  chainId: number
  isConnected: boolean
}

export interface NetworkConfig {
  chainId: number
  name: string
  rpcUrl: string
  blockExplorer: string
  nativeCurrency: {
    name: string
    symbol: string
    decimals: number
  }
  contractAddresses: {
    birthdayInsurance: string
    oracle: string
  }
}

export const SUPPORTED_NETWORKS: Record<number, NetworkConfig> = {
  // Ethereum Mainnet
  1: {
    chainId: 1,
    name: "Ethereum Mainnet",
    rpcUrl: "https://mainnet.infura.io/v3/YOUR_INFURA_KEY",
    blockExplorer: "https://etherscan.io",
    nativeCurrency: {
      name: "Ethereum",
      symbol: "ETH",
      decimals: 18,
    },
    contractAddresses: {
      birthdayInsurance: "0x1234567890123456789012345678901234567890",
      oracle: "0x0987654321098765432109876543210987654321",
    },
  },
  // Polygon Mainnet
  137: {
    chainId: 137,
    name: "Polygon Mainnet",
    rpcUrl: "https://polygon-rpc.com",
    blockExplorer: "https://polygonscan.com",
    nativeCurrency: {
      name: "MATIC",
      symbol: "MATIC",
      decimals: 18,
    },
    contractAddresses: {
      birthdayInsurance: "0x2345678901234567890123456789012345678901",
      oracle: "0x1987654321098765432109876543210987654321",
    },
  },
  // Sepolia Testnet
  11155111: {
    chainId: 11155111,
    name: "Sepolia Testnet",
    rpcUrl: "https://sepolia.infura.io/v3/YOUR_INFURA_KEY",
    blockExplorer: "https://sepolia.etherscan.io",
    nativeCurrency: {
      name: "Sepolia Ethereum",
      symbol: "SEP",
      decimals: 18,
    },
    contractAddresses: {
      birthdayInsurance: "0x3456789012345678901234567890123456789012",
      oracle: "0x2987654321098765432109876543210987654321",
    },
  },
}

export class WalletManager {
  private provider: ethers.BrowserProvider | null = null
  private signer: ethers.Signer | null = null
  private walletInfo: WalletInfo | null = null
  private birthdayContract: BirthdayInsuranceContract | null = null

  // Connect to MetaMask or other injected wallet
  async connectWallet(): Promise<WalletInfo> {
    try {
      if (!window.ethereum) {
        throw new Error("No wallet found. Please install MetaMask or another Web3 wallet.")
      }

      // Request account access
      await window.ethereum.request({ method: "eth_requestAccounts" })

      // Create provider and signer
      this.provider = new ethers.BrowserProvider(window.ethereum)
      this.signer = await this.provider.getSigner()

      // Get wallet info
      const address = await this.signer.getAddress()
      const balance = await this.provider.getBalance(address)
      const network = await this.provider.getNetwork()

      this.walletInfo = {
        address,
        balance: ethers.formatEther(balance),
        chainId: Number(network.chainId),
        isConnected: true,
      }

      // Initialize contract
      await this.initializeContract()

      // Set up event listeners
      this.setupEventListeners()

      console.log("[v0] Wallet connected:", this.walletInfo)
      return this.walletInfo
    } catch (error) {
      console.error("[v0] Wallet connection failed:", error)
      throw new Error(`Failed to connect wallet: ${error.message}`)
    }
  }

  // Disconnect wallet
  async disconnectWallet(): Promise<void> {
    this.provider = null
    this.signer = null
    this.walletInfo = null
    this.birthdayContract = null

    // Remove event listeners
    if (window.ethereum) {
      window.ethereum.removeAllListeners()
    }

    console.log("[v0] Wallet disconnected")
  }

  // Switch to a supported network
  async switchNetwork(chainId: number): Promise<void> {
    if (!window.ethereum) {
      throw new Error("No wallet found")
    }

    const networkConfig = SUPPORTED_NETWORKS[chainId]
    if (!networkConfig) {
      throw new Error(`Unsupported network: ${chainId}`)
    }

    try {
      // Try to switch to the network
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      })
    } catch (switchError: any) {
      // If network doesn't exist, add it
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: `0x${chainId.toString(16)}`,
              chainName: networkConfig.name,
              rpcUrls: [networkConfig.rpcUrl],
              nativeCurrency: networkConfig.nativeCurrency,
              blockExplorerUrls: [networkConfig.blockExplorer],
            },
          ],
        })
      } else {
        throw switchError
      }
    }

    // Reinitialize after network switch
    await this.connectWallet()
  }

  // Initialize birthday insurance contract
  private async initializeContract(): Promise<void> {
    if (!this.provider || !this.signer || !this.walletInfo) {
      throw new Error("Wallet not connected")
    }

    const networkConfig = SUPPORTED_NETWORKS[this.walletInfo.chainId]
    if (!networkConfig) {
      throw new Error(`Unsupported network: ${this.walletInfo.chainId}`)
    }

    this.birthdayContract = new BirthdayInsuranceContract(
      networkConfig.contractAddresses.birthdayInsurance,
      this.provider,
      this.signer,
    )

    console.log("[v0] Birthday insurance contract initialized")
  }

  // Set up wallet event listeners
  private setupEventListeners(): void {
    if (!window.ethereum) return

    // Account changed
    window.ethereum.on("accountsChanged", async (accounts: string[]) => {
      if (accounts.length === 0) {
        await this.disconnectWallet()
      } else {
        await this.connectWallet()
      }
    })

    // Network changed
    window.ethereum.on("chainChanged", async (chainId: string) => {
      await this.connectWallet()
    })

    // Disconnection
    window.ethereum.on("disconnect", async () => {
      await this.disconnectWallet()
    })
  }

  // Get current wallet info
  getWalletInfo(): WalletInfo | null {
    return this.walletInfo
  }

  // Get birthday insurance contract instance
  getBirthdayContract(): BirthdayInsuranceContract | null {
    return this.birthdayContract
  }

  // Check if wallet is connected
  isConnected(): boolean {
    return this.walletInfo?.isConnected || false
  }

  // Get supported networks
  getSupportedNetworks(): NetworkConfig[] {
    return Object.values(SUPPORTED_NETWORKS)
  }

  // Get current network config
  getCurrentNetwork(): NetworkConfig | null {
    if (!this.walletInfo) return null
    return SUPPORTED_NETWORKS[this.walletInfo.chainId] || null
  }

  // Sign a message
  async signMessage(message: string): Promise<string> {
    if (!this.signer) {
      throw new Error("Wallet not connected")
    }

    try {
      const signature = await this.signer.signMessage(message)
      console.log("[v0] Message signed successfully")
      return signature
    } catch (error) {
      console.error("[v0] Message signing failed:", error)
      throw new Error(`Failed to sign message: ${error.message}`)
    }
  }

  // Get transaction receipt
  async getTransactionReceipt(txHash: string): Promise<ethers.TransactionReceipt | null> {
    if (!this.provider) {
      throw new Error("Provider not available")
    }

    try {
      return await this.provider.getTransactionReceipt(txHash)
    } catch (error) {
      console.error("[v0] Failed to get transaction receipt:", error)
      return null
    }
  }

  // Wait for transaction confirmation
  async waitForTransaction(txHash: string, confirmations = 1): Promise<ethers.TransactionReceipt> {
    if (!this.provider) {
      throw new Error("Provider not available")
    }

    try {
      console.log(`[v0] Waiting for ${confirmations} confirmation(s) for tx: ${txHash}`)
      return await this.provider.waitForTransaction(txHash, confirmations)
    } catch (error) {
      console.error("[v0] Transaction confirmation failed:", error)
      throw new Error(`Transaction failed: ${error.message}`)
    }
  }

  // Estimate gas for a transaction
  async estimateGas(to: string, data: string, value?: string): Promise<bigint> {
    if (!this.provider || !this.signer) {
      throw new Error("Wallet not connected")
    }

    try {
      const gasEstimate = await this.provider.estimateGas({
        to,
        data,
        value: value ? ethers.parseEther(value) : undefined,
        from: await this.signer.getAddress(),
      })

      return gasEstimate
    } catch (error) {
      console.error("[v0] Gas estimation failed:", error)
      throw new Error(`Failed to estimate gas: ${error.message}`)
    }
  }
}

// Global wallet manager instance
export const walletManager = new WalletManager()

// Utility functions
export const formatAddress = (address: string): string => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export const formatBalance = (balance: string, decimals = 4): string => {
  const num = Number.parseFloat(balance)
  return num.toFixed(decimals)
}

export const getExplorerUrl = (chainId: number, txHash: string): string => {
  const network = SUPPORTED_NETWORKS[chainId]
  return network ? `${network.blockExplorer}/tx/${txHash}` : ""
}

// Type declarations for window.ethereum
declare global {
  interface Window {
    ethereum?: any
  }
}

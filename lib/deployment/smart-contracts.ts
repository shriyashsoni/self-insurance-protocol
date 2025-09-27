export const INSURANCE_CONTRACT_ABI = [
  {
    inputs: [
      { name: "policyType", type: "string" },
      { name: "premium", type: "uint256" },
      { name: "payout", type: "uint256" },
      { name: "duration", type: "uint256" },
    ],
    name: "purchasePolicy",
    outputs: [{ name: "tokenId", type: "uint256" }],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [{ name: "tokenId", type: "uint256" }],
    name: "getPolicy",
    outputs: [
      { name: "user", type: "address" },
      { name: "premium", type: "uint256" },
      { name: "payout", type: "uint256" },
      { name: "expiry", type: "uint256" },
      { name: "active", type: "bool" },
      { name: "policyType", type: "string" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "tokenId", type: "uint256" }],
    name: "triggerPayout",
    outputs: [{ name: "success", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
]

export const ORACLE_CONTRACT_ABI = [
  {
    inputs: [
      { name: "flightNumber", type: "string" },
      { name: "date", type: "string" },
    ],
    name: "getFlightStatus",
    outputs: [
      { name: "delayed", type: "bool" },
      { name: "delayMinutes", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "location", type: "string" }],
    name: "getWeatherData",
    outputs: [{ name: "extremeWeather", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
]

export interface DeploymentConfig {
  network: "alfajores" | "mainnet"
  gasPrice: string
  gasLimit: number
  confirmations: number
}

export const DEPLOYMENT_CONFIGS: Record<string, DeploymentConfig> = {
  alfajores: {
    network: "alfajores",
    gasPrice: "1000000000", // 1 gwei
    gasLimit: 6000000,
    confirmations: 1,
  },
  mainnet: {
    network: "mainnet",
    gasPrice: "2000000000", // 2 gwei
    gasLimit: 8000000,
    confirmations: 3,
  },
}

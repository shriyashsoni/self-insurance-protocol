export const CELO_NETWORKS = {
  mainnet: {
    name: "Celo Mainnet",
    chainId: 42220,
    rpcUrl: "https://forno.celo.org",
    blockExplorer: "https://celoscan.io",
    nativeCurrency: {
      name: "CELO",
      symbol: "CELO",
      decimals: 18,
    },
    stablecoin: {
      cUSD: "0x765DE816845861e75A25fCA122bb6898B8B1282a",
      cEUR: "0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73",
    },
  },
  alfajores: {
    name: "Celo Alfajores Testnet",
    chainId: 44787,
    rpcUrl: "https://alfajores-forno.celo-testnet.org",
    blockExplorer: "https://alfajores.celoscan.io",
    nativeCurrency: {
      name: "CELO",
      symbol: "CELO",
      decimals: 18,
    },
    stablecoin: {
      cUSD: "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1",
      cEUR: "0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F",
    },
  },
}

export const CONTRACT_ADDRESSES = {
  alfajores: {
    identityVerifier: "0x0000000000000000000000000000000000000000", // To be deployed
    insurancePolicy: "0x0000000000000000000000000000000000000000", // To be deployed
    insuranceOracle: "0x0000000000000000000000000000000000000000", // To be deployed
    chainlinkOracle: "0x0000000000000000000000000000000000000000", // Chainlink oracle address
  },
  mainnet: {
    identityVerifier: "0x0000000000000000000000000000000000000000", // To be deployed
    insurancePolicy: "0x0000000000000000000000000000000000000000", // To be deployed
    insuranceOracle: "0x0000000000000000000000000000000000000000", // To be deployed
    chainlinkOracle: "0x0000000000000000000000000000000000000000", // Chainlink oracle address
  },
}

export function getCeloNetwork(isTestnet = true) {
  return isTestnet ? CELO_NETWORKS.alfajores : CELO_NETWORKS.mainnet
}

export function getContractAddresses(isTestnet = true) {
  return isTestnet ? CONTRACT_ADDRESSES.alfajores : CONTRACT_ADDRESSES.mainnet
}

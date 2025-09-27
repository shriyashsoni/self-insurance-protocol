export interface Policy {
  id: string
  user_id: string
  policy_type: "travel" | "medical" | "baggage" | "cancellation" | "weather" | "visa"
  policy_name: string
  premium_amount: number // ETH amount (e.g., 0.01 for 0.01 ETH)
  coverage_amount: number // ETH amount (e.g., 0.1 for 0.1 ETH showcase)
  policy_terms: {
    conditions: string[]
    duration: string
    region?: string
  }
  oracle_conditions: {
    type: string
    triggers: string[]
    thresholds?: Record<string, any>
  }
  policy_status: "active" | "expired" | "claimed"
  nft_token_id?: string
  contract_address?: string
  start_date: string
  end_date: string
  created_at: string
  updated_at: string
}

export interface Claim {
  id: string
  policy_id: string
  user_id: string
  claim_amount: number // ETH amount
  claim_status: "pending" | "approved" | "paid" | "rejected"
  oracle_data?: Record<string, any>
  transaction_hash?: string
  payout_date?: string
  created_at: string
  updated_at: string
}

export interface OracleData {
  id: string
  oracle_type: "chainlink" | "pyth" | "redstone" | "travel_api" | "weather_api"
  data_feed: string
  data_value: Record<string, any>
  timestamp: string
  created_at: string
}

export interface TravelCredentialPolicy {
  id: string
  credential_type: "passport" | "visa" | "vaccination" | "travel_pass"
  required_for_policy: boolean
  verification_status: "pending" | "verified" | "expired"
  issued_by: string
  valid_until?: string
}

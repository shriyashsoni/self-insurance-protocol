export interface Policy {
  id: string
  user_id: string
  policy_type: "flight" | "weather" | "health"
  policy_name: string
  premium_amount: number
  coverage_amount: number
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
  claim_amount: number
  claim_status: "pending" | "approved" | "paid" | "rejected"
  oracle_data?: Record<string, any>
  transaction_hash?: string
  payout_date?: string
  created_at: string
  updated_at: string
}

export interface OracleData {
  id: string
  oracle_type: "chainlink" | "pyth" | "redstone"
  data_feed: string
  data_value: Record<string, any>
  timestamp: string
  created_at: string
}

-- Insurance Protocol Database Schema
-- Creates tables for users, policies, claims, and oracle data

-- Users table with Self SDK verification data
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_address TEXT UNIQUE,
  self_verification_status TEXT DEFAULT 'pending',
  self_verification_data JSONB,
  country_code TEXT,
  age INTEGER,
  kyc_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insurance policies table
CREATE TABLE IF NOT EXISTS public.insurance_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  policy_type TEXT NOT NULL, -- 'flight', 'weather', 'health', etc.
  policy_name TEXT NOT NULL,
  premium_amount DECIMAL(18, 6) NOT NULL,
  coverage_amount DECIMAL(18, 6) NOT NULL,
  policy_terms JSONB NOT NULL, -- Contains specific terms and conditions
  oracle_conditions JSONB NOT NULL, -- Oracle trigger conditions
  policy_status TEXT DEFAULT 'active', -- 'active', 'expired', 'claimed'
  nft_token_id TEXT, -- SBT/NFT token ID as proof
  contract_address TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Claims table for tracking payouts
CREATE TABLE IF NOT EXISTS public.claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id UUID NOT NULL REFERENCES public.insurance_policies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  claim_amount DECIMAL(18, 6) NOT NULL,
  claim_status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'paid', 'rejected'
  oracle_data JSONB, -- Data from oracle that triggered the claim
  transaction_hash TEXT, -- Blockchain transaction hash for payout
  payout_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Oracle data table for storing external data feeds
CREATE TABLE IF NOT EXISTS public.oracle_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  oracle_type TEXT NOT NULL, -- 'chainlink', 'pyth', 'redstone'
  data_feed TEXT NOT NULL, -- e.g., 'flight_status', 'weather_data'
  data_value JSONB NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oracle_data ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "users_select_own" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_insert_own" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "users_update_own" ON public.users FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for insurance_policies table
CREATE POLICY "policies_select_own" ON public.insurance_policies FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "policies_insert_own" ON public.insurance_policies FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "policies_update_own" ON public.insurance_policies FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for claims table
CREATE POLICY "claims_select_own" ON public.claims FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "claims_insert_own" ON public.claims FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "claims_update_own" ON public.claims FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for oracle_data table (read-only for all authenticated users)
CREATE POLICY "oracle_data_select_all" ON public.oracle_data FOR SELECT USING (auth.uid() IS NOT NULL);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_wallet_address ON public.users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_policies_user_id ON public.insurance_policies(user_id);
CREATE INDEX IF NOT EXISTS idx_policies_status ON public.insurance_policies(policy_status);
CREATE INDEX IF NOT EXISTS idx_claims_policy_id ON public.claims(policy_id);
CREATE INDEX IF NOT EXISTS idx_claims_status ON public.claims(claim_status);
CREATE INDEX IF NOT EXISTS idx_oracle_data_type ON public.oracle_data(oracle_type, data_feed);

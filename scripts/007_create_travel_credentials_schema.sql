-- SelfTravel Protocol - Travel Credentials Schema
-- This script creates tables for managing travel credentials and verifiable credentials

-- Travel Credentials table for storing user travel documents
CREATE TABLE IF NOT EXISTS travel_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    credential_type VARCHAR(50) NOT NULL CHECK (credential_type IN ('passport', 'visa', 'vaccination', 'travel_pass', 'identity_verification')),
    credential_data JSONB NOT NULL, -- Encrypted credential data
    issuer_did TEXT NOT NULL, -- DID of the credential issuer
    subject_did TEXT, -- DID of the credential subject (user)
    proof_signature TEXT NOT NULL, -- Cryptographic proof
    verification_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'expired', 'revoked')),
    issued_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    revoked_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}', -- Additional metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Verifiable Credentials table for W3C VC standard compliance
CREATE TABLE IF NOT EXISTS verifiable_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    credential_id TEXT UNIQUE NOT NULL, -- External credential ID
    vc_json JSONB NOT NULL, -- Full W3C Verifiable Credential JSON
    credential_schema TEXT, -- Schema URL for the credential
    credential_context TEXT[], -- JSON-LD context
    issuer_info JSONB NOT NULL, -- Issuer information
    subject_info JSONB NOT NULL, -- Subject information
    proof_info JSONB NOT NULL, -- Proof information
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'revoked')),
    issued_date TIMESTAMP WITH TIME ZONE NOT NULL,
    expiration_date TIMESTAMP WITH TIME ZONE,
    revocation_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Travel Verification Sessions table for Self.xyz integration
CREATE TABLE IF NOT EXISTS travel_verification_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT UNIQUE NOT NULL, -- External session ID from Self.xyz
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    wallet_address TEXT,
    verification_type VARCHAR(50) NOT NULL DEFAULT 'travel_identity',
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'expired')),
    verification_url TEXT,
    deep_link TEXT,
    qr_code_data TEXT,
    required_claims TEXT[] DEFAULT '{}',
    verified_claims JSONB DEFAULT '{}',
    proof_data JSONB DEFAULT '{}',
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '1 hour'),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Travel Policies table (updated for travel focus)
CREATE TABLE IF NOT EXISTS travel_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    policy_type VARCHAR(50) NOT NULL CHECK (policy_type IN ('travel', 'medical', 'baggage', 'cancellation', 'weather', 'visa')),
    policy_name VARCHAR(255) NOT NULL,
    premium_amount_eth DECIMAL(18, 8) NOT NULL, -- ETH amount (e.g., 0.01)
    coverage_amount_eth DECIMAL(18, 8) NOT NULL, -- ETH amount (e.g., 0.1)
    policy_terms JSONB NOT NULL,
    oracle_conditions JSONB NOT NULL,
    required_credentials TEXT[] DEFAULT '{}', -- Required travel credentials
    policy_status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (policy_status IN ('active', 'expired', 'claimed', 'cancelled')),
    nft_token_id BIGINT,
    contract_address TEXT,
    transaction_hash TEXT,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Travel Claims table (updated for travel focus)
CREATE TABLE IF NOT EXISTS travel_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_id UUID NOT NULL REFERENCES travel_policies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    claim_amount_eth DECIMAL(18, 8) NOT NULL, -- ETH amount
    claim_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (claim_status IN ('pending', 'investigating', 'approved', 'paid', 'rejected')),
    claim_type VARCHAR(50) NOT NULL,
    oracle_data JSONB DEFAULT '{}',
    evidence_data JSONB DEFAULT '{}',
    transaction_hash TEXT,
    payout_date TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Credential Presentations table for tracking when credentials are shared
CREATE TABLE IF NOT EXISTS credential_presentations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    credential_id UUID NOT NULL REFERENCES travel_credentials(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    verifier_did TEXT NOT NULL,
    verifier_name TEXT,
    presentation_data JSONB NOT NULL,
    selective_disclosure JSONB DEFAULT '{}', -- What claims were shared
    verification_result BOOLEAN,
    presentation_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    location TEXT, -- Where the credential was presented
    purpose TEXT, -- Purpose of the presentation
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_travel_credentials_user_id ON travel_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_travel_credentials_type ON travel_credentials(credential_type);
CREATE INDEX IF NOT EXISTS idx_travel_credentials_status ON travel_credentials(verification_status);
CREATE INDEX IF NOT EXISTS idx_travel_credentials_expires ON travel_credentials(expires_at);

CREATE INDEX IF NOT EXISTS idx_verifiable_credentials_user_id ON verifiable_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_verifiable_credentials_status ON verifiable_credentials(status);
CREATE INDEX IF NOT EXISTS idx_verifiable_credentials_issued ON verifiable_credentials(issued_date);

CREATE INDEX IF NOT EXISTS idx_travel_verification_sessions_user_id ON travel_verification_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_travel_verification_sessions_session_id ON travel_verification_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_travel_verification_sessions_status ON travel_verification_sessions(status);

CREATE INDEX IF NOT EXISTS idx_travel_policies_user_id ON travel_policies(user_id);
CREATE INDEX IF NOT EXISTS idx_travel_policies_type ON travel_policies(policy_type);
CREATE INDEX IF NOT EXISTS idx_travel_policies_status ON travel_policies(policy_status);

CREATE INDEX IF NOT EXISTS idx_travel_claims_policy_id ON travel_claims(policy_id);
CREATE INDEX IF NOT EXISTS idx_travel_claims_user_id ON travel_claims(user_id);
CREATE INDEX IF NOT EXISTS idx_travel_claims_status ON travel_claims(claim_status);

CREATE INDEX IF NOT EXISTS idx_credential_presentations_credential_id ON credential_presentations(credential_id);
CREATE INDEX IF NOT EXISTS idx_credential_presentations_user_id ON credential_presentations(user_id);
CREATE INDEX IF NOT EXISTS idx_credential_presentations_date ON credential_presentations(presentation_date);

-- Row Level Security (RLS) policies
ALTER TABLE travel_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE verifiable_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE travel_verification_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE travel_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE travel_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE credential_presentations ENABLE ROW LEVEL SECURITY;

-- RLS policies for travel_credentials
CREATE POLICY "Users can view their own travel credentials" ON travel_credentials
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own travel credentials" ON travel_credentials
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own travel credentials" ON travel_credentials
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS policies for verifiable_credentials
CREATE POLICY "Users can view their own verifiable credentials" ON verifiable_credentials
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own verifiable credentials" ON verifiable_credentials
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own verifiable credentials" ON verifiable_credentials
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS policies for travel_verification_sessions
CREATE POLICY "Users can view their own verification sessions" ON travel_verification_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own verification sessions" ON travel_verification_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own verification sessions" ON travel_verification_sessions
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS policies for travel_policies
CREATE POLICY "Users can view their own travel policies" ON travel_policies
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own travel policies" ON travel_policies
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own travel policies" ON travel_policies
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS policies for travel_claims
CREATE POLICY "Users can view their own travel claims" ON travel_claims
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own travel claims" ON travel_claims
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own travel claims" ON travel_claims
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS policies for credential_presentations
CREATE POLICY "Users can view their own credential presentations" ON credential_presentations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own credential presentations" ON credential_presentations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_travel_credentials_updated_at BEFORE UPDATE ON travel_credentials
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_verifiable_credentials_updated_at BEFORE UPDATE ON verifiable_credentials
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_travel_verification_sessions_updated_at BEFORE UPDATE ON travel_verification_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_travel_policies_updated_at BEFORE UPDATE ON travel_policies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_travel_claims_updated_at BEFORE UPDATE ON travel_claims
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

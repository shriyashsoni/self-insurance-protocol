-- Adding policy management tables for step 4 implementation

-- Policies table to track all insurance policies
CREATE TABLE IF NOT EXISTS policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    policy_type VARCHAR(50) NOT NULL,
    premium DECIMAL(10,2) NOT NULL,
    payout DECIMAL(10,2) NOT NULL,
    duration_days INTEGER NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    active BOOLEAN DEFAULT true,
    token_id BIGINT,
    transaction_hash VARCHAR(66),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Oracle events table to track monitoring conditions
CREATE TABLE IF NOT EXISTS oracle_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_id UUID REFERENCES policies(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    event_data JSONB,
    condition_met BOOLEAN DEFAULT false,
    checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    payout_triggered BOOLEAN DEFAULT false,
    payout_transaction_hash VARCHAR(66),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Policy claims table for tracking payouts
CREATE TABLE IF NOT EXISTS policy_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_id UUID REFERENCES policies(id) ON DELETE CASCADE,
    oracle_event_id UUID REFERENCES oracle_events(id),
    claim_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    transaction_hash VARCHAR(66),
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_policies_user_id ON policies(user_id);
CREATE INDEX IF NOT EXISTS idx_policies_active ON policies(active);
CREATE INDEX IF NOT EXISTS idx_oracle_events_policy_id ON oracle_events(policy_id);
CREATE INDEX IF NOT EXISTS idx_policy_claims_policy_id ON policy_claims(policy_id);

-- Row Level Security
ALTER TABLE policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE oracle_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_claims ENABLE ROW LEVEL SECURITY;

-- Policies RLS policies
CREATE POLICY "Users can view their own policies" ON policies
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own policies" ON policies
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own policies" ON policies
    FOR UPDATE USING (auth.uid() = user_id);

-- Oracle events RLS policies
CREATE POLICY "Users can view oracle events for their policies" ON oracle_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM policies 
            WHERE policies.id = oracle_events.policy_id 
            AND policies.user_id = auth.uid()
        )
    );

-- Policy claims RLS policies
CREATE POLICY "Users can view their own policy claims" ON policy_claims
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM policies 
            WHERE policies.id = policy_claims.policy_id 
            AND policies.user_id = auth.uid()
        )
    );

-- Function to automatically set end_date based on duration
CREATE OR REPLACE FUNCTION set_policy_end_date()
RETURNS TRIGGER AS $$
BEGIN
    NEW.end_date = NEW.start_date + (NEW.duration_days || ' days')::INTERVAL;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically set end_date
CREATE TRIGGER set_policy_end_date_trigger
    BEFORE INSERT OR UPDATE ON policies
    FOR EACH ROW
    EXECUTE FUNCTION set_policy_end_date();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at
CREATE TRIGGER update_policies_updated_at
    BEFORE UPDATE ON policies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

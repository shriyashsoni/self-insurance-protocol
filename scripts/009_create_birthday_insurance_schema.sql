-- Birthday Insurance Protocol Schema
-- This script adds birthday insurance functionality to the existing insurance protocol

-- Add birthday policy type to existing policy types
ALTER TYPE policy_type ADD VALUE IF NOT EXISTS 'birthday';

-- Create birthday_policies table for birthday-specific insurance data
CREATE TABLE IF NOT EXISTS birthday_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_id UUID NOT NULL REFERENCES insurance_policies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    birthday_date DATE NOT NULL,
    age_at_policy INTEGER NOT NULL,
    celebration_location TEXT,
    celebration_type TEXT CHECK (celebration_type IN ('party', 'travel', 'restaurant', 'event', 'other')),
    weather_dependency BOOLEAN DEFAULT FALSE,
    guest_count INTEGER DEFAULT 0,
    venue_type TEXT,
    special_requirements JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create birthday_claims table for birthday-specific claims
CREATE TABLE IF NOT EXISTS birthday_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_id UUID NOT NULL REFERENCES birthday_policies(policy_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    claim_type TEXT CHECK (claim_type IN ('weather_cancellation', 'venue_unavailable', 'illness', 'travel_disruption', 'other')),
    claim_reason TEXT NOT NULL,
    evidence_data JSONB DEFAULT '{}',
    weather_data JSONB,
    venue_confirmation TEXT,
    medical_documentation TEXT,
    claim_amount NUMERIC(18, 8) NOT NULL,
    status TEXT CHECK (status IN ('pending', 'investigating', 'approved', 'rejected', 'paid')) DEFAULT 'pending',
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    payout_transaction_hash TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create birthday_oracle_conditions table for automated claim processing
CREATE TABLE IF NOT EXISTS birthday_oracle_conditions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_id UUID NOT NULL REFERENCES birthday_policies(policy_id) ON DELETE CASCADE,
    condition_type TEXT CHECK (condition_type IN ('weather', 'venue_status', 'travel_disruption', 'health_emergency')),
    oracle_source TEXT NOT NULL, -- 'chainlink_weather', 'travel_api', 'venue_api', etc.
    trigger_conditions JSONB NOT NULL,
    payout_percentage NUMERIC(5, 2) DEFAULT 100.00, -- Percentage of coverage to pay out
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create birthday_celebrations table to track celebration details
CREATE TABLE IF NOT EXISTS birthday_celebrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_id UUID NOT NULL REFERENCES birthday_policies(policy_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    celebration_status TEXT CHECK (celebration_status IN ('planned', 'ongoing', 'completed', 'cancelled', 'postponed')) DEFAULT 'planned',
    actual_date DATE,
    actual_location TEXT,
    actual_guest_count INTEGER,
    weather_conditions JSONB,
    celebration_photos TEXT[], -- Array of photo URLs
    satisfaction_rating INTEGER CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),
    celebration_notes TEXT,
    total_spent NUMERIC(18, 8),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_birthday_policies_user_id ON birthday_policies(user_id);
CREATE INDEX IF NOT EXISTS idx_birthday_policies_birthday_date ON birthday_policies(birthday_date);
CREATE INDEX IF NOT EXISTS idx_birthday_claims_policy_id ON birthday_claims(policy_id);
CREATE INDEX IF NOT EXISTS idx_birthday_claims_status ON birthday_claims(status);
CREATE INDEX IF NOT EXISTS idx_birthday_oracle_conditions_policy_id ON birthday_oracle_conditions(policy_id);
CREATE INDEX IF NOT EXISTS idx_birthday_celebrations_user_id ON birthday_celebrations(user_id);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_birthday_policies_updated_at BEFORE UPDATE ON birthday_policies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_birthday_claims_updated_at BEFORE UPDATE ON birthday_claims FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_birthday_oracle_conditions_updated_at BEFORE UPDATE ON birthday_oracle_conditions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_birthday_celebrations_updated_at BEFORE UPDATE ON birthday_celebrations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample birthday insurance policies for testing
INSERT INTO birthday_policies (
    policy_id, 
    user_id, 
    birthday_date, 
    age_at_policy, 
    celebration_location, 
    celebration_type, 
    weather_dependency, 
    guest_count, 
    venue_type,
    special_requirements
) VALUES 
-- Note: These will need actual policy_id and user_id values from existing data
-- This is just the schema structure
(
    gen_random_uuid(), -- This should be replaced with actual policy_id
    gen_random_uuid(), -- This should be replaced with actual user_id
    '2025-03-15',
    25,
    'Central Park, New York',
    'party',
    true,
    50,
    'outdoor_venue',
    '{"dietary_restrictions": ["vegetarian", "gluten_free"], "accessibility": "wheelchair_accessible", "music_preference": "live_band"}'
),
(
    gen_random_uuid(), -- This should be replaced with actual policy_id
    gen_random_uuid(), -- This should be replaced with actual user_id
    '2025-07-22',
    30,
    'Santorini, Greece',
    'travel',
    true,
    10,
    'resort',
    '{"accommodation": "luxury_villa", "activities": ["yacht_tour", "wine_tasting"], "transportation": "private_transfer"}'
);

-- Add birthday-specific oracle monitoring
INSERT INTO birthday_oracle_conditions (
    policy_id,
    condition_type,
    oracle_source,
    trigger_conditions,
    payout_percentage
) VALUES
(
    gen_random_uuid(), -- This should be replaced with actual policy_id
    'weather',
    'chainlink_weather',
    '{"min_temperature": 15, "max_wind_speed": 20, "precipitation_threshold": 5, "location": "coordinates"}',
    75.0
),
(
    gen_random_uuid(), -- This should be replaced with actual policy_id
    'travel_disruption',
    'travel_api',
    '{"flight_delays": "> 4 hours", "cancellations": true, "airport_closures": true}',
    100.0
);

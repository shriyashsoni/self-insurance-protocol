-- Create verification sessions table
CREATE TABLE IF NOT EXISTS verification_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_address TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    config JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE verification_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sessions" ON verification_sessions
    FOR SELECT USING (auth.uid()::text = user_address);

CREATE POLICY "Service role can manage all sessions" ON verification_sessions
    FOR ALL USING (auth.role() = 'service_role');

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_verification_sessions_user_address ON verification_sessions(user_address);
CREATE INDEX IF NOT EXISTS idx_verification_sessions_status ON verification_sessions(status);

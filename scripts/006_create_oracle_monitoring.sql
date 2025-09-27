-- Add oracle monitoring and payout tracking tables
CREATE TABLE IF NOT EXISTS oracle_monitoring (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  policy_id UUID REFERENCES policies(id) ON DELETE CASCADE,
  monitoring_type TEXT NOT NULL,
  monitoring_params JSONB NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
  last_check_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  policy_id UUID REFERENCES policies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  transaction_hash TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  triggered_by TEXT NOT NULL, -- oracle event that triggered the payout
  triggered_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_oracle_monitoring_policy_id ON oracle_monitoring(policy_id);
CREATE INDEX IF NOT EXISTS idx_oracle_monitoring_status ON oracle_monitoring(status);
CREATE INDEX IF NOT EXISTS idx_payouts_policy_id ON payouts(policy_id);
CREATE INDEX IF NOT EXISTS idx_payouts_user_id ON payouts(user_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON payouts(status);

-- Enable RLS
ALTER TABLE oracle_monitoring ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;

-- RLS policies for oracle_monitoring
CREATE POLICY "Users can view their own oracle monitoring" ON oracle_monitoring
  FOR SELECT USING (
    policy_id IN (
      SELECT id FROM policies WHERE user_id = auth.uid()
    )
  );

-- RLS policies for payouts
CREATE POLICY "Users can view their own payouts" ON payouts
  FOR SELECT USING (user_id = auth.uid());

-- Service role can manage all oracle and payout data
CREATE POLICY "Service role can manage oracle monitoring" ON oracle_monitoring
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can manage payouts" ON payouts
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

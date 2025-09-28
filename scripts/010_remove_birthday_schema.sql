-- Remove Birthday Insurance Schema
-- This script removes all birthday-related tables and constraints from the database

-- Drop triggers first
DROP TRIGGER IF EXISTS update_birthday_policies_updated_at ON birthday_policies;
DROP TRIGGER IF EXISTS update_birthday_claims_updated_at ON birthday_claims;
DROP TRIGGER IF EXISTS update_birthday_oracle_conditions_updated_at ON birthday_oracle_conditions;
DROP TRIGGER IF EXISTS update_birthday_celebrations_updated_at ON birthday_celebrations;

-- Drop indexes
DROP INDEX IF EXISTS idx_birthday_policies_user_id;
DROP INDEX IF EXISTS idx_birthday_policies_birthday_date;
DROP INDEX IF EXISTS idx_birthday_claims_policy_id;
DROP INDEX IF EXISTS idx_birthday_claims_status;
DROP INDEX IF EXISTS idx_birthday_oracle_conditions_policy_id;
DROP INDEX IF EXISTS idx_birthday_celebrations_user_id;

-- Drop tables in correct order (respecting foreign key constraints)
DROP TABLE IF EXISTS birthday_celebrations CASCADE;
DROP TABLE IF EXISTS birthday_oracle_conditions CASCADE;
DROP TABLE IF EXISTS birthday_claims CASCADE;
DROP TABLE IF EXISTS birthday_policies CASCADE;

-- Remove birthday from policy_type enum
-- Note: PostgreSQL doesn't allow removing enum values directly
-- We'll need to recreate the enum without birthday
CREATE TYPE policy_type_new AS ENUM ('travel', 'medical', 'baggage', 'cancellation', 'weather', 'visa');

-- Update existing policies table to use new enum
ALTER TABLE policies ALTER COLUMN policy_type TYPE policy_type_new USING policy_type::text::policy_type_new;

-- Drop old enum and rename new one
DROP TYPE policy_type;
ALTER TYPE policy_type_new RENAME TO policy_type;

-- Clean up any remaining birthday-related data
DELETE FROM policies WHERE policy_type = 'birthday';
DELETE FROM claims WHERE policy_id NOT IN (SELECT id FROM policies);
DELETE FROM oracle_conditions WHERE policy_id NOT IN (SELECT id FROM policies);

COMMIT;

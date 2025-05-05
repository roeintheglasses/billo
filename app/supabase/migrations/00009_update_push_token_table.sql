-- Update user_push_tokens table with additional fields
ALTER TABLE IF EXISTS "public"."user_push_tokens"
  ADD COLUMN IF NOT EXISTS "device_id" TEXT,
  ADD COLUMN IF NOT EXISTS "device_name" TEXT,
  ADD COLUMN IF NOT EXISTS "last_used_at" TIMESTAMPTZ DEFAULT NOW();

-- Update or create indices for faster queries
CREATE INDEX IF NOT EXISTS idx_user_push_tokens_is_active ON user_push_tokens(is_active);

-- Ensure service role access policy exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_push_tokens' 
    AND policyname = 'service_role_push_tokens_all'
  ) THEN
    CREATE POLICY service_role_push_tokens_all ON user_push_tokens 
      FOR ALL TO authenticated USING (auth.jwt() ->> 'role' = 'service_role');
  END IF;
END
$$; 
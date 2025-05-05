-- Create the user_push_tokens table
-- This table stores push notification tokens for each user's devices
CREATE TABLE IF NOT EXISTS "public"."user_push_tokens" (
    "id" uuid DEFAULT uuid_generate_v4() NOT NULL PRIMARY KEY,
    "user_id" uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    "token" text NOT NULL,
    "device_type" text NOT NULL,
    "is_active" boolean NOT NULL DEFAULT true,
    "created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add indexes
CREATE INDEX IF NOT EXISTS "user_push_tokens_user_id_idx" ON "public"."user_push_tokens" ("user_id");
CREATE INDEX IF NOT EXISTS "user_push_tokens_token_idx" ON "public"."user_push_tokens" ("token");
CREATE UNIQUE INDEX IF NOT EXISTS "user_push_tokens_user_id_token_idx" ON "public"."user_push_tokens" ("user_id", "token");

-- Add RLS policies
ALTER TABLE "public"."user_push_tokens" ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to view their own tokens
CREATE POLICY "Users can view their own push tokens" 
ON "public"."user_push_tokens" 
FOR SELECT 
USING (auth.uid() = user_id);

-- Policy to allow users to insert their own tokens
CREATE POLICY "Users can insert their own push tokens" 
ON "public"."user_push_tokens" 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to update their own tokens
CREATE POLICY "Users can update their own push tokens" 
ON "public"."user_push_tokens" 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Policy to allow users to delete their own tokens
CREATE POLICY "Users can delete their own push tokens" 
ON "public"."user_push_tokens" 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add function to update updated_at timestamp
CREATE OR REPLACE FUNCTION "public"."update_user_push_tokens_updated_at"()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to update updated_at timestamp
CREATE TRIGGER "update_user_push_tokens_updated_at"
BEFORE UPDATE ON "public"."user_push_tokens"
FOR EACH ROW
EXECUTE FUNCTION "public"."update_user_push_tokens_updated_at"();

-- Grant privileges to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON "public"."user_push_tokens" TO authenticated; 
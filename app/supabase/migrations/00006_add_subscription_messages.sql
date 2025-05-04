-- Create subscription_messages table to store SMS messages that contain subscription information
CREATE TABLE IF NOT EXISTS public.subscription_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    sender TEXT NOT NULL,
    message_body TEXT NOT NULL,
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    confidence_score DECIMAL(5, 2) DEFAULT 0,
    extracted_data JSONB DEFAULT '{}'::jsonb,
    message_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for subscription_messages table
CREATE INDEX idx_subscription_messages_subscription_id ON public.subscription_messages(subscription_id);
CREATE INDEX idx_subscription_messages_user_id ON public.subscription_messages(user_id);
CREATE INDEX idx_subscription_messages_detected_at ON public.subscription_messages(detected_at);
CREATE INDEX idx_subscription_messages_confidence_score ON public.subscription_messages(confidence_score);
CREATE INDEX idx_subscription_messages_sender ON public.subscription_messages(sender);

-- Update subscriptions table to add source_type field
ALTER TABLE public.subscriptions
ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS auto_detected BOOLEAN DEFAULT FALSE;

-- Create trigger function to update timestamps
CREATE OR REPLACE FUNCTION update_subscription_message_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to subscription_messages table
CREATE TRIGGER set_timestamp_subscription_messages
BEFORE UPDATE ON public.subscription_messages
FOR EACH ROW
EXECUTE FUNCTION update_subscription_message_timestamp();

-- Add Row Level Security (RLS) policies for subscription_messages
ALTER TABLE public.subscription_messages ENABLE ROW LEVEL SECURITY;

-- Users can only view their own subscription messages
CREATE POLICY "Users can view their own subscription messages" 
  ON public.subscription_messages 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Users can only insert their own subscription messages
CREATE POLICY "Users can insert their own subscription messages" 
  ON public.subscription_messages 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own subscription messages
CREATE POLICY "Users can update their own subscription messages" 
  ON public.subscription_messages 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Users can only delete their own subscription messages
CREATE POLICY "Users can delete their own subscription messages" 
  ON public.subscription_messages 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create view for subscription with their related messages
CREATE OR REPLACE VIEW public.subscription_with_messages AS
SELECT 
  s.*,
  COALESCE(json_agg(sm) FILTER (WHERE sm.id IS NOT NULL), '[]'::json) as messages
FROM 
  public.subscriptions s
LEFT JOIN 
  public.subscription_messages sm ON s.id = sm.subscription_id
GROUP BY 
  s.id;

-- Create view for subscription analytics with message counts
CREATE OR REPLACE VIEW public.subscription_analytics AS
SELECT 
  s.user_id,
  COUNT(DISTINCT s.id) as total_subscriptions,
  SUM(s.amount) as total_monthly_cost,
  COUNT(CASE WHEN s.billing_cycle = 'monthly' THEN 1 END) as monthly_subscriptions,
  COUNT(CASE WHEN s.billing_cycle = 'yearly' THEN 1 END) as yearly_subscriptions,
  COUNT(DISTINCT sm.id) as detected_messages_count,
  COUNT(CASE WHEN s.auto_detected = TRUE THEN 1 END) as auto_detected_count,
  MAX(s.created_at) as latest_subscription_date
FROM 
  public.subscriptions s
LEFT JOIN
  public.subscription_messages sm ON s.id = sm.subscription_id
GROUP BY 
  s.user_id; 
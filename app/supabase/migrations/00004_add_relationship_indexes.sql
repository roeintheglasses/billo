-- This migration adds database indexes to optimize cross-model queries

-- Add index for subscription-transaction relationship
CREATE INDEX IF NOT EXISTS idx_transactions_subscription_id 
  ON public.transactions(subscription_id);

-- Add index for subscription-category relationship  
CREATE INDEX IF NOT EXISTS idx_subscriptions_category_id 
  ON public.subscriptions(category_id);

-- Add index for user-subscription relationship
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id 
  ON public.subscriptions(user_id);

-- Add index for transaction date queries
CREATE INDEX IF NOT EXISTS idx_transactions_date 
  ON public.transactions(date);

-- Add composite index for user's transactions by date
CREATE INDEX IF NOT EXISTS idx_transactions_user_date 
  ON public.transactions(user_id, date);

-- Add view for aggregated subscription data with category and transaction counts
CREATE OR REPLACE VIEW public.subscription_with_summary AS
SELECT 
  s.*,
  c.name as category_name,
  c.color as category_color,
  c.icon as category_icon,
  COUNT(t.id) as transaction_count,
  SUM(t.amount) as total_spent,
  MAX(t.date) as last_transaction_date
FROM 
  public.subscriptions s
LEFT JOIN 
  public.categories c ON s.category_id = c.id
LEFT JOIN 
  public.transactions t ON t.subscription_id = s.id
GROUP BY 
  s.id, c.id;

-- Add function to calculate spending by category for a date range
CREATE OR REPLACE FUNCTION public.get_spending_by_category(
  p_user_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE (
  category_id UUID,
  category_name TEXT,
  category_color TEXT,
  total_amount DECIMAL(10,2),
  subscription_count BIGINT,
  transaction_count BIGINT
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY 
  SELECT 
    c.id as category_id,
    c.name as category_name,
    c.color as category_color,
    COALESCE(SUM(t.amount), 0) as total_amount,
    COUNT(DISTINCT s.id) as subscription_count,
    COUNT(t.id) as transaction_count
  FROM 
    public.categories c
  LEFT JOIN 
    public.subscriptions s ON s.category_id = c.id AND s.user_id = p_user_id
  LEFT JOIN 
    public.transactions t ON t.subscription_id = s.id 
      AND t.date >= p_start_date 
      AND t.date <= p_end_date
  GROUP BY 
    c.id, c.name, c.color
  ORDER BY 
    total_amount DESC;
END;
$$; 
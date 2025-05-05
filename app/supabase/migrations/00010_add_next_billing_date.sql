-- Add next_billing_date column to subscriptions table
ALTER TABLE IF EXISTS public.subscriptions 
  ADD COLUMN IF NOT EXISTS next_billing_date DATE;

-- Add source_type and auto_detected columns if they don't exist
-- (since these appear in the type definitions but not in the original migration)
ALTER TABLE IF EXISTS public.subscriptions 
  ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'manual';
  
ALTER TABLE IF EXISTS public.subscriptions 
  ADD COLUMN IF NOT EXISTS auto_detected BOOLEAN DEFAULT false;

-- Update all existing subscriptions to calculate their next_billing_date
-- This will ensure data consistency for existing records
UPDATE public.subscriptions
SET next_billing_date = 
  CASE 
    WHEN billing_cycle = 'weekly' THEN 
      (start_date + (CEIL(EXTRACT(EPOCH FROM AGE(CURRENT_DATE, start_date)) / (7 * 86400))::INTEGER * INTERVAL '7 days'))::DATE
    WHEN billing_cycle = 'monthly' THEN 
      (start_date + 
       (EXTRACT(YEAR FROM AGE(CURRENT_DATE, start_date))::INTEGER * 12 + 
        EXTRACT(MONTH FROM AGE(CURRENT_DATE, start_date))::INTEGER + 1) * INTERVAL '1 month')::DATE
    WHEN billing_cycle = 'quarterly' THEN 
      (start_date + 
       (CEIL(EXTRACT(MONTH FROM AGE(CURRENT_DATE, start_date))::INTEGER / 3) + 1) * INTERVAL '3 months')::DATE
    WHEN billing_cycle = 'biannually' THEN 
      (start_date + 
       (CEIL(EXTRACT(MONTH FROM AGE(CURRENT_DATE, start_date))::INTEGER / 6) + 1) * INTERVAL '6 months')::DATE
    WHEN billing_cycle = 'yearly' THEN 
      (start_date + 
       (EXTRACT(YEAR FROM AGE(CURRENT_DATE, start_date))::INTEGER + 1) * INTERVAL '1 year')::DATE
    ELSE start_date
  END
WHERE next_billing_date IS NULL; 
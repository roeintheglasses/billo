-- Migration file: Create Dark Patterns table
-- This table stores information about various dark patterns used in subscription services

-- Create the dark_patterns table
CREATE TABLE IF NOT EXISTS public.dark_patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  examples JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_dark_patterns_category ON public.dark_patterns(category);
CREATE INDEX idx_dark_patterns_name ON public.dark_patterns(name);

-- Set up RLS policies
ALTER TABLE public.dark_patterns ENABLE ROW LEVEL SECURITY;

-- Allow public read access to dark patterns (they are reference data)
CREATE POLICY "Dark patterns are viewable by everyone" 
  ON public.dark_patterns 
  FOR SELECT USING (true);

-- Only allow admins to modify dark patterns (implementation of this depends on your auth setup)
CREATE POLICY "Only admins can modify dark patterns" 
  ON public.dark_patterns 
  FOR ALL 
  USING (auth.uid() IN (SELECT id FROM public.users WHERE email IN ('admin@example.com')));
  
-- Create trigger function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_dark_pattern_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER dark_pattern_updated_at
BEFORE UPDATE ON public.dark_patterns
FOR EACH ROW
EXECUTE FUNCTION update_dark_pattern_updated_at();

-- Seed the table with initial dark pattern data
INSERT INTO public.dark_patterns (name, description, category, examples) VALUES
  ('Roach Motel', 'A design pattern that makes it easy to sign up but difficult to cancel or unsubscribe from a service', 'Subscription', 
   '[
     {
       "service": "Amazon Prime",
       "description": "Requires multiple steps through several pages to find the cancellation option"
     },
     {
       "service": "Fitness Apps",
       "description": "Requires calling customer service to cancel subscription"
     }
   ]'::jsonb),
   
  ('Forced Continuity', 'Automatically transitioning from a free trial to a paid subscription without adequate notification', 'Subscription', 
   '[
     {
       "service": "Adobe Creative Cloud",
       "description": "Auto-charges after free trial without clear notification"
     },
     {
       "service": "Streaming Services",
       "description": "Convert free trials to paid subscriptions automatically"
     }
   ]'::jsonb),
   
  ('Hidden Costs', 'Concealing additional costs until the end of the checkout process', 'Pricing', 
   '[
     {
       "service": "Ticketing Sites",
       "description": "Add service fees at final checkout step"
     },
     {
       "service": "Subscription Services",
       "description": "Show monthly price but charge annually"
     }
   ]'::jsonb),
   
  ('Misleading Subscription', 'Failing to disclose recurring payments clearly', 'Subscription', 
   '[
     {
       "service": "App Subscriptions",
       "description": "Using vague language about recurring charges"
     },
     {
       "service": "News Sites",
       "description": "Unclear distinction between one-time purchase and recurring subscription"
     }
   ]'::jsonb),
   
  ('Preselection', 'Pre-selecting the most expensive option or optional add-ons', 'Subscription', 
   '[
     {
       "service": "Travel Booking",
       "description": "Auto-selecting travel insurance during checkout"
     },
     {
       "service": "Subscription Services",
       "description": "Pre-selecting annual plan instead of monthly option"
     }
   ]'::jsonb),
   
  ('Tricky Wording', 'Using confusing language or double negatives to mislead users', 'Interface', 
   '[
     {
       "service": "Privacy Settings",
       "description": "Using negative options: \"Uncheck to not receive marketing emails\""
     },
     {
       "service": "Subscription Services",
       "description": "Confusing terms for different subscription tiers"
     }
   ]'::jsonb),
   
  ('Confirm-shaming', 'Using guilt-inducing language to discourage users from declining an option', 'Interface', 
   '[
     {
       "service": "Newsletter Signup",
       "description": "No button labeled \"No thanks, I prefer to remain uninformed\""
     },
     {
       "service": "Subscription Upgrade",
       "description": "Decline option saying \"No, I don\'t want to save money\""
     }
   ]'::jsonb),
   
  ('Interface Interference', 'Using design elements to make important information less visible', 'Interface', 
   '[
     {
       "service": "Subscription Services",
       "description": "Using low-contrast text for price disclosures"
     },
     {
       "service": "Auto-renewal Terms",
       "description": "Placing renewal terms in hard-to-read small print"
     }
   ]'::jsonb),
   
  ('Forced Action', 'Requiring users to complete unrelated tasks to proceed with their goal', 'Interface', 
   '[
     {
       "service": "Free Trials",
       "description": "Requiring credit card details for free content"
     },
     {
       "service": "Mobile Apps",
       "description": "Forcing account creation to access basic features"
     }
   ]'::jsonb),
   
  ('Bait and Switch', 'Advertising one outcome but delivering something else', 'Pricing', 
   '[
     {
       "service": "Introductory Offers",
       "description": "Prominently advertising low intro rate but hiding the higher regular price"
     },
     {
       "service": "Free Service Tiers",
       "description": "Advertising features as free that actually require paid subscription"
     }
   ]'::jsonb); 
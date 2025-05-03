-- Seed data for Dark Patterns table
-- This file contains initial dark pattern examples for the application

-- Insert common dark patterns found in subscription services
INSERT INTO public.dark_patterns (name, description, category, examples)
VALUES 
  (
    'Hidden Costs', 
    'Charges that are not disclosed upfront and only revealed during checkout or later stages.', 
    'Pricing', 
    '[
      {
        "service": "StreamFlix",
        "example": "Advertising a $9.99 plan but adding mandatory $4.99 HD fee at checkout",
        "impact": "Customers pay 50% more than the advertised price"
      },
      {
        "service": "MusicStream",
        "example": "Adding \"platform fees\" and \"service charges\" not mentioned in the main pricing",
        "impact": "Users face unexpected charges on their first bill"
      }
    ]'::jsonb
  ),
  (
    'Forced Continuity', 
    'Converting free trials to paid subscriptions without explicit consent or notification.', 
    'Billing', 
    '[
      {
        "service": "NewsDaily",
        "example": "Free trial automatically converts to paid subscription without reminder notifications",
        "impact": "Users get charged unexpectedly when they forget to cancel"
      },
      {
        "service": "FitTracker Pro",
        "example": "Requiring credit card for free trial and automatic conversion with no notification",
        "impact": "Users find unexpected charges on credit card statements"
      }
    ]'::jsonb
  ),
  (
    'Roach Motel', 
    'Making it easy to sign up but difficult to cancel.', 
    'Account Management', 
    '[
      {
        "service": "GymMembership",
        "example": "Online signup but requiring in-person visit or certified mail to cancel",
        "impact": "Users remain subscribed longer due to cancellation friction"
      },
      {
        "service": "PremiumNews",
        "example": "Easy one-click signup but requiring phone call during limited hours to cancel",
        "impact": "Increased customer retention through artificial barriers"
      }
    ]'::jsonb
  ),
  (
    'Misdirection', 
    'Using visual design or language to direct attention away from important information.', 
    'User Interface', 
    '[
      {
        "service": "CloudStorage",
        "example": "Highlighting \"Try Premium\" button while making \"Continue with Free\" link small and grey",
        "impact": "Users accidentally upgrade when they intended to use free version"
      },
      {
        "service": "VideoStreaming",
        "example": "Pricing comparison that visually emphasizes premium plan while minimizing standard options",
        "impact": "Users choose more expensive plans than needed"
      }
    ]'::jsonb
  ),
  (
    'Price Comparison Prevention', 
    'Making it difficult to compare prices across different subscription tiers or periods.', 
    'Pricing', 
    '[
      {
        "service": "MealDelivery",
        "example": "Showing monthly price for basic plan but annual price for premium to make premium seem cheaper",
        "impact": "Users unable to accurately compare true costs"
      },
      {
        "service": "SoftwareSubscription",
        "example": "Offering different services in each tier to prevent direct comparison",
        "impact": "Customers cannot evaluate value proposition clearly"
      }
    ]'::jsonb
  ),
  (
    'Confirmshaming', 
    'Using guilt or shame to manipulate users into opting into something.', 
    'Marketing', 
    '[
      {
        "service": "NewsletterService",
        "example": "Decline button saying \"No thanks, I don\'t want to save money\"",
        "impact": "Psychological pressure to subscribe against true preferences"
      },
      {
        "service": "MembershipClub",
        "example": "Cancel button labeled \"I don\'t care about my health\"",
        "impact": "Emotional manipulation to continue subscription"
      }
    ]'::jsonb
  ),
  (
    'Disguised Ads', 
    'Advertisements designed to look like content or navigation.', 
    'Marketing', 
    '[
      {
        "service": "FreemiumApp",
        "example": "Showing \"upgrade\" options styled to look like regular features",
        "impact": "Users click on ads thinking they\'re accessing core functionality"
      },
      {
        "service": "ContentPlatform",
        "example": "Promoted subscriptions appearing identical to recommended content",
        "impact": "Users engage with ads believing they are organic recommendations"
      }
    ]'::jsonb
  ),
  (
    'Bait and Switch', 
    'Advertising one deal but substituting it with something else during the purchase process.', 
    'Marketing', 
    '[
      {
        "service": "InternetProvider",
        "example": "Advertising $39.99/month but revealing during signup that price requires bundling additional services",
        "impact": "Users end up paying more than expected for unwanted services"
      },
      {
        "service": "SecuritySoftware",
        "example": "Advertising full protection but revealing core features require premium tier",
        "impact": "Users receive less functionality than expected"
      }
    ]'::jsonb
  ),
  (
    'Trick Questions', 
    'Using confusing language or double negatives in consent forms or settings.', 
    'User Interface', 
    '[
      {
        "service": "EmailService",
        "example": "Checkbox labeled \"Please don\'t uncheck this box if you don\'t not want to receive offers\"",
        "impact": "Users unknowingly opt into marketing communications"
      },
      {
        "service": "SocialApp",
        "example": "Toggle labeled \"Turn off notifications\" that actually enables them when toggled",
        "impact": "Settings have opposite effect of what users intend"
      }
    ]'::jsonb
  ),
  (
    'Nagging', 
    'Persistent, repeated requests for the same action the user rejected.', 
    'User Experience', 
    '[
      {
        "service": "MobileApp",
        "example": "Showing premium upgrade popup after every third action despite previous declines",
        "impact": "Users feel harassed and may upgrade just to stop interruptions"
      },
      {
        "service": "WebBrowser",
        "example": "Repeated prompts to enable notifications despite user rejection",
        "impact": "Disrupted user experience and decision fatigue"
      }
    ]'::jsonb
  );

-- Add additional dark patterns related to cancellation
INSERT INTO public.dark_patterns (name, description, category, examples)
VALUES 
  (
    'Sneaky Auto-Renewals', 
    'Automatically renewing subscriptions with minimal notice or transparency.', 
    'Billing', 
    '[
      {
        "service": "AntimalwarePlus",
        "example": "Annual subscription that auto-renews at higher rate with only a small-print disclosure",
        "impact": "Users face unexpected charges at renewal time"
      },
      {
        "service": "EducationPlatform",
        "example": "Course subscription silently auto-renews with notification sent to unmonitored account area",
        "impact": "Students continue paying after completing coursework"
      }
    ]'::jsonb
  ),
  (
    'False Urgency', 
    'Creating artificial time pressure to force quick decisions.', 
    'Marketing', 
    '[
      {
        "service": "OnlineCourses",
        "example": "Countdown timer showing \"Offer expires in 2 hours\" that resets when page reloads",
        "impact": "Users make hurried decisions without proper research"
      },
      {
        "service": "StreamingService",
        "example": "\"Limited time offer\" that has been running unchanged for months",
        "impact": "False impression of scarcity drives impulsive sign-ups"
      }
    ]'::jsonb
  ),
  (
    'Obfuscated Cancellation', 
    'Hiding cancellation options or making the process unnecessarily complex.', 
    'Account Management', 
    '[
      {
        "service": "FitnessApp",
        "example": "Hiding cancellation option deep in account settings under \"membership preferences\"",
        "impact": "Users cannot find how to cancel and continue being charged"
      },
      {
        "service": "MediaSubscription",
        "example": "Requiring users to chat with retention specialists to cancel instead of providing direct option",
        "impact": "Many users abandon cancellation due to time constraints"
      }
    ]'::jsonb
  ),
  (
    'Forced Account Creation', 
    'Requiring unnecessary account creation before showing pricing or features.', 
    'User Experience', 
    '[
      {
        "service": "ProductivityTools",
        "example": "Hiding pricing details until after account creation with email verification",
        "impact": "Users commit time before knowing if price meets their budget"
      },
      {
        "service": "CookingRecipes",
        "example": "Forcing account creation to view full recipe details after showing partial information",
        "impact": "Users create unwanted accounts to access basic information"
      }
    ]'::jsonb
  ),
  (
    'Interface Interference', 
    'Modifying the user interface to emphasize certain choices over others.', 
    'User Interface', 
    '[
      {
        "service": "PremiumService",
        "example": "Making \"Premium\" button large and colorful while \"Basic\" option is small and grey",
        "impact": "Visual hierarchy manipulates users toward more expensive options"
      },
      {
        "service": "SoftwareDownload",
        "example": "Showing decline button for add-ons as a text link while accept is a prominent button",
        "impact": "Users unknowingly accept additional paid features"
      }
    ]'::jsonb
  ); 
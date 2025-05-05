-- Migration to extend the notifications table with scheduling and relationship fields
ALTER TABLE public.notifications 
  ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS related_entity_id UUID,
  ADD COLUMN IF NOT EXISTS related_entity_type VARCHAR(50),
  ADD COLUMN IF NOT EXISTS deep_link_url VARCHAR(255),
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending' NOT NULL;

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_notifications_related_entity ON public.notifications(related_entity_id, related_entity_type);
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled_for ON public.notifications(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON public.notifications(status);

-- Update RLS policies to ensure proper access control
ALTER POLICY "Users can view their own notifications" 
  ON public.notifications 
  USING (auth.uid() = user_id);

-- Update the notification trigger function to include the new fields
CREATE OR REPLACE FUNCTION notify_notification_change()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify(
    'notification_update',
    json_build_object(
      'user_id', NEW.user_id,
      'operation', TG_OP,
      'record', row_to_json(NEW),
      'scheduled_for', NEW.scheduled_for,
      'status', NEW.status
    )::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE public.notifications IS 'User notifications with scheduling and deep linking capabilities';
COMMENT ON COLUMN public.notifications.scheduled_for IS 'When the notification should be delivered to the user';
COMMENT ON COLUMN public.notifications.related_entity_id IS 'ID of the related entity (subscription, payment, etc.)';
COMMENT ON COLUMN public.notifications.related_entity_type IS 'Type of the related entity';
COMMENT ON COLUMN public.notifications.deep_link_url IS 'URL for deep linking into the app';
COMMENT ON COLUMN public.notifications.status IS 'Status of the notification (pending, sent, failed, etc.)'; 
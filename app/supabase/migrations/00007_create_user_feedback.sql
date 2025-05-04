-- Create user_feedback table
CREATE TABLE IF NOT EXISTS public.user_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
    message_id UUID REFERENCES public.subscription_messages(id) ON DELETE SET NULL,
    feedback_type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    accuracy_rating SMALLINT,
    source_screen VARCHAR(50) NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Add comment
COMMENT ON TABLE public.user_feedback IS 'User feedback on subscription detection and app features';

-- Add RLS policies
ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own feedback
CREATE POLICY "Users can view their own feedback"
    ON public.user_feedback
    FOR SELECT
    USING (auth.uid() = user_id);

-- Allow users to insert their own feedback
CREATE POLICY "Users can insert their own feedback"
    ON public.user_feedback
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own feedback
CREATE POLICY "Users can update their own feedback"
    ON public.user_feedback
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Allow users to delete their own feedback
CREATE POLICY "Users can delete their own feedback"
    ON public.user_feedback
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_user_feedback_user_id ON public.user_feedback(user_id);
CREATE INDEX idx_user_feedback_subscription_id ON public.user_feedback(subscription_id);
CREATE INDEX idx_user_feedback_message_id ON public.user_feedback(message_id);
CREATE INDEX idx_user_feedback_feedback_type ON public.user_feedback(feedback_type);

-- Add created_at and updated_at triggers
CREATE TRIGGER set_user_feedback_updated_at
    BEFORE UPDATE ON public.user_feedback
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at(); 
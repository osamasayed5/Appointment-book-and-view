-- Create the table to store OneSignal Player IDs
CREATE TABLE public.push_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  onesignal_user_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, onesignal_user_id) -- Prevent duplicate tokens for the same user
);

-- Add comments for clarity
COMMENT ON TABLE public.push_tokens IS 'Stores OneSignal Player IDs for push notifications.';
COMMENT ON COLUMN public.push_tokens.user_id IS 'Links the token to a specific application user.';
COMMENT ON COLUMN public.push_tokens.onesignal_user_id IS 'The OneSignal Player ID for a specific device.';

-- Enable Row Level Security (RLS) for security
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

-- Create policies to ensure users can only manage their own tokens
CREATE POLICY "Users can manage their own push tokens"
ON public.push_tokens FOR ALL
TO authenticated USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
-- Create a table to store push notification subscriptions
CREATE TABLE public.push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, subscription)
);

-- Enable Row Level Security (REQUIRED)
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies to ensure users can only manage their own subscriptions
CREATE POLICY "Users can view their own subscriptions" ON public.push_subscriptions
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscriptions" ON public.push_subscriptions
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own subscriptions" ON public.push_subscriptions
FOR DELETE TO authenticated USING (auth.uid() = user_id);
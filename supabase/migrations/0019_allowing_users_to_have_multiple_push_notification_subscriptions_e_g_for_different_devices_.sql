-- Drop the unique constraint on user_id in the push_subscriptions table
-- This allows a single user to have multiple subscriptions (e.g., on different devices)
ALTER TABLE public.push_subscriptions
DROP CONSTRAINT IF EXISTS unique_user_subscription;
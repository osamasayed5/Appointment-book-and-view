-- Step 1: Remove the trigger from the user_notifications table.
-- This stops the database from trying to call the function we're about to delete.
DROP TRIGGER IF EXISTS on_user_notification_insert ON public.user_notifications;

-- Step 2: Remove the database function that was responsible for calling the Edge Function.
DROP FUNCTION IF EXISTS public.trigger_send_push_notification();

-- Step 3: Remove the table that stored the push notification subscriptions.
-- The CASCADE keyword ensures that any associated security policies are also removed.
DROP TABLE IF EXISTS public.push_subscriptions CASCADE;
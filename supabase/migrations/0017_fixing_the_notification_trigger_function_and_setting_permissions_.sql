-- Step 1: Update the trigger function to use the correct JSONB data types for headers and body.
CREATE OR REPLACE FUNCTION public.trigger_send_push_notification()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  PERFORM net.http_post(
    url:='https://cjjxvexqtuksylbjqezo.supabase.co/functions/v1/send-push-notification',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqanh2ZXhxdHVrc3lsYmpxZXpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2MjEwNzQsImV4cCI6MjA3MDE5NzA3NH0._zv2y7Y2LjiL8Ljjs2jYQ9TL8i3g8kP7taXLbe10WZI"}'::jsonb,
    body:=json_build_object('record', NEW)::jsonb
  );
  RETURN NEW;
END;
$function$;

-- Step 2: Grant permission to the 'authenticated' role to use the http_post function.
-- This ensures that logged-in users can trigger notifications.
GRANT EXECUTE ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) TO authenticated;
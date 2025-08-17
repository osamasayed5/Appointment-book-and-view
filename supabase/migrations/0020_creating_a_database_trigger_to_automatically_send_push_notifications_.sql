-- Create a function that will be called by the trigger
CREATE OR REPLACE FUNCTION public.trigger_send_push_notification()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  -- Perform an HTTP POST request to the send-push-notification Edge Function
  PERFORM net.http_post(
    -- The URL of the Edge Function
    url:='https://cjjxvexqtuksylbjqezo.supabase.co/functions/v1/send-push-notification',
    -- Headers, including Content-Type and the Supabase anon key for authorization
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqanh2ZXhxdHVrc3lsYmpxZXpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2MjEwNzQsImV4cCI6MjA3MDE5NzA3NH0._zv2y7Y2LjiL8Ljjs2jYQ9TL8i3g8kP7taXLbe10WZI"}'::jsonb,
    -- The body of the request, containing the new row data
    body:=json_build_object('record', NEW)::jsonb
  );
  RETURN NEW;
END;
$function$
;

-- Create a trigger that fires after a new row is inserted into user_notifications
DROP TRIGGER IF EXISTS on_user_notification_insert ON public.user_notifications;
CREATE TRIGGER on_user_notification_insert
  AFTER INSERT ON public.user_notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_send_push_notification();
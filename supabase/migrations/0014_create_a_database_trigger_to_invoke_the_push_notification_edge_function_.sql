-- Create a function to be called by the trigger
CREATE OR REPLACE FUNCTION trigger_send_push_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM net.http_post(
    url:='https://cjjxvexqtuksylbjqezo.supabase.co/functions/v1/send-push-notification',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqanh2ZXhxdHVrc3lsYmpxZXpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2MjEwNzQsImV4cCI6MjA3MDE5NzA3NH0._zv2y7Y2LjiL8Ljjs2jYQ9TL8i3g8kP7taXLbe10WZI"}',
    body:=json_build_object('record', NEW)::text
  );
  RETURN NEW;
END;
$$;

-- Create the trigger that fires after a new notification is linked to a user
DROP TRIGGER IF EXISTS on_user_notification_insert ON public.user_notifications;
CREATE TRIGGER on_user_notification_insert
  AFTER INSERT ON public.user_notifications
  FOR EACH ROW
  EXECUTE FUNCTION trigger_send_push_notification();
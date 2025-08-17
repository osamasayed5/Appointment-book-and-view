CREATE OR REPLACE FUNCTION public.trigger_send_push_notification()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, extensions
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
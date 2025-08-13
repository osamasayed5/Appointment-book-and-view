-- Create notifications table for admin announcements
CREATE TABLE public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policies for notifications table
CREATE POLICY "Allow authenticated users to read all notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow admins to create notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (true); -- Any authenticated user can act as an admin

-- Create user_notifications join table to track read status
CREATE TABLE public.user_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  notification_id UUID NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(notification_id, user_id)
);

-- Enable RLS for security
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

-- Policies for user_notifications table
CREATE POLICY "Users can manage their own notification statuses"
ON public.user_notifications
FOR ALL
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can create notification statuses for users"
ON public.user_notifications
FOR INSERT
TO authenticated
WITH CHECK (true);
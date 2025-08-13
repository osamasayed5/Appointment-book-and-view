-- Create activity_logs table
CREATE TABLE public.activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add a comment for clarity
COMMENT ON TABLE public.activity_logs IS 'Records user actions for auditing and activity reports.';

-- Enable RLS (REQUIRED for security)
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Admins (any authenticated user in this app's case) can read all logs.
CREATE POLICY "Allow authenticated users to read all activity logs"
ON public.activity_logs
FOR SELECT
TO authenticated
USING (true);

-- Users can insert logs for their own actions.
CREATE POLICY "Allow users to insert their own activity logs"
ON public.activity_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
-- Step 1: Add a 'role' column to the profiles table, defaulting new users to 'user'
ALTER TABLE public.profiles ADD COLUMN role TEXT DEFAULT 'user';

-- Step 2: Create a secure helper function to check a user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- This runs with the permissions of the function owner, ensuring it can read the role
  SELECT role INTO user_role FROM public.profiles WHERE id = auth.uid();
  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Remove old, insecure policies from the 'appointments' table
DROP POLICY "Allow authenticated users to view all appointments" ON public.appointments;
DROP POLICY "Allow authenticated users to insert appointments" ON public.appointments;
DROP POLICY "Allow authenticated users to update appointments" ON public.appointments;
DROP POLICY "Allow authenticated users to delete appointments" ON public.appointments;

-- Add new, role-based policies for 'appointments'
CREATE POLICY "Allow admins to manage appointments" ON public.appointments
FOR ALL TO authenticated
USING (get_user_role() = 'admin')
WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "Allow all users to read appointments" ON public.appointments
FOR SELECT TO authenticated
USING (true);

-- Step 4: Update policies for 'services'
DROP POLICY "Allow authenticated users to view all services" ON public.services;
DROP POLICY "Allow authenticated users to insert services" ON public.services;
DROP POLICY "Allow authenticated users to update services" ON public.services;
DROP POLICY "Allow authenticated users to delete services" ON public.services;

CREATE POLICY "Allow admins to manage services" ON public.services
FOR ALL TO authenticated
USING (get_user_role() = 'admin')
WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "Allow all users to read services" ON public.services
FOR SELECT TO authenticated
USING (true);

-- Step 5: Update policies for 'custom_fields'
DROP POLICY "Allow authenticated users to view custom fields" ON public.custom_fields;
DROP POLICY "Allow authenticated users to manage custom fields" ON public.custom_fields;

CREATE POLICY "Allow admins to manage custom_fields" ON public.custom_fields
FOR ALL TO authenticated
USING (get_user_role() = 'admin')
WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "Allow all users to read custom_fields" ON public.custom_fields
FOR SELECT TO authenticated
USING (true);

-- Step 6: Strengthen the 'activity_logs' INSERT policy
DROP POLICY IF EXISTS "Allow users to insert their own activity logs" ON public.activity_logs;

CREATE POLICY "Users can insert their own activity logs" ON public.activity_logs
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Step 7: Update policies for 'notifications'
DROP POLICY "Allow admins to create notifications" ON public.notifications;
DROP POLICY "Allow admins to delete notifications" ON public.notifications;

CREATE POLICY "Allow admins to manage notifications" ON public.notifications
FOR ALL TO authenticated
USING (get_user_role() = 'admin')
WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "Allow all users to read notifications" ON public.notifications
FOR SELECT TO authenticated
USING (true);

-- Step 8: Update policies for 'appointment_form_config'
DROP POLICY "Allow all authenticated users to read config" ON public.appointment_form_config;
DROP POLICY "Allow all authenticated users to update config" ON public.appointment_form_config;

CREATE POLICY "Allow admins to update config" ON public.appointment_form_config
FOR UPDATE TO authenticated
USING (get_user_role() = 'admin')
WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "Allow all users to read config" ON public.appointment_form_config
FOR SELECT TO authenticated
USING (true);
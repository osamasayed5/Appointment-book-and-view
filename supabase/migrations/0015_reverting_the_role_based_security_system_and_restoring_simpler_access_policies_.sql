-- Step 1: Drop the restrictive, role-based policies from all affected tables.
DROP POLICY IF EXISTS "Allow admins to update config" ON public.appointment_form_config;
DROP POLICY IF EXISTS "Allow admins to manage appointments" ON public.appointments;
DROP POLICY IF EXISTS "Allow admins to manage services" ON public.services;
DROP POLICY IF EXISTS "Allow admins to manage custom_fields" ON public.custom_fields;
DROP POLICY IF EXISTS "Allow admins to manage notifications" ON public.notifications;

-- Step 2: Create new, simpler policies granting full access to any authenticated user.
CREATE POLICY "Allow authenticated users to manage appointments"
ON public.appointments FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to manage services"
ON public.services FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to manage custom_fields"
ON public.custom_fields FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to manage notifications"
ON public.notifications FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update config"
ON public.appointment_form_config FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Step 3: Drop the get_user_role() function as it's no longer needed.
DROP FUNCTION IF EXISTS public.get_user_role();

-- Step 4: Drop the 'role' column from the profiles table.
ALTER TABLE public.profiles DROP COLUMN IF EXISTS role;
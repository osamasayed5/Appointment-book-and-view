-- Drop existing restrictive policies for appointments
DROP POLICY IF EXISTS "Users can only insert their own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can only update their own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can only delete their own appointments" ON public.appointments;

-- Create new permissive policies for appointments for any authenticated user
CREATE POLICY "Allow authenticated users to insert appointments" ON public.appointments
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update appointments" ON public.appointments
FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to delete appointments" ON public.appointments
FOR DELETE TO authenticated USING (true);

-- Drop existing restrictive policies for services
DROP POLICY IF EXISTS "Users can only insert their own services" ON public.services;
DROP POLICY IF EXISTS "Users can only update their own services" ON public.services;
DROP POLICY IF EXISTS "Users can only delete their own services" ON public.services;

-- Create new permissive policies for services for any authenticated user
CREATE POLICY "Allow authenticated users to insert services" ON public.services
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update services" ON public.services
FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to delete services" ON public.services
FOR DELETE TO authenticated USING (true);
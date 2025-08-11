-- Drop the existing policy that restricts select to owner
DROP POLICY IF EXISTS "Users can only see their own appointments" ON public.appointments;

-- Create a new policy to allow all authenticated users to select all appointments
CREATE POLICY "Allow authenticated users to view all appointments" ON public.appointments
FOR SELECT TO authenticated USING (true);
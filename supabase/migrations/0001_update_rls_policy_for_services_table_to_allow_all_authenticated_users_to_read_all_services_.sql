-- Drop the existing policy that restricts select to owner
DROP POLICY IF EXISTS "Users can only see their own services" ON public.services;

-- Create a new policy to allow all authenticated users to select all services
CREATE POLICY "Allow authenticated users to view all services" ON public.services
FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow admins to delete notifications"
ON public.notifications
FOR DELETE
TO authenticated
USING (true);
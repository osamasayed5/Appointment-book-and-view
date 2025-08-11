-- Create the table to define custom fields for the appointment form
CREATE TABLE public.custom_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('text', 'number', 'date', 'boolean')),
  is_required BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add a JSONB column to the appointments table to store custom field data
ALTER TABLE public.appointments ADD COLUMN custom_data JSONB;

-- Enable Row Level Security on the new table
ALTER TABLE public.custom_fields ENABLE ROW LEVEL SECURITY;

-- Create policies to allow any authenticated user to manage and view custom fields
CREATE POLICY "Allow authenticated users to view custom fields" ON public.custom_fields
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to manage custom fields" ON public.custom_fields
FOR ALL TO authenticated USING (true) WITH CHECK (true);
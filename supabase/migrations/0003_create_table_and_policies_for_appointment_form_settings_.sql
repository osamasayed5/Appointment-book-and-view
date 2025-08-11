-- Create the table to store appointment form configuration
CREATE TABLE public.appointment_form_config (
  id INT PRIMARY KEY DEFAULT 1,
  show_phone BOOLEAN NOT NULL DEFAULT true,
  require_phone BOOLEAN NOT NULL DEFAULT false,
  show_email BOOLEAN NOT NULL DEFAULT true,
  require_email BOOLEAN NOT NULL DEFAULT false,
  show_notes BOOLEAN NOT NULL DEFAULT true,
  require_notes BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT single_row_check CHECK (id = 1)
);

-- Enable Row Level Security
ALTER TABLE public.appointment_form_config ENABLE ROW LEVEL SECURITY;

-- Policies for appointment_form_config
CREATE POLICY "Allow all authenticated users to read config" ON public.appointment_form_config
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow all authenticated users to update config" ON public.appointment_form_config
FOR UPDATE TO authenticated USING (true);

-- Insert the single default configuration row
INSERT INTO public.appointment_form_config (id) VALUES (1);
ALTER TABLE public.appointment_form_config
ADD COLUMN show_client_name BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN require_client_name BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN show_service BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN require_service BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN show_date BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN require_date BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN show_time BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN require_time BOOLEAN NOT NULL DEFAULT true;

UPDATE public.appointment_form_config 
SET 
  show_client_name = true,
  require_client_name = true,
  show_service = true,
  require_service = true,
  show_date = true,
  require_date = true,
  show_time = true,
  require_time = true
WHERE id = 1;
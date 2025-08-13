ALTER TABLE public.appointment_form_config
ADD COLUMN show_duration BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN require_duration BOOLEAN NOT NULL DEFAULT true;

UPDATE public.appointment_form_config SET show_duration = true, require_duration = true WHERE id = 1;
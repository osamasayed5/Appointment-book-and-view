import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useSession } from '@/components/SessionContextProvider';
import { logActivity } from '@/utils/activityLogger';
import { FormConfig } from '@/types';

const initialFormConfig: FormConfig = {
  show_phone: true,
  require_phone: false,
  show_email: true,
  require_email: false,
  show_notes: true,
  require_notes: false,
  show_duration: true,
  require_duration: true,
  show_client_name: true,
  require_client_name: true,
  show_service: true,
  require_service: true,
  show_date: true,
  require_date: true,
  show_time: true,
  require_time: true,
};

export const useFormConfig = () => {
  const { session } = useSession();
  const [formConfig, setFormConfig] = useState<FormConfig>(initialFormConfig);

  const fetchFormConfig = useCallback(async () => {
    if (!session) return;
    const { data, error } = await supabase
      .from('appointment_form_config')
      .select('*')
      .limit(1)
      .single();

    if (error) {
      console.error("Error fetching form config:", error);
    } else if (data) {
      setFormConfig(data);
    }
  }, [session]);

  useEffect(() => {
    if (session) {
      fetchFormConfig();
    }
  }, [session, fetchFormConfig]);

  const updateFormConfig = async (newConfig: Partial<FormConfig>) => {
    const { error } = await supabase
      .from('appointment_form_config')
      .update(newConfig)
      .eq('id', 1);

    if (error) {
      toast.error("Failed to save form settings.");
    } else {
      setFormConfig(prev => ({ ...prev, ...newConfig }));
      toast.success("Form settings saved!");
      await logActivity('Updated form settings', newConfig);
    }
  };

  return { formConfig, updateFormConfig, fetchFormConfig };
};
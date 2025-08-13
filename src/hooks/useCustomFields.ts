import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useSession } from '@/components/SessionContextProvider';
import { CustomField } from '@/types';

export const useCustomFields = () => {
  const { session } = useSession();
  const [customFields, setCustomFields] = useState<CustomField[]>([]);

  const fetchCustomFields = useCallback(async () => {
    if (!session) return;
    const { data, error } = await supabase.from('custom_fields').select('*').order('created_at');
    if (error) {
      toast.error("Failed to load custom fields.");
    } else {
      setCustomFields(data as CustomField[]);
    }
  }, [session]);

  useEffect(() => {
    if (session) {
      fetchCustomFields();
    }
  }, [session, fetchCustomFields]);

  return { customFields, fetchCustomFields };
};
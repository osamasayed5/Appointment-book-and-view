import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useSession } from '@/components/SessionContextProvider';
import { logActivity } from '@/utils/activityLogger';
import { Service } from '@/types';

export const useServices = () => {
  const { session } = useSession();
  const [services, setServices] = useState<Service[]>([]);

  const fetchServices = useCallback(async () => {
    if (!session) return;
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error("Error fetching services:", error);
      toast.error("Failed to fetch services.");
    } else {
      setServices(data as Service[]);
    }
  }, [session]);

  useEffect(() => {
    if (session) {
      fetchServices();
    }
  }, [session, fetchServices]);

  const updateServices = async (newServices: string[]) => {
    if (!session) return;

    const existingServiceNames = services.map(s => s.name);
    const servicesToAdd = newServices.filter(name => !existingServiceNames.includes(name));
    const servicesToDelete = existingServiceNames.filter(name => !newServices.includes(name));

    if (servicesToAdd.length > 0) {
      const { error: insertError } = await supabase
        .from('services')
        .insert(servicesToAdd.map(name => ({ user_id: session.user.id, name })));
      if (insertError) {
        console.error("Error adding services:", insertError);
        toast.error("Failed to add new services.");
      } else {
        await logActivity('Added services', { services: servicesToAdd });
      }
    }

    if (servicesToDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from('services')
        .delete()
        .in('name', servicesToDelete);
      if (deleteError) {
        console.error("Error deleting services:", deleteError);
        toast.error("Failed to delete services.");
      } else {
        await logActivity('Deleted services', { services: servicesToDelete });
      }
    }
    
    fetchServices();
  };

  return { services, updateServices, fetchServices };
};
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useSession } from '@/components/SessionContextProvider';
import { logActivity } from '@/utils/activityLogger';
import { sendSystemNotification } from '@/utils/notificationSender';
import { Appointment } from '@/types';

export const useAppointments = () => {
  const { session } = useSession();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAppointments = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .order('date', { ascending: true })
      .order('time', { ascending: true });

    if (error) {
      console.error("Error fetching appointments:", error);
      toast.error("Failed to fetch appointments.");
    } else {
      setAppointments(data as Appointment[]);
    }
    setLoading(false);
  }, [session]);

  useEffect(() => {
    if (session) {
      fetchAppointments();
    }
  }, [session, fetchAppointments]);

  useEffect(() => {
    if (!session) return;

    const channel = supabase
      .channel('public:appointments')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'appointments' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newAppointment = payload.new as Appointment;
            toast.success(`A new appointment for ${newAppointment.client_name} has been scheduled.`);
          } else if (payload.eventType === 'UPDATE') {
            const oldAppointment = payload.old as Appointment;
            const newAppointment = payload.new as Appointment;
            if (oldAppointment.status !== newAppointment.status) {
              toast.info(`Appointment for ${newAppointment.client_name} is now ${newAppointment.status}.`);
            }
          }
          fetchAppointments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session, fetchAppointments]);

  const createAppointment = async (data: any) => {
    if (!session) return;
    const { error } = await supabase
      .from('appointments')
      .insert({
        user_id: session.user.id,
        client_name: data.clientName,
        service: data.service,
        date: data.date,
        time: data.time,
        status: "pending",
        duration: data.duration,
        phone: data.phone || null,
        email: data.email || null,
        notes: data.notes || null,
        custom_data: data.customData || null,
      });

    if (error) {
      console.error("Error creating appointment:", error);
      toast.error("Failed to create appointment.");
    } else {
      await logActivity(`Created appointment for ${data.clientName}`);
      await sendSystemNotification(
        'New Appointment Scheduled',
        `An appointment for ${data.clientName} on ${data.date} has been added.`
      );
      fetchAppointments(); // Manually refresh the list
    }
  };

  const updateAppointment = async (id: string, data: any, originalStatus: string) => {
    if (!session) return;
    const statusChanged = originalStatus !== data.status;
    const { error } = await supabase
      .from('appointments')
      .update({
        client_name: data.clientName,
        service: data.service,
        date: data.date,
        time: data.time,
        duration: data.duration,
        phone: data.phone || null,
        email: data.email || null,
        notes: data.notes || null,
        status: data.status,
        custom_data: data.customData || null,
      })
      .eq('id', id);

    if (error) {
      console.error("Error updating appointment:", error);
      toast.error("Failed to update appointment.");
    } else {
      toast.success("Appointment updated successfully!");
      await logActivity(`Updated appointment for ${data.clientName}`, { status: data.status });
      if (statusChanged) {
        let notificationTitle = '';
        let notificationMessage = '';
        switch (data.status) {
          case 'confirmed':
            notificationTitle = 'Appointment Confirmed';
            notificationMessage = `The appointment for ${data.clientName} on ${data.date} has been confirmed.`;
            break;
          case 'cancelled':
            notificationTitle = 'Appointment Cancelled';
            notificationMessage = `The appointment for ${data.clientName} on ${data.date} has been cancelled.`;
            break;
          case 'pending':
            notificationTitle = 'Appointment Pending';
            notificationMessage = `The appointment for ${data.clientName} on ${data.date} is now pending review.`;
            break;
        }
        if (notificationTitle && notificationMessage) {
          await sendSystemNotification(notificationTitle, notificationMessage);
        }
      }
    }
  };

  return { appointments, loading, fetchAppointments, createAppointment, updateAppointment, setAppointments };
};
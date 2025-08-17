import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const triggerPushNotifications = async (userIds: string[], title: string, message: string) => {
  try {
    const { error } = await supabase.functions.invoke('send-push', {
      body: {
        userIds,
        notification: { title, message },
      },
    });
    if (error) throw error;
  } catch (err: any) {
    console.error('Error triggering push notifications:', err.message);
    // We don't show a toast here because the primary action (in-app notification) succeeded.
    // This is a background task.
  }
};

export const sendSystemNotification = async (title: string, message: string, senderEmail: string = 'System') => {
  try {
    const { data: profiles, error: profilesError } = await supabase.from('profiles').select('id');
    if (profilesError) throw profilesError;
    if (!profiles || profiles.length === 0) return;

    const { data: notification, error: notificationError } = await supabase
      .from('notifications')
      .insert({ title, message, sender_email: senderEmail })
      .select()
      .single();
    if (notificationError) throw notificationError;

    const userNotifications = profiles.map(profile => ({
      notification_id: notification.id,
      user_id: profile.id,
      is_read: false,
    }));

    const { error: userNotificationsError } = await supabase
      .from('user_notifications')
      .insert(userNotifications);
    if (userNotificationsError) throw userNotificationsError;

    // Trigger push notifications for all users
    const userIds = profiles.map(p => p.id);
    await triggerPushNotifications(userIds, title, message);

  } catch (err: any) {
    console.error('Error sending system notification:', err);
    toast.error(`Failed to send system notification: ${err.message}`);
  }
};

export const sendTargetedNotification = async (title: string, message: string, userIds: string[], senderEmail: string = 'Admin') => {
  if (userIds.length === 0) {
    toast.error("No users selected to receive the notification.");
    return;
  }

  try {
    const { data: notification, error: notificationError } = await supabase
      .from('notifications')
      .insert({ title, message, sender_email: senderEmail })
      .select()
      .single();
    if (notificationError) throw notificationError;

    const userNotifications = userIds.map(userId => ({
      notification_id: notification.id,
      user_id: userId,
      is_read: false,
    }));

    const { error: userNotificationsError } = await supabase
      .from('user_notifications')
      .insert(userNotifications);
    if (userNotificationsError) throw userNotificationsError;

    // Trigger push notifications for the targeted users
    await triggerPushNotifications(userIds, title, message);

  } catch (err: any) {
    console.error('Error sending targeted notification:', err);
    toast.error(`Failed to send targeted notification: ${err.message}`);
    throw err;
  }
};
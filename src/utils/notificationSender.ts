import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const sendSystemNotification = async (title: string, message: string) => {
  try {
    // 1. Get all user profiles to send them a notification
    const { data: profiles, error: profilesError } = await supabase.from('profiles').select('id');
    if (profilesError) throw profilesError;
    if (!profiles || profiles.length === 0) {
      console.log("No user profiles found to send notifications to.");
      return;
    }

    // 2. Insert the main notification message
    const { data: notification, error: notificationError } = await supabase
      .from('notifications')
      .insert({
        title,
        message,
        sender_email: 'System', // Mark as a system notification
      })
      .select()
      .single();
    if (notificationError) throw notificationError;

    // 3. Create a user_notification entry for each user to link them to the message
    const userNotifications = profiles.map(profile => ({
      notification_id: notification.id,
      user_id: profile.id,
      is_read: false,
    }));

    const { error: userNotificationsError } = await supabase
      .from('user_notifications')
      .insert(userNotifications);
    if (userNotificationsError) throw userNotificationsError;

  } catch (err: any) {
    console.error('Error sending system notification:', err);
    // Show an error to the admin performing the action, but don't block the main action
    toast.error(`Failed to send system notification: ${err.message}`);
  }
};
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const sendSystemNotification = async (title: string, message: string, senderEmail: string = 'System') => {
  try {
    // 1. Get all user profiles to create in-app notifications
    const { data: profiles, error: profilesError } = await supabase.from('profiles').select('id');
    if (profilesError) throw profilesError;
    if (!profiles || profiles.length === 0) {
      console.log("No user profiles found to send notifications to.");
      return;
    }

    // 2. Insert the main notification message for the in-app panel
    const { data: notification, error: notificationError } = await supabase
      .from('notifications')
      .insert({ title, message, sender_email: senderEmail })
      .select()
      .single();
    if (notificationError) throw notificationError;

    // 3. Create a user_notification entry for each user
    const userNotifications = profiles.map(profile => ({
      notification_id: notification.id,
      user_id: profile.id,
      is_read: false,
    }));
    const { error: userNotificationsError } = await supabase
      .from('user_notifications')
      .insert(userNotifications);
    if (userNotificationsError) throw userNotificationsError;

    // 4. (NEW) Trigger the Edge Function to send the push notification
    const userIds = profiles.map(p => p.id);
    const { error: functionError } = await supabase.functions.invoke('send-push', {
      body: { userIds, title, message },
    });

    if (functionError) {
      // Log this error for debugging but don't show it to the admin.
      // The in-app notification was successful, which is the primary goal.
      console.error('Failed to send push notification:', functionError);
    }

  } catch (err: any) {
    console.error('Error sending system notification:', err);
    toast.error(`Failed to send system notification: ${err.message}`);
  }
};
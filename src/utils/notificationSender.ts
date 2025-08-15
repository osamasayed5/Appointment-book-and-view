import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// This function sends both an in-app notification and a push notification
export const sendSystemNotification = async (title: string, message: string, senderEmail: string = 'System') => {
  try {
    // 1. Get all user profiles to send them a notification
    const { data: profiles, error: profilesError } = await supabase.from('profiles').select('id');
    if (profilesError) throw profilesError;
    if (!profiles || profiles.length === 0) {
      console.log("No user profiles found to send notifications to.");
      return;
    }

    // 2. Insert the main notification message for the in-app feed
    const { data: notification, error: notificationError } = await supabase
      .from('notifications')
      .insert({
        title,
        message,
        sender_email: senderEmail,
      })
      .select()
      .single();
    if (notificationError) throw notificationError;

    // 3. Create user_notification entries for each user
    const userNotifications = profiles.map(profile => ({
      notification_id: notification.id,
      user_id: profile.id,
      is_read: false,
    }));

    const { error: userNotificationsError } = await supabase
      .from('user_notifications')
      .insert(userNotifications);
    if (userNotificationsError) throw userNotificationsError;

    // 4. Trigger a push notification for each user via the Edge Function
    const pushPayload = { title, body: message };
    for (const profile of profiles) {
      await supabase.functions.invoke('send-push-notification', {
        body: { user_id: profile.id, payload: pushPayload },
      });
    }

  } catch (err: any) {
    console.error('Error sending system notification:', err);
    toast.error(`Failed to send system notification: ${err.message}`);
  }
};
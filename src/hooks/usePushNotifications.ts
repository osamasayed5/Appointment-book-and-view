import { useEffect } from 'react';
import { getToken, onMessage } from 'firebase/messaging';
import { messaging } from '@/integrations/firebase/client';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/components/SessionContextProvider';
import { toast } from 'sonner';

export const usePushNotifications = () => {
  const { session } = useSession();

  useEffect(() => {
    if (!session) return;

    const setupNotifications = async () => {
      try {
        const permission = await Notification.requestPermission();

        if (permission === 'granted') {
          const currentToken = await getToken(messaging, {
            vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
          });

          if (currentToken) {
            // Save the token to Supabase
            const { error } = await supabase
              .from('fcm_tokens')
              .upsert({ user_id: session.user.id, token: currentToken }, { onConflict: 'token' });

            if (error) {
              console.error('Error saving FCM token:', error);
            }
          } else {
            console.log('No registration token available. Request permission to generate one.');
          }
        } else {
          console.log('Unable to get permission to notify.');
        }
      } catch (error) {
        console.error('An error occurred while retrieving token. ', error);
      }
    };

    setupNotifications();

    // Handle incoming messages while the app is in the foreground
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Message received. ', payload);
      toast.info(payload.notification?.title || 'New Notification', {
        description: payload.notification?.body,
      });
    });

    return () => {
      unsubscribe();
    };
  }, [session]);
};
import { useEffect } from 'react';
import { useSession } from './SessionContextProvider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const OneSignalInitializer = () => {
  const { session } = useSession();

  useEffect(() => {
    if (!session) return;

    const oneSignalAppId = import.meta.env.VITE_ONESIGNAL_APP_ID;
    if (!oneSignalAppId) {
      console.error("OneSignal App ID is not configured. Please set VITE_ONESIGNAL_APP_ID.");
      return;
    }

    window.OneSignal = window.OneSignal || [];
    window.OneSignal.push(function() {
      window.OneSignal.init({
        appId: oneSignalAppId,
        allowLocalhostAsSecureOrigin: true, // Important for local development
      });

      // Listener for when a user is subscribed
      window.OneSignal.on('subscriptionChange', async (isSubscribed: boolean) => {
        if (isSubscribed) {
          const player_id = await window.OneSignal.getUserId();
          if (player_id) {
            // Save the token to Supabase, using upsert to avoid duplicates
            const { error } = await supabase
              .from('fcm_tokens')
              .upsert({ user_id: session.user.id, token: player_id }, { onConflict: 'user_id,token' });

            if (error) {
              console.error('Error saving OneSignal Player ID:', error);
              toast.error('Failed to save notification subscription.');
            } else {
              console.log('OneSignal Player ID saved:', player_id);
              toast.success('You are now subscribed to push notifications!');
            }
          }
        }
      });
    });

  }, [session]);

  return null; // This component does not render anything
};

// Add this to window interface to avoid TypeScript errors
declare global {
  interface Window {
    OneSignal: any;
  }
}

export default OneSignalInitializer;
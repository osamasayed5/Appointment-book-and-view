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
    window.OneSignal.push(async function() {
      await window.OneSignal.init({
        appId: oneSignalAppId,
        allowLocalhostAsSecureOrigin: true,
      });

      window.OneSignal.on('subscriptionChange', async (isSubscribed: boolean) => {
        if (isSubscribed) {
          const onesignalUserId = await window.OneSignal.getUserId();
          if (onesignalUserId) {
            // Save the token to the new 'push_tokens' table
            const { error } = await supabase
              .from('push_tokens')
              .upsert(
                { user_id: session.user.id, onesignal_user_id: onesignalUserId },
                { onConflict: 'user_id,onesignal_user_id' }
              );

            if (error) {
              console.error('Error saving OneSignal Player ID:', error);
              toast.error('Failed to save notification subscription.');
            } else {
              console.log('OneSignal Player ID saved:', onesignalUserId);
              toast.success('You are now subscribed to push notifications!');
            }
          }
        }
      });
    });

  }, [session]);

  return null;
};

declare global {
  interface Window {
    OneSignal: any;
  }
}

export default OneSignalInitializer;
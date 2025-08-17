import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const usePushManager = () => {
  const subscribeUser = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      toast.error("Push notifications are not supported by your browser.");
      return;
    }

    try {
      const swRegistration = await navigator.serviceWorker.register('/sw.js');
      let subscription = await swRegistration.pushManager.getSubscription();

      if (subscription === null) {
        if (!VAPID_PUBLIC_KEY) {
          console.error("VAPID public key is not defined. Please set VITE_VAPID_PUBLIC_KEY in your .env file.");
          toast.error("Push notification setup is incomplete on the server.");
          return;
        }

        subscription = await swRegistration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase
        .from('push_subscriptions')
        .insert({
          user_id: session.user.id,
          subscription: subscription,
        });

      if (error) {
        // Handle potential duplicate subscriptions gracefully
        if (error.code !== '23505') { // 23505 is unique_violation
          throw error;
        }
      } else {
        toast.success("Push notifications enabled!");
      }
    } catch (error) {
      console.error("Failed to subscribe to push notifications:", error);
      toast.error("Failed to enable push notifications.");
    }
  };

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      setTimeout(() => {
        toast("Enable push notifications to stay updated!", {
          action: <Button size="sm" onClick={() => subscribeUser()}>Enable</Button>,
          duration: 10000,
        });
      }, 5000);
    }
  }, []);

  return { subscribeToPushNotifications: subscribeUser };
};
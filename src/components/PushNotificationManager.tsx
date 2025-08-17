import { useState, useEffect } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from './SessionContextProvider';
import { toast } from 'sonner';

const urlBase64ToUint8Array = (base64String: string) => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

export const PushNotificationManager = () => {
  const { session } = useSession();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.register('/sw.js')
        .then(swReg => {
          setRegistration(swReg);
          return swReg.pushManager.getSubscription();
        })
        .then(sub => {
          if (sub) {
            setIsSubscribed(true);
            setSubscription(sub);
          }
        });
    }
  }, []);

  const subscribeUser = async () => {
    if (!registration) return;

    const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    if (!vapidPublicKey) {
      toast.error("VAPID public key not configured.");
      return;
    }

    try {
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      await supabase.from('push_subscriptions').insert({
        user_id: session!.user.id,
        subscription: sub.toJSON(),
      });

      setSubscription(sub);
      setIsSubscribed(true);
      toast.success("Push notifications enabled!");
    } catch (error) {
      console.error('Failed to subscribe the user: ', error);
      toast.error("Failed to enable push notifications.");
    }
  };

  const unsubscribeUser = async () => {
    if (!subscription) return;

    try {
      await subscription.unsubscribe();
      await supabase.from('push_subscriptions').delete().eq('subscription', subscription.toJSON());

      setIsSubscribed(false);
      setSubscription(null);
      toast.info("Push notifications disabled.");
    } catch (error) {
      console.error('Error unsubscribing', error);
      toast.error("Failed to disable push notifications.");
    }
  };

  const handleToggleSubscription = () => {
    if (isSubscribed) {
      unsubscribeUser();
    } else {
      subscribeUser();
    }
  };

  if (!session || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    return null;
  }

  return (
    <Button variant="ghost" size="icon" onClick={handleToggleSubscription}>
      {isSubscribed ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5 text-gray-500" />}
    </Button>
  );
};
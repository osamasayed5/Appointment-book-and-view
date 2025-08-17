import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

export async function subscribeToPushNotifications() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    toast.error("Push notifications are not supported by your browser.");
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    const permission = await window.Notification.requestPermission();

    if (permission !== 'granted') {
      toast.info("Push notification permission was not granted.");
      return;
    }

    const existingSubscription = await registration.pushManager.getSubscription();
    if (existingSubscription) {
      toast.info("You are already subscribed to push notifications.");
      return;
    }

    if (!VAPID_PUBLIC_KEY) {
      console.error("VAPID public key is not set. Cannot subscribe to push notifications.");
      toast.error("Push notification setup is incomplete on the server.");
      return;
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { error } = await supabase
      .from('push_subscriptions')
      .insert({
        user_id: session.user.id,
        subscription: subscription.toJSON(),
      });

    if (error) {
      toast.error(`Failed to save subscription: ${error.message}`);
    } else {
      toast.success("Successfully subscribed to push notifications!");
    }
  } catch (error) {
    console.error("Error subscribing to push notifications:", error);
    toast.error("An error occurred while subscribing to push notifications.");
  }
}
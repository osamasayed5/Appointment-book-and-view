import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

// This function is needed to convert the VAPID public key to a format the browser understands
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

export async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered successfully.');
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  }
  return null;
}

export async function subscribeUser(registration: ServiceWorkerRegistration) {
  if (!('PushManager' in window)) {
    toast.error('Push Notifications are not supported by your browser.');
    return;
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    toast.info('You have disabled push notifications.');
    return;
  }

  try {
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // Save the new subscription to the database.
    const { error } = await supabase
      .from('push_subscriptions')
      .insert({
        user_id: session.user.id,
        subscription: subscription.toJSON(),
      });

    if (error) throw error;

    toast.success('You are now subscribed to push notifications!');
  } catch (error) {
    console.error('Failed to subscribe the user: ', error);
    toast.error('Failed to subscribe to push notifications.');
  }
}
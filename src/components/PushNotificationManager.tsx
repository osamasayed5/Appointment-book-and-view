import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { BellRing } from 'lucide-react';
import { registerServiceWorker, subscribeUser } from '@/utils/pushNotifications';
import { useSession } from './SessionContextProvider';

const PushNotificationManager = () => {
  const { session } = useSession();
  const [permission, setPermission] = useState<NotificationPermission | null>(null);
  const [serviceWorkerRegistration, setServiceWorkerRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }
    
    registerServiceWorker().then(registration => {
      if (registration) {
        setServiceWorkerRegistration(registration);
      }
    });
  }, []);

  const handleSubscribeClick = () => {
    if (serviceWorkerRegistration) {
      subscribeUser(serviceWorkerRegistration).then(() => {
        // After the user clicks, re-check the permission to hide the prompt
        if (typeof window !== 'undefined' && 'Notification' in window) {
          setPermission(Notification.permission);
        }
      });
    }
  };

  // Don't show the prompt if notifications aren't supported, permission is already granted/denied, or the user isn't logged in.
  if (!session || permission === 'granted' || permission === 'denied' || !serviceWorkerRegistration) {
    return null;
  }

  // Render a small, non-intrusive prompt for the user to subscribe
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white p-4 rounded-lg shadow-lg border flex items-center space-x-4 animate-fadeIn">
        <div>
          <h4 className="font-semibold">Enable Notifications</h4>
          <p className="text-sm text-gray-600">Get updates directly on your device.</p>
        </div>
        <Button onClick={handleSubscribeClick} size="sm">
          <BellRing className="w-4 h-4 mr-2" />
          Enable
        </Button>
      </div>
    </div>
  );
};

export default PushNotificationManager;
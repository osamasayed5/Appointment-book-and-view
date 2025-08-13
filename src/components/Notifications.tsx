import { useState, useEffect } from 'react';
import { Bell, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from './SessionContextProvider';
import { formatDistanceToNow } from 'date-fns';

interface UserNotification {
  id: string;
  is_read: boolean;
  notifications: {
    title: string;
    message: string;
    created_at: string;
  };
}

const Notifications = () => {
  const { session } = useSession();
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!session) return;

    const fetchNotifications = async () => {
      const { data, error } = await supabase
        .from('user_notifications')
        .select(`
          id,
          is_read,
          notifications (
            title,
            message,
            created_at
          )
        `)
        .eq('user_id', session.user.id)
        .order('created_at', { foreignTable: 'notifications', ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching notifications:', error);
      } else {
        setNotifications(data as UserNotification[]);
        setUnreadCount(data.filter(n => !n.is_read).length);
      }
    };

    fetchNotifications();

    const channel = supabase
      .channel('user-notifications')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_notifications', filter: `user_id=eq.${session.user.id}` },
        () => fetchNotifications()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session]);

  const handleMarkAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
    if (unreadIds.length === 0) return;

    const { error } = await supabase
      .from('user_notifications')
      .update({ is_read: true })
      .in('id', unreadIds);

    if (error) {
      console.error('Error marking notifications as read:', error);
    } else {
      setUnreadCount(0);
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    }
  };

  return (
    <DropdownMenu onOpenChange={(open) => open && handleMarkAsRead()}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <p className="p-4 text-sm text-gray-500">No notifications yet.</p>
        ) : (
          notifications.map(n => (
            <DropdownMenuItem key={n.id} className="flex flex-col items-start gap-1">
              <p className="font-semibold">{n.notifications.title}</p>
              <p className="text-sm text-gray-600 whitespace-normal">{n.notifications.message}</p>
              <p className="text-xs text-gray-400 self-end">
                {formatDistanceToNow(new Date(n.notifications.created_at), { addSuffix: true })}
              </p>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default Notifications;
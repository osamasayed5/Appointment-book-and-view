import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Send, AlertCircle, History, User, Clock, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/components/SessionContextProvider';
import { toast } from 'sonner';
import { logActivity } from '@/utils/activityLogger';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';

interface SentNotification {
  id: string;
  title: string;
  message: string;
  created_at: string;
  sender_email: string | null;
}

const NotificationsTab = () => {
  const { session } = useSession();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [history, setHistory] = useState<SentNotification[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const fetchHistory = async () => {
    setLoadingHistory(true);
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching notification history:', error);
      toast.error('Failed to load notification history.');
    } else {
      setHistory(data as SentNotification[]);
    }
    setLoadingHistory(false);
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleSendNotification = async () => {
    if (!title.trim() || !message.trim()) {
      setError('Title and message cannot be empty.');
      return;
    }
    if (!session) {
      toast.error('You must be logged in to send notifications.');
      return;
    }
    setError('');
    setIsSending(true);

    try {
      const { data: profiles, error: profilesError } = await supabase.from('profiles').select('id');
      if (profilesError) throw profilesError;

      const { data: notification, error: notificationError } = await supabase
        .from('notifications')
        .insert({
          title,
          message,
          created_by: session.user.id,
          sender_email: session.user.email,
        })
        .select()
        .single();
      if (notificationError) throw notificationError;

      const userNotifications = profiles.map(profile => ({
        notification_id: notification.id,
        user_id: profile.id,
        is_read: false,
      }));

      const { error: userNotificationsError } = await supabase
        .from('user_notifications')
        .insert(userNotifications);
      if (userNotificationsError) throw userNotificationsError;

      toast.success('Notification sent to all users!');
      await logActivity('Sent notification', { title });
      setTitle('');
      setMessage('');
      fetchHistory(); // Refresh history after sending
    } catch (err: any) {
      console.error('Error sending notification:', err);
      toast.error(`Failed to send notification: ${err.message}`);
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteNotification = async (notificationId: string, notificationTitle: string) => {
    if (window.confirm(`Are you sure you want to delete the notification "${notificationTitle}"? This action cannot be undone.`)) {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) {
        toast.error(`Failed to delete notification: ${error.message}`);
      } else {
        toast.success('Notification deleted successfully.');
        await logActivity('Deleted notification', { title: notificationTitle });
        fetchHistory(); // Refresh the list
      }
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      <Card>
        <CardHeader>
          <CardTitle>Send Notification</CardTitle>
          <CardDescription>Broadcast a message to all registered users.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="notification-title">Title</Label>
            <Input
              id="notification-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., System Maintenance"
            />
          </div>
          <div>
            <Label htmlFor="notification-message">Message</Label>
            <Textarea
              id="notification-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Your message here..."
              rows={5}
            />
          </div>
          {error && (
            <p className="text-red-600 text-xs flex items-center">
              <AlertCircle className="w-3 h-3 mr-1" />
              {error}
            </p>
          )}
          <Button onClick={handleSendNotification} disabled={isSending}>
            <Send className="w-4 h-4 mr-2" />
            {isSending ? 'Sending...' : 'Send to All Users'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <History className="w-5 h-5 mr-2" />
            Sent History
          </CardTitle>
          <CardDescription>A log of the most recent notifications.</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {loadingHistory ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="space-y-2 p-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))
              ) : history.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No notifications sent yet.</p>
              ) : (
                history.map(notification => (
                  <div key={notification.id} className="p-3 border-b last:border-b-0">
                    <div className="flex justify-between items-start">
                      <p className="font-semibold text-gray-800">{notification.title}</p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-gray-500 hover:text-red-600"
                        onClick={() => handleDeleteNotification(notification.id, notification.title)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{notification.message}</p>
                    <div className="text-xs text-gray-500 flex items-center justify-end space-x-4 mt-2">
                      <div className="flex items-center">
                        <User className="w-3 h-3 mr-1" />
                        <span>{notification.sender_email || 'System'}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        <span>{formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationsTab;
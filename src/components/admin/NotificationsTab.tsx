import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Send, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/components/SessionContextProvider';
import { toast } from 'sonner';
import { logActivity } from '@/utils/activityLogger';

const NotificationsTab = () => {
  const { session } = useSession();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSending, setIsSending] = useState(false);

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
      // 1. Get all user profiles
      const { data: profiles, error: profilesError } = await supabase.from('profiles').select('id');
      if (profilesError) throw profilesError;

      // 2. Insert the main notification
      const { data: notification, error: notificationError } = await supabase
        .from('notifications')
        .insert({
          title,
          message,
          created_by: session.user.id,
        })
        .select()
        .single();
      if (notificationError) throw notificationError;

      // 3. Create a user_notification entry for each user
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
    } catch (err: any) {
      console.error('Error sending notification:', err);
      toast.error(`Failed to send notification: ${err.message}`);
    } finally {
      setIsSending(false);
    }
  };

  return (
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
  );
};

export default NotificationsTab;
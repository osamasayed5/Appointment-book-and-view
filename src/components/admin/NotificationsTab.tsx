import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Send, AlertCircle, History, User, Clock, Trash2, ChevronsUpDown, Check, BellRing, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/components/SessionContextProvider';
import { toast } from 'sonner';
import { logActivity } from '@/utils/activityLogger';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { Appointment } from '@/types';
import { cn } from '@/lib/utils';
import { sendSystemNotification, sendTargetedNotification } from '@/utils/notificationSender';
import { Badge } from '@/components/ui/badge';

interface SentNotification {
  id: string;
  title: string;
  message: string;
  created_at: string;
  sender_email: string | null;
}

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
}

const NotificationsTab = () => {
  const { session } = useSession();
  // State for broadcast notifications
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [broadcastError, setBroadcastError] = useState('');
  const [isSendingBroadcast, setIsSendingBroadcast] = useState(false);
  
  // State for sent history
  const [history, setHistory] = useState<SentNotification[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // State for targeted notifications
  const [allUsers, setAllUsers] = useState<Profile[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Profile[]>([]);
  const [targetedTitle, setTargetedTitle] = useState('');
  const [targetedMessage, setTargetedMessage] = useState('');
  const [isSendingTargeted, setIsSendingTargeted] = useState(false);
  const [isUserSelectOpen, setIsUserSelectOpen] = useState(false);

  const fetchHistory = async () => {
    setLoadingHistory(true);
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      toast.error('Failed to load notification history.');
    } else {
      setHistory(data as SentNotification[]);
    }
    setLoadingHistory(false);
  };

  const fetchUsers = async () => {
    const { data, error } = await supabase.from('profiles').select('id, first_name, last_name');
    if (error) {
      toast.error('Failed to load users.');
    } else {
      setAllUsers(data as Profile[]);
    }
  };

  useEffect(() => {
    fetchHistory();
    fetchUsers();
  }, []);

  const handleSendBroadcast = async () => {
    if (!title.trim() || !message.trim()) {
      setBroadcastError('Title and message cannot be empty.');
      return;
    }
    if (!session) {
      toast.error('You must be logged in to send notifications.');
      return;
    }
    setBroadcastError('');
    setIsSendingBroadcast(true);

    try {
      await sendSystemNotification(title, message, session.user.email || 'Admin');
      toast.success('Notification sent to all users!');
      await logActivity('Sent broadcast notification', { title });
      setTitle('');
      setMessage('');
      fetchHistory();
    } catch (err: any) {
      toast.error(`Failed to send notification: ${err.message}`);
    } finally {
      setIsSendingBroadcast(false);
    }
  };

  const handleSendTargeted = async () => {
    if (!targetedTitle.trim() || !targetedMessage.trim() || selectedUsers.length === 0) {
      toast.error("Title, message, and at least one recipient are required.");
      return;
    }
    if (!session) {
      toast.error('You must be logged in to send notifications.');
      return;
    }
    setIsSendingTargeted(true);

    try {
      const userIds = selectedUsers.map(u => u.id);
      await sendTargetedNotification(targetedTitle, targetedMessage, userIds, session.user.email || 'Admin');
      toast.success(`Notification sent to ${selectedUsers.length} user(s)!`);
      await logActivity('Sent targeted notification', { title: targetedTitle, recipients: selectedUsers.map(u => u.id) });
      setTargetedTitle('');
      setTargetedMessage('');
      setSelectedUsers([]);
      fetchHistory();
    } catch (err: any) {
      // Error toast is handled in the sender function
    } finally {
      setIsSendingTargeted(false);
    }
  };

  const handleDeleteNotification = async (notificationId: string, notificationTitle: string) => {
    if (window.confirm(`Are you sure you want to delete the notification "${notificationTitle}"? This action cannot be undone.`)) {
      const { error } = await supabase.from('notifications').delete().eq('id', notificationId);
      if (error) {
        toast.error(`Failed to delete notification: ${error.message}`);
      } else {
        toast.success('Notification deleted successfully.');
        await logActivity('Deleted notification', { title: notificationTitle });
        fetchHistory();
      }
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Send Broadcast Notification</CardTitle>
            <CardDescription>Broadcast a general message to all registered users.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="notification-title">Title</Label>
              <Input id="notification-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., System Maintenance" />
            </div>
            <div>
              <Label htmlFor="notification-message">Message</Label>
              <Textarea id="notification-message" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Your message here..." rows={4} />
            </div>
            {broadcastError && <p className="text-red-600 text-xs flex items-center"><AlertCircle className="w-3 h-3 mr-1" />{broadcastError}</p>}
            <Button onClick={handleSendBroadcast} disabled={isSendingBroadcast}>
              <Send className="w-4 h-4 mr-2" />
              {isSendingBroadcast ? 'Sending...' : 'Send Broadcast'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Send to Specific User(s)</CardTitle>
            <CardDescription>Send a targeted message to one or more users.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Recipients</Label>
              <Popover open={isUserSelectOpen} onOpenChange={setIsUserSelectOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className="w-full justify-between">
                    {selectedUsers.length > 0 ? `${selectedUsers.length} user(s) selected` : "Select users..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[350px] p-0">
                  <Command>
                    <CommandInput placeholder="Search users..." />
                    <CommandList>
                      <CommandEmpty>No users found.</CommandEmpty>
                      <CommandGroup>
                        {allUsers.map((user) => (
                          <CommandItem
                            key={user.id}
                            value={`${user.first_name || ''} ${user.last_name || ''} ${user.id}`}
                            onSelect={() => {
                              setSelectedUsers(current => 
                                current.some(u => u.id === user.id) 
                                ? current.filter(u => u.id !== user.id) 
                                : [...current, user]
                              );
                            }}
                          >
                            <Check className={cn("mr-2 h-4 w-4", selectedUsers.some(u => u.id === user.id) ? "opacity-100" : "opacity-0")} />
                            {user.first_name || user.last_name ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : user.id}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <div className="flex flex-wrap gap-1 mt-2">
                {selectedUsers.map(user => (
                  <Badge key={user.id} variant="secondary">
                    {user.first_name || user.last_name ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : user.id}
                    <button onClick={() => setSelectedUsers(current => current.filter(u => u.id !== user.id))} className="ml-1.5 rounded-full hover:bg-gray-300 p-0.5">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="targeted-title">Title</Label>
              <Input id="targeted-title" value={targetedTitle} onChange={(e) => setTargetedTitle(e.target.value)} placeholder="e.g., Your Appointment Reminder" />
            </div>
            <div>
              <Label htmlFor="targeted-message">Message</Label>
              <Textarea id="targeted-message" value={targetedMessage} onChange={(e) => setTargetedMessage(e.target.value)} placeholder="Your message here..." rows={4} />
            </div>
            <Button onClick={handleSendTargeted} disabled={isSendingTargeted}>
              <Send className="w-4 h-4 mr-2" />
              {isSendingTargeted ? 'Sending...' : 'Send to Selected'}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><History className="w-5 h-5 mr-2" />Sent History</CardTitle>
          <CardDescription>A log of the most recent notifications sent.</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-4">
              {loadingHistory ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="space-y-2 p-3 border-b"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-full" /><Skeleton className="h-3 w-1/2" /></div>
                ))
              ) : history.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No notifications sent yet.</p>
              ) : (
                history.map(notification => (
                  <div key={notification.id} className="p-3 border-b last:border-b-0">
                    <div className="flex justify-between items-start">
                      <p className="font-semibold text-gray-800">{notification.title}</p>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-500 hover:text-red-600" onClick={() => handleDeleteNotification(notification.id, notification.title)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                    <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{notification.message}</p>
                    <div className="text-xs text-gray-500 flex items-center justify-end space-x-4 mt-2">
                      <div className="flex items-center"><User className="w-3 h-3 mr-1" /><span>{notification.sender_email || 'System'}</span></div>
                      <div className="flex items-center"><Clock className="w-3 h-3 mr-1" /><span>{formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}</span></div>
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
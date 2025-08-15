import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Send, AlertCircle, History, User, Clock, Trash2, ChevronsUpDown, Check, BellRing } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/components/SessionContextProvider';
import { toast } from 'sonner';
import { logActivity } from '@/utils/activityLogger';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { Appointment } from '@/types';
import { cn } from '@/lib/utils';
import { sendSystemNotification } from '@/utils/notificationSender';

interface SentNotification {
  id: string;
  title: string;
  message: string;
  created_at: string;
  sender_email: string | null;
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

  // State for status update notifications
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<'confirmed' | 'pending' | 'cancelled' | ''>('');
  const [isSendingUpdate, setIsSendingUpdate] = useState(false);
  const [isComboboxOpen, setIsComboboxOpen] = useState(false);

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

  const fetchAppointments = async () => {
    setLoadingAppointments(true);
    const { data, error } = await supabase.from('appointments').select('*').order('date', { descending: true });
    if (error) {
      toast.error('Failed to load appointments.');
    } else {
      setAppointments(data as Appointment[]);
    }
    setLoadingAppointments(false);
  };

  useEffect(() => {
    fetchHistory();
    fetchAppointments();
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

  const handleSendStatusUpdate = async () => {
    if (!selectedAppointmentId || !selectedStatus) {
      toast.error("Please select an appointment and a new status.");
      return;
    }
    setIsSendingUpdate(true);

    const appointment = appointments.find(a => a.id === selectedAppointmentId);
    if (!appointment) {
      toast.error("Selected appointment not found.");
      setIsSendingUpdate(false);
      return;
    }

    const { error: updateError } = await supabase
      .from('appointments')
      .update({ status: selectedStatus })
      .eq('id', selectedAppointmentId);

    if (updateError) {
      toast.error(`Failed to update appointment status: ${updateError.message}`);
      setIsSendingUpdate(false);
      return;
    }

    const notificationTitle = 'Appointment Status Updated';
    const notificationMessage = `The status for ${appointment.client_name}'s appointment on ${appointment.date} has been changed to ${selectedStatus}.`;
    
    await sendSystemNotification(notificationTitle, notificationMessage);
    await logActivity(`Changed status to ${selectedStatus} for ${appointment.client_name}'s appointment and sent notification.`);
    
    toast.success('Status updated and notification sent!');
    setSelectedAppointmentId(null);
    setSelectedStatus('');
    setIsSendingUpdate(false);
    fetchHistory(); // Refresh history to show the new system notification
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
            <CardTitle>Update Appointment Status</CardTitle>
            <CardDescription>Change an appointment's status and notify all users.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Appointment</Label>
              <Popover open={isComboboxOpen} onOpenChange={setIsComboboxOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" aria-expanded={isComboboxOpen} className="w-full justify-between">
                    {selectedAppointmentId ? (appointments.find((a) => a.id === selectedAppointmentId)?.client_name + ' on ' + appointments.find((a) => a.id === selectedAppointmentId)?.date) : "Select appointment..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[350px] p-0">
                  <Command>
                    <CommandInput placeholder="Search appointments..." />
                    <CommandEmpty>{loadingAppointments ? "Loading..." : "No appointment found."}</CommandEmpty>
                    <CommandGroup>
                      {appointments.map((appointment) => (
                        <CommandItem
                          key={appointment.id}
                          value={`${appointment.client_name} ${appointment.service} ${appointment.date}`}
                          onSelect={() => {
                            setSelectedAppointmentId(appointment.id);
                            setIsComboboxOpen(false);
                          }}
                        >
                          <Check className={cn("mr-2 h-4 w-4", selectedAppointmentId === appointment.id ? "opacity-100" : "opacity-0")} />
                          <div>
                            <p>{appointment.client_name} - {appointment.service}</p>
                            <p className="text-xs text-muted-foreground">{appointment.date} at {appointment.time}</p>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label>New Status</Label>
              <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as any)}>
                <SelectTrigger><SelectValue placeholder="Select new status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSendStatusUpdate} disabled={isSendingUpdate}>
              <BellRing className="w-4 h-4 mr-2" />
              {isSendingUpdate ? 'Updating...' : 'Update Status & Notify'}
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
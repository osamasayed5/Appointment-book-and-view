import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { History, User, Edit, Trash2, PlusCircle, Settings } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface ActivityLog {
  id: string;
  user_email: string;
  action: string;
  details: any;
  created_at: string;
}

const ActivityLog = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error("Error fetching activity logs:", error);
      } else {
        setLogs(data as ActivityLog[]);
      }
      setLoading(false);
    };

    fetchLogs();
  }, []);

  const getActionIcon = (action: string) => {
    const actionLower = action.toLowerCase();
    if (actionLower.includes('create') || actionLower.includes('add')) {
      return <PlusCircle className="w-4 h-4 text-green-500" />;
    }
    if (actionLower.includes('update') || actionLower.includes('edit') || actionLower.includes('change')) {
      return <Edit className="w-4 h-4 text-blue-500" />;
    }
    if (actionLower.includes('delete') || actionLower.includes('remove')) {
      return <Trash2 className="w-4 h-4 text-red-500" />;
    }
    if (actionLower.includes('setting')) {
        return <Settings className="w-4 h-4 text-orange-500" />;
    }
    return <History className="w-4 h-4 text-gray-500" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <History className="w-5 h-5 mr-2" />
          Activity Log
        </CardTitle>
        <CardDescription>Recent actions performed by users in the system.</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px]">
          <div className="space-y-4">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-start space-x-4 p-3">
                  <Skeleton className="w-5 h-5 rounded-full mt-1" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))
            ) : logs.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No activity recorded yet.</p>
            ) : (
              logs.map(log => (
                <div key={log.id} className="flex items-start space-x-4 p-3 border-b last:border-b-0">
                  <div className="mt-1">{getActionIcon(log.action)}</div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{log.action}</p>
                    <div className="text-sm text-gray-500 flex items-center space-x-2 mt-1">
                      <User className="w-3 h-3" />
                      <span>{log.user_email || 'System'}</span>
                      <span>&bull;</span>
                      <span>{formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default ActivityLog;
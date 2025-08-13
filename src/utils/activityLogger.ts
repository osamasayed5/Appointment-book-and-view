import { supabase } from '@/integrations/supabase/client';

export const logActivity = async (action: string, details?: object) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.warn("No active session, cannot log activity.");
      return;
    }

    const { error } = await supabase
      .from('activity_logs')
      .insert({
        user_id: session.user.id,
        user_email: session.user.email,
        action,
        details: details || null,
      });

    if (error) {
      console.error('Failed to log activity:', error);
    }
  } catch (error) {
    console.error('Unexpected error in logActivity:', error);
  }
};
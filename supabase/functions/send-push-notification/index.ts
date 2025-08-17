import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import webpush from 'https://esm.sh/web-push@3.6.7';

// Configure web-push with VAPID keys from environment variables
webpush.setVapidDetails(
  'mailto:admin@example.com', // This can be a generic admin email
  Deno.env.get('VAPID_PUBLIC_KEY')!,
  Deno.env.get('VAPID_PRIVATE_KEY')!
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload = await req.json();

    let userId: string;
    let title: string;
    let body: string;

    // Create a Supabase client with the service role key to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Check if the payload is from the database trigger
    if (payload.record && payload.record.user_id && payload.record.notification_id) {
      const { user_id, notification_id } = payload.record;
      userId = user_id;

      // Fetch the notification details from the 'notifications' table
      const { data: notification, error: notifError } = await supabaseAdmin
        .from('notifications')
        .select('title, message')
        .eq('id', notification_id)
        .single();

      if (notifError) throw new Error(`Notification not found: ${notifError.message}`);
      
      title = notification.title;
      body = notification.message;
    } else {
      throw new Error('Invalid payload structure. Expected payload from database trigger.');
    }

    if (!userId || !title || !body) {
      throw new Error('Missing required parameters to send notification.');
    }

    // Fetch all subscriptions for the given user
    const { data: subscriptions, error: fetchError } = await supabaseAdmin
      .from('push_subscriptions')
      .select('id, subscription')
      .eq('user_id', userId);

    if (fetchError) throw fetchError;
    if (!subscriptions || subscriptions.length === 0) {
      console.log(`No push subscriptions found for user: ${userId}`);
      return new Response(JSON.stringify({ message: 'No subscriptions found for this user.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const notificationPayload = JSON.stringify({ title, body });
    const promises = subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(sub.subscription, notificationPayload);
      } catch (error) {
        console.error('Failed to send notification:', error);
        if (error.statusCode === 410) {
          await supabaseAdmin.from('push_subscriptions').delete().eq('id', sub.id);
        }
      }
    });

    await Promise.all(promises);

    return new Response(JSON.stringify({ message: 'Notifications sent successfully.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error in send-push-notification function:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
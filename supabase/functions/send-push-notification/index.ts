import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import webpush from 'https://deno.land/x/web_push@0.2.2/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize web-push with VAPID keys from environment variables
const vapidKeys = {
  publicKey: Deno.env.get('VAPID_PUBLIC_KEY')!,
  privateKey: Deno.env.get('VAPID_PRIVATE_KEY')!,
};

webpush.setVapidDetails(
  'mailto:admin@example.com', // This should be a valid email
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { record: userNotification } = await req.json();

    if (!userNotification || !userNotification.user_id || !userNotification.notification_id) {
      throw new Error("Invalid payload: Missing user_id or notification_id");
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // 1. Fetch the notification details
    const { data: notification, error: notificationError } = await supabaseAdmin
      .from('notifications')
      .select('title, message')
      .eq('id', userNotification.notification_id)
      .single();

    if (notificationError) throw notificationError;

    // 2. Fetch the user's push subscriptions
    const { data: subscriptions, error: subsError } = await supabaseAdmin
      .from('push_subscriptions')
      .select('subscription')
      .eq('user_id', userNotification.user_id);

    if (subsError) throw subsError;

    if (subscriptions && subscriptions.length > 0) {
      const payload = JSON.stringify({
        title: notification.title,
        body: notification.message,
      });

      // 3. Send a push notification to each subscription
      const sendPromises = subscriptions.map(sub => 
        webpush.sendNotification(sub.subscription, payload)
          .catch(async (err) => {
            console.error(`Error sending notification to ${sub.subscription.endpoint}:`, err.statusCode);
            // If subscription is expired or invalid, remove it from the database
            if (err.statusCode === 410 || err.statusCode === 404) {
              await supabaseAdmin
                .from('push_subscriptions')
                .delete()
                .eq('subscription', sub.subscription);
            }
          })
      );
      
      await Promise.all(sendPromises);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
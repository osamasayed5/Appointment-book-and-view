import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { WebPush, type PushSubscription } from 'https://deno.land/x/web_push@v0.2.0/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { userIds, notification } = await req.json();

    if (!userIds || !notification || userIds.length === 0) {
      return new Response(JSON.stringify({ error: 'Missing userIds or notification payload' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: subscriptions, error } = await supabaseAdmin
      .from('push_subscriptions')
      .select('id, subscription, user_id')
      .in('user_id', userIds);

    if (error) throw error;

    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');

    if (!vapidPublicKey || !vapidPrivateKey) {
      console.error('VAPID keys are not set in environment variables.');
      return new Response(JSON.stringify({ error: 'VAPID keys not configured on server' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const webPush = new WebPush(vapidPublicKey, vapidPrivateKey);
    const payload = JSON.stringify(notification);

    const promises = subscriptions.map(async (sub) => {
      try {
        await webPush.send(sub.subscription as unknown as PushSubscription, payload);
      } catch (err) {
        console.error(`Failed to send push to user ${sub.user_id}:`, err.message);
        // If subscription is expired or invalid, delete it
        if (err.message.includes('404') || err.message.includes('410')) {
          console.log(`Deleting stale subscription for user ${sub.user_id}`);
          await supabaseAdmin.from('push_subscriptions').delete().eq('id', sub.id);
        }
      }
    });

    await Promise.all(promises);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
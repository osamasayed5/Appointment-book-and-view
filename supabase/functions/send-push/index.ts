import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8'

// Secrets are set in the Supabase Dashboard: Project Settings > Edge Functions
const ONE_SIGNAL_APP_ID = Deno.env.get('ONESIGNAL_APP_ID')!
const ONE_SIGNAL_REST_API_KEY = Deno.env.get('ONESIGNAL_REST_API_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { userIds, title, message } = await req.json()

    if (!title || !message) {
      return new Response(JSON.stringify({ error: 'Title and message are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    let playerIds: string[] = [];

    if (userIds && Array.isArray(userIds) && userIds.length > 0) {
      // Send to specific users
      const { data: tokens, error: tokenError } = await supabaseAdmin
        .from('push_tokens')
        .select('onesignal_user_id')
        .in('user_id', userIds)

      if (tokenError) throw new Error(`Failed to fetch tokens: ${tokenError.message}`)
      if (tokens) {
        playerIds = tokens.map((t) => t.onesignal_user_id)
      }
    }

    if (playerIds.length === 0 && (!userIds || userIds.length === 0)) {
      // If no userIds are provided, send to all subscribed users
      // This part is optional, remove if you only want to target specific users
    } else if (playerIds.length === 0) {
      console.log('No push notification subscribers found for the target users.')
      return new Response(JSON.stringify({ message: 'No subscribers to notify' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const notificationBody = {
      app_id: ONE_SIGNAL_APP_ID,
      headings: { en: title },
      contents: { en: message },
      ...(playerIds.length > 0
        ? { include_player_ids: playerIds }
        : { included_segments: ["Subscribed Users"] }), // Fallback to all users
    };

    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${ONE_SIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify(notificationBody),
    })

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(`OneSignal API error: ${JSON.stringify(responseData)}`)
    }

    return new Response(JSON.stringify({ success: true, data: responseData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error(error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8'

// These secrets are automatically available from the Supabase environment.
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

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return new Response(JSON.stringify({ error: 'userIds array is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: tokens, error: tokenError } = await supabaseAdmin
      .from('fcm_tokens')
      .select('token')
      .in('user_id', userIds)

    if (tokenError) throw new Error(`Failed to fetch tokens: ${tokenError.message}`)

    if (!tokens || tokens.length === 0) {
      console.log('No push notification subscribers found for the target users.')
      return new Response(JSON.stringify({ message: 'No subscribers to notify' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const playerIds = tokens.map((t) => t.token)

    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${ONE_SIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify({
        app_id: ONE_SIGNAL_APP_ID,
        include_player_ids: playerIds,
        headings: { en: title },
        contents: { en: message },
      }),
    })

    if (!response.ok) {
      const errorBody = await response.json()
      throw new Error(`OneSignal API error: ${JSON.stringify(errorBody)}`)
    }

    return new Response(JSON.stringify({ success: true }), {
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
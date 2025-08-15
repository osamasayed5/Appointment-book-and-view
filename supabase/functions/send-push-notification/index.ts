import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const FCM_API_URL = 'https://fcm.googleapis.com/fcm/send';

// Define the structure of the notification payload
interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  click_action?: string;
}

// CORS headers for preflight requests
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
    const { user_id, payload } = await req.json();
    if (!user_id || !payload) {
      throw new Error('Missing user_id or payload in request body');
    }

    // Create a Supabase client with the service role key to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch all FCM tokens for the specified user
    const { data: tokens, error: tokenError } = await supabaseAdmin
      .from('fcm_tokens')
      .select('token')
      .eq('user_id', user_id);

    if (tokenError) throw tokenError;
    if (!tokens || tokens.length === 0) {
      return new Response(JSON.stringify({ message: 'No active devices for this user.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const registrationTokens = tokens.map(t => t.token);
    const fcmServerKey = Deno.env.get('FCM_SERVER_KEY');

    if (!fcmServerKey) {
      throw new Error('FCM_SERVER_KEY is not set in Supabase secrets.');
    }

    // Prepare the message for FCM's legacy API
    const message = {
      registration_ids: registrationTokens,
      notification: payload,
    };

    // Send the request to FCM
    const fcmResponse = await fetch(FCM_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `key=${fcmServerKey}`,
      },
      body: JSON.stringify(message),
    });

    if (!fcmResponse.ok) {
      const errorBody = await fcmResponse.text();
      throw new Error(`FCM request failed with status ${fcmResponse.status}: ${errorBody}`);
    }

    const fcmResult = await fcmResponse.json();
    const tokensToDelete = [];

    // Check for invalid tokens to clean up the database
    fcmResult.results.forEach((result, index) => {
      if (result.error === 'NotRegistered' || result.error === 'InvalidRegistration') {
        tokensToDelete.push(registrationTokens[index]);
      }
    });

    if (tokensToDelete.length > 0) {
      await supabaseAdmin
        .from('fcm_tokens')
        .delete()
        .in('token', tokensToDelete);
    }

    return new Response(JSON.stringify({ success: true, result: fcmResult }), {
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
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const today = new Date().toISOString().split('T')[0];

    // Find all 'follow up' appointments with a date in the past
    const { data: appointmentsToReschedule, error: fetchError } = await supabase
      .from('appointments')
      .select('id, date')
      .eq('status', 'follow up')
      .lt('date', today);

    if (fetchError) {
      throw fetchError;
    }

    if (!appointmentsToReschedule || appointmentsToReschedule.length === 0) {
      return new Response(JSON.stringify({ message: 'No follow-up appointments to reschedule.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Reschedule each appointment to the same day next week
    const updatePromises = appointmentsToReschedule.map(app => {
      const currentDueDate = new Date(app.date);
      currentDueDate.setDate(currentDueDate.getDate() + 7);
      const newDate = currentDueDate.toISOString().split('T')[0];

      return supabase
        .from('appointments')
        .update({ date: newDate })
        .eq('id', app.id);
    });

    await Promise.all(updatePromises);

    return new Response(JSON.stringify({ message: `Successfully rescheduled ${appointmentsToReschedule.length} follow-up appointments.` }), {
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
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the Auth context of the logged in user
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Get the session from the request
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Get the user from the auth header
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (userError || !user) {
      throw new Error('Invalid token')
    }

    // Check if the user is an agent by querying the agents table
    const { data: agentData, error: agentError } = await supabaseClient
      .from('agents')
      .select('role')
      .eq('id', user.id)
      .single()

    if (agentError || !agentData) {
      throw new Error('Unauthorized - Agent access only')
    }

    // Get feedback data with ticket information
    const { data: feedbackData, error: feedbackError } = await supabaseClient
      .from('ticket_feedback')
      .select(`
        id,
        ticket_number,
        rating,
        feedback_text,
        created_at,
        tickets (
          title,
          assigned_to,
          status,
          priority
        )
      `)
      .order('created_at', { ascending: false })

    if (feedbackError) {
      throw feedbackError
    }

    return new Response(
      JSON.stringify({ data: feedbackData }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 200,
      },
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: error.message.includes('Unauthorized') ? 403 : 400,
      },
    )
  }
}) 
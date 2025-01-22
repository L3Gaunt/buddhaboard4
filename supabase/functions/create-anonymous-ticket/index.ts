import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { title, description, priority, email, name } = await req.json()

    // Create an anonymous user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email || `anonymous-${Date.now()}@temp.buddhaboard.com`,
      email_confirm: true,
      user_metadata: {
        name: name || 'Anonymous User',
        is_anonymous: true
      }
    })

    if (authError) throw authError

    // Create the ticket
    const { data, error } = await supabaseAdmin
      .from('tickets')
      .insert({
        title,
        description,
        priority,
        status: 'open',
        customer_id: authData.user.id,
        conversation: []
      })
      .select()
      .single()

    if (error) throw error

    // Create a hash from the ticket number and user ID
    const ticketHash = btoa(`${data.number}:${authData.user.id}`).replace(/=/g, '')

    return new Response(
      JSON.stringify({ 
        data: { 
          ...data,
          ticketHash
        }, 
        error: null 
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ data: null, error: error.message }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 400,
      }
    )
  }
}) 
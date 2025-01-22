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

    const body = await req.json()
    const { action } = body

    if (action === 'create') {
      const { title, firstMessage, priority, email, name } = body

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

      // Find the least busy online agent
      const { data: leastBusyAgent, error: agentError } = await supabaseAdmin.rpc(
        'get_least_busy_agent'
      )

      if (agentError) throw agentError
      
      console.log('Least busy agent:', leastBusyAgent?.[0]?.agent_id || 'No agent available')
      if (leastBusyAgent?.[0]) {
        console.log('Current open tickets:', leastBusyAgent[0].open_tickets)
      }

      // Create the ticket
      const { data, error } = await supabaseAdmin
        .from('tickets')
        .insert({
          title,
          priority,
          status: 'open',
          customer_id: authData.user.id,
          conversation: [{
            id: `msg_${Date.now()}`,
            isFromCustomer: true,
            message: firstMessage,
            timestamp: new Date().toISOString()
          }],
          assigned_to: leastBusyAgent?.[0]?.agent_id || null
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
    } else if (action === 'append_message') {
      const { ticketHash, message } = body

      // Decode the hash to get ticket number and user ID
      const decoded = atob(ticketHash)
      const [ticketNumber, userId] = decoded.split(':')

      // Verify the ticket belongs to this user
      const { data: ticket, error: ticketError } = await supabaseAdmin
        .from('tickets')
        .select('*')
        .eq('number', ticketNumber)
        .eq('customer_id', userId)
        .single()

      if (ticketError || !ticket) {
        throw new Error('Invalid ticket hash or ticket not found')
      }

      // Append the message to the conversation
      const newMessage = {
        id: `msg_${Date.now()}`,
        isFromCustomer: true,
        message,
        timestamp: new Date().toISOString()
      }

      const updatedConversation = [...(ticket.conversation || []), newMessage]

      const { data, error } = await supabaseAdmin
        .from('tickets')
        .update({ 
          conversation: updatedConversation,
          last_updated: new Date().toISOString()
        })
        .eq('number', ticketNumber)
        .select()
        .single()

      if (error) throw error

      return new Response(
        JSON.stringify({ data, error: null }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
          status: 200,
        }
      )
    } else {
      throw new Error('Invalid action')
    }
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
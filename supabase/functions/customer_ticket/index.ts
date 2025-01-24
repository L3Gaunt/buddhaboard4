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
      const { title, firstMessage, priority, email, password, name } = body

      if (!email || !password) {
        throw new Error('Email and password are required')
      }

      // First create the auth user
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true
      })

      if (authError) throw authError

      // Create or update user in public.users table
      const { data: user, error: userError } = await supabaseAdmin
        .from('users')
        .upsert({
          id: authUser.user.id,
          email: email,
          name: name || 'Anonymous User',
          metadata: { is_anonymous: false }
        })
        .select()
        .single()

      if (userError) throw userError

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
          customer_id: user.id,
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
      const ticketHash = btoa(`${data.number}:${user.id}`).replace(/=/g, '')

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
    } else if (action === 'list_tickets') {
      const { user_id } = body

      if (!user_id) {
        throw new Error('User ID is required')
      }

      // Fetch all tickets for the user
      const { data: tickets, error: ticketsError } = await supabaseAdmin
        .from('tickets')
        .select('*')
        .eq('customer_id', user_id)
        .order('last_updated', { ascending: false })

      if (ticketsError) throw ticketsError

      // Add ticket hashes to each ticket
      const ticketsWithHashes = tickets.map(ticket => ({
        ...ticket,
        ticketHash: btoa(`${ticket.number}:${user_id}`).replace(/=/g, '')
      }))

      return new Response(
        JSON.stringify({ data: ticketsWithHashes, error: null }),
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
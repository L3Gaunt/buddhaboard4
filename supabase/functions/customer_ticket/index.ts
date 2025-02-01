import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { generateAgentResponse } from './langchain.ts'

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

      // First check if user already exists
      const { data: { users: existingUsers }, error: existingUserError } = await supabaseAdmin.auth.admin.listUsers()
      const existingUser = existingUsers.find(user => user.email === email)

      let userId

      if (existingUser) {
        // If user exists, verify their password
        const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
          email,
          password
        })

        if (signInError) {
          throw new Error('User already registered, please sign in with correct password')
        }

        userId = existingUser.id
      } else {
        // Create new auth user if they don't exist
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true
        })

        if (authError) {
          // If user already exists, try to sign in instead
          if (authError.message?.includes('User already registered')) {
            const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
              email,
              password
            })

            if (signInError) {
              throw new Error('User already registered, please sign in with correct password')
            }

            // Get the existing user's ID
            const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers()
            const existingUser = users.find(user => user.email === email)
            if (!existingUser) {
              throw new Error('Failed to retrieve user information')
            }
            userId = existingUser.id
          } else {
            throw authError
          }
        } else {
          userId = authUser.user.id
        }
      }

      // Create or update user in public.users table
      const { data: user, error: userError } = await supabaseAdmin
        .from('users')
        .upsert({
          id: userId,
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

      // Generate AI response using knowledge base
      const agentResponse = await generateAgentResponse(
        supabaseAdmin,
        title,
        firstMessage
      );

      // Create the ticket with both customer message and AI response
      const { data, error } = await supabaseAdmin
        .from('tickets')
        .insert({
          title,
          priority,
          status: 'open',
          customer_id: user.id,
          conversation: [
            {
              id: `msg_${Date.now()}`,
              isFromCustomer: true,
              message: firstMessage,
              timestamp: new Date().toISOString()
            },
            {
              id: `msg_${Date.now() + 1}`,
              isFromCustomer: false,
              message: agentResponse.message,
              timestamp: new Date().toISOString(),
              metadata: {
                is_ai_response: true,
                relevant_articles: agentResponse.relevantArticles.map(article => ({
                  id: article.id,
                  title: article.title,
                  similarity: article.similarity
                }))
              }
            }
          ],
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
      const { ticketHash, ticketNumber, message } = body

      let ticket;
      if (ticketHash) {
        // Decode the hash to get ticket number and user ID
        const decoded = atob(ticketHash)
        const [decodedTicketNumber, userId] = decoded.split(':')

        // Verify the ticket belongs to this user
        const { data: ticketData, error: ticketError } = await supabaseAdmin
          .from('tickets')
          .select('*')
          .eq('number', decodedTicketNumber)
          .eq('customer_id', userId)
          .single()

        if (ticketError || !ticketData) {
          throw new Error('Invalid ticket hash or ticket not found')
        }

        ticket = ticketData;
      } else if (ticketNumber) {
        // For authenticated users, verify ownership through auth token
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
          throw new Error('Authorization header required')
        }

        // Create a client with the user's token
        const supabaseClient = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_ANON_KEY') ?? '',
          {
            global: {
              headers: { Authorization: authHeader },
            },
          }
        )

        // Get the authenticated user
        const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
        if (userError || !user) {
          throw new Error('Authentication required')
        }

        // Verify the ticket belongs to this user
        const { data: ticketData, error: ticketError } = await supabaseAdmin
          .from('tickets')
          .select('*')
          .eq('number', ticketNumber)
          .eq('customer_id', user.id)
          .single()

        if (ticketError || !ticketData) {
          throw new Error('Ticket not found or unauthorized')
        }

        ticket = ticketData;
      } else {
        throw new Error('Either ticketHash or ticketNumber is required')
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
          last_updated: new Date().toISOString(),
          status: 'open'
        })
        .eq('number', ticket.number)
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
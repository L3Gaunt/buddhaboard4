import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface FeedbackRequest {
  ticketNumber: number;
  rating: number;
  feedbackText?: string;
}

serve(async (req) => {
  try {
    // Handle CORS
    if (req.method === 'OPTIONS') {
      return new Response('ok', {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        }
      })
    }

    // Create Supabase client with service role for database operations
    const serviceRoleClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Create regular client for auth
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (req.method === 'GET') {
      // Extract ticket number from URL
      const url = new URL(req.url);
      const ticketNumber = url.searchParams.get('ticketNumber');

      if (!ticketNumber) {
        return new Response(
          JSON.stringify({ error: 'Ticket number is required' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
      }

      // Verify the ticket belongs to the user
      const { data: ticket, error: ticketError } = await serviceRoleClient
        .from('tickets')
        .select('customer_id')
        .eq('number', ticketNumber)
        .single()

      if (ticketError || !ticket) {
        return new Response(
          JSON.stringify({ error: 'Ticket not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        )
      }

      if (ticket.customer_id !== user.id) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        )
      }

      // Get feedback
      const { data: feedback, error: feedbackError } = await serviceRoleClient
        .from('ticket_feedback')
        .select('rating, feedback_text')
        .eq('ticket_number', ticketNumber)
        .single()

      if (feedbackError && feedbackError.code !== 'PGRST116') { // PGRST116 is "not found" error
        return new Response(
          JSON.stringify({ error: 'Failed to fetch feedback' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ data: feedback }),
        { 
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          }
        }
      )
    }

    if (req.method === 'POST') {
      // Parse request body
      const { ticketNumber, rating, feedbackText }: FeedbackRequest = await req.json()

      // Validate input
      if (!ticketNumber || !rating || rating < 1 || rating > 5) {
        return new Response(
          JSON.stringify({ error: 'Invalid input' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
      }

      // Verify the ticket belongs to the user and is resolved/closed
      const { data: ticket, error: ticketError } = await serviceRoleClient
        .from('tickets')
        .select('customer_id, status')
        .eq('number', ticketNumber)
        .single()

      if (ticketError || !ticket) {
        return new Response(
          JSON.stringify({ error: 'Ticket not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        )
      }

      if (ticket.customer_id !== user.id) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        )
      }

      if (!['resolved', 'closed'].includes(ticket.status)) {
        return new Response(
          JSON.stringify({ error: 'Ticket must be resolved or closed to submit feedback' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
      }

      // Check if feedback already exists
      const { data: existingFeedback } = await serviceRoleClient
        .from('ticket_feedback')
        .select('id')
        .eq('ticket_number', ticketNumber)
        .single()

      let result;
      if (existingFeedback) {
        // Update existing feedback
        result = await serviceRoleClient
          .from('ticket_feedback')
          .update({
            rating,
            feedback_text: feedbackText
          })
          .eq('id', existingFeedback.id)
      } else {
        // Insert new feedback
        result = await serviceRoleClient
          .from('ticket_feedback')
          .insert({
            ticket_number: ticketNumber,
            rating,
            feedback_text: feedbackText
          })
      }

      if (result.error) {
        return new Response(
          JSON.stringify({ error: 'Failed to submit feedback' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ 
          message: existingFeedback ? 'Feedback updated successfully' : 'Feedback submitted successfully' 
        }),
        { 
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          }
        }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}) 
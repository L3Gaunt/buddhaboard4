import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PostmarkWebhook {
  FromName: string;
  From: string;
  To: string;
  Subject: string;
  TextBody: string;
  HtmlBody: string;
  StrippedTextReply?: string;
  MessageID: string;
  InReplyTo?: string;
  Attachments?: Array<{
    Name: string;
    Content: string;
    ContentType: string;
    ContentLength: number;
  }>;
}

async function sendAutoReply(to: string, ticketNumber: number) {
  const response = await fetch('https://api.postmarkapp.com/email', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-Postmark-Server-Token': Deno.env.get('POSTMARK_SERVER_TOKEN') ?? ''
    },
    body: JSON.stringify({
      From: Deno.env.get('POSTMARK_FROM_EMAIL') ?? 'support@yourdomain.com',
      To: to,
      Subject: `Re: Support Ticket #${ticketNumber} Received`,
      TextBody: `Thank you for contacting our support team. Your ticket #${ticketNumber} has been received and is being reviewed by our team. We'll get back to you as soon as possible.

Best regards,
Support Team`,
      MessageStream: 'outbound'
    })
  });

  if (!response.ok) {
    console.error('Failed to send auto-reply:', await response.text());
  }
}

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

    const postmarkData = await req.json() as PostmarkWebhook
    
    // Extract email data
    const {
      FromName,
      From,
      Subject,
      TextBody,
      StrippedTextReply,
      MessageID,
      InReplyTo,
      Attachments
    } = postmarkData

    // Extract email from From field (format: "Name <email@domain.com>")
    const email = From.match(/<(.+)>/)?.[1] || From

    // First check if user already exists
    const { data: { users: existingUsers }, error: existingUserError } = await supabaseAdmin.auth.admin.listUsers()
    if (existingUserError) throw existingUserError

    const existingUser = existingUsers.find(user => user.email === email)
    let userId: string

    if (existingUser) {
      userId = existingUser.id
    } else {
      // Create new auth user if they don't exist
      const tempPassword = crypto.randomUUID() // Generate a random password
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true
      })

      if (authError) throw authError
      userId = authUser.user.id
    }

    // Create or update user in public.users table
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .upsert({
        id: userId,
        email: email,
        name: FromName || email.split('@')[0],
        metadata: { 
          is_anonymous: false,
          source: 'email'
        }
      })
      .select()
      .single()

    if (userError) throw userError

    // Process attachments if any
    const processedAttachments = Attachments?.map(attachment => ({
      url: `data:${attachment.ContentType};base64,${attachment.Content}`,
      name: attachment.Name,
      type: attachment.ContentType,
      size: attachment.ContentLength
    }))

    const messageContent = StrippedTextReply || TextBody
    const timestamp = new Date().toISOString()

    if (InReplyTo) {
      // This is a reply to an existing ticket - find the ticket and append the message
      const { data: ticket, error: ticketError } = await supabaseAdmin
        .from('tickets')
        .select('*')
        .eq('metadata->email_message_id', InReplyTo)
        .single()

      if (ticketError || !ticket) {
        // If we can't find the ticket by message ID, create a new one
        return await createNewTicket()
      }

      // Append the message to the conversation
      const newMessage = {
        id: `msg_${Date.now()}`,
        isFromCustomer: true,
        message: messageContent,
        timestamp,
        attachments: processedAttachments,
        metadata: {
          email_message_id: MessageID
        }
      }

      const updatedConversation = [...(ticket.conversation || []), newMessage]

      const { data, error } = await supabaseAdmin
        .from('tickets')
        .update({ 
          conversation: updatedConversation,
          last_updated: timestamp,
          status: 'open' // Reopen ticket if it was closed
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
    } else {
      return await createNewTicket()
    }

    async function createNewTicket() {
      // Find the least busy online agent
      const { data: leastBusyAgent, error: agentError } = await supabaseAdmin.rpc(
        'get_least_busy_agent'
      )

      if (agentError) throw agentError

      // Create a new ticket
      const { data: ticket, error: ticketError } = await supabaseAdmin
        .from('tickets')
        .insert({
          title: Subject || 'Email Inquiry',
          priority: 'medium', // Default priority
          status: 'open',
          customer_id: user.id,
          conversation: [{
            id: `msg_${Date.now()}`,
            isFromCustomer: true,
            message: messageContent,
            timestamp,
            attachments: processedAttachments,
            metadata: {
              email_message_id: MessageID
            }
          }],
          assigned_to: leastBusyAgent?.[0]?.agent_id || null,
          metadata: {
            source: 'email',
            email_message_id: MessageID
          }
        })
        .select()
        .single()

      if (ticketError) throw ticketError

      // Send auto-reply for new tickets
      await sendAutoReply(email, ticket.number);

      return new Response(
        JSON.stringify({ data: ticket, error: null }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
          status: 200,
        }
      )
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